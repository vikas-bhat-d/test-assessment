import { Router } from "express";
import { initializeVerification, verifyOTP } from "../controller/otp.controller.js";

export const otpRouter=Router();

otpRouter.route('/send').post(initializeVerification);
otpRouter.route("/").post(verifyOTP)