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
            process.env.JWT_SECRET || 'neco_secret_key',
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

// 토큰으로 내 정보 조회 (선택)
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
