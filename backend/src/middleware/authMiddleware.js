const admin = require("firebase-admin");
const serviceAccount = require("../../hennessy-7faf2-firebase-adminsdk.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

module.exports = authenticateFirebaseToken;