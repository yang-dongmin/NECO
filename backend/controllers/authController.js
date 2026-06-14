const bcrypt = require('bcrypt')
const db     = require('../database/db')
const jwt    = require('jsonwebtoken')

// 이메일 형식 검증 헬퍼
const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

exports.register = async (req, res) => {
    try {
        const { email, password, nickname } = req.body

        // 필수값 체크
        if (!email || !password || !nickname) {
            return res.status(400).json({ message: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.' })
        }

        // 이메일 형식 체크
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: '이메일 형식이 올바르지 않습니다.' })
        }

        // 비밀번호 길이 체크
        if (password.length < 6) {
            return res.status(400).json({ message: '비밀번호는 6자 이상이어야 합니다.' })
        }

        // 닉네임 길이 체크
        if (nickname.trim().length < 2) {
            return res.status(400).json({ message: '닉네임은 2자 이상이어야 합니다.' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const [result] = await db.query(
            'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)',
            [email.toLowerCase(), hashedPassword, nickname.trim()]
        )

        res.status(201).json({
            message: '회원가입 성공',
            userId: result.insertId
        })

    } catch (error) {
        console.error('회원가입 에러:', error)

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' })
        }

        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' })
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: '이메일 형식이 올바르지 않습니다.' })
        }

        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email.toLowerCase()]
        )

        const user = rows[0]

        if (!user) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            // 보안상 이메일/비밀번호 오류를 동일 메시지로
            return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, nickname: user.nickname },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.json({
            message: '로그인 성공',
            token,
            user: {
                id:       user.id,
                email:    user.email,
                nickname: user.nickname
            }
        })

    } catch (error) {
        console.error('로그인 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// 토큰으로 내 정보 조회
exports.me = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, email, nickname, created_at FROM users WHERE id = ?',
            [req.user.id]
        )
        if (!rows[0]) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
        res.json({ user: rows[0] })
    } catch (error) {
        console.error('내 정보 조회 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// 닉네임 변경
exports.updateProfile = async (req, res) => {
    try {
        const { nickname } = req.body
        if (!nickname || nickname.trim().length < 2) {
            return res.status(400).json({ message: '닉네임은 2자 이상이어야 합니다.' })
        }
        await db.query(
            'UPDATE users SET nickname = ? WHERE id = ?',
            [nickname.trim(), req.user.id]
        )
        res.json({ message: '닉네임이 변경되었습니다.', nickname: nickname.trim() })
    } catch (error) {
        console.error('프로필 수정 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// 비밀번호 변경
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' })
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: '새 비밀번호는 6자 이상이어야 합니다.' })
        }

        const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id])
        if (!rows[0]) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password)
        if (!isMatch) return res.status(401).json({ message: '현재 비밀번호가 올바르지 않습니다.' })

        const hashed = await bcrypt.hash(newPassword, 10)
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id])
        res.json({ message: '비밀번호가 변경되었습니다.' })
    } catch (error) {
        console.error('비밀번호 변경 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

// 회원탈퇴
exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body
        if (!password) return res.status(400).json({ message: '비밀번호를 입력해주세요.' })

        const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id])
        if (!rows[0]) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })

        const isMatch = await bcrypt.compare(password, rows[0].password)
        if (!isMatch) return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' })

        // notes, code_notes 등 연관 테이블은 ON DELETE CASCADE로 자동 처리
        await db.query('DELETE FROM users WHERE id = ?', [req.user.id])

        res.json({ message: '계정이 삭제되었습니다.' })
    } catch (error) {
        console.error('회원탈퇴 에러:', error)
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}
