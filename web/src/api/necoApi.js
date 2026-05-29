// 백엔드 서버와 통신하는 API
const BASE = 'http://localhost:5001/api'

// localStorage에서 로그인 토큰 가져오기
function getToken() {
  return localStorage.getItem('token')
}

// 인증 헤더 만들기
function getAuthHeaders() {
  const token = getToken()

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// 내 전체 노트 가져오기
export async function fetchMyNotes() {
  try {
    const res = await fetch(`${BASE}/notes`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      throw new Error('서버 응답 오류')
    }

    return await res.json()
  } catch (error) {
    console.error('[NECO] 내 노트 조회 실패:', error)
    return []
  }
}

// 공개 노트 가져오기
// 아직 백엔드에 /notes/public이 없다면 나중에 추가할 예정
export async function fetchPublicNotes() {
  try {
    const res = await fetch(`${BASE}/notes/public`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      throw new Error('서버 응답 오류')
    }

    return await res.json()
  } catch (error) {
    console.error('[NECO] 공개 노트 조회 실패:', error)
    return []
  }
}

export async function fetchNoteById(id) {
  try {
    const res = await fetch(`${BASE}/notes/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!res.ok) {
      throw new Error('서버 응답 오류')
    }

    return await res.json()
  } catch (error) {
    console.error('[NECO] 노트 상세 조회 실패:', error)
    return null
  }
}

// 지금은 DB 서버 기준으로 갈 거라 WebSocket은 일단 사용하지 않음
export function subscribeToNotes() {
  return () => {}
}