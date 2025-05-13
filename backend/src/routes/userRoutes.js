const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateFirebaseToken } = require("../middleware/authMiddleware");

router.get("/me", authenticateFirebaseToken, userController.getMyInfo);
router.post("/me/profile-image", authenticateFirebaseToken, userController.updateProfileImage);

router.get("/users/:id", userController.getProfileById);
router.get("/users/:id/reviews", userController.getUserReviewsById);
router.get("/users/:id/ratings/grouped", userController.getUserRatingsGroupedById);
module.exports = router;