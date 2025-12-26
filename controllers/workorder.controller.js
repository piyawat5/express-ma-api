import prisma from "../config/prisma.js";
import createError from "../utils/createError.js";
import bcrypt from "bcryptjs";

import { sendLineMessage } from "../utils/lineNotify.js";
import axios from "axios";

export async function createWorkorder(req, res, next) {
  try {
    // บันทึกข้อมูล
    const { title, status, workorderItems } = req.body;

    if (!workorderItems || workorderItems.length === 0) {
      return next(createError(400, "At least one workorder item is required"));
    }

    let invalid = workorderItems.every(
      (item) =>
        item.detail &&
        item.ownerId &&
        item.approveId &&
        item.startDate &&
        item.endDate
    );

    if (invalid === false) {
      return next(
        createError(
          400,
          "กรุณากรอกข้อมูล สิ่งที่ต้องแจ้งซ่อม, ผู้อนุมัติ, วันที่เริ่มต้น-สิ้นสุด และสถานที่ ให้ครบถ้วน"
        )
      );
    }

    // Extract user IDs (ownerId + approveId)
    const allUserIds = workorderItems
      .flatMap((item) => [item.ownerId, item.approveId])
      .filter(Boolean); // ลบ null/undefined

    // ลบ id ซ้ำ
    const uniqueUserIds = [...new Set(allUserIds)];

    if (uniqueUserIds.length > 0) {
      const existingUsers = await prisma.user.findMany({
        where: {
          id: { in: uniqueUserIds },
          status: true,
        },
        select: { id: true },
      });

      const existingUserIds = existingUsers.map((u) => u.id);

      const invalidUserIds = uniqueUserIds.filter(
        (id) => !existingUserIds.includes(id)
      );

      if (invalidUserIds.length > 0) {
        return next(
          createError(400, "Invalid or inactive user IDs: " + invalidUserIds)
        );
      }
    }

    const checkConfigType = workorderItems.some((item) => !item.configId);
    if (checkConfigType) {
      return next(createError(400, "กรุณาเลือก config สำหรับ workorder item"));
    }

    // Create workorder with nested relations
    const workorder = await prisma.workorder.create({
      data: {
        title,
        status: status || "PENDING",
        workorderItems: {
          create: workorderItems.map((item) => ({
            configId: item.configId,
            detail: item.detail,
            statusApproveId: 1, // default pending
            startDate: item.startDate ? new Date(item.startDate) : undefined,
            endDate: item.endDate ? new Date(item.endDate) : undefined,
            ownerId: item.ownerId,
            approveId: item.approveId,
            attachments: item.attachments
              ? {
                  create: item.attachments.map((url) => ({
                    url,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: {
        workorderItems: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            approver: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            config: true,
            attachments: true,
          },
        },
      },
    });

    //TODO: ทำ link กดไปที่ ระบบ approve ใน line message เลย
    //TODO: update workorder แจ้งใน Line message ด้วย

    await Promise.all(
      workorder.workorderItems.map(async (item) => {
        if (item.approveId && item.ownerId) {
          return axios.post(
            `https://api-app.family-sivarom.com/approve/create`,
            {
              apiKey: process.env.API_KEY,
              url: "https://example.com/document/67890",
              title: item?.config?.name,
              detail: item?.detail,
              comment: item.comment || "",
              idFrom: item.id,
              apiPath: `https://api-ma.family-sivarom.com/workorder/updateStatusWorkorderItem/`,
              statusApproveId: 1,
              configId: "6d881a00-dd75-4839-b636-ec65b22cc945",
              approveId: item.approveId,
              ownerId: item.ownerId,
              // userId: item.assignedTo[0].userId,
            }
          );
        }
      })
    );

    // ส่งไลน์
    let message = `🔔 มีรายการแจ้งซ่อม!\n`;

    workorder.workorderItems.forEach((item, index) => {
      message += `\n📌 รายการที่ ${index + 1}\n`;

      if (item.config) {
        message += `   รายละเอียด: ${item.config.name}\n`;
      }
      if (item.detail) {
        message += `   สถานที่: ${item.detail}\n`;
      }
      if (item.startDate) {
        message += `   เริ่มต้น: ${new Date(item.startDate).toLocaleString(
          "th-TH"
        )}\n`;
      }

      if (item.approveId) {
        message += `   👤 ผู้อนุมัติ:`;
        message += `      • ${item.approver.firstName}\n`;
      }

      if (item.ownerId) {
        message += `   👤 ผู้ส่ง:`;
        message += `      • ${item.owner.firstName}\n`;
      }
    });

    await sendLineMessage(message);

    return res.status(201).json({
      success: true,
      message: "Workorder created successfully",
      data: workorder,
    });
  } catch (error) {
    return next(createError(500, error));
  }
}

export async function getWorkorders(req, res, next) {
  try {
    const {
      page = "1",
      size = "10",
      title,
      status,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const sizeNum = parseInt(size);
    const skip = (pageNum - 1) * sizeNum;

    // Build filter conditions
    const where = {};

    if (title) {
      where.title = {
        contains: title,
      };
    }

    if (status) {
      where.status = status;
    }

    // Filter by workorderItems date range
    if (startDate || endDate) {
      where.workorderItems = {
        some: {
          ...(startDate && { startDate: { gte: new Date(startDate) } }),
          ...(endDate && { endDate: { lte: new Date(endDate) } }),
        },
      };
    }

    // Get total count for pagination
    const total = await prisma.workorder.count({ where });

    // Get workorders with relations
    const workorders = await prisma.workorder.findMany({
      where,
      include: {
        workorderItems: {
          include: {
            config: true,
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            approver: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            attachments: true,
            StatusApprove: true,
          },
        },
      },
      skip,
      take: sizeNum,
      orderBy: {
        [sortBy]: sortOrder.toLowerCase() === "asc" ? "asc" : "desc",
      },
    });

    return res.json({
      success: true,
      data: workorders,
      pagination: {
        page: pageNum,
        size: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (error) {
    next(createError(500, error));
  }
}

export async function getSubWorkorder(req, res, next) {
  try {
    const {
      page = "1",
      size = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
      statusApproveId,
    } = req.query;
    const pageNum = parseInt(page);
    const sizeNum = parseInt(size);
    const skip = (pageNum - 1) * sizeNum;
    // Get total count for pagination
    const total = await prisma.workorderItem.count();
    // Get workorders with relations
    const workorderItems = await prisma.workorderItem.findMany({
      where: {
        ...(statusApproveId && { statusApproveId: parseInt(statusApproveId) }),
      },
      include: {
        config: true,
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        approver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        attachments: true,
        StatusApprove: true,
      },
      skip,
      take: sizeNum,
      orderBy: {
        [sortBy]: sortOrder.toLowerCase() === "asc" ? "asc" : "desc",
      },
    });
    return res.json({
      success: true,
      data: workorderItems,
      pagination: {
        page: pageNum,
        size: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (error) {
    next(createError(500, error));
  }
}

export const getWorkorderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workorder = await prisma.workorder.findUnique({
      where: { id },
      include: {
        workorderItems: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            approver: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            attachments: true,
          },
        },
      },
    });

    if (!workorder) {
      return next(createError(404, "ไม่พบ workorder"));
    }

    return res.json({
      success: true,
      data: workorder,
    });
  } catch (error) {
    next(createError(500, error));
  }
};

export const updateWorkorder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, status, workorderItems } = req.body;

    let invalid = workorderItems.every(
      (item) =>
        item.detail &&
        item.ownerId &&
        item.approveId &&
        item.startDate &&
        item.endDate
    );

    if (invalid === false) {
      return next(
        createError(
          400,
          "กรุณากรอกข้อมูล สิ่งที่ต้องแจ้งซ่อม, ผู้อนุมัติ, วันที่เริ่มต้น-สิ้นสุด และสถานที่ ให้ครบถ้วน"
        )
      );
    }

    // Check if workorder exists
    const existingWorkorder = await prisma.workorder.findUnique({
      where: { id },
    });

    if (!existingWorkorder) {
      return next(createError(404, "ไม่พบ workorder"));
    }

    // Update workorder
    const workorder = await prisma.workorder.update({
      where: { id },
      data: {
        title,
        status,
        ...(workorderItems && {
          workorderItems: {
            deleteMany: {},
            create: workorderItems.map((item) => ({
              detail: item.detail,
              startDate: item.startDate ? new Date(item.startDate) : null,
              endDate: item.endDate ? new Date(item.endDate) : null,
              configId: item.configId,
              approveId: item.approveId,
              ownerId: item.ownerId,
              // ...(item.assignedTo && {
              //   assignedTo: {
              //     create: item.assignedTo.map((userId) => ({
              //       userId,
              //     })),
              //   },
              // }),
              statusApproveId: item.statusApproveId || 1,
              ...(item.attachments && {
                attachments: {
                  create: item.attachments.map((url) => ({
                    url,
                  })),
                },
              }),
            })),
          },
        }),
      },
      include: {
        workorderItems: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            approver: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            config: true,
            attachments: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: "อัพเดท workorder สำเร็จ",
      data: workorder,
    });
  } catch (error) {
    next(createError(500, error));
  }
};

export const deleteWorkorder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if workorder exists
    const existingWorkorder = await prisma.workorder.findUnique({
      where: { id },
    });

    if (!existingWorkorder) {
      return next(createError(404, "ไม่พบ workorder"));
    }

    // Delete workorder (cascade will handle related records)
    await prisma.workorder.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "ลบ workorder สำเร็จ",
    });
  } catch (error) {
    next(createError(500, error));
  }
};

export const updateStatusWorkorderItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statusApproveId, comment } = req.body;
    // Check if workorder item exists
    const existingWorkorderItem = await prisma.workorderItem.findUnique({
      where: { id },
    });
    if (!existingWorkorderItem) {
      return next(createError(404, "ไม่พบ workorder item"));
    }
    // Update workorder item status
    const workorderItem = await prisma.workorderItem.update({
      where: { id },
      data: {
        statusApproveId,
        ...(comment ? { comment: comment } : {}),
      },
    });
    return res.json({
      success: true,
      message: "อัพเดทสถานะ workorder item สำเร็จ",
      data: workorderItem,
    });
  } catch (error) {
    next(createError(500, error));
  }
};

export const register = async (req, res, next) => {
  try {
    /* 
      1.keep body
      2.check Email In DB
      3.Encrypt Password -> bcryptjs
      4.Insert into DB
      5.response
    */
    const { email, firstName, lastName, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (user) {
      return next(createError(409, "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น"));
    }

    const hashPassword = bcrypt.hashSync(password, 10);
    const result = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = result;

    res.json({ message: "สมัครสำเร็จ!!!", user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

export const createStatusApproveId = async (req, res, next) => {
  try {
    const { name } = req.body;
    const statusApprove = await prisma.statusApprove.create({
      data: {
        name,
      },
    });
    res.status(201).json({
      message: "สร้างสถานะการอนุมัติสำเร็จ",
      statusApprove,
    });
  } catch (error) {
    next(createError(500, error));
  }
};

export const repairNotify = async (req, res, next) => {
  try {
    const workOrderItems = await prisma.workorderItem.findMany({
      where: {
        statusApproveId: 2, // Approved
      },
      include: {
        owner: true,
        approver: true,
        config: true,
      },
    });

    if (workOrderItems.length === 0) {
      return res.json({
        success: true,
        message: "ไม่มีรายการรอดำเนินการ",
      });
    }

    let message = "⚙ แจ้งเตือนจากระบบ MA\n\n";
    message += "รายการดังต่อไปนี้ยังไม่ได้ดำเนินการซ่อมแซม\n\n";
    workOrderItems.forEach((item, index) => {
      message += `#Order ${index + 1}\n`;
      message += `ชื่อรายการ:\n➤${item.config.name}\n`;
      message += `ผู้รับผิดชอบ:\n➤คุณ (${item.approver.firstName})\n`;
      message += `สถานที่:\n➤${item.detail}\n\n`;
    });

    message += "กรุณาดำเนินการซ่อมแซมโดยเร็ว\n";
    message += "𓆝 𓆟 𓆞 𓆝 𓆟 𓆝 𓆟 𓆞";
    // ส่งข้อความแจ้งเตือนผ่าน LINE Notify
    await sendLineMessage(message);
    res.json({
      success: true,
      message: "ส่งการแจ้งเตือนรายการรอดำเนินการสำเร็จ",
    });
  } catch (error) {
    next(createError(500, error));
  }
};

export const test = async (req, res, next) => {
  try {
    res.json({ message: "Test controller is working!" });
  } catch (error) {
    next(error);
  }
};
