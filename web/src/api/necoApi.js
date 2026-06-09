// 백엔드 서버와 통신하는 API
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// localStorage에서 로그인 토큰 가져오기
function getToken() {
  return localStorage.getItem('token')
}

// 인증 헤더
function getAuthHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// ── 내 코드 노트 (VSCode에서 저장한 것) ─────────────────────────────────────
export async function fetchMyNotes() {
  try {
    const res = await fetch(`${BASE}/code-notes`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('서버 응답 오류')
    return await res.json()
  } catch (error) {
    console.error('[NECO] 내 노트 조회 실패:', error)
    return []
  }
}

// ── 공개 코드 노트 (PublicNoteListPage용) ────────────────────────────────────
export async function fetchPublicNotes() {
  try {
    const res = await fetch(`${BASE}/code-notes/public`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('서버 응답 오류')
    return await res.json()
  } catch (error) {
    console.error('[NECO] 공개 노트 조회 실패:', error)
    return []
  }
}

// ── 코드 노트 상세 ────────────────────────────────────────────────────────────
export async function fetchNoteById(id) {
  try {
    const res = await fetch(`${BASE}/code-notes/${id}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('서버 응답 오류')
    return await res.json()
  } catch (error) {
    console.error('[NECO] 노트 상세 조회 실패:', error)
    return null
  }
}

// ── 공개 코드 노트 좋아요 토글 ───────────────────────────────────────────────
export async function toggleCodeNoteLike(id) {
  const res = await fetch(`${BASE}/code-notes/${id}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('좋아요 실패')
  return await res.json()   // { liked, likeCount }
}

// ── WebSocket: 확장에서 저장 시 실시간 수신 ──────────────────────────────────
let ws = null
let wsListeners = []

function getWs() {
  if (ws && ws.readyState === WebSocket.OPEN) return ws

  ws = new WebSocket('ws://localhost:3939')

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'newNote') {
        wsListeners.forEach((cb) => cb(msg.data))
      }
    } catch {}
  }

  ws.onclose = () => {
    ws = null
  }

  ws.onerror = () => {
    ws = null
  }

  return ws
}

export function subscribeToNotes(callback) {
  wsListeners.push(callback)
  getWs()

  return () => {
    wsListeners = wsListeners.filter((cb) => cb !== callback)
    if (wsListeners.length === 0 && ws) {
      ws.close()
      ws = null
    }
  }
}
