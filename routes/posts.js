const express = require("express");
const router = express.Router();

// 게시글 등록
router.post("/groups/:groupId/posts", (req, res) => {
  res.send("Post created in group " + req.params.groupId);
});

// 게시글 목록 조회
router.get("/groups/:groupId/posts", (req, res) => {
  res.send("Post list in group " + req.params.groupId);
});

// 게시글 수정
router.put("/:postId", (req, res) => {
  const { postId } = req.params;
  res.send(`Post ${postId} updated`);
});

// 게시글 삭제
router.delete("/:postId", (req, res) => {
  const { postId } = req.params;
  res.send(`Post ${postId} deleted`);
});

// 게시글 상세 정보 조회
router.get("/:postId", (req, res) => {
  const { postId } = req.params;
  res.send(`Post ${postId} details`);
});

// 게시글 조회 권한 확인
router.post("/:postId/verify-password", (req, res) => {
  const { postId } = req.params;
  res.send(`Password verified for post ${postId}`);
});

// 게시글 공감하기
router.post("/:postId/like", (req, res) => {
  const { postId } = req.params;
  res.send(`Post ${postId} liked`);
});

// 게시글 공개 여부 확인
router.get("/:postId/is-public", (req, res) => {
  const { postId } = req.params;
  res.send(`Post ${postId} is public`);
});

module.exports = router;
