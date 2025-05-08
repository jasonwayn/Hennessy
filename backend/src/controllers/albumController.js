// src/controllers/albumController.js
const db = require("../config/db");
const slugify = require("slugify");

// 앨범 조회
exports.getAlbumDetail = (req, res) => {
  const { artistSlug, albumSlug } = req.params;

  const query = `
    SELECT a.*, ar.name as artist_name
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    WHERE a.slug = ? AND ar.slug = ?
  `;

  db.query(query, [albumSlug, artistSlug], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류" });
    if (results.length === 0) return res.status(404).json({ message: "앨범 없음" });

    res.json(results[0]);
  });
};

// 앨범 추가
exports.createAlbum = (req, res) => {
  const { title, artist_id, genre, description, release_date, image_url } = req.body;

  if (!title || !artist_id) {
    return res.status(400).json({ message: "필수 항목 누락" });
  }

  const albumSlug = slugify(title, { lower: true });

  const insertQuery = `
    INSERT INTO albums (title, slug, artist_id, genre, description, release_date, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertQuery,
    [title, albumSlug, artist_id, genre, description, release_date, image_url],
    (err, result) => {
      if (err) {
        console.error("앨범 저장 실패:", err);
        return res.status(500).json({ message: "DB 오류" });
      }

      res.status(201).json({ message: "앨범 저장 성공", album_id: result.insertId });
    }
  );
};