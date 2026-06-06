const express    = require("express")
const router     = express.Router()
const auth       = require("../middleware/authMiddleware")
const authController = require("../controllers/authController")

router.post("/register", authController.register)
router.post("/login",    authController.login)
router.get("/me", auth,  authController.me)   // ← 토큰으로 내 정보 조회

module.exports = router
