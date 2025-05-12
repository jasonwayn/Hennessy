// src/routes/songRoutes.js
const express = require("express");
const router = express.Router();
const songController = require("../controllers/songController");


router.post("/songs", songController.createSong);
router.get("/albums/:albumId/songs", songController.getSongsByAlbum);
router.get("/songs/:id", songController.getSongDetail);

module.exports = router;