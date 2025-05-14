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
      a.slug AS album_slug,
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

// 곡 정보 수정 및 아티스트 크레딧 테이블 반영
exports.updateSongDetails = (req, res) => {
  const songId = req.params.id;
  const { description, credits } = req.body;

  const updateQuery = `UPDATE songs SET description = ?, credits = ? WHERE id = ?`;

  db.query(updateQuery, [description, credits, songId], (err) => {
    if (err) {
      console.error("곡 정보 업데이트 실패:", err);
      return res.status(500).json({ message: "DB 오류" });
    }

    // 1. 기존 크레딧 연결 삭제
    const deleteQuery = `DELETE FROM artist_song_credits WHERE song_id = ?`;
    db.query(deleteQuery, [songId], (delErr) => {
      if (delErr) {
        console.error("기존 크레딧 삭제 실패:", delErr);
        return res.status(500).json({ message: "크레딧 초기화 실패" });
      }

      // 2. 크레딧에서 @이름 파싱
      const matches = [...credits.matchAll(/@([\w\s]+)/g)].map((m) => m[1].trim());
      const unique = [...new Set(matches)].filter(name => name.length >= 2);

      if (unique.length === 0) {
        return res.json({ message: "곡 정보 업데이트 완료 (추가할 크레딧 없음)" });
      }

      // 3. 해당 이름의 artist_id 가져오기
      const getArtistIdsQuery = `SELECT id, name FROM artists WHERE name IN (?)`;
      db.query(getArtistIdsQuery, [unique], (err2, artists) => {
        if (err2) {
          console.error("아티스트 조회 실패:", err2);
          return res.status(500).json({ message: "DB 오류 (아티스트 조회)" });
        }

        if (!artists.length) {
          return res.json({ message: "곡 정보 업데이트 완료 (일치하는 아티스트 없음)" });
        }

        // 4. 삽입용 쌍 만들기: [artist_id, song_id]
        const values = artists.map(a => [a.id, songId]);
        const insertQuery = `
          INSERT INTO artist_song_credits (artist_id, song_id)
          VALUES ?
        `;

        db.query(insertQuery, [values], (err3) => {
          if (err3) {
            console.error("크레딧 삽입 실패:", err3);
            return res.status(500).json({ message: "크레딧 삽입 중 오류" });
          }

          res.json({ message: "곡 정보 및 크레딧 업데이트 완료" });
        });
      });
    });
  });
};
