// src/config/db.js
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "nodeuser",
  password: "nodepass123!", 
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