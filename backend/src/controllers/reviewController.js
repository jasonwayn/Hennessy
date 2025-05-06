const db = require("../config/db");

// 리뷰 작성
exports.createReview = (req, res) => {
  const { slug } = req.params;
  const { review_text } = req.body;
  const userEmail = req.user.email;

  if (!review_text || review_text.trim() === "") {
    return res.status(400).json({ message: "리뷰 내용을 입력해주세요." });
  }

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = userResults[0].id;

    db.query("SELECT id FROM albums WHERE slug = ?", [slug], (err2, albumResults) => {
      if (err2 || albumResults.length === 0) return res.status(404).json({ message: "앨범 없음" });

      const albumId = albumResults[0].id;

      const insertQuery = `INSERT INTO reviews (user_id, album_id, review_text) VALUES (?, ?, ?)`;
      db.query(insertQuery, [userId, albumId, review_text], (err3) => {
        if (err3) return res.status(500).json({ message: "서버 에러" });
        res.status(201).json({ message: "리뷰 저장 완료" });
      });
    });
  });
};

// 리뷰 조회
exports.getReviews = (req, res) => {
  const { slug } = req.params;
  const sort = req.query.sort === "recent" ? "r.created_at DESC" : "like_count DESC, r.created_at DESC";
  const userEmail = req.user.email;

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    const userId = userResults?.[0]?.id || 0;

    db.query("SELECT id FROM albums WHERE slug = ?", [slug], (err2, albumResults) => {
      if (err2 || albumResults.length === 0) return res.status(404).json({ message: "앨범 없음" });

      const albumId = albumResults[0].id;

      const query = `
      SELECT r.id, r.review_text, r.created_at, u.nickname, u.profile_image,
             COUNT(rl.id) AS like_count,
             EXISTS (
               SELECT 1 FROM review_likes rl2 WHERE rl2.review_id = r.id AND rl2.user_id = ?
             ) AS liked
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN review_likes rl ON r.id = rl.review_id
      WHERE r.album_id = ?
      GROUP BY r.id
      ORDER BY ${sort}
      `;

      db.query(query, [userId, albumId], (err3, results) => {
        if (err3) return res.status(500).json({ message: "리뷰 조회 실패" });
        res.json(results);
      });
    });
  });
};

// 리뷰 좋아요 토글
exports.toggleReviewLike = (req, res) => {
  const reviewId = req.params.id;
  const userEmail = req.user.email;

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = results[0].id;

    db.query(
      "SELECT * FROM review_likes WHERE user_id = ? AND review_id = ?",
      [userId, reviewId],
      (err2, results2) => {
        if (err2) return res.status(500).json({ message: "DB 오류" });

        if (results2.length > 0) {
          db.query(
            "DELETE FROM review_likes WHERE user_id = ? AND review_id = ?",
            [userId, reviewId],
            (err3) => {
              if (err3) return res.status(500).json({ message: "좋아요 취소 실패" });
              res.json({ message: "좋아요 취소됨" });
            }
          );
        } else {
          db.query(
            "INSERT INTO review_likes (user_id, review_id) VALUES (?, ?)",
            [userId, reviewId],
            (err4) => {
              if (err4) return res.status(500).json({ message: "좋아요 실패" });
              res.json({ message: "좋아요 성공" });
            }
          );
        }
      }
    );
  });
};

// 리뷰 수정
exports.updateReview = (req, res) => {
  const reviewId = req.params.id;
  const { review_text } = req.body;
  const userEmail = req.user.email;

  if (!review_text || review_text.trim() === "") {
    return res.status(400).json({ message: "리뷰 내용을 입력해주세요." });
  }

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = userResults[0].id;

    db.query(
      "UPDATE reviews SET review_text = ? WHERE id = ? AND user_id = ?",
      [review_text, reviewId, userId],
      (err2, result) => {
        if (err2) return res.status(500).json({ message: "서버 오류" });
        if (result.affectedRows === 0) return res.status(403).json({ message: "수정 권한 없음" });

        res.json({ message: "리뷰 수정 완료" });
      }
    );
  });
};

// 리뷰 삭제
exports.deleteReview = (req, res) => {
  const reviewId = req.params.id;
  const userEmail = req.user.email;

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = userResults[0].id;

    db.query("DELETE FROM reviews WHERE id = ? AND user_id = ?", [reviewId, userId], (err2, result) => {
      if (err2) return res.status(500).json({ message: "서버 오류" });
      if (result.affectedRows === 0) return res.status(403).json({ message: "삭제 권한 없음" });

      res.json({ message: "리뷰 삭제 완료" });
    });
  });
};
