const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "인증 토큰이 없습니다."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "neco_secret_key"
        );

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "유효하지 않은 토큰입니다."
        });
    }
};