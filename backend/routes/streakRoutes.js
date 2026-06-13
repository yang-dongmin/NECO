const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/authMiddleware')
const { db }  = require('../controllers/helpers')

// GET /api/streak — 내 스트릭 조회
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id
        const [[row]] = await db.query(
            'SELECT current_streak, longest_streak, last_review_date FROM user_streaks WHERE user_id = ?',
            [userId]
        )
        res.json({
            currentStreak:  row?.current_streak  ?? 0,
            longestStreak:  row?.longest_streak  ?? 0,
            lastReviewDate: row?.last_review_date ?? null,
        })
    } catch (err) {
        res.status(500).json({ message: '서버 오류' })
    }
})

module.exports = router
