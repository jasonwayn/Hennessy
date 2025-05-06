const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 5000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우트 등록
const reviewRoutes = require("./src/routes/reviewRoutes");
const annotationRoutes = require("./src/routes/annotationRoutes");
const albumRoutes = require("./src/routes/albumRoutes");
const songRoutes = require("./src/routes/songRoutes");
const ratingRoutes = require("./src/routes/ratingRoutes");
const registerRoutes = require("./src/routes/registerRoutes");
const mypageRoutes = require("./src/routes/mypageRoutes");
const searchRoutes = require("./src/routes/searchRoutes");


app.use("/api", reviewRoutes);
app.use("/api", annotationRoutes);
app.use("/api", albumRoutes);
app.use("/api", songRoutes);
app.use("/api", ratingRoutes);
app.use("/api", registerRoutes);
app.use("/api", mypageRoutes);
app.use("/api", searchRoutes);

// 서버 실행
app.listen(port, () => {
  console.log(`🚀 서버 실행중: http://localhost:${port}`);
});
