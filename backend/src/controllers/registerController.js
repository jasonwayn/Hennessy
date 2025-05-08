const db = require("../config/db");

exports.registerUser = (req, res) => {
  const { nickname } = req.body;
  const { email } = req.user; // ✅ authenticateFirebaseToken 미들웨어로부터

  if (!nickname || nickname.trim() === "") {
    return res.status(400).json({ message: "닉네임은 필수입니다." });
  }

  // 이미 존재하는지 확인
  const checkQuery = "SELECT id FROM users WHERE email = ?";
  db.query(checkQuery, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류 (확인 중)" });
    if (results.length > 0) return res.status(200).json({ message: "이미 등록된 사용자입니다." });

    // 새로 삽입
    const insertQuery = `
      INSERT INTO users (email, nickname)
      VALUES (?, ?)
    `;

    db.query(insertQuery, [email, nickname], (err2) => {
      if (err2) {
        console.error("회원 등록 실패:", err2);
        return res.status(500).json({ message: "DB 오류 (삽입 실패)" });
      }

      res.status(201).json({ message: "회원 등록 완료" });
    });
  });
};
