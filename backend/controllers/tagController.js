const { db } = require('./helpers')

// GET /api/notes/tags
exports.getTags = async (req, res, next) => {
    try {
        const userId = req.user.id
        const [tags] = await db.query(
            `SELECT t.id, t.name, COUNT(nt.note_id) as count
             FROM tags t
             JOIN note_tags nt ON nt.tag_id = t.id
             JOIN notes n      ON n.id = nt.note_id
             WHERE n.user_id = ?
             GROUP BY t.id, t.name
             ORDER BY count DESC
             LIMIT 30`,
            [userId]
        )
        res.json({ tags })
    } catch (error) {
        next(error)
    }
}
