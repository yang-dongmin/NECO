// 전역 에러 핸들러 미들웨어
// 컨트롤러에서 next(error)로 넘긴 에러를 여기서 일괄 처리
module.exports = (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}`, err.message)
    res.status(err.status ?? 500).json({
        message: err.message ?? '서버 오류가 발생했습니다.',
    })
}
