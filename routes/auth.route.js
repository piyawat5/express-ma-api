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

import { getUsers } from "../controllers/authCookie.controller.js";
// import { preLogUserAction } from "../controllers/logUser.controller.js";
// import { registerSchema, loginSchema, validate } from "../utils/validator.js";

const router = express.Router();

//------------- auth --------------
router.get("/users", getUsers); //

// ------------- workorder --------------
router.post("/workorder/create", createWorkorder); //
router.put("/workorder/update/:id", updateWorkorder); //
router.delete("/workorder/delete/:id", deleteWorkorder); //
router.get("/workorder/:id", getWorkorderById); //
router.get("/workorder", getWorkorders); //
router.put("/workorder/updateStatusWorkorderItem", updateStatusWorkorderItem); //
router.post("/workorder/statusApprove", createStatusApproveId); //

// ------------- config --------------
router.get("/config/type", getConfigTypes); //
router.post("/config/create", createConfig); //
router.put("/config/update/:id", updateConfig); //
router.delete("/config/delete/:id", deleteConfig); //
router.get("/config/:id", getConfigById); //
router.get("/config", getConfigs); //
router.post("/config/type/create", createConfigsType); //

// ------------- technicial --------------
router.post("/technicial/create", createTechnicial);
router.put("/technicial/update/:id", updateTechnicial);
router.delete("/technicial/delete/:id", deleteTechnicial);
router.get("/technicial/:id", getTechnicialById);
router.get("/technicial", getTechnicials);

router.post("/auth/register", register);

// TODO: validate

export default router;
