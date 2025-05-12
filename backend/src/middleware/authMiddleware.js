const admin = require("firebase-admin");
const serviceAccount = require("../../hennessy-4ef47-firebase-adminsdk-fbsvc-d990061c4c");

// ✅ 중복 초기화 방지
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Firebase JWT 인증 미들웨어
 */
function authenticateFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 토큰이 없습니다." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      // 이메일이 없는 경우 대비
      if (!decodedToken.email) {
        console.error("이 토큰에는 이메일이 없습니다:", decodedToken);
        return res.status(401).json({ message: "이메일 정보 없음" });
      }

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      next();
    })
    .catch((error) => {
      console.error("토큰 검증 실패:", error);
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    });
}

module.exports = { authenticateFirebaseToken };
