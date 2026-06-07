const { db } = require('./helpers')

// GET /api/notes/bookmarks
exports.getBookmarks = async (req, res, next) => {
    try {
        const userId = req.user.id
        const [rows] = await db.query('SELECT note_id FROM bookmarks WHERE user_id = ?', [userId])
        res.json({ bookmarks: rows.map(r => r.note_id) })
    } catch (error) {
        next(error)
    }
}

// POST /api/notes/bookmarks/:id
exports.addBookmark = async (req, res, next) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)
        const [[note]] = await db.query('SELECT id FROM notes WHERE id = ? AND user_id = ?', [noteId, userId])
        if (!note) return res.status(404).json({ message: '노트를 찾을 수 없습니다.' })
        await db.query('INSERT IGNORE INTO bookmarks (user_id, note_id) VALUES (?, ?)', [userId, noteId])
        res.json({ bookmarked: true })
    } catch (error) {
        next(error)
    }
}

// DELETE /api/notes/bookmarks/:id
exports.removeBookmark = async (req, res, next) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)
        await db.query('DELETE FROM bookmarks WHERE user_id = ? AND note_id = ?', [userId, noteId])
        res.json({ bookmarked: false })
    } catch (error) {
        next(error)
    }
}
