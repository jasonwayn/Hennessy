const db = require("../config/db");
const slugify = require("slugify");

// 아티스트 생성
exports.createArtist = (req, res) => {
  const {
    name,
    type, // solo 또는 group
    formed_date,
    members,
    genre,
    bio,
    image_url
  } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: "필수 항목 누락 (name, type)" });
  }

  const artistSlug = slugify(name, { lower: true });

  const insertQuery = `
    INSERT INTO artists (name, type, formed_date, members, genre, bio, slug, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertQuery,
    [name, type, formed_date, members, genre, bio, artistSlug, image_url],
    (err, result) => {
      if (err) {
        console.error("아티스트 저장 실패:", err);
        return res.status(500).json({ message: "DB 오류" });
      }

      res.status(201).json({
        message: "아티스트 저장 성공",
        artist_id: result.insertId,
        slug: artistSlug
      });
    }
  );
};


// artist 조회
exports.getArtistDetail = (req, res) => {
  const { slug } = req.params;

  // 1. 아티스트 정보 조회
  const artistQuery = `
    SELECT id, name, type, formed_date, members, genre, bio, image_url, slug
    FROM artists
    WHERE slug = ?
  `;

  db.query(artistQuery, [slug], (err, artistResults) => {
    if (err) return res.status(500).json({ message: "DB 오류 (아티스트)" });
    if (artistResults.length === 0) return res.status(404).json({ message: "아티스트 없음" });

    const artist = artistResults[0];

    // 2. 해당 아티스트가 참여한 모든 앨범 조회 (메인/협업 포함)
    const albumQuery = `
      (
        SELECT a.id, a.title, a.slug, a.genre, a.release_date, a.image_url, a.type
        FROM albums a
        WHERE a.artist_id = ?
      )
      UNION
      (
        SELECT a.id, a.title, a.slug, a.genre, a.release_date, a.image_url, a.type
        FROM albums a
        JOIN album_artists aa ON a.id = aa.album_id
        WHERE aa.artist_id = ?
      )
      ORDER BY release_date DESC
    `;
      
    db.query(albumQuery, [artist.id, artist.id], (err2, albumResults) => {
      if (err2) return res.status(500).json({ message: "DB 오류 (앨범)" });
    
      res.json({
        artist,
        albums: albumResults,
      });
    });
  });
};