import prisma from "../config/prisma.js";
import createError from "../utils/createError.js";
// import bcrypt from "bcryptjs";

import nodemailer from "nodemailer";
// import axios from "axios";

// ------------------- function -----------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "ยืนยันการสมัครสมาชิก - OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>ยืนยันการสมัครสมาชิก</h2>
        <p>รหัส OTP ของคุณคือ:</p>
        <div style="font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>รหัสนี้จะหมดอายุใน 5 นาที</p>
        <p>หากคุณไม่ได้สมัครสมาชิก กรุณาเพิกเฉยต่ออีเมลนี้</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ success: true, data: users });
  } catch (error) {
    next(createError(500, error));
  }
};

// ------------------------ LOGOUT ------------------------
// export const logout = async (req, res) => {
//   const refreshToken = req.cookies.jid;
//   if (refreshToken) {
//     await prisma.refreshToken.updateMany({
//       where: { tokenHash: hashRt(refreshToken) },
//       data: { revoked: true },
//     });
//   }

//   res.clearCookie("jid"); // ลบ cookie
//   res.json({ message: "Logged out" });
// };

// ------------------------ ME (ไม่ได้ใช้) ----------------------------
// export const authen = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return next(createError(401, "No token provided"));
//   const token = authHeader.split(" ")[1];
//   try {
//     jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
//       if (err) {
//         return next(createError(401, "token หมดอายุ"));
//       }
//       res.json(decoded);
//     });
//   } catch (err) {
//     next(err);
//   }
// };
