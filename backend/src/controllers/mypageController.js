const db = require("../config/db");

// ✅ 마이페이지 리뷰 조회 (기본 3개, offset으로 더보기)
exports.getMyReviews = (req, res) => {
  const userEmail = req.user.email;
  const offset = parseInt(req.query.offset || "0");
  const limit = 3;

  const getUserQuery = "SELECT id FROM users WHERE email = ?";
  db.query(getUserQuery, [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(401).json({ message: "유저 인증 실패" });
    }

    const userId = userResults[0].id;

    const reviewQuery = `
      SELECT r.id, r.review_text, r.created_at, a.title AS album_title, a.slug AS album_slug, ar.name AS artist_name, ar.slug AS artist_slug
      FROM reviews r
      JOIN albums a ON r.album_id = a.id
      JOIN artists ar ON a.artist_id = ar.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(reviewQuery, [userId, limit, offset], (err2, results) => {
      if (err2) return res.status(500).json({ message: "DB 오류" });
      res.json(results);
    });
  });
};


// 평점 구간별 앨범 정리
exports.getUserRatingsGrouped = (req, res) => {
    const userEmail = req.user.email;
  
    const getUserIdQuery = "SELECT id FROM users WHERE email = ?";
    db.query(getUserIdQuery, [userEmail], (err, userResults) => {
      if (err || userResults.length === 0) {
        return res.status(401).json({ message: "유저 인증 실패" });
      }
  
      const userId = userResults[0].id;
  
      const ratingGroupQuery = `
        SELECT
          FLOOR(ar.rating) AS rating_group,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'title', al.title,
              'slug', al.slug,
              'image_url', al.image_url,
              'rating', ar.rating
            )
          ) AS albums
        FROM album_ratings ar
        JOIN albums al ON ar.album_id = al.id
        WHERE ar.user_id = ?
        GROUP BY rating_group
        ORDER BY rating_group DESC
      `;
  
      db.query(ratingGroupQuery, [userId], (err2, results) => {
        if (err2) {
          console.error("평점 그룹 조회 실패:", err2);
          return res.status(500).json({ message: "DB 오류" });
        }
        res.json(results);
      });
    });
  };

//프로필 편집 (username) 
exports.updateProfileInfo = (req, res) => {
  const { nickname, bio } = req.body;
  const email = req.user.email;

  if (!nickname || !/^[가-힣a-zA-Z0-9]+$/.test(nickname)) {
    return res.status(400).json({ message: "닉네임은 한글, 영어, 숫자만 허용됩니다." });
  }

  const query = `UPDATE users SET nickname = ?, bio = ? WHERE email = ?`;
  db.query(query, [nickname, bio, email], (err) => {
    if (err) return res.status(500).json({ message: "DB 오류" });
    res.json({ message: "프로필 정보 수정 완료" });
  });
};

// 내가 저장한 다른 사람 리뷰 조회
exports.getSavedReviews = (req, res) => {
  const userEmail = req.user.email;

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(401).json({ message: "유저 인증 실패" });
    }

    const userId = userResults[0].id;

    const query = `
      SELECT sr.id, r.review_text, u.nickname, u.profile_image, a.title AS album_title, ar.name AS artist_name
      FROM saved_reviews sr
      JOIN reviews r ON sr.review_id = r.id
      JOIN users u ON r.user_id = u.id
      JOIN albums a ON r.album_id = a.id
      JOIN artists ar ON a.artist_id = ar.id
      WHERE sr.user_id = ?
      ORDER BY sr.id DESC
    `;

    db.query(query, [userId], (err2, results) => {
      if (err2) return res.status(500).json({ message: "DB 오류" });
      res.json(results);
    });
  });
};