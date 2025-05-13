const express = require("express");
const router = express.Router();
const annotationController = require("../controllers/annotationController");
const { authenticateFirebaseToken } = require("../middleware/authMiddleware");

// ✅ 위치 기반 주석 저장 및 조회
router.post("/annotations", authenticateFirebaseToken, annotationController.createAnnotation);
router.get("/annotations", annotationController.getAnnotationByPosition);

// ✅ 라인 기반 주석 저장 및 조회
router.post("/song-annotations", authenticateFirebaseToken, annotationController.createAnnotationFromLine);
router.get("/song-annotations", annotationController.getAnnotationByLine);

// ✅ 좋아요 토글 (둘 다 등록된 이유라면 유지 가능)
router.post("/annotations/:id/like", authenticateFirebaseToken, annotationController.toggleAnnotationLike);
router.post("/song-annotations/:id/like", authenticateFirebaseToken, annotationController.toggleAnnotationLike);

// ✅ 주석 수정/삭제
router.patch("/song-annotations/:id", authenticateFirebaseToken, annotationController.updateAnnotation);
router.delete("/song-annotations/:id", authenticateFirebaseToken, annotationController.deleteAnnotation);

module.exports = router;
