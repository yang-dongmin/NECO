import axios from 'axios'
import { useAuthStore } from '../store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout()
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────
export const login          = (body) => api.post('/auth/login', body)
export const register       = (body) => api.post('/auth/register', body)
export const updateProfile  = (body) => api.put('/auth/profile', body)
export const changePassword = (body) => api.put('/auth/password', body)
export const deleteAccount  = (body) => api.delete('/auth/account', { data: body })

// ── Notes (정처기 오답노트) ───────────────────
export const getNotes   = (params) => api.get('/notes', { params })
export const getNote    = (id)     => api.get(`/notes/${id}`)
export const createNote = (body)   => api.post('/notes', body)
export const reviewNote = (id, body) => api.patch(`/notes/${id}/review`, body)
export const deleteNote = (id)     => api.delete(`/notes/${id}`)
export const updateNote = (id, body) => api.patch(`/notes/${id}`, body)

// ── Stats ─────────────────────────────────────
export const getStats = () => api.get('/notes/stats')

// ── Tags ──────────────────────────────────────────────────────
export const getTags = () => api.get('/notes/tags')

// ── Bookmarks ────────────────────────────────────────────────
export const getBookmarks    = ()   => api.get('/notes/bookmarks')
export const addBookmark     = (id) => api.post(`/notes/bookmarks/${id}`)
export const removeBookmark  = (id) => api.delete(`/notes/bookmarks/${id}`)

// ── Code Notes ────────────────────────────────────────────────
export const fetchMyCodeNotes     = ()          => api.get('/code-notes')
export const fetchPublicCodeNotes = ()           => api.get('/code-notes/public')
export const fetchCodeNoteById    = (id)         => api.get(`/code-notes/${id}`)
export const toggleCodeNoteLike   = (id)         => api.post(`/code-notes/${id}/like`)
export const deleteCodeNote       = (id)         => api.delete(`/code-notes/${id}`)
export const updateCodeNote       = (id, body)   => api.patch(`/code-notes/${id}`, body)
export const reviewCodeNoteQuiz   = (id, quality) => api.patch(`/code-notes/${id}/quiz-review`, { quality })
export const fetchCodeNoteSrs     = ()           => api.get('/code-notes/srs')
export const fetchDueCodeNotes    = ()           => api.get('/code-notes/due')

// ── Streak ────────────────────────────────────────────────────
export const fetchStreak = () => api.get('/streak')

// ── Search ────────────────────────────────────────────────────
export const searchAll = (q) => api.get('/search', { params: { q } })
