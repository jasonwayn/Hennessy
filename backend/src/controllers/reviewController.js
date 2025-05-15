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
  const sort =
    req.query.sort === "recent"
      ? "r.created_at DESC"
      : "like_count DESC, r.created_at DESC";
  const userEmail = req.user?.email;

  const getUserId = (callback) => {
    if (!userEmail) return callback(0);
    db.query(
      "SELECT id FROM users WHERE email = ?",
      [userEmail],
      (err, results) => {
        if (err || results.length === 0) return callback(0);
        return callback(results[0].id);
      }
    );
  };

  getUserId((userId) => {
    db.query(
      "SELECT id FROM albums WHERE slug = ?",
      [slug],
      (err2, albumResults) => {
        if (err2 || albumResults.length === 0)
          return res.status(404).json({ message: "앨범 없음" });

        const albumId = albumResults[0].id;

        const query = `
          SELECT
            r.id,
            r.review_text,
            r.created_at,
            u.id AS user_id,
            u.nickname,
            u.profile_image_url AS profile_image,
            COUNT(rl.id) AS like_count,
            CASE WHEN rl2.user_id IS NOT NULL THEN 1 ELSE 0 END AS liked,
            CASE WHEN sr.user_id IS NOT NULL THEN 1 ELSE 0 END AS saved,  
            CASE WHEN r.user_id = ? THEN 1 ELSE 0 END AS is_owner,
            ar.rating AS user_rating
          FROM reviews r
          JOIN users u ON r.user_id = u.id
          LEFT JOIN review_likes rl ON r.id = rl.review_id
          LEFT JOIN review_likes rl2 ON rl2.review_id = r.id AND rl2.user_id = ?
          LEFT JOIN saved_reviews sr ON sr.review_id = r.id AND sr.user_id = ?
          LEFT JOIN album_ratings ar ON ar.album_id = r.album_id AND ar.user_id = r.user_id
          WHERE r.album_id = ?
          GROUP BY r.id, r.review_text, r.created_at, u.nickname, u.profile_image_url, rl2.user_id, sr.review_id, r.user_id, ar.rating
          ORDER BY ${sort}
        `;

        // ?가 4개 사용되었으므로 userId 3개, albumId 1개 순서로 전달
        db.query(query, [userId, userId, userId, albumId], (err3, results) => {
          if (err3) {
            console.error("리뷰 조회 쿼리 실패:", err3);
            return res.status(500).json({ message: "리뷰 조회 실패" });
          }
          res.json(results);
        });
      }
    );
  });
};

//리뷰 조회 (비회원)
exports.getReviewsPublic = (req, res) => {
  const { slug } = req.params;
  const sort =
    req.query.sort === "recent"
      ? "r.created_at DESC"
      : "like_count DESC, r.created_at DESC";

  db.query(
    "SELECT id FROM albums WHERE slug = ?",
    [slug],
    (err, albumResults) => {
      if (err || albumResults.length === 0) {
        return res.status(404).json({ message: "앨범 없음" });
      }

      const albumId = albumResults[0].id;

      const query = `
        SELECT
          r.id,
          r.review_text,
          r.created_at,
          u.id AS user_id,
          u.nickname,
          u.profile_image_url AS profile_image,
          COUNT(rl.id) AS like_count,
          ar.rating AS user_rating
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN review_likes rl ON r.id = rl.review_id
        LEFT JOIN album_ratings ar ON ar.album_id = r.album_id AND ar.user_id = r.user_id
        WHERE r.album_id = ?
        GROUP BY r.id, r.review_text, r.created_at, u.id, u.nickname, u.profile_image_url, ar.rating
        ORDER BY ${sort}
      `;

      db.query(query, [albumId], (err2, results) => {
        if (err2) {
          console.error("리뷰 조회 실패:", err2);
          return res.status(500).json({ message: "리뷰 조회 실패" });
        }
        res.json(results);
      });
    }
  );
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

// 리뷰 저장 또는 해제 (토글)
exports.toggleSaveReview = (req, res) => {
  const { reviewId } = req.params;
  const userEmail = req.user.email;

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(401).json({ message: "유저 인증 실패" });
    }

    const userId = userResults[0].id;

    db.query("SELECT user_id FROM reviews WHERE id = ?", [reviewId], (err2, reviewResults) => {
      if (err2 || reviewResults.length === 0) {
        return res.status(404).json({ message: "리뷰 없음" });
      }

      const reviewOwnerId = reviewResults[0].user_id;
      if (reviewOwnerId === userId) {
        return res.status(400).json({ message: "본인의 리뷰는 저장할 수 없습니다." });
      }

      db.query(
        "SELECT * FROM saved_reviews WHERE user_id = ? AND review_id = ?",
        [userId, reviewId],
        (err3, savedResults) => {
          if (err3) return res.status(500).json({ message: "DB 오류" });

          if (savedResults.length > 0) {
            db.query(
              "DELETE FROM saved_reviews WHERE user_id = ? AND review_id = ?",
              [userId, reviewId],
              (err4) => {
                if (err4) return res.status(500).json({ message: "해제 실패" });
                res.json({ message: "저장 해제됨", saved: false });
              }
            );
          } else {
            db.query(
              "INSERT INTO saved_reviews (user_id, review_id) VALUES (?, ?)",
              [userId, reviewId],
              (err5) => {
                if (err5) return res.status(500).json({ message: "저장 실패" });
                res.json({ message: "리뷰 저장 완료", saved: true });
              }
            );
          }
        }
      );
    });
  });
};

exports.getSavedReviews = (req, res) => {
  const userEmail = req.user.email;

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(401).json({ message: "유저 인증 실패" });
    }

    const userId = userResults[0].id;

    const query = `
      SELECT 
        r.id,
        r.review_text,
        r.created_at,
        u.id AS user_id,
        u.nickname,
        a.title AS album_title,
        a.slug AS album_slug,
        a.image_url,
        ar.name AS artist_name,
        ar.slug AS artist_slug
      FROM saved_reviews sr
      JOIN reviews r ON sr.review_id = r.id
      JOIN users u ON r.user_id = u.id
      JOIN albums a ON r.album_id = a.id
      JOIN artists ar ON a.artist_id = ar.id
      WHERE sr.user_id = ?
      ORDER BY r.created_at DESC
    `;

    db.query(query, [userId], (err2, results) => {
      if (err2) {
        console.error("저장된 리뷰 조회 실패:", err2);
        return res.status(500).json({ message: "조회 실패" });
      }
      res.json(results);
    });
  });
};

exports.getMyReviews = (req, res) => {
  const userEmail = req.user.email;

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) {
      return res.status(401).json({ message: "유저 인증 실패" });
    }

    const userId = userResults[0].id;
    const offset = parseInt(req.query.offset) || 0;

    const query = `
      SELECT 
        r.id,
        r.review_text,
        r.created_at,
        a.title AS album_title,
        a.slug AS album_slug,
        a.image_url,
        ar.name AS artist_name,
        ar.slug AS artist_slug
      FROM reviews r
      JOIN albums a ON r.album_id = a.id
      JOIN artists ar ON a.artist_id = ar.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10 OFFSET ?
    `;

    db.query(query, [userId, offset], (err2, results) => {
      if (err2) {
        console.error("내 리뷰 조회 실패:", err2);
        return res.status(500).json({ message: "조회 실패" });
      }
      res.json(results);
    });
  });
};

