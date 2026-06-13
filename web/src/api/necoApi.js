// VSCode 확장과의 WebSocket 실시간 연결
// REST API 함수는 api/client.js의 코드노트 섹션을 사용하세요

// ── WebSocket: 확장에서 저장 시 실시간 수신 ──────────────────────────────────
let ws = null
let wsListeners = []
let reconnectTimer = null

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
    // 리스너가 있을 때만 재연결 시도
    if (wsListeners.length > 0) {
      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => {
        getWs()
      }, 5000)
    }
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
    if (wsListeners.length === 0) {
      clearTimeout(reconnectTimer)
      if (ws) {
        ws.close()
        ws = null
      }
    }
  }
}
