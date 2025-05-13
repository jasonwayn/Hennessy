// src/routes/songRoutes.js
const express = require("express");
const router = express.Router();
const songController = require("../controllers/songController");
const { authenticateFirebaseToken } = require("../middleware/authMiddleware");

router.post("/songs", songController.createSong);
router.get("/albums/:albumId/songs", songController.getSongsByAlbum);
router.get("/songs/:id", songController.getSongDetail);
router.patch("/songs/:id/details", authenticateFirebaseToken, songController.updateSongDetails);

module.exports = router;