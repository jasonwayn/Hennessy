// src/routes/artistRoutes.js
const express = require("express");
const router = express.Router();
const artistController = require("../controllers/artistController");

// 아티스트 추가
router.post("/artists", artistController.createArtist);

//artist 조회
router.get("/artists/by-name", artistController.getArtistByName);
router.get("/artists/search", artistController.searchArtistsByName);
router.get("/artists/:slug", artistController.getArtistDetail);




module.exports = router;
