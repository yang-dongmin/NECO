const express  = require('express')
const router   = express.Router()
const auth     = require('../middleware/authMiddleware')
const noteCtrl = require('../controllers/noteController')

// 모든 라우트 JWT 인증 적용
router.use(auth)

// ── 고정 경로 (:id 앞에 위치해야 충돌 없음) ───────────────────────────────
router.get('/stats',              noteCtrl.getStats)
router.get('/srs-cards',          noteCtrl.getSrsCards)
router.get('/tags',               noteCtrl.getTags)
router.get('/bookmarks',          noteCtrl.getBookmarks)
router.post('/bookmarks/:id',     noteCtrl.addBookmark)
router.delete('/bookmarks/:id',   noteCtrl.removeBookmark)

// ── 노트 CRUD ─────────────────────────────────────────────────────────────
router.get('/',             noteCtrl.getNotes)
router.get('/:id',          noteCtrl.getNote)
router.post('/',            noteCtrl.createNote)
router.patch('/:id',        noteCtrl.updateNote)
router.delete('/:id',       noteCtrl.deleteNote)
router.patch('/:id/review', noteCtrl.reviewNote)

module.exports = router
