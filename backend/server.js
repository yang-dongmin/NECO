require("dotenv").config();
require("./database/initDB");

const express          = require("express");
const cors             = require("cors");
const authRoutes       = require("./routes/authRoutes");
const noteRoutes       = require("./routes/noteRoutes");       // 정처기 오답노트
const codeNoteRoutes   = require("./routes/codeNoteRoutes");   // VSCode 코드 주석

const app = express();

// ── 미들웨어 ─────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// ── 라우터 ───────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/notes",       noteRoutes);       // 정처기 오답노트 CRUD
app.use("/api/code-notes",  codeNoteRoutes);   // VSCode 코드 주석 (공개/비공개)

// ── 헬스체크 ─────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ message: "NECO API SERVER", status: "ok" });
});

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `${req.method} ${req.path} 를 찾을 수 없습니다.` });
});

// ── 전역 에러 핸들러 ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("서버 에러:", err.stack);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✓ NECO 서버 실행 중 → http://localhost:${PORT}`);
});
