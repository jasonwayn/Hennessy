const db = require("../config/db");

// 곡 추가
exports.createSong = (req, res) => {
  const { title, album_id, track_number, lyrics } = req.body;

  if (!title || !album_id || !track_number || !lyrics) {
    return res.status(400).json({ message: "필수 값 누락" });
  }

  const insertQuery = `
    INSERT INTO songs (title, album_id, track_number, lyrics)
    VALUES (?, ?, ?, ?)
  `;

  db.query(insertQuery, [title, album_id, track_number, lyrics], (err, result) => {
    if (err) {
      console.error("곡 저장 실패:", err);
      return res.status(500).json({ message: "DB 오류" });
    }

    res.status(201).json({ message: "곡 추가 완료", song_id: result.insertId });
  });
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
