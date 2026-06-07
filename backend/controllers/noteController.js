const { db, VALID_SUBJECTS, VALID_LANGUAGES, upsertTags, attachTags, toNote } = require('./helpers')

// GET /api/notes
exports.getNotes = async (req, res, next) => {
    try {
        const userId = req.user.id
        const { subject, language, tag, page = 1, limit = 20, sort = 'newest' } = req.query

        let sql    = 'SELECT n.* FROM notes n'
        let params = []

        if (tag) {
            sql += ' JOIN note_tags nt ON nt.note_id = n.id'
            sql += ' JOIN tags t ON t.id = nt.tag_id'
        }

        sql += ' WHERE (n.user_id = ? OR n.is_public = 1)'
        params.push(userId)

        if (subject  && VALID_SUBJECTS.includes(subject))   { sql += ' AND n.subject = ?';   params.push(subject)  }
        if (language && VALID_LANGUAGES.includes(language)) { sql += ' AND n.language = ?';  params.push(language) }
        if (tag)                                            { sql += ' AND t.name = ?';      params.push(tag)      }

        const orderMap = {
            newest: 'n.is_public DESC, n.created_at DESC',
            oldest: 'n.is_public DESC, n.created_at ASC',
        }
        sql += ` ORDER BY ${orderMap[sort] || 'n.is_public DESC, n.created_at DESC'}`

        const offset = (Number(page) - 1) * Number(limit)
        sql += ' LIMIT ? OFFSET ?'
        params.push(Number(limit), offset)

        const [rows] = await db.query(sql, params)

        let countSql    = 'SELECT COUNT(*) as total FROM notes n'
        let countParams = [userId]
        if (tag) countSql += ' JOIN note_tags nt ON nt.note_id = n.id JOIN tags t ON t.id = nt.tag_id'
        countSql += ' WHERE (n.user_id = ? OR n.is_public = 1)'
        if (subject)  { countSql += ' AND n.subject = ?';  countParams.push(subject)  }
        if (language) { countSql += ' AND n.language = ?'; countParams.push(language) }
        if (tag)      { countSql += ' AND t.name = ?';     countParams.push(tag)      }

        const [[{ total }]] = await db.query(countSql, countParams)
        const notes = await attachTags(rows.map(toNote))

        res.json({
            notes,
            pagination: {
                total,
                page:       Number(page),
                limit:      Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        })
    } catch (error) {
        next(error)
    }
}

// GET /api/notes/:id
exports.getNote = async (req, res, next) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)
        const [[row]] = await db.query(
            'SELECT * FROM notes WHERE id = ? AND (user_id = ? OR is_public = 1)',
            [noteId, userId]
        )
        if (!row) return res.status(404).json({ message: '노트를 찾을 수 없습니다.' })
        const [note] = await attachTags([toNote(row)])
        res.json({ note })
    } catch (error) {
        next(error)
    }
}

// POST /api/notes
exports.createNote = async (req, res, next) => {
    try {
        const userId = req.user.id
        const {
            wrongCode, fixedCode, explanation,
            subject  = 'programming',
            language = 'theory',
            year     = 0,
            round    = 0,
            tags     = [],
            isPublic = false,
        } = req.body

        if (!wrongCode?.trim() || !fixedCode?.trim() || !explanation?.trim()) {
            return res.status(400).json({ message: '문제, 정답, 해설은 필수입니다.' })
        }

        const [result] = await db.query(
            `INSERT INTO notes (user_id, subject, language, year, round, wrong_code, fixed_code, explanation, is_public)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                VALID_SUBJECTS.includes(subject)   ? subject  : 'programming',
                VALID_LANGUAGES.includes(language) ? language : 'theory',
                Number(year), Number(round),
                wrongCode.trim(), fixedCode.trim(), explanation.trim(),
                isPublic ? 1 : 0,
            ]
        )

        const noteId = result.insertId
        if (Array.isArray(tags) && tags.length > 0) {
            const tagIds = await upsertTags(tags)
            for (const tagId of tagIds) {
                await db.query('INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)', [noteId, tagId])
            }
        }

        const [[row]] = await db.query('SELECT * FROM notes WHERE id = ?', [noteId])
        const [note] = await attachTags([toNote(row)])
        res.status(201).json({ message: '노트가 저장되었습니다.', note })
    } catch (error) {
        next(error)
    }
}

// PATCH /api/notes/:id
exports.updateNote = async (req, res, next) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)

        const [[existing]] = await db.query(
            'SELECT id FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]
        )
        if (!existing) return res.status(404).json({ message: '노트를 찾을 수 없습니다.' })

        const { wrongCode, fixedCode, explanation, subject, language, year, round, tags, isPublic } = req.body

        await db.query(
            `UPDATE notes SET
                wrong_code  = COALESCE(?, wrong_code),
                fixed_code  = COALESCE(?, fixed_code),
                explanation = COALESCE(?, explanation),
                subject     = COALESCE(?, subject),
                language    = COALESCE(?, language),
                year        = COALESCE(?, year),
                round       = COALESCE(?, round),
                is_public   = COALESCE(?, is_public)
             WHERE id = ? AND user_id = ?`,
            [
                wrongCode   ?? null, fixedCode   ?? null, explanation ?? null,
                subject     ?? null, language    ?? null, year        ?? null,
                round       ?? null,
                isPublic !== undefined ? (isPublic ? 1 : 0) : null,
                noteId, userId,
            ]
        )

        if (Array.isArray(tags)) {
            await db.query('DELETE FROM note_tags WHERE note_id = ?', [noteId])
            if (tags.length > 0) {
                const tagIds = await upsertTags(tags)
                for (const tagId of tagIds) {
                    await db.query('INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)', [noteId, tagId])
                }
            }
        }

        const [[row]] = await db.query('SELECT * FROM notes WHERE id = ?', [noteId])
        const [note] = await attachTags([toNote(row)])
        res.json({ message: '노트가 수정되었습니다.', note })
    } catch (error) {
        next(error)
    }
}

// DELETE /api/notes/:id
exports.deleteNote = async (req, res, next) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)
        const [result] = await db.query(
            'DELETE FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]
        )
        if (result.affectedRows === 0) return res.status(404).json({ message: '노트를 찾을 수 없습니다.' })
        res.json({ message: '노트가 삭제되었습니다.' })
    } catch (error) {
        next(error)
    }
}

// PATCH /api/notes/:id/review
exports.reviewNote = async (req, res, next) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)
        const { ef, intervalDays, repetitions, nextReviewAt } = req.body

        const [[existing]] = await db.query(
            'SELECT id FROM notes WHERE id = ? AND user_id = ?', [noteId, userId]
        )
        if (!existing) return res.status(404).json({ message: '노트를 찾을 수 없습니다.' })

        await db.query('UPDATE notes SET review_count = review_count + 1 WHERE id = ?', [noteId])

        if (ef !== undefined) {
            await db.query(
                `INSERT INTO srs_cards
                 (user_id, note_id, ef, interval_days, repetitions, next_review_at, last_reviewed_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE
                     ef               = VALUES(ef),
                     interval_days    = VALUES(interval_days),
                     repetitions      = VALUES(repetitions),
                     next_review_at   = VALUES(next_review_at),
                     last_reviewed_at = NOW()`,
                [userId, noteId, ef, intervalDays || 0, repetitions || 0, nextReviewAt || null]
            )
        }

        res.json({ message: '복습 완료가 기록되었습니다.' })
    } catch (error) {
        next(error)
    }
}
