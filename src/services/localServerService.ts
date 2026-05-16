// web/ 브라우저 앱에 데이터를 제공하는 로컬 서버
// Express: REST API (노트 목록 조회)
// WebSocket: 새 노트 저장 시 실시간 알림

import * as http from 'http';
import { loadNotes, getPublicNotes } from './noteStorageService';

let server: http.Server | null = null;
// ws는 동적으로 require (VSCode 확장 환경 대응)
let wss: any = null;
const clients = new Set<any>();

export function startLocalServer() {
  if (server) return; // 이미 실행 중이면 스킵

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WebSocketServer } = require('ws');

  const app = express();
  app.use(express.json());

  // CORS 허용 (web/ 개발 서버에서 접근 가능하게)
  app.use((_req: any, res: any, next: any) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // GET /api/notes - 내 전체 노트
  app.get('/api/notes', (_req: any, res: any) => {
    res.json(loadNotes());
  });

  // GET /api/notes/public - 공개 노트 (문제 풀기용)
  app.get('/api/notes/public', (_req: any, res: any) => {
    res.json(getPublicNotes());
  });

  server = http.createServer(app);

  // WebSocket 서버 (같은 포트)
  wss = new WebSocketServer({ server });
  wss.on('connection', (ws: any) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    console.log('[NECO Server] 웹 앱 연결됨');
  });

  server!.listen(3939, () => {
    console.log('[NECO Server] http://localhost:3939 에서 실행 중');
  });
}

export function stopLocalServer() {
  clients.clear();
  wss?.close();
  server?.close();
  server = null;
  wss = null;
}

// 새 노트 저장됐을 때 web/에 실시간 알림
export function broadcastNewNote(note: any) {
  const msg = JSON.stringify({ type: 'newNote', data: note });
  clients.forEach(ws => {
    try { ws.send(msg); } catch { /* 끊긴 클라이언트 무시 */ }
  });
}