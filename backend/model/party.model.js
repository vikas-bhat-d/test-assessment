import pool from "../database/db.js";
export default class Party {
  constructor({
    party_id,
    name,
    phone_number,
    email,
    GSTIN,
    type,
    billing_address,
    shipping_address,
    opening_balance,
    balance,
    userID,
  }) {
    this.party_id = party_id ? party_id : null;
    this.name = name ? name : null;
    this.phone_number = phone_number ? phone_number : null;
    this.email = email ? email : null;
    this.GSTIN = GSTIN ? GSTIN : null;
    this.type = type ? type : null;
    this.billing_address = billing_address ? billing_address : null;
    this.shipping_address = shipping_address ? shipping_address : null;
    this.opening_balance = opening_balance ? opening_balance : null;
    this.balance = balance ? balance : null;
    this.userID = userID ? userID : null;
  }

  async save() {
    const sql =
      "INSERT INTO parties(name,phone_number,email,GSTIN,type,billing_address,shipping_address,opening_balance,balance,userID) VALUES (?,?,?,?,?,?,?,?,?,?);";
    const [result] = await pool.execute(sql, [
      this.name,
      this.phone_number,
      this.email,
      this.GSTIN,
      this.type,
      this.billing_address,
      this.shipping_address,
      this.opening_balance,
      this.balance,
      this.userID,
    ]);
    return result;
  }

  static async allParty(userID) {
    const sql =
      "SELECT users.id AS usersID,parties.id AS partiesID ,users.* ,parties.* FROM users JOIN parties ON users.id=?";
    const result = await pool.execute(sql, [userID]);
    return result[0];
  }
}
