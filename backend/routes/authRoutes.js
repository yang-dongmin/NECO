const express    = require("express")
const router     = express.Router()
const auth       = require("../middleware/authMiddleware")
const authController = require("../controllers/authController")

router.post("/register",          authController.register)
router.post("/login",             authController.login)
router.get("/me",        auth,    authController.me)
router.put("/profile",   auth,    authController.updateProfile)   // 닉네임 변경
router.put("/password",  auth,    authController.changePassword)  // 비밀번호 변경
router.delete("/account", auth,   authController.deleteAccount)   // 회원탈퇴

module.exports = router
