// web/ 브라우저 앱에 데이터를 제공하는 로컬 서버
// Express: REST API (노트 목록 조회)
// WebSocket: 새 노트 저장 시 실시간 알림
// 로그인 상태 전달

import * as http from 'http';
import { loadNotes, getPublicNotes } from './noteStorageService';

let server: http.Server | null = null;

// ws는 동적으로 require
let wss: any = null;

const clients = new Set<any>();

let authHandler:
  | ((token: string, nickname: string) => Promise<void>)
  | null = null;

export function setAuthHandler(
  handler: (token: string, nickname: string) => Promise<void>
) {
  authHandler = handler;
}

export function startLocalServer() {
  if (server) return;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express');

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WebSocketServer } = require('ws');

  const app = express();

  app.use(express.json());

  app.use((_req: any, res: any, next: any) => {
    res.header('Access-Control-Allow-Origin', '*');

    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );

    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS'
    );

    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  });

  // 로그인 전달
  app.post(
    '/api/auth/vscode-login',
    async (req: any, res: any) => {
      try {
        const {
          token,
          nickname
        } = req.body;

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

        await authHandler(
          token,
          nickname ?? '사용자'
        );

        res.json({
          success: true
        });

      } catch (error) {
        console.error(
          '[NECO] 로그인 실패',
          error
        );

        res.status(500).json({
          success: false
        });
      }
    }
  );

  // VSCode 연결 상태 확인
  app.get(
    '/api/status',
    (_req: any, res: any) => {
      res.json({ connected: true });
    }
  );

  // 전체 노트
  app.get(
    '/api/notes',
    (_req: any, res: any) => {
      res.json(loadNotes());
    }
  );

  // 공개 노트
  app.get(
    '/api/notes/public',
    (_req: any, res: any) => {
      res.json(getPublicNotes());
    }
  );

  server = http.createServer(app);

  wss = new WebSocketServer({
    server
  });

  wss.on(
    'connection',
    (ws: any) => {
      clients.add(ws);

      ws.on(
        'close',
        () => clients.delete(ws)
      );

      console.log(
        '[NECO Server] 웹 연결됨'
      );
    }
  );

  server.listen(
    3939,
    () => {
      console.log(
        '[NECO Server] http://localhost:3939 실행'
      );
    }
  );
}

export function stopLocalServer() {
  clients.clear();

  wss?.close();

  server?.close();

  server = null;

  wss = null;
}

// 실시간 노트 전송
export function broadcastNewNote(
  note: any
) {
  const msg = JSON.stringify({
    type: 'newNote',
    data: note
  });

  clients.forEach(
    ws => {
      try {
        ws.send(msg);
      } catch {
        //
      }
    }
  );
}