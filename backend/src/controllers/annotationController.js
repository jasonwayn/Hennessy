const db = require("../config/db");

// 주석 저장 (직접 start_char, end_char 전달하는 방식)
exports.createAnnotation = (req, res) => {
  const { song_id, start_char, end_char, type, content } = req.body;
  const userEmail = req.user.email;

  if (!song_id || start_char == null || end_char == null || !type || !content) {
    return res.status(400).json({ message: "필수 값 누락" });
  }

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = userResults[0].id;

    const insertQuery = `
      INSERT INTO song_annotations (song_id, user_id, start_char, end_char, type, content)
      VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(insertQuery, [song_id, userId, start_char, end_char, type, content], (err2, result) => {
      if (err2) return res.status(500).json({ message: "DB 오류" });
      res.status(201).json({ message: "주석 저장 완료", id: result.insertId });
    });
  });
};

// 주석 불러오기 (start_char, end_char 기준)
exports.getAnnotationByPosition = (req, res) => {
  const { song_id, start, end, type } = req.query;

  if (!song_id || !start || !end || !type) {
    return res.status(400).json({ message: "필수 파라미터 누락" });
  }

  const query = `
    SELECT 
      a.*, 
      u.nickname,
      (
        SELECT COUNT(*) 
        FROM annotation_likes 
        WHERE annotation_id = a.id
      ) AS likes
    FROM song_annotations a
    JOIN users u ON a.user_id = u.id
    WHERE a.song_id = ? AND a.start_char = ? AND a.end_char = ? AND a.type = ?
    ORDER BY likes DESC, a.created_at DESC
  `;

  db.query(query, [song_id, start, end, type], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류" });
    res.json(results);
  });
};

// 주석 저장 (line 문자열로 위치 계산)
exports.createAnnotationFromLine = (req, res) => {
  const { song_id, line, content, type } = req.body;
  const userEmail = req.user.email;

  if (!song_id || !line || !content || !type) {
    return res.status(400).json({ message: "필수 항목 누락" });
  }

  const decodedLine = decodeURIComponent(line);

  db.query("SELECT lyrics FROM songs WHERE id = ?", [song_id], (err, results) => {
    if (err) return res.status(500).json({ message: "가사 조회 실패" });
    if (results.length === 0) return res.status(404).json({ message: "곡 없음" });

    const lyrics = results[0].lyrics;
    const start_char = lyrics.indexOf(decodedLine);
    const end_char = start_char + decodedLine.length;

    if (start_char === -1) {
      return res.status(400).json({ message: "해당 문장을 가사에서 찾을 수 없음" });
    }

    db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err2, userResults) => {
      if (err2 || userResults.length === 0) {
        return res.status(401).json({ message: "유저 인증 실패" });
      }

      const userId = userResults[0].id;

      const insertQuery = `
        INSERT INTO song_annotations (song_id, user_id, start_char, end_char, content, type)
        VALUES (?, ?, ?, ?, ?, ?)`;

      db.query(insertQuery, [song_id, userId, start_char, end_char, content, type], (err3, result) => {
        if (err3) return res.status(500).json({ message: "주석 등록 실패" });
        res.status(201).json({ message: "주석 등록 완료", annotation_id: result.insertId });
      });
    });
  });
};

// 주석 조회 (line 문자열 기반)
// 수정 후 - 로그인 여부 따라 liked 필드 포함
exports.getAnnotationByLine = (req, res) => {
  const { song_id, line } = req.query;
  const userEmail = req.user?.email || null; // 로그인 안 했으면 null

  if (!song_id || !line) {
    return res.status(400).json({ message: "필수 파라미터 누락" });
  }

  const decodedLine = decodeURIComponent(line);

  db.query("SELECT lyrics FROM songs WHERE id = ?", [song_id], (err, results) => {
    if (err) return res.status(500).json({ message: "가사 조회 실패" });
    if (results.length === 0) return res.status(404).json({ message: "곡 없음" });

    const lyrics = results[0].lyrics;
    const start_char = lyrics.indexOf(decodedLine);
    const end_char = start_char + decodedLine.length;

    if (start_char === -1) {
      return res.status(404).json({ message: "문장을 가사에서 찾을 수 없음" });
    }

    // 로그인한 사용자 ID 조회 (없으면 null)
    if (!userEmail) return queryAndRespond(null); // 비로그인 상태

    db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err2, userResults) => {
      const userId = userResults.length > 0 ? userResults[0].id : null;
      queryAndRespond(userId);
    });

    function queryAndRespond(userId) {
      const query = `
        SELECT 
          a.*, 
          a.user_id,
          u.nickname,
          u.email AS user_email,
          u.profile_image_url,
          (
            SELECT COUNT(*) FROM annotation_likes WHERE annotation_id = a.id
          ) AS likes,
          (
            SELECT COUNT(*) FROM annotation_likes WHERE annotation_id = a.id AND user_id = ?
          ) AS liked
        FROM song_annotations a
        JOIN users u ON a.user_id = u.id
        WHERE a.song_id = ? AND a.start_char = ? AND a.end_char = ?
        ORDER BY a.type, likes DESC, a.created_at DESC
      `;

      db.query(query, [userId, song_id, start_char, end_char], (err3, results3) => {
        if (err3) return res.status(500).json({ message: "DB 오류" });

        // liked 필드 Boolean으로 변환
        const withLiked = results3.map(r => ({ ...r, liked: !!r.liked }));
        res.json(withLiked);
      });
    }
  });
};



// 좋아요 toggle API
exports.toggleAnnotationLike = (req, res) => {
    const annotationId = req.params.id;
    const userEmail = req.user.email;
  
    const getUserQuery = `SELECT id FROM users WHERE email = ?`;
  
    db.query(getUserQuery, [userEmail], (err, userResults) => {
      if (err || userResults.length === 0) {
        return res.status(401).json({ message: "유저 인증 실패" });
      }
  
      const userId = userResults[0].id;
  
      const checkQuery = `
        SELECT * FROM annotation_likes
        WHERE user_id = ? AND annotation_id = ?
      `;
  
      db.query(checkQuery, [userId, annotationId], (err2, likeResults) => {
        if (err2) return res.status(500).json({ message: "DB 오류" });
  
        if (likeResults.length > 0) {
          // 좋아요 이미 있음 → 삭제
          const deleteQuery = `
            DELETE FROM annotation_likes
            WHERE user_id = ? AND annotation_id = ?
          `;
          db.query(deleteQuery, [userId, annotationId], (err3) => {
            if (err3) return res.status(500).json({ message: "좋아요 취소 실패" });
            res.json({ message: "좋아요 취소됨" });
          });
        } else {
          // 좋아요 추가
          const insertQuery = `
            INSERT INTO annotation_likes (user_id, annotation_id)
            VALUES (?, ?)
          `;
          db.query(insertQuery, [userId, annotationId], (err4) => {
            if (err4) return res.status(500).json({ message: "좋아요 실패" });
            res.json({ message: "좋아요 성공" });
          });
        }
      });
    });
  };

  // 주석 수정
exports.updateAnnotation = (req, res) => {
  const annotationId = req.params.id;
  const { content } = req.body;
  const userEmail = req.user.email;

  if (!content) {
    return res.status(400).json({ message: "내용이 비어 있습니다." });
  }

  // 사용자 인증 및 소유자 확인
  db.query("SELECT u.id AS user_id, a.user_id AS author_id FROM users u JOIN song_annotations a ON a.id = ? WHERE u.email = ?", 
    [annotationId, userEmail], 
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ message: "인증 실패 또는 주석 없음" });
      }

      const { user_id, author_id } = results[0];
      if (user_id !== author_id) {
        return res.status(403).json({ message: "본인의 주석만 수정할 수 있습니다." });
      }

      db.query(
        "UPDATE song_annotations SET content = ? WHERE id = ?",
        [content, annotationId],
        (err2) => {
          if (err2) return res.status(500).json({ message: "DB 오류" });
          res.json({ message: "주석이 수정되었습니다." });
        }
      );
    }
  );
};

// 주석 삭제
exports.deleteAnnotation = (req, res) => {
  const annotationId = req.params.id;
  const userEmail = req.user.email;
  db.query(
    "SELECT u.id AS user_id, a.user_id AS author_id FROM users u JOIN song_annotations a ON a.id = ? WHERE u.email = ?",
    [annotationId, userEmail],
    (err, results) => {
      if (err || results.length === 0) {
        console.error("인증 실패 또는 주석 없음:", err);
        return res.status(401).json({ message: "인증 실패 또는 주석 없음" });
      }

      const { user_id, author_id } = results[0];
      if (user_id !== author_id) {
        console.warn("본인 아님:", user_id, author_id);
        return res.status(403).json({ message: "본인의 주석만 삭제할 수 있습니다." });
      }

      db.query(
        "DELETE FROM song_annotations WHERE id = ?",
        [annotationId],
        (err2) => {
          if (err2) {
            console.error("DB 삭제 오류:", err2); 
            return res.status(500).json({ message: "DB 오류" });
          }
          res.json({ message: "주석이 삭제되었습니다." });
        }
      );
    }
  );
};


