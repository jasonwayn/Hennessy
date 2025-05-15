// src/controllers/albumController.js
const db = require("../config/db");
const slugify = require("slugify");


// 앨범 조회
exports.getAlbumDetail = (req, res) => {
  const { artistSlug, albumSlug } = req.params;

  const albumQuery = `
    SELECT a.*, ar.name AS artist_name, ar.slug AS artist_slug
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    WHERE a.slug = ?
  `;

  db.query(albumQuery, [albumSlug], (err, results) => {
    if (err) {
      console.error("앨범 조회 실패:", err);
      return res.status(500).json({ message: "DB 오류" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "앨범 없음" });
    }

    const album = results[0];

    // artistSlug가 일치하지 않는 경우, 협업 아티스트에도 있는지 확인
    const checkSlug =
      album.artist_slug === artistSlug
        ? Promise.resolve(true)
        : new Promise((resolve) => {
            db.query(
              `SELECT 1 FROM album_artists aa
               JOIN artists ar ON aa.artist_id = ar.id
               WHERE aa.album_id = ? AND ar.slug = ?`,
              [album.id, artistSlug],
              (err2, slugResults) => {
                if (err2) return resolve(false);
                resolve(slugResults.length > 0);
              }
            );
          });

    checkSlug.then((isValidArtist) => {
      if (!isValidArtist) {
        return res.status(404).json({ message: "해당 아티스트의 앨범이 아님" });
      }

      // collaboration인 경우 협업 아티스트 추가
      if (album.type === "collaboration") {
        db.query(
          `SELECT ar.id, ar.name, ar.slug, ar.image_url
           FROM album_artists aa
           JOIN artists ar ON aa.artist_id = ar.id
           WHERE aa.album_id = ?`,
          [album.id],
          (err3, artists) => {
            if (err3) {
              console.error("협업 아티스트 조회 실패:", err3);
              return res.status(500).json({ message: "DB 오류 (협업 아티스트)" });
            }
            album.collaborators = artists;
            res.json(album);
          }
        );
      } else {
        res.json(album);
      }
    });
  });
};


// 앨범 추가
exports.createAlbum = (req, res) => {
  const {
    title,
    artist_id,         // 단일 아티스트 (album, ep, single)
    artist_ids,        // 복수 아티스트 (collaboration)
    genre,
    description,
    release_date,
    image_url,
    type
  } = req.body;

  if (!title || !type || (!artist_id && (!artist_ids || artist_ids.length === 0))) {
    return res.status(400).json({ message: "필수 항목 누락" });
  }

  const albumSlug = slugify(title, { lower: true });
  const mainArtistId = type === "collaboration" ? artist_ids[0] : artist_id;

  const insertAlbumQuery = `
    INSERT INTO albums (title, slug, artist_id, genre, description, release_date, image_url, type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertAlbumQuery,
    [title, albumSlug, mainArtistId, genre, description, release_date, image_url, type],
    (err, result) => {
      if (err) {
        console.error("앨범 저장 실패:", err);
        return res.status(500).json({ message: "DB 오류" });
      }

      const albumId = result.insertId;

      // 아티스트 slug 조회
      db.query(
        `SELECT slug FROM artists WHERE id = ?`,
        [mainArtistId],
        (err2, artistResults) => {
          if (err2 || artistResults.length === 0) {
            console.error("아티스트 slug 조회 실패:", err2);
            return res.status(500).json({ message: "아티스트 slug 조회 실패" });
          }

          const artistSlug = artistResults[0].slug;

          // 협업 아티스트 처리
          if (type === "collaboration" && Array.isArray(artist_ids)) {
            const values = artist_ids.map((aid) => [albumId, aid]);
            db.query(
              `INSERT INTO album_artists (album_id, artist_id) VALUES ?`,
              [values],
              (err3) => {
                if (err3) {
                  console.error("협업 아티스트 저장 실패:", err3);
                  return res.status(500).json({ message: "협업 아티스트 저장 실패" });
                }
                return res.status(201).json({
                  message: "앨범 저장 성공",
                  album_id: albumId,
                  slug: albumSlug,
                  artist_slug: artistSlug
                });
              }
            );
          } else {
            return res.status(201).json({
              message: "앨범 저장 성공",
              album_id: albumId,
              slug: albumSlug,
              artist_slug: artistSlug
            });
          }
        }
      );
    }
  );
};


//앨범 정렬 조회
exports.getFilteredAlbums = (req, res) => {
  const { year, sort } = req.query;

  let baseQuery = `
    SELECT a.id, a.title, a.slug, a.image_url, a.release_date, 
           ar.name AS artist_name, ar.slug AS artist_slug,
           IFNULL(AVG(r.rating), 0) AS average_rating
    FROM albums a
    JOIN artists ar ON a.artist_id = ar.id
    LEFT JOIN album_ratings r ON r.album_id = a.id
  `;
  const params = [];

  if (year) {
    baseQuery += ` WHERE YEAR(a.release_date) = ?`;
    params.push(year);
  }

  baseQuery += `
    GROUP BY a.id
    ORDER BY ${sort === "latest" ? "a.release_date DESC" : "average_rating DESC"}
    LIMIT 100
  `;

  db.query(baseQuery, params, (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류", error: err });
    res.json(results);
  });
};

// 평균 평점 + 참여자 수 반환 (버그 FIX)
exports.getAverageRating = (req, res) => {
  const { albumSlug } = req.params;

  const getAlbumIdQuery = `SELECT id FROM albums WHERE slug = ? LIMIT 1`;

  db.query(getAlbumIdQuery, [albumSlug], (err1, albumResults) => {
    if (err1 || albumResults.length === 0) {
      console.error("앨범 ID 조회 실패:", err1);
      return res.status(404).json({ message: "앨범 없음" });
    }

    const albumId = albumResults[0].id;

    const ratingQuery = `
      SELECT 
        ROUND(AVG(r.rating), 1),
        COUNT(r.rating)
      FROM album_ratings r
      WHERE r.album_id = ?
    `;

    db.query(ratingQuery, [albumId], (err2, ratingResults) => {
      if (err2) {
        console.error("평균 평점 조회 실패:", err2);
        return res.status(500).json({ message: "DB 오류" });
      }
      const [averageRaw, countRaw] = Object.values(ratingResults[0] || {});
      const average = averageRaw != null ? parseFloat(averageRaw) : null;
      const count = countRaw != null ? Number(countRaw) : 0;
      res.json({ average, count });
    });
  });
};




