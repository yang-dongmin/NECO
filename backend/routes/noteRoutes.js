const express = require("express");
const router = express.Router();

const db = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            code,
            comment,
            parsedCode,
            isPublic,
            languageId,
            fileName,
            quiz
        } = req.body;

        if (!code || !comment) {
            return res.status(400).json({
                message: "코드와 주석은 필수입니다."
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO code_notes
            (
                user_id,
                code,
                comment,
                parsed_code,
                is_public,
                language_id,
                file_name,
                quiz
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                req.user.id,
                code,
                comment,
                parsedCode ? JSON.stringify(parsedCode) : null,
                isPublic ? 1 : 0,
                languageId || null,
                fileName || null,
                quiz ? JSON.stringify(quiz) : null
            ]
        );

        res.json({
            message: "주석 저장 성공",
            noteId: result.insertId
        });

    } catch (error) {
        console.error("주석 저장 에러:", error);
        res.status(500).json({
            message: "서버 오류"
        });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            `
            SELECT
                id,
                code,
                comment,
                parsed_code AS parsedCode,
                is_public AS isPublic,
                language_id AS languageId,
                file_name AS fileName,
                quiz,
                created_at AS createdAt
            FROM code_notes
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,
            [req.user.id]
        );

        res.json(rows);

    } catch (error) {
        console.error("주석 조회 에러:", error);
        res.status(500).json({
            message: "서버 오류"
        });
    }
});

router.get("/public", authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            `
            SELECT
                cn.id,
                cn.code,
                cn.comment,
                cn.parsed_code AS parsedCode,
                cn.is_public AS isPublic,
                cn.language_id AS languageId,
                cn.file_name AS fileName,
                cn.quiz,
                cn.created_at AS createdAt,
                u.id AS authorId,
                u.nickname AS authorNickname
            FROM code_notes cn
            JOIN users u ON cn.user_id = u.id
            WHERE cn.is_public = 1
            ORDER BY cn.created_at DESC
            `
        );

        res.json(rows);

    } catch (error) {
        console.error("공개 문제 조회 에러:", error);

        res.status(500).json({
            message: "서버 오류"
        });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const noteId = req.params.id;

        const [rows] = await db.query(
            `
            SELECT
                cn.id,
                cn.code,
                cn.comment,
                cn.parsed_code AS parsedCode,
                cn.is_public AS isPublic,
                cn.language_id AS languageId,
                cn.file_name AS fileName,
                cn.quiz,
                cn.created_at AS createdAt,
                u.id AS authorId,
                u.nickname AS authorNickname
            FROM code_notes cn
            JOIN users u ON cn.user_id = u.id
            WHERE cn.id = ?
                AND (cn.user_id = ? OR cn.is_public = 1)
            LIMIT 1
            `,
            [
                noteId,
                req.user.id
            ]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "노트를 찾을 수 없습니다."
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error("주석 상세 조회 에러:", error);

        res.status(500).json({
            message: "서버 오류"
        });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const noteId = req.params.id;

        const [result] = await db.query(
            `
            DELETE FROM code_notes
            WHERE id = ?
              AND user_id = ?
            `,
            [
                noteId,
                req.user.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "삭제할 주석을 찾을 수 없습니다."
            });
        }

        res.json({
            message: "주석 삭제 성공"
        });

    } catch (error) {
        console.error("주석 삭제 에러:", error);

        res.status(500).json({
            message: "서버 오류"
        });
    }
});

module.exports = router;