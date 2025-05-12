const db = require("../config/db");

/**
 * 🔹 1. Firebase 회원가입 후 DB에 email만 등록
 * POST /api/auth/register
 */
exports.createUserIfNotExists = (req, res) => {
  const email = req.user.email;

  const query = "INSERT IGNORE INTO users (email) VALUES (?)";
  db.query(query, [email], (err) => {
    if (err) {
      console.error("유저 등록 실패:", err);
      return res.status(500).json({ message: "DB 오류" });
    }
    res.json({ message: "유저 등록 완료" });
  });
};

/**
 * 🔹 2. 닉네임 설정 (이미 존재하는 email 기준으로 nickname 업데이트)
 * POST /api/register
 */
exports.registerUser = (req, res) => {
  const { nickname } = req.body;
  const { email } = req.user;

  if (!nickname || nickname.trim() === "") {
    return res.status(400).json({ message: "닉네임은 필수입니다." });
  }

  const updateQuery = `
    UPDATE users
    SET nickname = ?
    WHERE email = ?
  `;

  db.query(updateQuery, [nickname, email], (err, result) => {
    if (err) {
      console.error("닉네임 설정 실패:", err);
      return res.status(500).json({ message: "DB 오류 (닉네임 설정)" });
    }

    // 적용된 행이 없는 경우 (이메일 등록이 안 되어 있음)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "유저가 먼저 등록되어야 합니다." });
    }

    res.status(200).json({ message: "닉네임 설정 완료" });
  });
};
