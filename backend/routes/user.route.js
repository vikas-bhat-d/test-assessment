import { Router } from "express";
import {
  addFeedback,
  addMultiQuestions,
  addQuestions,
  addSubject,
  fetchVideo,
  getQuestions,
  getSubjects,
  getTeacher,
  login,
  parseExcel,
  register,
  submitTest,
  uploadVideo,
} from "../controller/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { upload } from "../middlewares/multer.middleware.js";

export const userRouter = Router();

userRouter.route("/register").post(register);
userRouter.route("/login").post(login);
userRouter.route("/").get(verifyJWT, async (req, res, next) => {
  return res.status(200).send(req.user);
});

userRouter.route("/subjects").post(verifyJWT, addSubject);
userRouter.route("/subjects").get(verifyJWT, getSubjects);
userRouter.route("/questions").post(verifyJWT, addQuestions);
userRouter.route("/multipleQuestions").post(verifyJWT, addMultiQuestions);
userRouter.route("/questions").get(verifyJWT, getQuestions);
userRouter.route("/submit-test").post(verifyJWT, submitTest);
userRouter.route("/teachers").get(verifyJWT, getTeacher);
// userRouter.route("/video").post(verifyJWT, upload.single("video"), uploadVideo);
userRouter.post(
  "/video",
  (req, res, next) => {
    upload.single("video")(req, res, (err) => {
      if (err) {
        console.error("Multer Error:", err);
        return res.status(400).send("File upload error");
      }
      next();
    });
  },
  verifyJWT,
  uploadVideo
);

userRouter.route("/excel").post(upload.single("data"), verifyJWT, parseExcel);

userRouter.route("/video").get(verifyJWT, fetchVideo);
userRouter.route("/feedback").post(verifyJWT, addFeedback);
