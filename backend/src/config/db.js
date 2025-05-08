// src/config/db.js
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "hjsoo2001!", // 환경변수로 바꾸는 게 좋음
  database: "hennessy_db"
});

db.connect((err) => {
  if (err) {
    console.error("MySQL 연결 실패:", err);
    return;
  }
  console.log("✅ MySQL 연결 성공");
});

module.exports = db;