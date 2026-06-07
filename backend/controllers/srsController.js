const { db } = require('./helpers')

// GET /api/notes/srs-cards
exports.getSrsCards = async (req, res, next) => {
    try {
        const userId = req.user.id
        const [cards] = await db.query(
            `SELECT note_id, ef, interval_days, repetitions, next_review_at, last_reviewed_at
             FROM srs_cards WHERE user_id = ?`,
            [userId]
        )
        res.json({ cards })
    } catch (error) {
        next(error)
    }
}
