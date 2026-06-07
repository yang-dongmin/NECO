"use strict";
// web/ 브라우저 앱에 데이터를 제공하는 로컬 서버
// Express: REST API (노트 목록 조회)
// WebSocket: 새 노트 저장 시 실시간 알림
// 로그인 상태 전달
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthHandler = setAuthHandler;
exports.startLocalServer = startLocalServer;
exports.stopLocalServer = stopLocalServer;
exports.broadcastNewNote = broadcastNewNote;
const http = __importStar(require("http"));
const noteStorageService_1 = require("./noteStorageService");
let server = null;
// ws는 동적으로 require
let wss = null;
const clients = new Set();
let authHandler = null;
function setAuthHandler(handler) {
    authHandler = handler;
}
function startLocalServer() {
    if (server)
        return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const express = require('express');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { WebSocketServer } = require('ws');
    const app = express();
    app.use(express.json());
    app.use((_req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        if (_req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        next();
    });
    // 로그인 전달
    app.post('/api/auth/vscode-login', async (req, res) => {
        try {
            const { token, nickname } = req.body;
            if (!token) {
                return res.status(400).json({
                    message: '토큰 없음'
                });
            }
            if (!authHandler) {
                return res.status(500).json({
                    message: '로그인 핸들러 없음'
                });
            }
            await authHandler(token, nickname ?? '사용자');
            res.json({
                success: true
            });
        }
        catch (error) {
            console.error('[NECO] 로그인 실패', error);
            res.status(500).json({
                success: false
            });
        }
    });
    // VSCode 연결 상태 확인
    app.get('/api/status', (_req, res) => {
        res.json({ connected: true });
    });
    // 전체 노트
    app.get('/api/notes', (_req, res) => {
        res.json((0, noteStorageService_1.loadNotes)());
    });
    // 공개 노트
    app.get('/api/notes/public', (_req, res) => {
        res.json((0, noteStorageService_1.getPublicNotes)());
    });
    server = http.createServer(app);
    wss = new WebSocketServer({
        server
    });
    wss.on('connection', (ws) => {
        clients.add(ws);
        ws.on('close', () => clients.delete(ws));
        console.log('[NECO Server] 웹 연결됨');
    });
    server.listen(3939, () => {
        console.log('[NECO Server] http://localhost:3939 실행');
    });
}
function stopLocalServer() {
    clients.clear();
    wss?.close();
    server?.close();
    server = null;
    wss = null;
}
// 실시간 노트 전송
function broadcastNewNote(note) {
    const msg = JSON.stringify({
        type: 'newNote',
        data: note
    });
    clients.forEach(ws => {
        try {
            ws.send(msg);
        }
        catch {
            //
        }
    });
}
//# sourceMappingURL=localServerService.js.map