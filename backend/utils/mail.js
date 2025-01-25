import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const generateAndSendOTP = async (recipientEmail) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipientEmail,
      subject: "Verification OTP",
      text: `here is the otp to verify yourself- ${otp}`,
    };

    const result = await transporter.sendMail(mailOptions);
    return { otp, result };
  } catch (error) {
    return { otp, result: null };
  }
};

export const sendFeedback = async (data) => {
  console.log(data);
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: data.email,
      subject: "Feedback on your video submission",
      text: `Dear ${data?.student_name},

Your video submission has been reviewed by ${data?.teacher_name}. Here is the feedback:

Feedback:
"${data?.feedback}"

We encourage you to review the feedback and make any necessary improvements.

If you have any questions, feel free to reach out.`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("resutlt", result);
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const sendRequestStatusMail = async (data) => {
  console.log(data);
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: data.email,
      subject: "New Interview Request",
      text: data?.text_message,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("resutlt", result);
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const sendNewRequestEmail = async (data) => {
  console.log(data);
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: data.email,
      subject: "New Request for the interview",
      text: data?.text_message,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("resutlt", result);
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};
