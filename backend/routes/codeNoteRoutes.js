const express = require("express");
const router = express.Router();

const db  = require("../database/db");
const auth = require("../middleware/authMiddleware");
const { updateStreak } = require("../controllers/helpers");

router.post("/", auth, async (req, res) => {
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

router.get("/", auth, async (req, res) => {
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

router.get("/public", auth, async (req, res) => {
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
                u.nickname AS authorNickname,
                COUNT(DISTINCT l.user_id) AS likeCount,
                MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS likedByMe
            FROM code_notes cn
            JOIN users u ON cn.user_id = u.id
            LEFT JOIN code_note_likes l ON l.code_note_id = cn.id
            WHERE cn.is_public = 1
            GROUP BY cn.id
            ORDER BY cn.created_at DESC
            `,
            [req.user.id]
        );

        res.json(rows);

    } catch (error) {
        console.error("공개 문제 조회 에러:", error);

        res.status(500).json({
            message: "서버 오류"
        });
    }
});

// GET /code-notes/srs — 내 코드노트 SRS 카드 목록 (/:id 앞에 있어야 함)
router.get("/srs", auth, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT code_note_id, ef, interval_days, repetitions, next_review_at, last_reviewed_at
             FROM code_note_srs WHERE user_id = ?`,
            [req.user.id]
        );
        res.json({ cards: rows });
    } catch (error) {
        console.error("코드노트 SRS 조회 에러:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// GET /code-notes/due — 오늘 복습할 코드노트 (quiz 있는 카드 중 next_review_at <= 오늘)
router.get("/due", auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // SRS 카드가 있고 오늘 이내인 것 + 아직 SRS 카드 없지만 quiz 가진 노트도 포함 (미시작)
        const [dueRows] = await db.query(
            `SELECT
                cn.id, cn.code, cn.comment, cn.language_id AS languageId,
                cn.file_name AS fileName, cn.quiz, cn.is_public AS isPublic,
                cn.created_at AS createdAt,
                s.ef, s.interval_days AS intervalDays, s.repetitions,
                s.next_review_at AS nextReviewAt, s.last_reviewed_at AS lastReviewedAt
             FROM code_notes cn
             LEFT JOIN code_note_srs s
               ON s.code_note_id = cn.id AND s.user_id = cn.user_id
             WHERE cn.user_id = ?
               AND cn.quiz IS NOT NULL
               AND (s.next_review_at IS NULL OR s.next_review_at <= ?)
             ORDER BY COALESCE(s.next_review_at, '1970-01-01') ASC`,
            [req.user.id, today]
        );

        // SRS 전체 카드 수 (통계용)
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM code_note_srs WHERE user_id = ?`,
            [req.user.id]
        );

        res.json({ due: dueRows, totalSrsCards: total });
    } catch (error) {
        console.error("코드노트 due 조회 에러:", error);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/:id", auth, async (req, res) => {
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

// PATCH /code-notes/:id/quiz-review — SM-2 SRS 복습 결과 제출 (/:id 앞에 있어야 함)
router.patch("/:id/quiz-review", auth, async (req, res) => {
    try {
        const userId     = req.user.id;
        const codeNoteId = Number(req.params.id);
        const { quality } = req.body; // 0~5

        if (quality === undefined || quality < 0 || quality > 5) {
            return res.status(400).json({ message: 'quality 값은 0~5 사이여야 합니다.' });
        }

        // 노트 소유 확인
        const [[note]] = await db.query(
            'SELECT id FROM code_notes WHERE id = ? AND user_id = ?',
            [codeNoteId, userId]
        );
        if (!note) return res.status(404).json({ message: '노트를 찾을 수 없습니다.' });

        // 기존 SRS 카드 조회
        const [[card]] = await db.query(
            'SELECT ef, interval_days, repetitions FROM code_note_srs WHERE user_id = ? AND code_note_id = ?',
            [userId, codeNoteId]
        );

        // SM-2 계산
        let ef          = card ? card.ef          : 2.5;
        let intervalDays = card ? card.interval_days : 0;
        let repetitions  = card ? card.repetitions   : 0;

        if (quality >= 3) {
            if (repetitions === 0)      intervalDays = 1;
            else if (repetitions === 1) intervalDays = 6;
            else                        intervalDays = Math.round(intervalDays * ef);
            repetitions++;
        } else {
            repetitions  = 0;
            intervalDays = 1;
        }
        ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (ef < 1.3) ef = 1.3;

        const nextReviewAt = new Date(Date.now() + intervalDays * 86400000)
            .toISOString().slice(0, 19).replace('T', ' ');

        await db.query(
            `INSERT INTO code_note_srs
             (user_id, code_note_id, ef, interval_days, repetitions, next_review_at, last_reviewed_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
                 ef               = VALUES(ef),
                 interval_days    = VALUES(interval_days),
                 repetitions      = VALUES(repetitions),
                 next_review_at   = VALUES(next_review_at),
                 last_reviewed_at = NOW()`,
            [userId, codeNoteId, ef, intervalDays, repetitions, nextReviewAt]
        );

        const streak = await updateStreak(userId);
        res.json({ ef, intervalDays, repetitions, nextReviewAt, streak });
    } catch (error) {
        console.error('quiz-review error:', error);
        res.status(500).json({ message: 'server error' });
    }
});

router.patch("/:id", auth, async (req, res) => {
    try {
        const noteId = req.params.id;
        const { comment, isPublic } = req.body;

        if (comment === undefined && isPublic === undefined) {
            return res.status(400).json({ message: "nothing to update" });
        }

        const [[note]] = await db.query(
            "SELECT id FROM code_notes WHERE id = ? AND user_id = ?",
            [noteId, req.user.id]
        );
        if (!note) return res.status(404).json({ message: "not found" });

        const fields = [];
        const values = [];
        if (comment !== undefined)  { fields.push("comment = ?");   values.push(comment); }
        if (isPublic !== undefined) { fields.push("is_public = ?"); values.push(isPublic ? 1 : 0); }
        values.push(noteId, req.user.id);

        await db.query(
            `UPDATE code_notes SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
            values
        );

        res.json({ message: "updated" });
    } catch (error) {
        console.error("patch error:", error);
        res.status(500).json({ message: "server error" });
    }
});

router.delete("/:id", auth, async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM code_notes WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "not found" });
        res.json({ message: "deleted" });
    } catch (error) {
        console.error("delete error:", error);
        res.status(500).json({ message: "server error" });
    }
});

router.post("/:id/like", auth, async (req, res) => {
    try {
        const userId     = req.user.id;
        const codeNoteId = Number(req.params.id);

        const [[pub]] = await db.query(
            "SELECT id FROM code_notes WHERE id = ? AND is_public = 1",
            [codeNoteId]
        );
        if (!pub) return res.status(404).json({ message: "not found" });

        const [[existing]] = await db.query(
            "SELECT 1 FROM code_note_likes WHERE user_id = ? AND code_note_id = ?",
            [userId, codeNoteId]
        );

        if (existing) {
            await db.query(
                "DELETE FROM code_note_likes WHERE user_id = ? AND code_note_id = ?",
                [userId, codeNoteId]
            );
            const [[{ count }]] = await db.query(
                "SELECT COUNT(*) AS count FROM code_note_likes WHERE code_note_id = ?",
                [codeNoteId]
            );
            return res.json({ liked: false, likeCount: count });
        } else {
            await db.query(
                "INSERT INTO code_note_likes (user_id, code_note_id) VALUES (?, ?)",
                [userId, codeNoteId]
            );
            const [[{ count }]] = await db.query(
                "SELECT COUNT(*) AS count FROM code_note_likes WHERE code_note_id = ?",
                [codeNoteId]
            );
            return res.json({ liked: true, likeCount: count });
        }
    } catch (error) {
        console.error("like error:", error);
        res.status(500).json({ message: "server error" });
    }
});

module.exports = router;
