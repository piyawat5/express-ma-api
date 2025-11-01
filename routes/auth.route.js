import express from "express";
// import {
//   register,
//   verifyOTPAndRegister,
// } from "../controllers/authCookie.controller.js";
import {
  createStatusApproveId,
  createWorkorder,
  deleteWorkorder,
  getWorkorderById,
  getWorkorders,
  register,
  updateStatusWorkorderItem,
  updateWorkorder,
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

import verifyToken from "../config/verify.js";
// import { preLogUserAction } from "../controllers/logUser.controller.js";
// import { registerSchema, loginSchema, validate } from "../utils/validator.js";

const router = express.Router();

//------------- auth --------------
router.get("/users", verifyToken, getUsers); //

// ------------- workorder --------------
router.post("/workorder/create", verifyToken, createWorkorder); //
router.put("/workorder/update/:id", verifyToken, updateWorkorder); //
router.delete("/workorder/delete/:id", verifyToken, deleteWorkorder); //
router.get("/workorder/:id", verifyToken, getWorkorderById); //
router.get("/workorder", verifyToken, getWorkorders); //
router.put(
  "/workorder/updateStatusWorkorderItem/:id",
  updateStatusWorkorderItem
); //
router.post("/workorder/statusApprove", createStatusApproveId); //

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
