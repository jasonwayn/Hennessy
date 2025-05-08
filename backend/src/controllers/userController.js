const db = require("../config/db");

// ✅ 로그인한 유저의 닉네임 + 프로필 이미지 반환
exports.getMyInfo = (req, res) => {
  const userEmail = req.user.email;

  const query = `
    SELECT nickname, profile_image AS profile_image_url
    FROM users
    WHERE email = ?
  `;

  db.query(query, [userEmail], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류" });
    if (results.length === 0) return res.status(404).json({ message: "유저 정보 없음" });

    res.json(results[0]);
  });
};

// ✅ 프로필 이미지 업데이트
exports.updateProfileImage = (req, res) => {
  const { image_url } = req.body;
  const userEmail = req.user.email;

  if (!image_url) return res.status(400).json({ message: "URL 없음" });

  const query = `UPDATE users SET profile_image = ? WHERE email = ?`;
  db.query(query, [image_url, userEmail], (err) => {
    if (err) return res.status(500).json({ message: "DB 오류" });
    res.json({ message: "프로필 이미지 업데이트 완료" });
  });
};
