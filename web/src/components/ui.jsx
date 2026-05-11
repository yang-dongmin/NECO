import { SUBJECTS } from '../api/mock'

// ── 과목 배지 ─────────────────────────────────────────────────────────────────
export function SubjectBadge({ subjectId, size = 'md' }) {
  const s = SUBJECTS.find(s => s.id === subjectId)
  if (!s) return null
  const pad = size === 'sm' ? '1px 8px' : '3px 10px'
  const fs  = size === 'sm' ? 10 : 11
  return (
    <span style={{
      display: 'inline-block', fontSize: fs, fontWeight: 600, padding: pad,
      borderRadius: 99, background: `${s.color}14`, color: s.color,
      border: `1px solid ${s.color}30`, whiteSpace: 'nowrap',
    }}>
      {size === 'sm' ? s.short : s.name}
    </span>
  )
}

// ── 태그 배지 ─────────────────────────────────────────────────────────────────
export function TagBadge({ name, active, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-block', fontSize: 11, fontWeight: 500,
        padding: '2px 10px', borderRadius: 99, whiteSpace: 'nowrap',
        cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s',
        background: active ? '#2563eb' : '#f1f5f9',
        color: active ? '#fff' : '#475569',
        border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`,
      }}
    >
      {name}
    </span>
  )
}

// ── 회차/연도 배지 ────────────────────────────────────────────────────────────
export function RoundBadge({ year, round }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
      background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {year}년 {round}회
    </span>
  )
}

// ── 패널 카드 ─────────────────────────────────────────────────────────────────
export function Panel({ title, children, action, style }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9',
      borderRadius: 12, padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{title}</span>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// ── 통계 카드 ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, color = '#2563eb', bg = '#eff6ff' }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12,
      padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      {icon && (
        <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── 빈 상태 ───────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', message = '데이터가 없습니다.', action }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', color: '#94a3b8' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: action ? 20 : 0 }}>{message}</div>
      {action}
    </div>
  )
}

// ── 로딩 스피너 ───────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 28, height: 28, border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── 언어 배지 (하위호환) ──────────────────────────────────────────────────────
export function LangBadge({ lang }) {
  const map = { theory: '이론', sql: 'SQL', c: 'C언어', python: 'Python', javascript: 'JS' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
      background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {map[lang] ?? lang}
    </span>
  )
}
