const db = require("../config/db");

// 곡 추가
exports.createSong = (req, res) => {
  const { title, album_id, track_number, lyrics, description, credits, contributors } = req.body;

  if (!title || !album_id || !track_number || !lyrics) {
    return res.status(400).json({ message: "필수 값 누락" });
  }

  const insertQuery = `
    INSERT INTO songs (title, album_id, track_number, lyrics, description, credits, contributors)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertQuery,
    [title, album_id, track_number, lyrics, description, credits, contributors],
    (err, result) => {
      if (err) {
        console.error("곡 저장 실패:", err);
        return res.status(500).json({ message: "DB 오류" });
      }

      res.status(201).json({ message: "곡 추가 완료", song_id: result.insertId });
    }
  );
};

// 곡 목록 조회
exports.getSongsByAlbum = (req, res) => {
  const { albumId } = req.params;

  const query = `
    SELECT id, title, track_number, average_rating
    FROM songs
    WHERE album_id = ?
    ORDER BY track_number ASC
  `;

  db.query(query, [albumId], (err, results) => {
    if (err) {
      console.error("곡 목록 조회 실패:", err);
      return res.status(500).json({ message: "DB 오류" });
    }

    res.json(results);
  });
};

// 곡 상세 조회
exports.getSongDetail = (req, res) => {
  const songId = req.params.id;

  const query = `
    SELECT 
      s.*, 
      a.title AS album_title,
      a.image_url AS album_image_url,
      a.description AS album_description,
      ar.name AS artist_name,
      ar.slug AS artist_slug,
      ar.image_url AS artist_image
    FROM songs s
    JOIN albums a ON s.album_id = a.id
    JOIN artists ar ON a.artist_id = ar.id
    WHERE s.id = ?
  `;

  db.query(query, [songId], (err, results) => {
    if (err) {
      console.error("곡 조회 실패:", err);
      return res.status(500).json({ message: "DB 오류" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "곡을 찾을 수 없습니다" });
    }

    res.json(results[0]);
  });
};
