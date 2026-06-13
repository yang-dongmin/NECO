const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/authMiddleware')
const { db }  = require('../controllers/helpers')

// GET /api/search?q=검색어 — 정처기 노트 + 코드노트 통합 검색
router.get('/', auth, async (req, res) => {
    try {
        const q = (req.query.q || '').trim()
        if (q.length < 2) return res.json({ notes: [], codeNotes: [] })

        const like = `%${q}%`
        const userId = req.user.id

        const [[notesRows], [codeRows]] = await Promise.all([
            db.query(
                `SELECT id, subject, wrong_code AS wrongCode, explanation, created_at AS createdAt
                 FROM notes
                 WHERE user_id = ?
                   AND (wrong_code LIKE ? OR fixed_code LIKE ? OR explanation LIKE ?)
                 ORDER BY created_at DESC LIMIT 5`,
                [userId, like, like, like]
            ),
            db.query(
                `SELECT id, language_id AS languageId, file_name AS fileName,
                        LEFT(code, 120) AS codeSnippet, comment, created_at AS createdAt
                 FROM code_notes
                 WHERE user_id = ?
                   AND (code LIKE ? OR comment LIKE ? OR file_name LIKE ?)
                 ORDER BY created_at DESC LIMIT 5`,
                [userId, like, like, like]
            ),
        ])

        res.json({ notes: notesRows, codeNotes: codeRows })
    } catch (err) {
        console.error('search 에러:', err)
        res.status(500).json({ message: '서버 오류' })
    }
})

module.exports = router
