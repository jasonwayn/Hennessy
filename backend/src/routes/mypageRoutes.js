const express = require("express");
const router = express.Router();
const mypageController = require("../controllers/mypageController");
const { authenticateFirebaseToken } = require("../middleware/authMiddleware");

router.get("/mypage/reviews", authenticateFirebaseToken, mypageController.getMyReviews);
router.get("/mypage/ratings/grouped", authenticateFirebaseToken, mypageController.getUserRatingsGrouped);
router.get("/saved-reviews", authenticateFirebaseToken, mypageController.getSavedReviews);
router.put("/mypage/profile", authenticateFirebaseToken, mypageController.updateProfileInfo);

module.exports = router;
