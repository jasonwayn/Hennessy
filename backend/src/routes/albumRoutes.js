const express = require("express");
const router = express.Router();
const albumController = require("../controllers/albumController");

router.get("/album/:artistSlug/:albumSlug", albumController.getAlbumDetail);
router.post("/albums", albumController.createAlbum);
router.get("/albums", albumController.getFilteredAlbums);
router.get("/album/:albumSlug/average-rating", albumController.getAverageRating);

module.exports = router;
