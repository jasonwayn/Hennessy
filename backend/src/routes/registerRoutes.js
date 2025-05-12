const express = require("express");
const router = express.Router();
const { authenticateFirebaseToken } = require("../middleware/authMiddleware");
const { registerUser, createUserIfNotExists } = require("../controllers/registerController");

// ✅ Firebase 회원가입 후 최초 DB 등록 (email만)
router.post("/auth/register", authenticateFirebaseToken, createUserIfNotExists);

// ✅ 닉네임 등록 (이미 등록된 user에 대해)
router.post("/register", authenticateFirebaseToken, registerUser);

module.exports = router;
