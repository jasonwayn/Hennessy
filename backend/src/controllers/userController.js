const db = require("../config/db");

// ✅ 로그인한 유저의 닉네임 + bio + 프로필 이미지 반환
exports.getMyInfo = (req, res) => {
  const userEmail = req.user?.email;
  if (!userEmail) {
    return res.status(400).json({ message: "이메일이 없습니다" });
  }

  const query = `
    SELECT nickname, bio, profile_image_url
    FROM users
    WHERE email = ?
  `;

  db.query(query, [userEmail], (err, results) => {
    if (err) {
      console.error("❌ DB 오류:", err);
      return res.status(500).json({ message: "DB 오류" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "유저 정보 없음" });
    }

    res.json(results[0]);
  });
};

// ✅ 프로필 이미지 업데이트
exports.updateProfileImage = (req, res) => {
  const { image_url } = req.body;
  const userEmail = req.user.email;

  if (!image_url) return res.status(400).json({ message: "URL 없음" });

  const query = `UPDATE users SET profile_image_url = ? WHERE email = ?`;
  db.query(query, [image_url, userEmail], (err) => {
    if (err) return res.status(500).json({ message: "DB 오류" });
    res.json({ message: "프로필 이미지 업데이트 완료" });
  });
};

// ✅ ID 기반 프로필 조회
exports.getProfileById = (req, res) => {
  const userId = req.params.id;
  const query = `
    SELECT id, nickname, bio, profile_image_url
    FROM users
    WHERE id = ?
  `;
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류" });
    if (results.length === 0) return res.status(404).json({ message: "사용자 없음" });
    res.json(results[0]);
  });
};

// ✅ 타인의 리뷰 목록
exports.getUserReviewsById = (req, res) => {
  const userId = req.params.id;
  const query = `
    SELECT r.id, r.review_text, r.created_at, u.nickname,
           a.slug AS album_slug, a.title AS album_title, a.image_url,
           ar.name AS artist_name, ar.slug AS artist_slug
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN albums a ON r.album_id = a.id
    JOIN artists ar ON a.artist_id = ar.id
    WHERE u.id = ?
    ORDER BY r.created_at DESC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류" });
    res.json(results);
  });
};

// ✅ 타인의 평점 목록 (그룹화)
exports.getUserRatingsGroupedById = (req, res) => {
  const userId = req.params.id;

  const ratingGroupQuery = `
    SELECT
      FLOOR(ar.rating) AS rating_group,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'title', al.title,
          'slug', al.slug,
          'image_url', al.image_url,
          'rating', ar.rating,
          'artist_slug', at.slug
        )
      ) AS albums
    FROM album_ratings ar
    JOIN albums al ON ar.album_id = al.id
    JOIN artists at ON al.artist_id = at.id
    WHERE ar.user_id = ?
    GROUP BY rating_group
    ORDER BY rating_group DESC
  `;

  db.query(ratingGroupQuery, [userId], (err, results) => {
    if (err) {
      console.error("타인 평점 그룹 조회 실패:", err);
      return res.status(500).json({ message: "DB 오류" });
    }
    res.json(results);
  });
};

