const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 5000;
const slugify = require("slugify")

// 🔐 Firebase Admin SDK 설정 (맨 위 상단)
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

// ✅ Firebase 토큰 인증 미들웨어
function authenticateFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 토큰이 없습니다." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      next();
    })
    .catch((error) => {
      console.error("토큰 검증 실패:", error);
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    });
}

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

// 주석 조회 API
app.get("/api/song-annotations", (req, res) => {
  const { song_id, line } = req.query;

  if (!song_id || !line) {
    return res.status(400).json({ message: "필수 파라미터 누락" });
  }

  const decodedLine = decodeURIComponent(line); // 혹시 %20 같은 인코딩 대비

  // line이 가사 전체에서 어디에 위치하는지 찾아서 시작/끝 인덱스 계산
  const lyricsQuery = "SELECT lyrics FROM songs WHERE id = ?";

  db.query(lyricsQuery, [song_id], (err, results) => {
    if (err) return res.status(500).json({ message: "가사 불러오기 실패" });
    if (results.length === 0) return res.status(404).json({ message: "곡 없음" });

    const lyrics = results[0].lyrics;
    const start_char = lyrics.indexOf(decodedLine);
    const end_char = start_char + decodedLine.length;

    if (start_char === -1) {
      return res.status(404).json({ message: "문장을 가사에서 찾을 수 없음" });
    }

    const query = `
      SELECT a.*, u.nickname
      FROM song_annotations a
      JOIN users u ON a.user_id = u.id
      WHERE a.song_id = ? AND a.start_char = ? AND a.end_char = ?
      ORDER BY a.type, a.likes DESC, a.created_at DESC
    `;

    db.query(query, [song_id, start_char, end_char], (err, results) => {
      if (err) {
        console.error("주석 조회 실패:", err);
        return res.status(500).json({ message: "DB 오류" });
      }
      res.json(results);
    });
  });
});

// 주석 등록 API
app.post("/api/song-annotations", authenticateFirebaseToken, (req, res) => {
  const { song_id, line, content, type } = req.body;
  const userEmail = req.user.email;

  if (!song_id || !line || !content || !type) {
    return res.status(400).json({ message: "필수 항목 누락" });
  }

  const decodedLine = decodeURIComponent(line);

  const lyricsQuery = "SELECT lyrics FROM songs WHERE id = ?";
  db.query(lyricsQuery, [song_id], (err, results) => {
    if (err) return res.status(500).json({ message: "가사 조회 실패" });
    if (results.length === 0) return res.status(404).json({ message: "곡 없음" });

    const lyrics = results[0].lyrics;
    const start_char = lyrics.indexOf(decodedLine);
    const end_char = start_char + decodedLine.length;

    if (start_char === -1) {
      return res.status(400).json({ message: "해당 문장을 가사에서 찾을 수 없음" });
    }

    // 🔍 이메일로 user_id 조회
    const getUserQuery = "SELECT id FROM users WHERE email = ?";
    db.query(getUserQuery, [userEmail], (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ message: "유저 인증 실패 또는 없음" });
      }

      const userId = results[0].id;

      const insertQuery = `
        INSERT INTO song_annotations (song_id, user_id, start_char, end_char, content, type)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [song_id, userId, start_char, end_char, content, type], (err, result) => {
        if (err) {
          console.error("주석 등록 실패:", err);
          return res.status(500).json({ message: "DB 오류" });
        }

        res.status(201).json({ message: "주석 등록 완료", annotation_id: result.insertId });
      });
    });
  });
});


// 좋아요 toggle API
app.post("/api/annotations/:id/like", authenticateFirebaseToken, (req, res) => {
  const annotationId = req.params.id;
  const userEmail = req.user.email;

  const userQuery = `SELECT id FROM users WHERE email = ?`;
  db.query(userQuery, [userEmail], (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ message: "유저 인증 실패" });
    }

    const userId = results[0].id;

    const checkQuery = `
      SELECT * FROM annotation_likes
      WHERE user_id = ? AND annotation_id = ?
    `;

    db.query(checkQuery, [userId, annotationId], (err, results) => {
      if (err) return res.status(500).json({ message: "DB 오류" });

      if (results.length > 0) {
        const deleteQuery = `
          DELETE FROM annotation_likes
          WHERE user_id = ? AND annotation_id = ?
        `;
        db.query(deleteQuery, [userId, annotationId], (err2) => {
          if (err2) return res.status(500).json({ message: "좋아요 취소 실패" });
          res.json({ message: "좋아요 취소됨" });
        });
      } else {
        const insertQuery = `
          INSERT INTO annotation_likes (user_id, annotation_id)
          VALUES (?, ?)
        `;
        db.query(insertQuery, [userId, annotationId], (err3) => {
          if (err3) return res.status(500).json({ message: "좋아요 실패" });
          res.json({ message: "좋아요 성공" });
        });
      }
    });
  });
});


  const checkQuery = `
    SELECT * FROM annotation_likes
    WHERE user_id = ? AND annotation_id = ?
  `;

  db.query(checkQuery, [userId, annotationId], (err, results) => {
    if (err) {
      console.error("좋아요 조회 실패:", err);
      return res.status(500).json({ message: "DB 오류" });
    }

    if (results.length > 0) {
      // 이미 좋아요 했음 → 취소
      const deleteQuery = `
        DELETE FROM annotation_likes
        WHERE user_id = ? AND annotation_id = ?
      `;
      db.query(deleteQuery, [userId, annotationId], (err2) => {
        if (err2) {
          console.error("좋아요 취소 실패:", err2);
          return res.status(500).json({ message: "좋아요 취소 실패" });
        }
        res.json({ message: "좋아요 취소됨" });
      });
    } else {
      // 좋아요 추가
      const insertQuery = `
        INSERT INTO annotation_likes (user_id, annotation_id)
        VALUES (?, ?)
      `;
      db.query(insertQuery, [userId, annotationId], (err3) => {
        if (err3) {
          console.error("좋아요 추가 실패:", err3);
          return res.status(500).json({ message: "좋아요 실패" });
        }
        res.json({ message: "좋아요 성공" });
      });
    }
  });

//내 평점 가져오기
app.get("/api/album/:slug/my-rating", authenticateFirebaseToken, (req, res) => {
  const { slug } = req.params;
  const userEmail = req.user.email;

  const getUserQuery = "SELECT id FROM users WHERE email = ?";
  db.query(getUserQuery, [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = userResults[0].id;

    const getAlbumIdQuery = "SELECT id FROM albums WHERE slug = ?";
    db.query(getAlbumIdQuery, [slug], (err2, albumResults) => {
      if (err2 || albumResults.length === 0) return res.status(404).json({ message: "앨범 없음" });

      const albumId = albumResults[0].id;

      const query = `SELECT rating FROM album_ratings WHERE user_id = ? AND album_id = ?`;
      db.query(query, [userId, albumId], (err3, results) => {
        if (err3) return res.status(500).json({ message: "DB 오류" });
        if (results.length === 0) return res.json({ rating: null });

        res.json({ rating: results[0].rating });
      });
    });
  });
}); 

//평점 등록 및 수정
app.post("/api/album/:slug/rating", authenticateFirebaseToken, (req, res) => {
  const { rating } = req.body;
  const { slug } = req.params;
  const userEmail = req.user.email;

  if (rating === undefined || rating === null || rating < 0.0 || rating > 10.0) {
    return res.status(400).json({ message: "평점은 0.0~10.0 사이여야 합니다" });
  }

  const getUserQuery = "SELECT id FROM users WHERE email = ?";
  db.query(getUserQuery, [userEmail], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(401).json({ message: "유저 인증 실패" });

    const userId = userResults[0].id;

    const getAlbumIdQuery = "SELECT id FROM albums WHERE slug = ?";
    db.query(getAlbumIdQuery, [slug], (err2, albumResults) => {
      if (err2 || albumResults.length === 0) return res.status(404).json({ message: "앨범 없음" });

      const albumId = albumResults[0].id;

      const upsertQuery = `
        INSERT INTO album_ratings (user_id, album_id, rating)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE rating = VALUES(rating)
      `;

      db.query(upsertQuery, [userId, albumId, rating], (err3) => {
        if (err3) return res.status(500).json({ message: "평점 저장 실패" });
        res.status(201).json({ message: "평점 저장 완료" });
      });
    });
  });
});
//평균 평점 가져오기
app.get("/api/album/:slug/average-rating", (req, res) => {
  const { slug } = req.params;

  const getAlbumIdQuery = "SELECT id FROM albums WHERE slug = ?";
  db.query(getAlbumIdQuery, [slug], (err, albumResults) => {
    if (err || albumResults.length === 0) return res.status(404).json({ message: "앨범 없음" });

    const albumId = albumResults[0].id;

    const avgQuery = `SELECT AVG(rating) AS average FROM album_ratings WHERE album_id = ?`;
    db.query(avgQuery, [albumId], (err2, results) => {
      if (err2) return res.status(500).json({ message: "DB 오류" });

      res.json({ average: results[0].average || 0 });
    });
  });
});


});




