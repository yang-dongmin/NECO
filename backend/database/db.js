const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host:     process.env.DB_HOST     || "localhost",
    port:     process.env.DB_PORT     || 3306,        // ← 추가
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME     || "neco",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false },               // ← 추가 (Railway 필수)
});

module.exports = pool;