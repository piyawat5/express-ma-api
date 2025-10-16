import express from "express";
// import {
//   register,
//   verifyOTPAndRegister,
// } from "../controllers/authCookie.controller.js";
import {
  createWorkorder,
  deleteWorkorder,
  getWorkorderById,
  getWorkorders,
  register,
  test,
  updateWorkorder,
} from "../controllers/workorder.controller.js";

import {
  createConfig,
  deleteConfig,
  getConfigById,
  getConfigs,
  updateConfig,
} from "../controllers/config.controller.js";

import {
  createTechnicial,
  deleteTechnicial,
  getTechnicialById,
  getTechnicials,
  updateTechnicial,
} from "../controllers/technicial.controller.js";
// import { preLogUserAction } from "../controllers/logUser.controller.js";
// import { registerSchema, loginSchema, validate } from "../utils/validator.js";

const router = express.Router();

// ------------- workorder --------------
router.get("/workorder", getWorkorders);
router.get("/workorder/:id", getWorkorderById);
router.post("/workorder/create", createWorkorder);
router.put("/workorder/update/:id", updateWorkorder);
router.delete("/workorder/delete/:id", deleteWorkorder);

// ------------- config --------------
router.get("/config", getConfigs);
router.get("/config/:id", getConfigById);
router.post("/config/create", createConfig);
router.put("/config/update/:id", updateConfig);
router.delete("/config/delete/:id", deleteConfig);

// ------------- technicial --------------
router.get("/technicial", getTechnicials);
router.get("/technicial/:id", getTechnicialById);
router.post("/technicial/create", createTechnicial);
router.put("/technicial/update/:id", updateTechnicial);
router.delete("/technicial/delete/:id", deleteTechnicial);

router.post("/auth/register", register);
router.get("/test", test);

// TODO: validate

export default router;
