const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const { authenticateFirebaseToken } = require("../middleware/authMiddleware");

router.get("/news", newsController.getAllNews);
router.get("/news/top", newsController.getTopNews);
router.get("/news/:id", newsController.getNewsById);
router.post("/news", authenticateFirebaseToken, newsController.createNews);
router.put("/news/:id", authenticateFirebaseToken, newsController.updateNews);
router.delete("/news/:id", authenticateFirebaseToken, newsController.deleteNews);
router.post("/news/:id/view", newsController.incrementViewCount);

module.exports = router;
