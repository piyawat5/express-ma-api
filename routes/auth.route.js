import express from "express";
// import {
//   register,
//   verifyOTPAndRegister,
// } from "../controllers/authCookie.controller.js";
import {
  createWorkorder,
  register,
} from "../controllers/workorder.controller.js";
// import { registerSchema, loginSchema, validate } from "../utils/validator.js";

const router = express.Router();

// ------------- auth --------------
router.post("/workorder/create", createWorkorder);
router.post("/auth/register", register);

// TODO: validate

export default router;
