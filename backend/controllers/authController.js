const bcrypt = require("bcrypt");
const db = require("../database/db");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        const { email, password, nickname } = req.body;

        if (!email || !password || !nickname) {
            return res.status(400).json({
                message: "이메일, 비밀번호, 닉네임을 모두 입력해주세요."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `
            INSERT INTO users
            (email, password, nickname)
            VALUES (?, ?, ?)
            `,
            [email, hashedPassword, nickname]
        );

        res.json({
            message: "회원가입 성공",
            userId: result.insertId
        });

    } catch (error) {
        console.error("회원가입 에러:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "이미 존재하는 이메일"
            });
        }

        res.status(500).json({
            message: "서버 오류"
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "이메일과 비밀번호를 입력해주세요."
            });
        }

        const [rows] = await db.query(
            `
            SELECT *
            FROM users
            WHERE email = ?
            `,
            [email]
        );

        const user = rows[0];

        if (!user) {
            return res.status(401).json({
                message: "존재하지 않는 이메일"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "비밀번호 불일치"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                nickname: user.nickname
            },
            process.env.JWT_SECRET || "neco_secret_key",
            {
                expiresIn: "7d"
            }
        );

        res.json({
            message: "로그인 성공",
            token,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname
            }
        });

    } catch (error) {
        console.error("로그인 에러:", error);

        res.status(500).json({
            message: "서버 오류"
        });
    }
};