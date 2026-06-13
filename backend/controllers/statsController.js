const { db } = require('./helpers')

// GET /api/notes/stats
exports.getStats = async (req, res, next) => {
    try {
        const userId = req.user.id

        const [[{ totalNotes }]] = await db.query(
            'SELECT COUNT(*) as totalNotes FROM notes WHERE user_id = ?', [userId]
        )
        const [[{ totalReview }]] = await db.query(
            'SELECT COALESCE(SUM(review_count), 0) as totalReview FROM notes WHERE user_id = ?', [userId]
        )
        const [subjectBreakdown] = await db.query(
            'SELECT subject, COUNT(*) as count FROM notes WHERE user_id = ? GROUP BY subject ORDER BY count DESC', [userId]
        )
        const [languageBreakdown] = await db.query(
            'SELECT language, COUNT(*) as count FROM notes WHERE user_id = ? GROUP BY language ORDER BY count DESC', [userId]
        )
        const [topTags] = await db.query(
            `SELECT t.name, COUNT(*) as count
             FROM note_tags nt JOIN tags t ON t.id = nt.tag_id JOIN notes n ON n.id = nt.note_id
             WHERE n.user_id = ? GROUP BY t.name ORDER BY count DESC LIMIT 10`,
            [userId]
        )
        const [recentActivity] = await db.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM notes WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 28 DAY)
             GROUP BY DATE(created_at) ORDER BY date ASC`,
            [userId]
        )
        const [[srs]] = await db.query(
            `SELECT COUNT(*) as learnedCount,
                SUM(CASE WHEN interval_days >= 21 THEN 1 ELSE 0 END) as matureCount,
                AVG(ef) as avgEF,
                SUM(repetitions) as totalRepetitions
             FROM srs_cards WHERE user_id = ?`,
            [userId]
        )
        const [[streakRow]] = await db.query(
            'SELECT current_streak FROM user_streaks WHERE user_id = ?',
            [userId]
        )
        const streak = streakRow?.current_streak ?? 0

        res.json({
            totalNotes,
            totalReview: Number(totalReview),
            streak,
            subjectBreakdown,
            languageBreakdown,
            topTags,
            recentActivity,
            srs: {
                learnedCount:     srs.learnedCount     || 0,
                matureCount:      srs.matureCount      || 0,
                avgEF:            srs.avgEF ? parseFloat(srs.avgEF.toFixed(2)) : 2.5,
                totalRepetitions: srs.totalRepetitions || 0,
            },
        })
    } catch (error) {
        next(error)
    }
}
