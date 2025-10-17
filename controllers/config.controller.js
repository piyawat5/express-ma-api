import prisma from "../config/prisma.js";
import createError from "../utils/createError.js";

export async function getConfigs(req, res) {
  try {
    res.json({ message: "Hello World" });
  } catch (error) {
    console.error("Get configs error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล config" + error,
    });
  }
}

export async function getConfigById(req, res) {
  try {
    const { id } = req.params;

    const config = await prisma.config.findUnique({
      where: { id },
      include: {
        technicials: true,
      },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบ config",
      });
    }

    return res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Get config by id error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูล config",
    });
  }
}

export async function createConfig(req, res, next) {
  try {
    const { name, type = "TECHNICIAL" } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกชื่อ config",
      });
    }

    // Create config
    const config = await prisma.config.create({
      data: {
        name,
        type,
      },
      include: {
        technicials: true,
        workorderItems: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "สร้าง config สำเร็จ",
      data: config,
    });
  } catch (error) {
    console.error("Create config error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้าง config",
    });
  }
}

export async function updateConfig(req, res, next) {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    // Check if config exists
    const existingConfig = await prisma.config.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบ config",
      });
    }

    // Update config
    const config = await prisma.config.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
      },
      include: {
        technicials: true,
      },
    });

    return res.json({
      success: true,
      message: "อัพเดท config สำเร็จ",
      data: config,
    });
  } catch (error) {
    console.error("Update config error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัพเดท config",
    });
  }
}

export async function deleteConfig(req, res, next) {
  try {
    const { id } = req.params;

    // Check if config exists
    const existingConfig = await prisma.config.findUnique({
      where: { id },
      include: {
        technicials: true,
      },
    });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบ config",
      });
    }

    // Check if config has related technicials
    if (existingConfig.technicials.length > 0) {
      return res.status(400).json({
        success: false,
        message: "ไม่สามารถลบ config ได้ เนื่องจากมีช่างที่เชื่อมโยงอยู่",
      });
    }

    // Delete config
    await prisma.config.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "ลบ config สำเร็จ",
    });
  } catch (error) {
    console.error("Delete config error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบ config",
    });
  }
}
