import mysql from "mysql2"
import { configDotenv } from "dotenv";
configDotenv();
console.log(process.env.DB_HOST)
const pool=mysql.createPool({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    database:process.env.DB_NAME,
    password:process.env.DB_PASS
}).promise();

console.log("db method called");
// let sql="select * from users where id;"

// const [result,_]=await pool.execute(sql)
// console.log(result);

export default pool