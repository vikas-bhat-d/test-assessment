import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../database/db.js";

class User {
  constructor({ id, username, email, password, refreshToken, role }) {
    this.id = id ? id : null;
    this.username = username ? username : null;
    this.email = email ? email : null;
    this.password = password ? password : null;
    this.refreshToken = refreshToken ? refreshToken : null;
    this.role = role ? role : null;
  }

  async save() {
    this.password = await bcrypt.hash(this.password, 10);
    const sql =
      "INSERT INTO users(username,email,password,role) values(?,?,?,?);";
    const [result] = await pool.execute(sql, [
      this.username,
      this.email,
      this.password,
      this.role,
    ]);
    return result;
  }

  async checkPassword(password) {
    const isCorrect = await bcrypt.compare(password, this.password);
    return isCorrect;
  }

  static async findById(id) {
    const sql = "SELECT id,username,email,role FROM users WHERE id=?;";
    const [result] = await pool.execute(sql, [id]);
    if (result.length == 0) return {};
    return new User(result[0]);
  }

  static async findByEmail(email) {
    const sql = "SELECT * FROM users WHERE email=?;";
    const [result] = await pool.execute(sql, [email]);
    if (result.length == 0) return {};
    return new User(result[0]);
  }

  static async find() {
    const sql = "SELECT * FROM users;";
    const [result] = await pool.execute(sql);
    return result;
  }

  static async isVerified(email) {
    const sql = "SELECT * FROM otp_tokens WHERE email = ? AND is_used=1";
    const [rows] = await pool.execute(sql, [email]);
    if (rows.length == 0) return false;
    const deleteOTP = "DELETE FROM otp_tokens WHERE email=?";
    await pool.execute(deleteOTP, [email]);
    return true;
  }

  async generateAccessToken() {
    return jwt.sign(
      {
        id: this.id,
        username: this.username,
        email: this.email,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "24h",
      }
    );
  }

  async generateRefreshToken() {
    return jwt.sign(
      {
        id: this.id,
        username: this.username,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "10d",
      }
    );
  }
}

export default User;
