import User from "../model/user.model.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import db from "../database/db.js";
import { generateAndSendOTP } from "../utils/mail.js";
import apiResponse from "../utils/apiResponse.utils.js";



export const initializeVerification = asyncHandler(async (req, res, next) => {
    let {email} = req.body;
    console.log(email);
    const { otp, result } = await generateAndSendOTP(email);
    console.log(result);
    console.log(result, "\n");
    console.log(otp)

    if (!result && result?.accepted?.length) {
        console.log("unable to send")
        return;
    }
    const expirationTime = new Date(Date.now() + 1 * 60 * 1000);

    await db.execute("DELETE FROM otp_tokens WHERE email = ?", [email]);

    const sql = "INSERT INTO otp_tokens (email, otp, expires_at) VALUES (?, ?, ?)";
    await db.execute(sql, [email, otp, expirationTime]);

    console.log(`OTP for ${email}: ${otp}`);

    return res.status(200).send(new apiResponse(200, { isOTPSent: true }, "OTP sent succesfully"));
})

export const verifyOTP = asyncHandler(async (req, res, next) => {
    const sql = "SELECT * FROM otp_tokens WHERE email = ? AND otp = ?";
    const {email,otp}=req.body;
    const [rows] = await db.execute(sql, [email, otp]);

    if (rows.length === 0) {
        return res.status(400).send(new apiResponse(400, null, "Invalid OTP or email"))
    }

    const otpData = rows[0];

    if (new Date() > new Date(otpData.expires_at)) {
        return res.status(400).send(new apiResponse(400, null, "OTP has expired"))
    }

    if (otpData.is_used) {
        return res.status(400).send(new apiResponse(400, null, "OTP has already been used"))
    }

    await db.execute("UPDATE otp_tokens SET is_used = ? WHERE id = ?", [true, otpData.id]);

    console.log("OTP verified successfully!");
    return res.status(200).send(new apiResponse(200, { isVerified: true }, "OTP verified succesfully"));
})
