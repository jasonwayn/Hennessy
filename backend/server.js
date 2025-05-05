const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 5000;
const slugify = require("slugify")

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// MySQL 연결 
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "hjsoo2001!",
  database: "hennessy_db"
});

// MySQL 연결 테스트
db.connect((err) => {
  if (err) {
    console.error("MySQL 연결 실패:", err);
    return;
  }
  console.log("✅ MySQL 연결 성공");
});

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 서버 실행중: http://localhost:${port}`);
});



// 리뷰 저장 API
app.post("/api/reviews", (req, res) => {
    const { firebase_uid, album_title, review_text, rating } = req.body;
  
    // firebase_uid로 users 테이블에서 user_id를 찾아야 함
    const findUserQuery = "SELECT id FROM users WHERE firebase_uid = ?";
  
    db.query(findUserQuery, [firebase_uid], (err, results) => {
      if (err) {
        console.error("유저 조회 실패:", err);
        return res.status(500).json({ message: "서버 에러" });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: "사용자 없음" });
      }
  
      const userId = results[0].id;
  
      // 이제 reviews 테이블에 데이터 삽입
      const insertReviewQuery = `
        INSERT INTO reviews (user_id, album_title, review_text, rating)
        VALUES (?, ?, ?, ?)
      `;
  
      db.query(insertReviewQuery, [userId, album_title, review_text, rating], (err, result) => {
        if (err) {
          console.error("리뷰 저장 실패:", err);
          return res.status(500).json({ message: "서버 에러" });
        }
  
        res.status(201).json({ message: "리뷰 저장 성공" });
      });
    });
  });




  // 주석 저장 API
app.post("/api/annotations", (req, res) => {
    const { song_id, user_id, start_char, end_char, type, content } = req.body;
  
    if (!song_id || !user_id || !start_char || !end_char || !type || !content) {
      return res.status(400).json({ message: "필수 값 누락" });
    }
  
    const insertQuery = `
      INSERT INTO song_annotations (song_id, user_id, start_char, end_char, type, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
  
    db.query(
      insertQuery,
      [song_id, user_id, start_char, end_char, type, content],
      (err, result) => {
        if (err) {
          console.error("주석 저장 실패:", err);
          return res.status(500).json({ message: "DB 오류" });
        }
  
        res.status(201).json({ message: "주석 저장 완료", id: result.insertId });
      }
    );
  });
  



//주석 불러오기 API
app.get("/api/annotations", (req, res) => {
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
      if (err) {
        console.error("주석 조회 실패:", err);
        return res.status(500).json({ message: "DB 오류" });
      }
  
      res.json(results);
    });
  });
  
  //앨범 조회 API

  app.get("/api/album/:artistSlug/:albumSlug", (req, res) => {
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
  });
  
//앨범 추가 api

app.post("/api/albums", (req, res) => {
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
});


//곡 추가 api
app.post("/api/songs", (req, res) => {
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
});


//곡 불러오기 api
app.get("/api/albums/:albumId/songs", (req, res) => {
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
});


//artist 추가 api

app.post("/api/artists", (req, res) => {
  const {
    name,
    type,               // solo 또는 group
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
        artist_id: result.insertId
      });
    }
  );
});
