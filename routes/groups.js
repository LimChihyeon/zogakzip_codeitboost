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
    badges: JSON.stringify([]), // 빈 배열을 JSON 문자열로 변환
    likeCount: 0,
    postCount: 0,
    createdAt: new Date(),
  };

  const query = `INSERT INTO \`groups\` (name, password, imageUrl, isPublic, introduction, badges, likeCount, postCount, createdAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  console.log("새 그룹을 데이터베이스에 삽입 시도 중...");
  pool.query(
    query,
    [
      newGroup.name,
      newGroup.password,
      newGroup.imageUrl,
      newGroup.isPublic,
      newGroup.introduction,
      newGroup.badges,
      newGroup.likeCount,
      newGroup.postCount,
      newGroup.createdAt,
    ],
    (error, results) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .json({ message: "서버 내부 오류가 발생했습니다." });
      }

      newGroup.id = results.insertId;
      newGroup.badges = [];
      res.status(201).json(newGroup);
    }
  );
});

// 그룹 목록 조회
router.get("/", (req, res) => {
  const {
    page = 1,
    pageSize = 10,
    sortBy = "latest",
    keyword = "",
    isPublic,
  } = req.query;

  // 기본 쿼리문 작성
  let query = `SELECT id, name, imageUrl, isPublic, likeCount, postCount, createdAt, introduction, badges FROM \`groups\``;
  let queryParams = [];
  let condition = "";

  // 공개 여부 필터링
  if (typeof isPublic !== "undefined") {
    condition += ` WHERE isPublic = ?`;
    queryParams.push(isPublic === "true" ? 1 : 0);
  }

  // 검색어 필터링
  if (keyword) {
    if (queryParams.length > 0) {
      condition += ` AND name LIKE ?`;
    } else {
      condition += ` WHERE name LIKE ?`;
    }
    queryParams.push(`%${keyword}%`);
  }

  query += condition;

  // 정렬 기준
  switch (sortBy) {
    case "latest":
      query += ` ORDER BY createdAt DESC`;
      break;
    case "mostLiked":
      query += ` ORDER BY likeCount DESC`;
      break;
    case "mostPosted":
      query += ` ORDER BY postCount DESC`;
      break;
    default:
      query += ` ORDER BY createdAt DESC`;
  }

  const offset = (page - 1) * pageSize;
  query += ` LIMIT ?, ?`;
  queryParams.push(offset, parseInt(pageSize, 10));

  let countQuery = `SELECT COUNT(*) as totalItemCount FROM \`groups\``;
  countQuery += condition;

  // 총 아이템 수 조회
  pool.query(
    countQuery,
    queryParams.slice(0, queryParams.length - 2),
    (error, countResults) => {
      if (error) {
        console.error("Error executing count query:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

      const totalItemCount = countResults[0].totalItemCount;
      const totalPages = Math.ceil(totalItemCount / pageSize);

      // 그룹 데이터 조회
      pool.query(query, queryParams, (error, results) => {
        if (error) {
          console.error("Error executing query:", error);
          return res.status(500).json({ message: "Internal server error" });
        }

        // 각 그룹의 배지 개수 계산 및 응답 데이터 변환
        const modifiedResults = results.map((group) => {
          let badgeCount = 0;

          // badges 필드가 존재하고, 유효한 JSON 문자열일 경우 파싱하여 배지 개수 계산
          if (group.badges) {
            try {
              const badgesArray = JSON.parse(group.badges);
              if (Array.isArray(badgesArray)) {
                badgeCount = badgesArray.length;
              }
            } catch (e) {
              console.error("Error parsing badges JSON:", e);
            }
          }

          return {
            id: group.id,
            name: group.name,
            imageUrl: group.imageUrl,
            isPublic: !!group.isPublic,
            likeCount: group.likeCount,
            badgeCount: badgeCount,
            postCount: group.postCount,
            createdAt: group.createdAt,
            introduction: group.introduction,
          };
        });

        res.status(200).json({
          currentPage: parseInt(page, 10),
          totalPages: totalPages,
          totalItemCount: totalItemCount,
          data: modifiedResults,
        });
      });
    }
  );
});

// 그룹 수정
router.put("/:groupId", (req, res) => {
  const { groupId } = req.params;
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

  // 그룹 ID와 password 확인
  const checkQuery = `SELECT * FROM \`groups\` WHERE id = ? AND password = ?`;
  pool.query(checkQuery, [groupId, password], (checkError, checkResults) => {
    if (checkError) {
      console.error("Error executing check query:", checkError);
      return res
        .status(500)
        .json({ message: "서버 내부 오류가 발생했습니다." });
    }

    if (checkResults.length === 0) {
      return res.status(403).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // 그룹 정보 업데이트
    const updateQuery = `UPDATE \`groups\` 
                         SET name = ?, imageUrl = ?, isPublic = ?, introduction = ?
                         WHERE id = ?`;

    pool.query(
      updateQuery,
      [name, imageUrl, isPublic, introduction, groupId],
      (updateError, updateResults) => {
        if (updateError) {
          console.error("Error executing update query:", updateError);
          return res
            .status(500)
            .json({ message: "서버 내부 오류가 발생했습니다." });
        }

        if (updateResults.affectedRows === 0) {
          return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
        }

        // 수정된 그룹의 정보를 다시 조회하여 응답
        const selectQuery = `SELECT id, name, imageUrl, isPublic, introduction, likeCount, postCount, createdAt, badges FROM \`groups\` WHERE id = ?`;
        pool.query(selectQuery, [groupId], (selectError, selectResults) => {
          if (selectError) {
            console.error("Error executing select query:", selectError);
            return res
              .status(500)
              .json({ message: "서버 내부 오류가 발생했습니다." });
          }

          if (selectResults.length === 0) {
            return res
              .status(404)
              .json({ message: "그룹을 찾을 수 없습니다." });
          }

          const updatedGroup = selectResults[0];
          updatedGroup.isPublic = !!updatedGroup.isPublic; // 숫자를 boolean으로 변환
          updatedGroup.badges = JSON.parse(updatedGroup.badges || "[]"); // JSON 파싱

          res.status(200).json(updatedGroup);
        });
      }
    );
  });
});

// 그룹 삭제
router.delete("/:groupId", (req, res) => {
  const { groupId } = req.params;
  const { password } = req.body;

  // 요청 본문 검증
  if (!password) {
    return res.status(400).json({ message: "잘못된 요청입니다" });
  }

  // 그룹 ID 존재 여부 확인
  const checkExistenceQuery = `SELECT * FROM \`groups\` WHERE id = ?`;
  pool.query(
    checkExistenceQuery,
    [groupId],
    (existenceError, existenceResults) => {
      if (existenceError) {
        console.error("Error executing existence check query:", existenceError);
        return res
          .status(500)
          .json({ message: "서버 내부 오류가 발생했습니다." });
      }

      if (existenceResults.length === 0) {
        return res.status(404).json({ message: "존재하지 않습니다" });
      }

      // 비밀번호 확인
      const checkPasswordQuery = `SELECT * FROM \`groups\` WHERE id = ? AND password = ?`;
      pool.query(
        checkPasswordQuery,
        [groupId, password],
        (passwordError, passwordResults) => {
          if (passwordError) {
            console.error(
              "Error executing password check query:",
              passwordError
            );
            return res
              .status(500)
              .json({ message: "서버 내부 오류가 발생했습니다." });
          }

          if (passwordResults.length === 0) {
            return res.status(403).json({ message: "비밀번호가 틀렸습니다" });
          }

          // 그룹 삭제
          const deleteQuery = `DELETE FROM \`groups\` WHERE id = ?`;
          pool.query(deleteQuery, [groupId], (deleteError, deleteResults) => {
            if (deleteError) {
              console.error("Error executing delete query:", deleteError);
              return res
                .status(500)
                .json({ message: "서버 내부 오류가 발생했습니다." });
            }

            res.status(200).json({ message: "그룹 삭제 성공" });
          });
        }
      );
    }
  );
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
