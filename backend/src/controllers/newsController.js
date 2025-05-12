const db = require("../config/db");

// ✅ 전체 뉴스 목록 조회 (최신순)
exports.getAllNews = (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = 6;

  const query = `
    SELECT id, title, summary, image_url, created_at
    FROM news
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.query(query, [limit, offset], (err, results) => {
    if (err) return res.status(500).json({ message: "뉴스 조회 실패" });
    res.json(results);
  });
};

// ✅ 인기 뉴스 (최근 3일간 조회수 기준)
exports.getTopNews = (req, res) => {
  const query = `
    SELECT id, title, summary, image_url, created_at, views
    FROM news
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)
    ORDER BY views DESC
    LIMIT 3
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "인기 뉴스 조회 실패" });
    res.json(results);
  });
};

// ✅ 단일 뉴스 조회 (상세 + 조회수 증가)
exports.getNewsById = (req, res) => {
  const { id } = req.params;

  const selectQuery = `
    SELECT n.id, n.title, n.summary, n.content, n.image_url, n.created_at,
           u.nickname, u.profile_image_url
    FROM news n
    JOIN users u ON n.user_id = u.id
    WHERE n.id = ?
  `;

  db.query(selectQuery, [id], (err, results) => {
    if (err) {
      console.error("뉴스 상세 조회 실패:", err);
      return res.status(500).json({ message: "뉴스 조회 실패" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "뉴스 없음" });
    }

    db.query("UPDATE news SET views = views + 1 WHERE id = ?", [id]); // 비동기 조회수 증가
    res.json(results[0]);
  });
};


// ✅ 뉴스 등록
exports.createNews = (req, res) => {
  const { title, summary, content, image_url } = req.body;
  const userEmail = req.user.email;

  if (!title || !summary || !content) {
    return res.status(400).json({ message: "제목, 요약, 내용을 입력해주세요." });
  }

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = userResults[0].id;

    const query = `
      INSERT INTO news (title, summary, content, image_url, user_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(query, [title, summary, content, image_url, userId], (err2, result) => {
      if (err2) return res.status(500).json({ message: "뉴스 등록 실패" });
      res.status(201).json({ message: "뉴스 등록 성공", news_id: result.insertId });
    });
  });
};

// ✅ 뉴스 수정
exports.updateNews = (req, res) => {
  const { id } = req.params;
  const { title, summary, content, image_url } = req.body;
  const userEmail = req.user.email;

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = userResults[0].id;

    db.query("SELECT user_id FROM news WHERE id = ?", [id], (err2, newsResults) => {
      if (err2 || newsResults.length === 0) return res.status(404).json({ message: "뉴스 없음" });
      if (newsResults[0].user_id !== userId) return res.status(403).json({ message: "수정 권한 없음" });

      const updateQuery = `
        UPDATE news
        SET title = ?, summary = ?, content = ?, image_url = ?
        WHERE id = ?
      `;
      db.query(updateQuery, [title, summary, content, image_url, id], (err3) => {
        if (err3) return res.status(500).json({ message: "뉴스 수정 실패" });
        res.json({ message: "뉴스 수정 완료" });
      });
    });
  });
};

// ✅ 뉴스 삭제
exports.deleteNews = (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.email;

  db.query("SELECT id FROM users WHERE email = ?", [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = userResults[0].id;

    db.query("SELECT user_id FROM news WHERE id = ?", [id], (err2, newsResults) => {
      if (err2 || newsResults.length === 0) return res.status(404).json({ message: "뉴스 없음" });
      if (newsResults[0].user_id !== userId) return res.status(403).json({ message: "삭제 권한 없음" });

      db.query("DELETE FROM news WHERE id = ?", [id], (err3) => {
        if (err3) return res.status(500).json({ message: "뉴스 삭제 실패" });
        res.json({ message: "뉴스 삭제 완료" });
      });
    });
  });
};

  // 뉴스 조회수 1 증가
exports.incrementViewCount = (req, res) => {
  const { id } = req.params;

  const query = `
    UPDATE news
    SET views = views + 1
    WHERE id = ?
  `;

  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "조회수 증가 실패" });
    res.json({ message: "조회수 증가 완료" });
  });
};

