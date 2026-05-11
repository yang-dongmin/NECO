import axios from 'axios'
import { useAuthStore } from '../store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
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
export const login    = (body) => api.post('/auth/login', body)
export const register = (body) => api.post('/auth/register', body)

// ── Notes ─────────────────────────────────────
export const getNotes   = (params) => api.get('/notes', { params })
export const getNote    = (id)     => api.get(`/notes/${id}`)
export const createNote = (body)   => api.post('/notes', body)
export const reviewNote = (id)     => api.patch(`/notes/${id}/review`)
export const deleteNote = (id)     => api.delete(`/notes/${id}`)

// ── Stats / Tags ───────────────────────────────
export const getStats = () => api.get('/stats')
export const getTags  = () => api.get('/tags')
