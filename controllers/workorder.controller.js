import prisma from "../config/prisma.js";
import createError from "../utils/createError.js";
import bcrypt from "bcryptjs";

import { sendLineMessage } from "../utils/lineNotify.js";

export async function createWorkorder(req, res) {
  try {
    // บันทึกข้อมูล
    const { title, status, workorderItems } = req.body;

    if (!workorderItems || workorderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one workorder item is required",
      });
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
        return res.status(400).json({
          success: false,
          message: "Invalid or inactive user IDs",
          invalidUserIds,
        });
      }
    }

    // Create workorder with nested relations
    const workorder = await prisma.workorder.create({
      data: {
        title,
        status: status || "PENDING",
        workorderItems: {
          create: workorderItems.map((item) => ({
            detail: item.detail,
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
            attachments: true,
          },
        },
      },
    });

    // ส่งไลน์
    let message = `🔔 มีรายการแจ้งซ่อมใหม่!\n\n`;
    message += `📋 หัวข้อ: ${workorder.title}\n`;
    message += `📊 สถานะ: ${workorder.status}\n`;
    message += `📅 วันที่สร้าง: ${new Date(workorder.createdAt).toLocaleString(
      "th-TH"
    )}\n`;
    message += `\n━━━━━━━━━━━━━━━━━━\n`;

    // แสดงรายละเอียดแต่ละ workorder item
    workorder.workorderItems.forEach((item, index) => {
      message += `\n📌 รายการที่ ${index + 1}\n`;

      if (item.detail) {
        message += `   รายละเอียด: ${item.detail}\n`;
      }

      if (item.startDate) {
        message += `   เริ่มต้น: ${new Date(item.startDate).toLocaleString(
          "th-TH"
        )}\n`;
      }

      if (item.endDate) {
        message += `   สิ้นสุด: ${new Date(item.endDate).toLocaleString(
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

      // แสดงจำนวนไฟล์แนบ
      if (item.attachments && item.attachments.length > 0) {
        message += `   📎 ไฟล์แนบ: ${item.attachments.length} ไฟล์\n`;
      }
    });

    await sendLineMessage(message);

    return res.status(201).json({
      success: true,
      message: "Workorder created successfully",
      data: workorder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
}

export async function getWorkorders(req, res) {
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
    console.error("Get workorders error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล workorder",
    });
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
      return res.status(404).json({
        success: false,
        message: "ไม่พบ workorder",
      });
    }

    return res.json({
      success: true,
      data: workorder,
    });
  } catch (error) {
    console.error("Get workorder by id error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล workorder",
    });
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
      return res.status(404).json({
        success: false,
        message: "ไม่พบ workorder",
      });
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
              ...(item.assignedTo && {
                assignedTo: {
                  create: item.assignedTo.map((userId) => ({
                    userId,
                  })),
                },
              }),
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
    console.error("Update workorder error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัพเดท workorder",
    });
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
      return res.status(404).json({
        success: false,
        message: "ไม่พบ workorder",
      });
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
    console.error("Delete workorder error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบ workorder",
    });
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

export const test = async (req, res, next) => {
  try {
    res.json({ message: "Test controller is working!" });
  } catch (error) {
    next(error);
  }
};
