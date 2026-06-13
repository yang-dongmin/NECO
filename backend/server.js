require("dotenv").config();

if (!process.env.JWT_SECRET) {
    console.error("[NECO] JWT_SECRET not set. Check backend/.env");
    process.exit(1);
}

require("./database/initDB");

const express        = require("express");
const cors           = require("cors");
const authRoutes     = require("./routes/authRoutes");
const noteRoutes     = require("./routes/noteRoutes");
const codeNoteRoutes = require("./routes/codeNoteRoutes");
const streakRoutes   = require("./routes/streakRoutes");
const searchRoutes   = require("./routes/searchRoutes");
const errorHandler   = require("./middleware/errorHandler");

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth",       authRoutes);
app.use("/api/notes",      noteRoutes);
app.use("/api/code-notes", codeNoteRoutes);
app.use("/api/streak",     streakRoutes);
app.use("/api/search",     searchRoutes);

app.get("/", (req, res) => {
    res.json({ message: "NECO API SERVER", status: "ok" });
});

app.use((req, res) => {
    res.status(404).json({ message: `${req.method} ${req.path} not found` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`NECO server running -> http://localhost:${PORT}`);
});
