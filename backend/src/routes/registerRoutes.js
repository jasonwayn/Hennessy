const express = require("express");
const router = express.Router();
const authenticateFirebaseToken = require("../middleware/authMiddleware");
const { registerUser } = require("../controllers/registerController");

// POST /api/register - 사용자 닉네임 등록
router.post("/register", authenticateFirebaseToken, registerUser);

module.exports = router;