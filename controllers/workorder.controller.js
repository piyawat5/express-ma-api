import prisma from "../config/prisma.js";
import createError from "../utils/createError.js";
import bcrypt from "bcryptjs";

import { sendLineMessage } from "../utils/lineNotify.js";

export async function createWorkorder(req, res, next) {
  try {
    // บันทึกข้อมูล
    const { title, status, workorderItems } = req.body;

    if (!workorderItems || workorderItems.length === 0) {
      return next(createError(400, "At least one workorder item is required"));
    }

    // Validate user IDs if provided
    const allUserIds = workorderItems
      .flatMap((item) => item.assignedTo || [])
      .filter((id, index, self) => self.indexOf(id) === index);

    if (allUserIds.length > 0) {
      const existingUsers = await prisma.user.findMany({
        where: {
          id: { in: allUserIds },
          status: true,
        },
        select: { id: true },
      });

      const existingUserIds = existingUsers.map((u) => u.id);
      const invalidUserIds = allUserIds.filter(
        (id) => !existingUserIds.includes(id)
      );

      if (invalidUserIds.length > 0) {
        return next(
          createError(400, "Invalid or inactive user IDs: " + invalidUserIds)
        );
      }

      const checkConfigType = workorderItems.some((item) => !item.configId);
      if (checkConfigType) {
        return next(
          createError(400, "กรุณาเลือก config สำหรับ workorder item")
        );
      }
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
            assignedTo: item.assignedTo
              ? {
                  create: item.assignedTo.map((userId) => ({
                    userId,
                  })),
                }
              : undefined,
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
            assignedTo: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
            config: true,
            attachments: true,
          },
        },
      },
    });

    //TODO: post api approve
    //TODO: ทำ link กดไปที่ ระบบ approve ใน line message เลย
    //TODO: update workorder แจ้งใน Line message ด้วย
    // ส่งไลน์
    let message = `🔔 มีรายการแจ้งซ่อม!\n`;

    // แสดงรายละเอียดแต่ละ workorder item
    workorder.workorderItems.forEach((item, index) => {
      message += `\n📌 รายการที่ ${index + 1}\n`;

      if (item.config) {
        message += `   รายละเอียด: ${item.config.name}\n`;
      }
      if (item.startDate) {
        message += `   เริ่มต้น: ${new Date(item.startDate).toLocaleString(
          "th-TH"
        )}\n`;
      }

      // แสดงผู้รับผิดชอบ
      if (item.assignedTo && item.assignedTo.length > 0) {
        message += `   👤 ผู้รับผิดชอบ:\n`;
        item.assignedTo.forEach((assigned) => {
          const fullName =
            [assigned.user.firstName, assigned.user.lastName]
              .filter(Boolean)
              .join(" ") || assigned.user.email;
          message += `      • ${fullName}\n`;
        });
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
            assignedTo: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
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

export const getWorkorderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workorder = await prisma.workorder.findUnique({
      where: { id },
      include: {
        workorderItems: {
          include: {
            assignedTo: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
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
              ...(item.assignedTo && {
                assignedTo: {
                  create: item.assignedTo.map((userId) => ({
                    userId,
                  })),
                },
              }),
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
            assignedTo: {
              include: {
                user: true,
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

export const test = async (req, res, next) => {
  try {
    res.json({ message: "Test controller is working!" });
  } catch (error) {
    next(error);
  }
};
