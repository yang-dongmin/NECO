const db = require("./db");

async function initDB() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nickname VARCHAR(100) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS code_notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                code LONGTEXT NOT NULL,
                comment LONGTEXT NOT NULL,
                parsed_code JSON NULL,
                is_public BOOLEAN DEFAULT FALSE,
                language_id VARCHAR(100),
                file_name VARCHAR(255),
                quiz JSON NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE
            )
        `);

        console.log("MySQL code_notes 테이블 생성 완료");

        console.log("MySQL users 테이블 생성 완료");
    } catch (error) {
        console.error("users 테이블 생성 실패:", error);
    }
}

initDB();