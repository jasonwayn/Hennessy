const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const { authenticateFirebaseToken } = require("../middleware/authMiddleware");

router.get("/album/:slug/my-rating", authenticateFirebaseToken, ratingController.getMyRating);
router.post("/album/:slug/rating", authenticateFirebaseToken, ratingController.setRating);
router.get("/album/:slug/average-rating", ratingController.getAverageRating);

module.exports = router;
