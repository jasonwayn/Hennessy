const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticateFirebaseToken } = require("../middleware/authMiddleware");

router.post("/album/:slug/reviews", authenticateFirebaseToken, reviewController.createReview);
router.post("/reviews/:id/like", authenticateFirebaseToken, reviewController.toggleReviewLike);
router.put("/reviews/:id", authenticateFirebaseToken, reviewController.updateReview);
router.delete("/reviews/:id", authenticateFirebaseToken, reviewController.deleteReview);
router.post("/reviews/:reviewId/save-toggle", authenticateFirebaseToken, reviewController.toggleSaveReview);
router.get("/album/:slug/reviews", authenticateFirebaseToken, reviewController.getReviews);


module.exports = router;
