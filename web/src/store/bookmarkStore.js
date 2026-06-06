/**
 * bookmarkStore
 * - localStorage를 1차 캐시로 사용 (즉시 반응)
 * - DB API를 2차로 동기화 (기기 간 공유)
 * - 로그인 시 loadFromDB()로 DB ↔ 로컬 병합
 */
import { create } from 'zustand'
import { getBookmarks, addBookmark, removeBookmark } from '../api/client'

const BM_KEY = 'ct_bookmarks'

function loadLocal() {
  try { return new Set(JSON.parse(localStorage.getItem(BM_KEY) ?? '[]')) }
  catch { return new Set() }
}
function saveLocal(set) {
  localStorage.setItem(BM_KEY, JSON.stringify([...set]))
}

export const useBookmarkStore = create((set, get) => ({
  ids: loadLocal(),   // Set<number>

  // ── 로그인 시 DB에서 로드 ─────────────────────────────────────────────────
  async loadFromDB() {
    try {
      const data = await getBookmarks()
      const dbIds = new Set((data.bookmarks ?? []).map(Number))
      // DB 기준으로 덮어쓰기 (DB가 truth)
      saveLocal(dbIds)
      set({ ids: dbIds })
    } catch {
      /* 실패하면 localStorage 유지 */
    }
  },

  // ── 북마크 상태 조회 ──────────────────────────────────────────────────────
  isBookmarked(noteId) {
    return get().ids.has(Number(noteId))
  },

  // ── 토글 — localStorage 즉시 반영 + DB 비동기 ────────────────────────────
  async toggle(noteId) {
    const id  = Number(noteId)
    const cur = new Set(get().ids)
    const next = new Set(cur)

    if (cur.has(id)) {
      next.delete(id)
      saveLocal(next)
      set({ ids: next })
      try { await removeBookmark(id) }
      catch { /* 실패 시 롤백 */ saveLocal(cur); set({ ids: cur }) }
      return false
    } else {
      next.add(id)
      saveLocal(next)
      set({ ids: next })
      try { await addBookmark(id) }
      catch { saveLocal(cur); set({ ids: cur }) }
      return true
    }
  },
}))
