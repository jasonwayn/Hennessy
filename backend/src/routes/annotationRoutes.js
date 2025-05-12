const express = require("express");
const router = express.Router();
const annotationController = require("../controllers/annotationController");
const { authenticateFirebaseToken } = require("../middleware/authMiddleware");

// ✅ 위치 기반 주석 저장 및 조회
router.post("/annotations", authenticateFirebaseToken, annotationController.createAnnotation);
router.get("/annotations", annotationController.getAnnotationByPosition);

// ✅ line 기반 주석 저장 및 조회
router.post("/song-annotations", authenticateFirebaseToken, annotationController.createAnnotationFromLine);
router.get("/song-annotations", annotationController.getAnnotationByLine);

// 좋아요 토글
router.post("/annotations/:id/like", authenticateFirebaseToken, annotationController.toggleAnnotationLike);

module.exports = router;
