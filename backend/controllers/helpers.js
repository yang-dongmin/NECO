// helpers.js - Controller utilities
const db = require('../database/db')

const VALID_SUBJECTS = [
    'sw-design', 'sw-dev', 'db', 'security', 'programming', 'general'
]
const VALID_LANGUAGES = [
    'theory', 'sql', 'c', 'python', 'javascript', 'java', 'kotlin', 'swift', 'other'
]

async function upsertTags(tagNames = []) {
    const tagIds = []
    for (const name of tagNames) {
        const trimmed = name.trim()
        if (!trimmed) continue
        await db.query('INSERT IGNORE INTO tags (name) VALUES (?)', [trimmed])
        const [[tag]] = await db.query('SELECT id FROM tags WHERE name = ?', [trimmed])
        if (tag) tagIds.push(tag.id)
    }
    return tagIds
}

async function attachTags(notes) {
    if (notes.length === 0) return notes
    const ids = notes.map(n => n.id)
    const [rows] = await db.query(
        `SELECT nt.note_id, t.id, t.name
         FROM note_tags nt
         JOIN tags t ON t.id = nt.tag_id
         WHERE nt.note_id IN (?)`,
        [ids]
    )
    const tagMap = {}
    rows.forEach(r => {
        if (!tagMap[r.note_id]) tagMap[r.note_id] = []
        tagMap[r.note_id].push({ id: r.id, name: r.name })
    })
    return notes.map(n => ({ ...n, tags: tagMap[n.id] || [] }))
}

function toNote(row) {
    return {
        id:          row.id,
        userId:      row.user_id,
        subject:     row.subject,
        language:    row.language,
        year:        row.year,
        round:       row.round,
        wrongCode:   row.wrong_code,
        fixedCode:   row.fixed_code,
        explanation: row.explanation,
        isPublic:    !!row.is_public,
        reviewCount: row.review_count,
        createdAt:   row.created_at,
        updatedAt:   row.updated_at,
    }
}

// Streak update - count once per day
async function updateStreak(userId) {
    const today = new Date().toISOString().slice(0, 10)
    const [[row]] = await db.query(
        'SELECT current_streak, longest_streak, last_review_date FROM user_streaks WHERE user_id = ?',
        [userId]
    )
    if (!row) {
        await db.query(
            'INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_review_date) VALUES (?,1,1,?)',
            [userId, today]
        )
        return { currentStreak: 1, longestStreak: 1 }
    }

    const last = row.last_review_date ? String(row.last_review_date).slice(0, 10) : null
    if (last === today) return { currentStreak: row.current_streak, longestStreak: row.longest_streak }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const current = last === yesterday ? row.current_streak + 1 : 1
    const longest = Math.max(current, row.longest_streak)

    await db.query(
        'UPDATE user_streaks SET current_streak=?, longest_streak=?, last_review_date=? WHERE user_id=?',
        [current, longest, today, userId]
    )
    return { currentStreak: current, longestStreak: longest }
}

module.exports = { db, VALID_SUBJECTS, VALID_LANGUAGES, upsertTags, attachTags, toNote, updateStreak }
