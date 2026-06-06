import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }
const COLORS = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', bar: '#10b981' },
  error:   { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', bar: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', bar: '#f59e0b' },
  info:    { bg: '#eff6ff', border: '#dbeafe', color: '#2563eb', bar: '#3b82f6' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type]
          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: c.bg, border: `1px solid ${c.border}`,
                borderRadius: 10, padding: '11px 16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                minWidth: 260, maxWidth: 360,
                pointerEvents: 'all', cursor: 'pointer',
                animation: 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* 왼쪽 컬러 바 */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c.bar, borderRadius: '10px 0 0 10px' }} />
              {/* 아이콘 */}
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: c.bar, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 4,
              }}>
                {ICONS[t.type]}
              </div>
              {/* 메시지 */}
              <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
                {t.message}
              </span>
              {/* 닫기 */}
              <span style={{ fontSize: 14, color: '#94a3b8', flexShrink: 0, marginLeft: 4 }}>×</span>

              {/* 진행 바 */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, height: 2,
                background: c.bar, borderRadius: '0 0 10px 10px', opacity: 0.4,
                animation: `toastProgress ${t.duration}ms linear forwards`,
              }} />
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
