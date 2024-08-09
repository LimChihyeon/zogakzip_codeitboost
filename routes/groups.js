const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// 그룹 등록
router.post("/", (req, res) => {
  const { name, password, imageUrl, isPublic, introduction } = req.body;

  // 입력 데이터 검증
  if (
    !name ||
    !password ||
    !imageUrl ||
    typeof isPublic !== "boolean" ||
    !introduction
  ) {
    return res.status(400).json({ message: "잘못된 요청입니다" });
  }

  const newGroup = {
    name,
    password,
    imageUrl,
    isPublic,
    introduction,
    likeCount: 0,
    postCount: 0,
    createdAt: new Date(),
  };

  const query = `INSERT INTO \`groups\` (name, password, imageUrl, isPublic, introduction, likeCount, postCount, createdAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  pool.query(
    query,
    [
      newGroup.name,
      newGroup.password,
      newGroup.imageUrl,
      newGroup.isPublic,
      newGroup.introduction,
      newGroup.likeCount,
      newGroup.postCount,
      newGroup.createdAt,
    ],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      }

      newGroup.id = results.insertId;
      res.status(201).json(newGroup);
    }
  );
});

// 그룹 목록 조회
router.get("/", (req, res) => {
  res.send("Group list");
});

// 그룹 수정
router.put("/:groupId", (req, res) => {
  const { groupId } = req.params;
  res.send(`Group ${groupId} updated`);
});

// 그룹 삭제
router.delete("/:groupId", (req, res) => {
  const { groupId } = req.params;
  res.send(`Group ${groupId} deleted`);
});

// 그룹 상세 정보 조회
router.get("/:groupId", (req, res) => {
  const { groupId } = req.params;
  res.send(`Group ${groupId} details`);
});

// 그룹 조회 권한 확인
router.post("/:groupId/verify-password", (req, res) => {
  const { groupId } = req.params;
  res.send(`Password verified for group ${groupId}`);
});

// 그룹 공감하기
router.post("/:groupId/like", (req, res) => {
  const { groupId } = req.params;
  res.send(`Group ${groupId} liked`);
});

// 그룹 공개 여부 확인
router.get("/:groupId/is-public", (req, res) => {
  const { groupId } = req.params;
  res.send(`Group ${groupId} is public`);
});

module.exports = router;
