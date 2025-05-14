const db = require("../config/db");

// 내 평점 조회
exports.getMyRating = (req, res) => {
  const { slug } = req.params;
  const userEmail = req.user.email;

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });
    const userId = userResults[0].id;

    db.query("SELECT id FROM albums WHERE slug = ?", [slug], (err2, albumResults) => {
      if (err2 || albumResults.length === 0) return res.status(404).json({ message: "앨범 없음" });

      const albumId = albumResults[0].id;
      db.query("SELECT rating FROM album_ratings WHERE user_id = ? AND album_id = ?", [userId, albumId], (err3, results) => {
        if (err3) return res.status(500).json({ message: "DB 오류" });
        res.json({ rating: results[0]?.rating || null });
      });
    });
  });
};

// 평점 등록 또는 수정
exports.setRating = (req, res) => {
  const { slug } = req.params;
  const { rating } = req.body;
  const userEmail = req.user.email;

  if (rating == null || rating < 0 || rating > 10) {
    return res.status(400).json({ message: "평점은 0.0~10.0 사이여야 합니다" });
  }

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = userResults[0].id;

    db.query("SELECT id FROM albums WHERE slug = ?", [slug], (err2, albumResults) => {
      if (err2 || albumResults.length === 0) return res.status(404).json({ message: "앨범 없음" });

      const albumId = albumResults[0].id;

      const upsertQuery = `
        INSERT INTO album_ratings (user_id, album_id, rating)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE rating = VALUES(rating)
      `;
      db.query(upsertQuery, [userId, albumId, rating], (err3) => {
        if (err3) return res.status(500).json({ message: "평점 저장 실패" });
        res.status(201).json({ message: "평점 저장 완료" });
      });
    });
  });
};

// 평균 평점 조회
exports.getAverageRating = (req, res) => {
  const { slug } = req.params;
  db.query("SELECT id FROM albums WHERE slug = ?", [slug], (err, albumResults) => {
    if (err || albumResults.length === 0) return res.status(404).json({ message: "앨범 없음" });

    const albumId = albumResults[0].id;

    db.query("SELECT AVG(rating) AS average FROM album_ratings WHERE album_id = ?", [albumId], (err2, results) => {
      if (err2) return res.status(500).json({ message: "DB 오류" });
      res.json({ average: results[0].average || 0 });
    });
  });
};
