const express = require("express");
const app = express();
const bodyParser = require("body-parser");

// 라우트 파일을 불러옵니다
const groupRoutes = require("./routes/groups");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const imageRoutes = require("./routes/images");

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// 라우트를 등록합니다
app.use("/api/groups", groupRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/image", imageRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
