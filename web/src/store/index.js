import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user:  null,
  token: localStorage.getItem('ct_token') ?? null,
  login:  (user, token) => { localStorage.setItem('ct_token', token); set({ user, token }) },
  logout: ()            => { localStorage.removeItem('ct_token');      set({ user: null, token: null }) },
}))

export const useNoteStore = create((set) => ({
  notes:      [],
  pagination: { total: 0, page: 1, totalPages: 1 },
  // ★ subject, q 추가
  filters:    { tag: '', lang: '', subject: '', q: '', page: 1 },
  stats:      null,
  tags:       [],

  setNotes: (notes, pagination) => set({ notes, pagination }),
  setStats: (stats) => set({ stats }),
  setTags:  (tags)  => set({ tags }),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value, page: 1 } })),
  setPage: (page) =>
    set((s) => ({ filters: { ...s.filters, page } })),

  // ★ subject, q 포함 전체 초기화
  clearFilters: () =>
    set({ filters: { tag: '', lang: '', subject: '', q: '', page: 1 } }),

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
