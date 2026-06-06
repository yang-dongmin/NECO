const db = require('../database/db')

// ── 유효한 과목/언어 목록 ────────────────────────────────────────────────────
const VALID_SUBJECTS = [
    'sw-design', 'sw-dev', 'db', 'security', 'programming', 'general'
]
const VALID_LANGUAGES = [
    'theory', 'sql', 'c', 'python', 'javascript', 'java', 'kotlin', 'swift', 'other'
]

// ── 태그 upsert 헬퍼 ────────────────────────────────────────────────────────
async function upsertTags(tagNames = []) {
    const tagIds = []
    for (const name of tagNames) {
        const trimmed = name.trim()
        if (!trimmed) continue
        // 없으면 insert, 있으면 기존 id 반환
        await db.query(
            'INSERT IGNORE INTO tags (name) VALUES (?)', [trimmed]
        )
        const [[tag]] = await db.query(
            'SELECT id FROM tags WHERE name = ?', [trimmed]
        )
        if (tag) tagIds.push(tag.id)
    }
    return tagIds
}

// ── 노트 + 태그 조합 헬퍼 ───────────────────────────────────────────────────
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

// ── 노트 camelCase 변환 ──────────────────────────────────────────────────────
function toNote(row) {
    return {
        id:           row.id,
        userId:       row.user_id,
        subject:      row.subject,
        language:     row.language,
        year:         row.year,
        round:        row.round,
        wrongCode:    row.wrong_code,
        fixedCode:    row.fixed_code,
        explanation:  row.explanation,
        isPublic:     !!row.is_public,
        reviewCount:  row.review_count,
        createdAt:    row.created_at,
        updatedAt:    row.updated_at,
    }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/notes  — 내 노트 목록 (필터 + 페이징)
// ────────────────────────────────────────────────────────────────────────────
exports.getNotes = async (req, res) => {
    try {
        const userId  = req.user.id
        const {
            subject, language, tag,
            page  = 1,
            limit = 20,
            sort  = 'newest'   // newest | oldest | weak
        } = req.query

        let sql    = 'SELECT n.* FROM notes n'
        let params = []

        // 태그 필터가 있으면 JOIN
        if (tag) {
            sql += ' JOIN note_tags nt ON nt.note_id = n.id'
            sql += ' JOIN tags t ON t.id = nt.tag_id'
        }

        // 내 노트 OR 공용 문제(is_public=1) 모두 포함
        sql += ' WHERE (n.user_id = ? OR n.is_public = 1)'
        params.push(userId)

        if (subject && VALID_SUBJECTS.includes(subject)) {
            sql += ' AND n.subject = ?'
            params.push(subject)
        }
        if (language && VALID_LANGUAGES.includes(language)) {
            sql += ' AND n.language = ?'
            params.push(language)
        }
        if (tag) {
            sql += ' AND t.name = ?'
            params.push(tag)
        }

        // 정렬: 공용 문제를 먼저, 그 다음 최신순
        const orderMap = {
            newest: 'n.is_public DESC, n.created_at DESC',
            oldest: 'n.is_public DESC, n.created_at ASC',
        }
        sql += ` ORDER BY ${orderMap[sort] || 'n.is_public DESC, n.created_at DESC'}`

        // 페이징
        const offset = (Number(page) - 1) * Number(limit)
        sql += ' LIMIT ? OFFSET ?'
        params.push(Number(limit), offset)

        const [rows] = await db.query(sql, params)

        // 전체 수 카운트
        let countSql    = 'SELECT COUNT(*) as total FROM notes n'
        let countParams = [userId]
        if (tag) {
            countSql += ' JOIN note_tags nt ON nt.note_id = n.id JOIN tags t ON t.id = nt.tag_id'
        }
        countSql += ' WHERE (n.user_id = ? OR n.is_public = 1)'
        if (subject) { countSql += ' AND n.subject = ?'; countParams.push(subject) }
        if (language) { countSql += ' AND n.language = ?'; countParams.push(language) }
        if (tag)     { countSql += ' AND t.name = ?';     countParams.push(tag)     }

        const [[{ total }]] = await db.query(countSql, countParams)

        const notes = await attachTags(rows.map(toNote))

        res.json({
            notes,
            pagination: {
                total,
                page:       Number(page),
                limit:      Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        })
    } catch (error) {
        console.error('노트 목록 조회 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/notes/:id  — 노트 상세
// ────────────────────────────────────────────────────────────────────────────
exports.getNote = async (req, res) => {
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
        console.error('노트 상세 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/notes  — 노트 생성
// ────────────────────────────────────────────────────────────────────────────
exports.createNote = async (req, res) => {
    try {
        const userId = req.user.id
        const {
            wrongCode, fixedCode, explanation,
            subject    = 'programming',
            language   = 'theory',
            year       = 0,
            round      = 0,
            tags       = [],
            isPublic   = false,
        } = req.body

        // 필수값 검증
        if (!wrongCode?.trim() || !fixedCode?.trim() || !explanation?.trim()) {
            return res.status(400).json({ message: '문제, 정답, 해설은 필수입니다.' })
        }

        const [result] = await db.query(
            `INSERT INTO notes
             (user_id, subject, language, year, round,
              wrong_code, fixed_code, explanation, is_public)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                VALID_SUBJECTS.includes(subject)   ? subject  : 'programming',
                VALID_LANGUAGES.includes(language) ? language : 'theory',
                Number(year), Number(round),
                wrongCode.trim(), fixedCode.trim(), explanation.trim(),
                isPublic ? 1 : 0
            ]
        )

        const noteId = result.insertId

        // 태그 연결
        if (Array.isArray(tags) && tags.length > 0) {
            const tagIds = await upsertTags(tags)
            for (const tagId of tagIds) {
                await db.query(
                    'INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
                    [noteId, tagId]
                )
            }
        }

        // 생성된 노트 반환
        const [[row]] = await db.query('SELECT * FROM notes WHERE id = ?', [noteId])
        const [note] = await attachTags([toNote(row)])

        res.status(201).json({ message: '노트가 저장되었습니다.', note })

    } catch (error) {
        console.error('노트 생성 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// ────────────────────────────────────────────────────────────────────────────
// PATCH /api/notes/:id  — 노트 수정
// ────────────────────────────────────────────────────────────────────────────
exports.updateNote = async (req, res) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)

        // 내 노트인지 확인
        const [[existing]] = await db.query(
            'SELECT id FROM notes WHERE id = ? AND user_id = ?',
            [noteId, userId]
        )
        if (!existing) return res.status(404).json({ message: '노트를 찾을 수 없습니다.' })

        const {
            wrongCode, fixedCode, explanation,
            subject, language, year, round,
            tags, isPublic
        } = req.body

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
                wrongCode   ?? null,
                fixedCode   ?? null,
                explanation ?? null,
                subject     ?? null,
                language    ?? null,
                year        ?? null,
                round       ?? null,
                isPublic !== undefined ? (isPublic ? 1 : 0) : null,
                noteId, userId
            ]
        )

        // 태그 재설정
        if (Array.isArray(tags)) {
            await db.query('DELETE FROM note_tags WHERE note_id = ?', [noteId])
            if (tags.length > 0) {
                const tagIds = await upsertTags(tags)
                for (const tagId of tagIds) {
                    await db.query(
                        'INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
                        [noteId, tagId]
                    )
                }
            }
        }

        const [[row]] = await db.query('SELECT * FROM notes WHERE id = ?', [noteId])
        const [note] = await attachTags([toNote(row)])

        res.json({ message: '노트가 수정되었습니다.', note })

    } catch (error) {
        console.error('노트 수정 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/notes/:id  — 노트 삭제
// ────────────────────────────────────────────────────────────────────────────
exports.deleteNote = async (req, res) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)

        const [result] = await db.query(
            'DELETE FROM notes WHERE id = ? AND user_id = ?',
            [noteId, userId]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '노트를 찾을 수 없습니다.' })
        }

        res.json({ message: '노트가 삭제되었습니다.' })

    } catch (error) {
        console.error('노트 삭제 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// ────────────────────────────────────────────────────────────────────────────
// PATCH /api/notes/:id/review  — 복습 완료 (review_count + SRS 동기화)
// ────────────────────────────────────────────────────────────────────────────
exports.reviewNote = async (req, res) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)
        const { ef, intervalDays, repetitions, nextReviewAt } = req.body

        // 내 노트인지 확인
        const [[existing]] = await db.query(
            'SELECT id FROM notes WHERE id = ? AND user_id = ?',
            [noteId, userId]
        )
        if (!existing) return res.status(404).json({ message: '노트를 찾을 수 없습니다.' })

        // review_count 증가
        await db.query(
            'UPDATE notes SET review_count = review_count + 1 WHERE id = ?',
            [noteId]
        )

        // SRS 카드 동기화 (있으면 update, 없으면 insert)
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
        console.error('복습 기록 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/stats  — 내 학습 통계
// ────────────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id

        // 전체 노트 수
        const [[{ totalNotes }]] = await db.query(
            'SELECT COUNT(*) as totalNotes FROM notes WHERE user_id = ?',
            [userId]
        )

        // 총 복습 횟수
        const [[{ totalReview }]] = await db.query(
            'SELECT COALESCE(SUM(review_count), 0) as totalReview FROM notes WHERE user_id = ?',
            [userId]
        )

        // 과목별 문제 수
        const [subjectBreakdown] = await db.query(
            `SELECT subject, COUNT(*) as count
             FROM notes WHERE user_id = ?
             GROUP BY subject ORDER BY count DESC`,
            [userId]
        )

        // 언어별 문제 수
        const [languageBreakdown] = await db.query(
            `SELECT language, COUNT(*) as count
             FROM notes WHERE user_id = ?
             GROUP BY language ORDER BY count DESC`,
            [userId]
        )

        // 태그별 문제 수 Top 10
        const [topTags] = await db.query(
            `SELECT t.name, COUNT(*) as count
             FROM note_tags nt
             JOIN tags t ON t.id = nt.tag_id
             JOIN notes n ON n.id = nt.note_id
             WHERE n.user_id = ?
             GROUP BY t.name
             ORDER BY count DESC
             LIMIT 10`,
            [userId]
        )

        // 최근 28일 활동
        const [recentActivity] = await db.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM notes
             WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 28 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [userId]
        )

        // SRS 통계
        const [[srs]] = await db.query(
            `SELECT
                COUNT(*) as learnedCount,
                SUM(CASE WHEN interval_days >= 21 THEN 1 ELSE 0 END) as matureCount,
                AVG(ef) as avgEF,
                SUM(repetitions) as totalRepetitions
             FROM srs_cards WHERE user_id = ?`,
            [userId]
        )

        // 연속 학습일(streak) 계산
        // srs_cards의 last_reviewed_at 기준으로 오늘 포함 연속 날짜 수 계산
        const [reviewDays] = await db.query(
            `SELECT DISTINCT DATE(last_reviewed_at) as day
             FROM srs_cards
             WHERE user_id = ? AND last_reviewed_at IS NOT NULL
             ORDER BY day DESC
             LIMIT 365`,
            [userId]
        )

        let streak = 0
        if (reviewDays.length > 0) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // 오늘 또는 어제부터 시작해야 streak 인정
            const firstDay = new Date(reviewDays[0].day)
            firstDay.setHours(0, 0, 0, 0)
            const diffFromToday = Math.round((today - firstDay) / 86400000)

            if (diffFromToday <= 1) {
                streak = 1
                for (let i = 1; i < reviewDays.length; i++) {
                    const prev = new Date(reviewDays[i - 1].day)
                    const curr = new Date(reviewDays[i].day)
                    prev.setHours(0, 0, 0, 0)
                    curr.setHours(0, 0, 0, 0)
                    const gap = Math.round((prev - curr) / 86400000)
                    if (gap === 1) streak++
                    else break
                }
            }
        }

        res.json({
            totalNotes,
            totalReview:       Number(totalReview),
            streak,
            subjectBreakdown,
            languageBreakdown,
            topTags,
            recentActivity,
            srs: {
                learnedCount:    srs.learnedCount    || 0,
                matureCount:     srs.matureCount     || 0,
                avgEF:           srs.avgEF ? parseFloat(srs.avgEF.toFixed(2)) : 2.5,
                totalRepetitions:srs.totalRepetitions|| 0,
            }
        })

    } catch (error) {
        console.error('통계 조회 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/notes/srs-cards  — 내 SRS 카드 전체 조회 (로그인 시 로드용)
// ────────────────────────────────────────────────────────────────────────────
exports.getSrsCards = async (req, res) => {
    try {
        const userId = req.user.id
        const [cards] = await db.query(
            `SELECT note_id, ef, interval_days, repetitions, next_review_at, last_reviewed_at
             FROM srs_cards
             WHERE user_id = ?`,
            [userId]
        )
        res.json({ cards })
    } catch (error) {
        console.error('SRS 카드 조회 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/notes/tags  — 내 노트 태그 목록 (사용 빈도순)
// ────────────────────────────────────────────────────────────────────────────
exports.getTags = async (req, res) => {
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
        console.error('태그 목록 조회 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// ────────────────────────────────────────────────────────────────────────────
// GET  /api/notes/bookmarks       — 내 북마크 id 목록
// POST /api/notes/bookmarks/:id   — 북마크 추가
// DELETE /api/notes/bookmarks/:id — 북마크 제거
// ────────────────────────────────────────────────────────────────────────────
exports.getBookmarks = async (req, res) => {
    try {
        const userId = req.user.id
        const [rows] = await db.query(
            'SELECT note_id FROM bookmarks WHERE user_id = ?',
            [userId]
        )
        res.json({ bookmarks: rows.map(r => r.note_id) })
    } catch (error) {
        console.error('북마크 조회 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

exports.addBookmark = async (req, res) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)
        // 내 노트인지 확인
        const [[note]] = await db.query(
            'SELECT id FROM notes WHERE id = ? AND user_id = ?',
            [noteId, userId]
        )
        if (!note) return res.status(404).json({ message: '노트를 찾을 수 없습니다.' })

        await db.query(
            'INSERT IGNORE INTO bookmarks (user_id, note_id) VALUES (?, ?)',
            [userId, noteId]
        )
        res.json({ bookmarked: true })
    } catch (error) {
        console.error('북마크 추가 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

exports.removeBookmark = async (req, res) => {
    try {
        const userId = req.user.id
        const noteId = Number(req.params.id)
        await db.query(
            'DELETE FROM bookmarks WHERE user_id = ? AND note_id = ?',
            [userId, noteId]
        )
        res.json({ bookmarked: false })
    } catch (error) {
        console.error('북마크 제거 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}
