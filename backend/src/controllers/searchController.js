// ✅ 수정된 searchController.js
const db = require("../config/db");

exports.search = (req, res) => {
  const q = req.query.q;
  if (!q || q.trim() === "") {
    return res.status(400).json({ message: "검색어가 필요합니다." });
  }
  const keyword = `%${q.trim()}%`;

  const results = {
    artists: [],
    albums: [],
    songs: [],
  };

  const artistQuery = `SELECT id, name, slug, image_url FROM artists WHERE name LIKE ? LIMIT 10`;
  const albumQuery = `
    SELECT a.id, a.title, a.slug, a.image_url, ar.name AS artist_name, ar.slug AS artist_slug
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    WHERE a.title LIKE ?
    LIMIT 10
  `;
  const songQuery = `
    SELECT s.id, s.title, al.image_url AS album_image_url
    FROM songs s
    JOIN albums al ON s.album_id = al.id
    WHERE s.title LIKE ?
    LIMIT 10
  `;

  db.query(artistQuery, [keyword], (err1, artistResults) => {
    if (err1) return res.status(500).json({ message: "DB 오류 (artist)" });
    results.artists = artistResults;

    db.query(albumQuery, [keyword], (err2, albumResults) => {
      if (err2) return res.status(500).json({ message: "DB 오류 (album)" });
      results.albums = albumResults;

      db.query(songQuery, [keyword], (err3, songResults) => {
        if (err3) return res.status(500).json({ message: "DB 오류 (song)" });
        results.songs = songResults;

        res.json(results);
      });
    });
  });
};
