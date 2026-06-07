const express      = require('express')
const router       = express.Router()
const auth         = require('../middleware/authMiddleware')
const noteCtrl     = require('../controllers/noteController')
const statsCtrl    = require('../controllers/statsController')
const srsCtrl      = require('../controllers/srsController')
const tagCtrl      = require('../controllers/tagController')
const bookmarkCtrl = require('../controllers/bookmarkController')

router.use(auth)

// 고정 경로 (:id 앞에 위치)
router.get('/stats',            statsCtrl.getStats)
router.get('/srs-cards',        srsCtrl.getSrsCards)
router.get('/tags',             tagCtrl.getTags)
router.get('/bookmarks',        bookmarkCtrl.getBookmarks)
router.post('/bookmarks/:id',   bookmarkCtrl.addBookmark)
router.delete('/bookmarks/:id', bookmarkCtrl.removeBookmark)

// 노트 CRUD
router.get('/',             noteCtrl.getNotes)
router.get('/:id',          noteCtrl.getNote)
router.post('/',            noteCtrl.createNote)
router.patch('/:id',        noteCtrl.updateNote)
router.delete('/:id',       noteCtrl.deleteNote)
router.patch('/:id/review', noteCtrl.reviewNote)

module.exports = router
