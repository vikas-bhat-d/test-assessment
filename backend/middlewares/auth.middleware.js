import pool from "../database/db.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.utils.js";
import apiResponse from "../utils/apiResponse.utils.js";
import User from "../model/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken || accessToken === undefined) {
    return res
      .status(400)
      .send(new apiResponse(400, null, "Unauthorized request"));
  }

  let decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

  if (!decodedToken)
    return res.status(400).send(new apiResponse(400, null, "Invalid token"));

  const user = await User.findById(decodedToken.id);
  if (!user)
    return res
      .status(400)
      .send(new apiResponse(400, null, "Invalid token,User not found"));
  req.user = user;
});
