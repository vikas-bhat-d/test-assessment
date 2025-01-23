import User from "../model/user.model.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import apiResponse from "../utils/apiResponse.utils.js";
import db from "../database/db.js";
import { sendFeedback } from "../utils/mail.js";
import XLSX from "xlsx";
import { promises as fs } from "fs";

const cookieOptions = {
  httpOnly: true,
  secure: true,
};

export const register = asyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body;
  if ([username, email, password, role].some((field) => field?.trim() === "")) {
    return res
      .status(400)
      .send(new apiResponse(400, null, "all fields are required"));
  }

  let existedUser = await User.findByEmail(email);
  if (existedUser.id) {
    return res
      .status(400)
      .send(new apiResponse(400, null, "user already exists"));
  }

  let isVerified = await User.isVerified(email);
  console.log(isVerified);
  isVerified = true;
  if (!isVerified)
    return res
      .status(400)
      .send(new apiResponse(400, null, "user not verified"));

  const user = new User({ username, email, password, role });
  const subjects = await user.save();
  res
    .status(200)
    .send(new apiResponse(200, subjects, "User Registered Successfully"));
});

const verifyOTP = async (email, otp) => {
  const sql = "SELECT * FROM otp_tokens WHERE email = ? AND otp = ?";
  const [rows] = await db.execute(sql, [email, otp]);
  if (rows.length === 0) {
    return false;
  }

  const otpData = rows[0];
  if (new Date() > new Date(otpData.expires_at)) {
    return false;
  }

  if (otpData.is_used) {
    return res
      .status(400)
      .send(new apiResponse(400, null, "OTP has already been used"));
  }

  await db.execute("DELETE FROM otp_tokens WHERE email=?", [email]);

  return true;
};

export const login = asyncHandler(async (req, res, next) => {
  const { email, pass, byOTP } = req.body;

  console.log(req.body);
  console.log(email, pass, byOTP);

  if (email.trim() == "" || pass.trim() == "")
    return res
      .status(400)
      .send(new apiResponse(400, null, "all the fields are required"));
  let existedUser = await User.findByEmail(email);
  console.log(existedUser);
  if (!existedUser.id) {
    return res.status(400).send(new apiResponse(400, null, "incorrect email"));
  }
  let isVerified;
  if (byOTP === "false" || byOTP === false)
    isVerified = await existedUser.checkPassword(pass);
  else isVerified = await verifyOTP(email, pass);

  console.log("verified:", isVerified);

  if (!isVerified)
    return res
      .status(400)
      .send(
        new apiResponse(
          400,
          null,
          "Incorrect password or otp.. or otp is expired"
        )
      );

  const accessToken = await existedUser.generateAccessToken();
  const refreshToken = await existedUser.generateRefreshToken();

  const sql = "UPDATE users SET refreshToken=? WHERE id=?;";
  await db.execute(sql, [refreshToken, existedUser.id]);

  console.log("res sent");

  return res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .status(200)
    .send(
      new apiResponse(
        200,
        { accessToken, refreshToken },
        "logged in succesfully"
      )
    );
});

export const getTeacher = asyncHandler(async (req, res, next) => {
  const sql = "SELECT id,username FROM users WHERE role='teacher'";
  const [result] = await db.execute(sql);
  res
    .status(201)
    .send(new apiResponse(201, result, "fetched teachers succesfully"));
});

export const addSubject = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const teacherId = req.user?.id;
  console.log(req.user);
  const [subjects] = await db.query(
    "INSERT INTO subjects (name, teacher_id) VALUES (?, ?)",
    [name, teacherId]
  );
  res
    .status(201)
    .send(new apiResponse(200, subjects, "Subject added successfully"));
});

export const getSubjects = asyncHandler(async (req, res, next) => {
  const teacher_id = req.query.teacherId
    ? parseInt(req.query.teacherId)
    : req.user.id;
  const withQuestion = req.query?.q;
  let subjectsWithQuestions = null;
  console.log("with question:", withQuestion);
  const [subjects] = await db.query(
    "SELECT * from subjects WHERE teacher_id=?",
    [teacher_id]
  );

  if (withQuestion === "true" || withQuestion === true) {
    const subjectsWithQuestionsPromises = subjects.map(async (subject) => {
      const [questions] = await db.query(
        "SELECT * FROM questions WHERE subject_id=?",
        [subject.id]
      );
      return { ...subject, questions };
    });

    subjectsWithQuestions = await Promise.all(subjectsWithQuestionsPromises);
    console.log(subjectsWithQuestions);
  }

  return res
    .status(201)
    .send(
      new apiResponse(
        200,
        subjectsWithQuestions ? subjectsWithQuestions : subjects,
        "subjects and questions fetched successfully"
      )
    );
});

export const addQuestions = asyncHandler(async (req, res, next) => {
  const {
    subjectId,
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    correctOption,
  } = req.body;
  const [subjects] = await db.query(
    "INSERT INTO questions (subject_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [subjectId, questionText, optionA, optionB, optionC, optionD, correctOption]
  );

  return res
    .status(201)
    .send(new apiResponse(200, subjects, "question added succesfully"));
});

export const addMultiQuestions = asyncHandler(async (req, res, next) => {
  let { questions, subjectId } = req.body;

  console.log(questions, subjectId);
  if (typeof questions === "string") {
    questions = JSON.parse(questions);
  }

  console.log("questions: ", questions, typeof questions);

  try {
    // Use Promise.all with map to handle multiple asynchronous operations
    const results = await Promise.all(
      questions.map(async (element) => {
        const {
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctOption,
        } = element;

        const [subjects] = await db.query(
          "INSERT INTO questions (subject_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            subjectId,
            questionText,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
          ]
        );

        return subjects;
      })
    );

    console.log(results);

    return res
      .status(200)
      .send(new apiResponse(200, {}, "Questions added successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).send(new apiResponse(500, null, error));
  }
});

export const getQuestions = asyncHandler(async (req, res, next) => {
  const { subjectId, numQuestions } = req.query;
  console.log(subjectId, parseInt(numQuestions));
  const [questions] = await db.query(
    `SELECT id,subject_id,question_text,option_a,option_b,option_c,option_d FROM questions WHERE subject_id = ? ORDER BY RAND() LIMIT ?`,
    [subjectId, parseInt(numQuestions)]
  );
  res.status(201).json(questions);
});

export const submitTest = asyncHandler(async (req, res, next) => {
  let { subjectId, answers } = req.body;
  console.log(subjectId, answers);
  const student_id = req.user.id;
  let score = 0;
  if (typeof answers === "string") answers = JSON.parse(answers);
  console.log(answers.length);
  console.log(answers[0]);
  const [subjects] = await db.query(
    "INSERT INTO tests (student_id, subject_id, score,no_of_questions) VALUES (?, ?, ?,?)",
    [student_id, subjectId, 0, answers?.length]
  );
  const testId = subjects.insertId;
  for (const answer of answers) {
    const [question] = await db.query(
      "SELECT correct_option FROM questions WHERE id = ?",
      [answer.questionId]
    );
    console.log(question);
    const isCorrect = question[0]?.correct_option === answer.selectedOption;
    score += isCorrect ? 1 : 0;

    await db.query(
      "INSERT INTO test_answers (test_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)",
      [testId, answer.questionId, answer.selectedOption, isCorrect]
    );
  }

  await db.query("UPDATE tests SET score = ? WHERE id = ?", [score, testId]);

  res
    .status(200)
    .send(
      new apiResponse(
        200,
        { testId, score, numQuestions: answers?.length },
        "submitted succesfully"
      )
    );
});

export const uploadVideo = asyncHandler(async (req, res, next) => {
  const { to_id } = req.body;
  console.log(req.file);
  const from_id = req.user?.id;

  if (!from_id || !to_id) {
    return res.status(400).json({ error: "from_id and to_id are required" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Video file is required" });
  }

  const videoPath = `videos/${req.file.filename}`;

  const [result] = await db.query(
    "INSERT INTO videos (video_path, from_id, to_id) VALUES (?, ?, ?)",
    [videoPath, from_id, to_id]
  );

  res
    .status(201)
    .send(new apiResponse(201, result, "video uploaded succesfully"));
});

export const fetchVideo = asyncHandler(async (req, res, next) => {
  const user = req.user;
  console.log(user);
  let sql;
  if (user.role === "teacher") {
    sql = "SELECT * from videos where to_id=?";
  } else {
    sql = "SELECT * from videos where from_id=?";
  }

  const [videos] = await db.execute(sql, [user.id]);
  console.log(videos);
  res
    .status(201)
    .send(new apiResponse(201, videos, "fetched video successfuly"));
});

export const addFeedback = asyncHandler(async (req, res, next) => {
  const { videoId, feedback } = req.body;
  if (req.user?.role != "teacher")
    return res.status(400).send("unauthorized request");

  let sql = "SELECT * FROM videos WHERE id=?";

  let [existedVideo] = await db.execute(sql, [videoId]);
  if (!existedVideo) res.status(400).send("video doesn't exist");

  sql = "UPDATE videos SET feedback=?,status='reviewed' WHERE id=?";
  let [result] = await db.execute(sql, [feedback, videoId]);

  sql = "SELECT * FROM videos WHERE id=?";

  if (existedVideo.length > 0) {
    console.log(existedVideo[0]);
    const student = await User.findById(existedVideo[0].from_id);
    const teacher = await User.findById(existedVideo[0].to_id);
    console.log(student, teacher);
    sendFeedback({
      student_name: student.username,
      teacher_name: teacher.username,
      email: student.email,
      feedback,
    });
  }
  res
    .status(201)
    .send(new apiResponse(201, result, "added feedback succesfully"));
});

export const logout = asyncHandler(async (req, res, next) => {
  return res.send("user logged out succesfully");
});

export const parseExcel = asyncHandler(async (req, res, next) => {
  let workbook = null;
  if (req.file) workbook = XLSX.readFile(req.file.path);

  const sheetName = workbook?.SheetNames[0];
  const workSheet = workbook.Sheets[sheetName];
  const jsonArray = XLSX.utils.sheet_to_json(workSheet);
  console.log(jsonArray);
  await fs.unlink(req.file?.path);
  res.json(jsonArray);
});
