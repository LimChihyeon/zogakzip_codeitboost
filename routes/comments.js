const express = require("express");
const router = express.Router();

// 댓글 등록
router.post("/posts/:postId/comments", (req, res) => {
  res.send("Comment created on post " + req.params.postId);
});

// 댓글 목록 조회
router.get("/posts/:postId/comments", (req, res) => {
  res.send("Comment list on post " + req.params.postId);
});

// 댓글 수정
router.put("/:commentId", (req, res) => {
  const { commentId } = req.params;
  res.send(`Comment ${commentId} updated`);
});

// 댓글 삭제
router.delete("/:commentId", (req, res) => {
  const { commentId } = req.params;
  res.send(`Comment ${commentId} deleted`);
});

module.exports = router;
