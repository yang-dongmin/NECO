// VSCode 확장의 로컬 서버(3939)와 통신하는 API

const BASE = 'http://localhost:3939/api';

// 내 전체 노트 가져오기
export async function fetchMyNotes() {
  try {
    const res = await fetch(`${BASE}/notes`);
    if (!res.ok) throw new Error('서버 응답 오류');
    return await res.json();
  } catch {
    console.warn('[NECO] 로컬 서버에 연결할 수 없어요. VSCode를 열어주세요.');
    return [];
  }
}

// 공개 노트(문제) 가져오기
export async function fetchPublicNotes() {
  try {
    const res = await fetch(`${BASE}/notes/public`);
    if (!res.ok) throw new Error('서버 응답 오류');
    return await res.json();
  } catch {
    console.warn('[NECO] 로컬 서버에 연결할 수 없어요.');
    return [];
  }
}

// 실시간 업데이트 (WebSocket)
// onNewNote: 새 노트 저장됐을 때 콜백
export function subscribeToNotes(onNewNote) {
  try {
    const ws = new WebSocket('ws://localhost:3939');
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      if (type === 'newNote') onNewNote(data);
    };
    ws.onerror = () => {
      console.warn('[NECO] WebSocket 연결 실패. VSCode를 열어주세요.');
    };
    return () => ws.close(); // cleanup 함수 반환
  } catch {
    return () => {};
  }
}