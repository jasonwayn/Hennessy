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
    if (err) {
      console.error("❌ 아티스트 조회 중 DB 오류:", err); // STEP 2
      return res.status(500).json({ message: "DB 오류 (아티스트)" });
    }
    if (artistResults.length === 0) {
      console.warn("⚠️ 아티스트 없음:", slug); // STEP 3
      return res.status(404).json({ message: "아티스트 없음" });
    }

    const artist = artistResults[0];
    // 2. 앨범 조회
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
      if (err2) {
        console.error("❌ 앨범 조회 중 DB 오류:", err2); // STEP 5
        return res.status(500).json({ message: "DB 오류 (앨범)" });
      }
      // 3. 크레딧 참여한 곡도 추가로 조회
        const creditQuery = `
          SELECT 
            s.id AS song_id,
            s.title AS song_title,
            al.id AS album_id,
            al.image_url AS album_image,
            al.title AS album_title,
            al.slug AS album_slug,
            ar.slug AS main_artist_slug
          FROM artist_song_credits ascs
          JOIN songs s ON ascs.song_id = s.id
          JOIN albums al ON s.album_id = al.id
          JOIN artists ar ON al.artist_id = ar.id
          WHERE ascs.artist_id = ?
        `;


      db.query(creditQuery, [artist.id], (err3, creditResults) => {
        if (err3) {
          console.error("❌ 크레딧 조회 중 DB 오류:", err3); // STEP 7
          return res.status(500).json({ message: "DB 오류 (크레딧)" });
        }

        res.json({
          artist,
          albums: albumResults,
          credits: creditResults,
        });
      });
    });
  });
};


// 아티스트 이름으로 조회 (@이름 처리용)
exports.getArtistByName = (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: "아티스트 이름이 필요합니다" });
  }

  const query = `
    SELECT id, name, slug, image_url
    FROM artists
    WHERE name = ?
    LIMIT 1
  `;

  db.query(query, [name], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류" });
    if (results.length === 0) return res.status(404).json({ message: "해당 이름의 아티스트 없음" });

    res.json(results[0]);
  });
};

// 아티스트 자동완성용 검색 (@b → beach house 등)
exports.searchArtistsByName = (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: "검색어가 필요합니다" });
  }

  const query = `
    SELECT id, name, slug, image_url
    FROM artists
    WHERE name LIKE CONCAT(?, '%')
    ORDER BY name ASC
    LIMIT 10
  `;

  db.query(query, [name], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류" });
    res.json(results);
  });
};
