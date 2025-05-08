// src/routes/songRoutes.js
const express = require("express");
const router = express.Router();
const songController = require("../controllers/songController");

// 🎵 곡 추가
router.post("/songs", songController.createSong);

// 🎵 앨범별 곡 목록 조회
router.get("/albums/:albumId/songs", songController.getSongsByAlbum);

module.exports = router;