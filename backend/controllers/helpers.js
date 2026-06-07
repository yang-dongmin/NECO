// 컨트롤러 공통 유틸: DB, 상수, 헬퍼 함수
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

module.exports = { db, VALID_SUBJECTS, VALID_LANGUAGES, upsertTags, attachTags, toNote }
