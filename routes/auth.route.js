import express from "express";
// import {
//   register,
//   verifyOTPAndRegister,
// } from "../controllers/authCookie.controller.js";
import {
  createStatusApproveId,
  createWorkorder,
  deleteWorkorder,
  getSubWorkorder,
  getWorkorderById,
  getWorkorders,
  register,
  updateStatusWorkorderItem,
  updateWorkorder,
  repairNotify,
} from "../controllers/workorder.controller.js";

import {
  createConfig,
  createConfigsType,
  deleteConfig,
  getConfigById,
  getConfigs,
  getConfigTypes,
  updateConfig,
} from "../controllers/config.controller.js";

import {
  createTechnicial,
  deleteTechnicial,
  getTechnicialById,
  getTechnicials,
  updateTechnicial,
} from "../controllers/technicial.controller.js";

import {
  authen,
  getUsers,
  login,
} from "../controllers/authCookie.controller.js";

import {
  uploadImage,
  uploadMultipleImages,
} from "../controllers/attachFile.controller.js";

import multer from "multer";

import verifyToken from "../config/verify.js";
// import { preLogUserAction } from "../controllers/logUser.controller.js";
// import { registerSchema, loginSchema, validate } from "../utils/validator.js";

// ใช้ memory storage สำหรับ multer (เก็บไว้ใน memory ก่อนส่งไป Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // จำกัด 5MB
  },
  fileFilter: (req, file, cb) => {
    console.log("01");
    // ยอมรับเฉพาะไฟล์รูปภาพ
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น"));
    }
  },
});

const router = express.Router();

//------------- auth --------------
router.get("/users", verifyToken, getUsers); //

// ------------- upload --------------
router.post("/single", upload.single("image"), uploadImage);
router.post("/multiple", upload.array("images", 10), uploadMultipleImages);

// ------------- workorder --------------
router.post("/workorder/create", verifyToken, createWorkorder); //
router.put("/workorder/update/:id", verifyToken, updateWorkorder); //
router.delete("/workorder/delete/:id", verifyToken, deleteWorkorder); //
router.get("/workorder/:id", verifyToken, getWorkorderById); //
router.get("/workorder", verifyToken, getWorkorders); //
router.get("/workorderItem", verifyToken, getSubWorkorder); //
router.put(
  "/workorder/updateStatusWorkorderItem/:id",
  updateStatusWorkorderItem
); //
router.post("/workorder/statusApprove", createStatusApproveId); //
router.get("/repairNotification", repairNotify);

// ------------- config --------------
router.get("/config/type", verifyToken, getConfigTypes); //
router.post("/config/create", verifyToken, createConfig); //
router.put("/config/update/:id", verifyToken, updateConfig); //
router.delete("/config/delete/:id", verifyToken, deleteConfig); //
router.get("/config/:id", verifyToken, getConfigById); //
router.get("/config", verifyToken, getConfigs); //
router.post("/config/type/create", verifyToken, createConfigsType); //

// ------------- technicial --------------
router.post("/technicial/create", verifyToken, createTechnicial);
router.put("/technicial/update/:id", verifyToken, updateTechnicial);
router.delete("/technicial/delete/:id", verifyToken, deleteTechnicial);
router.get("/technicial/:id", verifyToken, getTechnicialById);
router.get("/technicial", verifyToken, getTechnicials);

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/verify", authen);

// TODO: validate

export default router;
