import { create } from 'zustand'
import api from '../api/client'

// ── 로컬스토리지에서 user 복원 ────────────────────────────────────────────────
function loadUser() {
  try {
    const raw = localStorage.getItem('neco_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export const useAuthStore = create((set) => ({
  user:  loadUser(),
  token: localStorage.getItem('token') ?? null,

  login: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('neco_user', JSON.stringify(user))
    set({ user, token })

    // ── VSCode 확장에 토큰 전달 (연결돼 있을 때만, 실패해도 무시) ──────────
    fetch('http://localhost:3939/api/auth/vscode-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, nickname: user.name ?? user.nickname }),
    }).catch(() => {})

    // ── 로그인 시: 이전 유저 데이터 클리어 후 DB에서 새로 로드 ──────────────
    import('../store/srsStore').then(({ useSrsStore }) => {
      useSrsStore.getState().resetAll()   // 이전 유저 로컬 데이터 클리어
      api.get('/notes/srs-cards')
        .then(data => {
          const cards = data.cards ?? data ?? []
          useSrsStore.getState().loadFromDB(cards)
        })
        .catch(() => {})
    })
    import('../store/bookmarkStore').then(({ useBookmarkStore }) => {
      useBookmarkStore.getState().clear()  // 이전 유저 로컬 데이터 클리어
      useBookmarkStore.getState().loadFromDB()
    })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('neco_user')
    // ── 로그아웃 시 SRS·북마크 로컬 데이터 초기화 ──────────────────────────
    import('../store/srsStore').then(({ useSrsStore }) => {
      useSrsStore.getState().resetAll()
    })
    import('../store/bookmarkStore').then(({ useBookmarkStore }) => {
      useBookmarkStore.getState().clear()
    })
    set({ user: null, token: null })
  },
}))

export const useNoteStore = create((set) => ({
  notes:      [],
  pagination: { total: 0, page: 1, totalPages: 1 },
  filters:    { tag: '', lang: '', subject: '', q: '', bookmark: '', page: 1 },
  stats:      null,
  tags:       [],

  setNotes: (notes, pagination) => set({ notes, pagination }),
  setStats: (stats) => set({ stats }),
  setTags:  (tags)  => set({ tags }),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value, page: 1 } })),
  setPage: (page) =>
    set((s) => ({ filters: { ...s.filters, page } })),
  clearFilters: () =>
    set({ filters: { tag: '', lang: '', subject: '', q: '', bookmark: '', page: 1 } }),

  addNote: (note) =>
    set((s) => ({
      notes:      [note, ...s.notes],
      pagination: { ...s.pagination, total: s.pagination.total + 1 },
    })),
  deleteNote: (id) =>
    set((s) => ({
      notes:      s.notes.filter((n) => n.id !== id),
      pagination: { ...s.pagination, total: Math.max(0, s.pagination.total - 1) },
    })),
  updateNote: (id, fields) =>
    set((s) => ({
      notes: s.notes.map((n) => n.id === id ? { ...n, ...fields } : n),
    })),
}))
