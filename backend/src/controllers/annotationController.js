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
    SELECT a.*, u.nickname
    FROM song_annotations a
    JOIN users u ON a.user_id = u.id
    WHERE a.song_id = ? AND a.start_char = ? AND a.end_char = ? AND a.type = ?
    ORDER BY a.likes DESC, a.created_at DESC
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
exports.getAnnotationByLine = (req, res) => {
  const { song_id, line } = req.query;

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

    if (start_char === -1) return res.status(404).json({ message: "문장을 가사에서 찾을 수 없음" });

    const query = `
      SELECT a.*, u.nickname
      FROM song_annotations a
      JOIN users u ON a.user_id = u.id
      WHERE a.song_id = ? AND a.start_char = ? AND a.end_char = ?
      ORDER BY a.type, a.likes DESC, a.created_at DESC
    `;

    db.query(query, [song_id, start_char, end_char], (err2, results2) => {
      if (err2) return res.status(500).json({ message: "DB 오류" });
      res.json(results2);
    });
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