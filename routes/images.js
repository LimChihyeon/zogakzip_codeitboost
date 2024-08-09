const express = require("express");
const router = express.Router();

// 이미지 URL 생성
router.post("/", (req, res) => {
  res.send("Image URL created");
});

module.exports = router;
