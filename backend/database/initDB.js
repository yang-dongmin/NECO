const db = require("./db");

async function initDB() {
    try {
        // ── users 테이블 ─────────────────────────────────────────────
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                email      VARCHAR(255) UNIQUE NOT NULL,
                password   VARCHAR(255) NOT NULL,
                nickname   VARCHAR(100) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✓ users 테이블 준비 완료");

        // ── code_notes 테이블 (VSCode 확장에서 저장하는 코드 주석) ───
        await db.query(`
            CREATE TABLE IF NOT EXISTS code_notes (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                user_id     INT NOT NULL,
                code        LONGTEXT NOT NULL,
                comment     LONGTEXT NOT NULL,
                parsed_code JSON NULL,
                is_public   BOOLEAN DEFAULT FALSE,
                language_id VARCHAR(100),
                file_name   VARCHAR(255),
                quiz        JSON NULL,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE
            )
        `);
        console.log("✓ code_notes 테이블 준비 완료");

        // ── notes 테이블 (웹앱에서 만드는 정처기 오답노트) ───────────
        await db.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                user_id      INT NOT NULL,
                subject      VARCHAR(50)  DEFAULT 'programming',
                language     VARCHAR(50)  DEFAULT 'theory',
                year         INT          DEFAULT 0,
                round        INT          DEFAULT 0,
                wrong_code   TEXT         NOT NULL,
                fixed_code   TEXT         NOT NULL,
                explanation  TEXT         NOT NULL,
                is_public    TINYINT(1)   DEFAULT 0,
                review_count INT          DEFAULT 0,
                created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
                updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("✓ notes 테이블 준비 완료");

        // ── tags 테이블 ──────────────────────────────────────────────
        await db.query(`
            CREATE TABLE IF NOT EXISTS tags (
                id   INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL
            )
        `);
        console.log("✓ tags 테이블 준비 완료");

        // ── note_tags 조인 테이블 ────────────────────────────────────
        await db.query(`
            CREATE TABLE IF NOT EXISTS note_tags (
                note_id INT NOT NULL,
                tag_id  INT NOT NULL,
                PRIMARY KEY (note_id, tag_id),
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
            )
        `);
        console.log("✓ note_tags 테이블 준비 완료");

        // ── srs_cards 테이블 (복습 스케줄 서버 저장) ─────────────────
        await db.query(`
            CREATE TABLE IF NOT EXISTS srs_cards (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                user_id          INT NOT NULL,
                note_id          INT NOT NULL,
                ef               FLOAT   DEFAULT 2.5,
                interval_days    INT     DEFAULT 0,
                repetitions      INT     DEFAULT 0,
                next_review_at   DATETIME,
                last_reviewed_at DATETIME,
                UNIQUE KEY uq_user_note (user_id, note_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
            )
        `);
        console.log("✓ srs_cards 테이블 준비 완료");

        // ── 인덱스 (성능) ─────────────────────────────────────────────
        const indexes = [
            'CREATE INDEX idx_code_notes_user    ON code_notes(user_id)',
            'CREATE INDEX idx_code_notes_public  ON code_notes(is_public)',
            'CREATE INDEX idx_notes_user_id      ON notes(user_id)',
            'CREATE INDEX idx_notes_subject      ON notes(subject)',
            'CREATE INDEX idx_notes_language     ON notes(language)',
            'CREATE INDEX idx_srs_user_id        ON srs_cards(user_id)',
            'CREATE INDEX idx_srs_next_review    ON srs_cards(next_review_at)',
        ];
        for (const sql of indexes) {
            try { await db.query(sql) } catch (_) { /* 이미 있으면 skip */ }
        }
        console.log("✓ 인덱스 준비 완료");

    } catch (error) {
        console.error("DB 초기화 실패:", error);
        process.exit(1);
    }
}

initDB();

// ── Phase 3 마이그레이션 (서버 재시작 시 자동 적용) ─────────────────────────
async function phase3Migration() {
    try {
        // bookmarks 테이블
        await db.query(`
            CREATE TABLE IF NOT EXISTS bookmarks (
                user_id INT NOT NULL,
                note_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, note_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
            )
        `);

        console.log('✓ bookmarks 테이블 준비 완료');
    } catch (err) {
        console.error('Phase 3 마이그레이션 실패:', err);
    }
}

// 🔥 핵심 수정 부분
async function bootstrap() {
    await initDB();
    await phase3Migration();
}

bootstrap();