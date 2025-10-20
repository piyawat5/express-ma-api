import prisma from "../config/prisma.js";
import createError from "../utils/createError.js";

export async function getTechnicials(req, res, next) {
  try {
    const {
      page = "1",
      size = "10",
      name,
      number,
      configId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const sizeNum = parseInt(size);
    const skip = (pageNum - 1) * sizeNum;

    // Build filter conditions
    const where = {};

    if (name) {
      where.name = {
        contains: name,
      };
    }

    if (number) {
      where.number = {
        contains: number,
      };
    }

    if (configId) {
      where.configId = configId;
    }

    // Get total count for pagination
    const total = await prisma.technicial.count({ where });

    // Get technicials with config relation
    const technicials = await prisma.technicial.findMany({
      where,
      include: {
        config: true,
      },
      skip,
      take: sizeNum,
      orderBy: {
        [sortBy]: sortOrder === "asc" ? "asc" : "desc",
      },
    });

    return res.json({
      success: true,
      data: technicials,
      pagination: {
        page: pageNum,
        size: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (error) {
    console.error("Get technicials error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลช่าง",
    });
  }
}

export async function getTechnicialById(req, res, next) {
  try {
    const { id } = req.params;

    const technicial = await prisma.technicial.findUnique({
      where: { id },
      include: {
        config: true,
      },
    });

    if (!technicial) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลช่าง",
      });
    }

    return res.json({
      success: true,
      data: technicial,
    });
  } catch (error) {
    console.error("Get technicial by id error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลช่าง",
    });
  }
}

export async function createTechnicial(req, res, next) {
  try {
    const { name, number, spareNumber, url, configId } = req.body;

    // Validate required fields
    if (!name || !number || !configId) {
      return next(
        createError(400, "กรุณากรอกข้อมูลให้ครบถ้วน (name, number, configId)")
      );
    }

    // Check if config exists
    const config = await prisma.config.findUnique({
      where: { id: configId },
    });

    if (!config) {
      return next(createError(404, "ไม่พบ config ที่ระบุ"));
    }

    // Create technicial
    const technicial = await prisma.technicial.create({
      data: {
        name,
        number,
        spareNumber,
        url,
        configId,
      },
      include: {
        config: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "สร้างข้อมูลช่างสำเร็จ",
      data: technicial,
    });
  } catch (error) {
    next(createError(error));
  }
}

export async function updateTechnicial(req, res, next) {
  try {
    const { id } = req.params;
    const { name, number, spareNumber, url, configId } = req.body;

    // Check if technicial exists
    const existingTechnicial = await prisma.technicial.findUnique({
      where: { id },
    });

    if (!existingTechnicial) {
      return next(createError(404, "ไม่พบข้อมูลช่าง"));
    }

    // If configId is provided, check if it exists
    if (configId) {
      const config = await prisma.config.findUnique({
        where: { id: configId },
      });

      if (!config) {
        return next(createError(404, "ไม่พบ config ที่ระบุ"));
      }
    }

    // Update technicial
    const technicial = await prisma.technicial.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(number && { number }),
        ...(spareNumber !== undefined && { spareNumber }),
        ...(url !== undefined && { url }),
        ...(configId && { configId }),
      },
      include: {
        config: true,
      },
    });

    return res.json({
      success: true,
      message: "อัพเดทข้อมูลช่างสำเร็จ",
      data: technicial,
    });
  } catch (error) {
    next(createError(error));
  }
}

export async function deleteTechnicial(req, res, next) {
  try {
    const { id } = req.params;

    // Check if technicial exists
    const existingTechnicial = await prisma.technicial.findUnique({
      where: { id },
    });

    if (!existingTechnicial) {
      return next(createError(404, "ไม่พบข้อมูลช่าง"));
    }

    // Delete technicial
    await prisma.technicial.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "ลบข้อมูลช่างสำเร็จ",
    });
  } catch (error) {
    next(createError(error));
  }
}
