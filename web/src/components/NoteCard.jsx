import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, Circle, Star } from 'lucide-react'
import { SubjectBadge, RoundBadge, TagBadge } from './ui'
import { useSrsStore } from '../store/srsStore'
import { masteryLevel } from '../lib/sm2'
import { useBookmarkStore } from '../store/bookmarkStore'

const MASTERY_COLORS = {
  '완벽': '#10b981',
  '양호': '#2563eb',
  '보통': '#f59e0b',
  '취약': '#ef4444',
  default: '#e2e8f0',
}

// 언어 → 배지 라벨
const LANG_LABEL = {
  theory: null, sql: 'SQL', c: 'C', python: 'Python',
  javascript: 'JS', java: 'Java', kotlin: 'Kotlin', swift: 'Swift',
}

export default function NoteCard({ note }) {
  const navigate    = useNavigate()
  const { getCard } = useSrsStore()
  const card        = getCard(note.id)
  const mastery     = card.repetitions > 0 ? masteryLevel(card.ef) : null
  const barColor    = mastery ? MASTERY_COLORS[mastery.label] : MASTERY_COLORS.default
  const preview     = (note.wrongCode || note.code || '').split('\n').slice(0, 3).join('\n')
  const langLabel   = LANG_LABEL[note.language] ?? null
  const bookmarked  = useBookmarkStore(s => s.ids.has(Number(note.id)))
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => navigate(`/notes/${note.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? '#bfdbfe' : '#f1f5f9'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hovered
          ? '0 4px 16px rgba(37,99,235,0.10)'
          : '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* 숙련도 컬러 인디케이터 바 */}
      <div style={{
        width: 4, flexShrink: 0,
        background: barColor,
        borderRadius: '12px 0 0 12px',
        transition: 'background 0.3s',
      }} />

      {/* 카드 본문 */}
      <div style={{ flex: 1, padding: '14px 16px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {note.subject && <SubjectBadge subjectId={note.subject} size="sm" />}
          {note.year > 0 && <RoundBadge year={note.year} round={note.round} />}

          {/* 언어 배지 (코드 문제일 때만) */}
          {langLabel && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
              background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {langLabel}
            </span>
          )}

          {/* 우측: 즐겨찾기 + 숙련도 */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {bookmarked && (
              <Star size={12} fill="#d97706" color="#d97706" />
            )}
            {mastery ? (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
                background: `${barColor}14`, color: barColor, border: `1px solid ${barColor}30`,
              }}>
                {mastery.label}
              </span>
            ) : (
              <span style={{ fontSize: 10, color: '#94a3b8' }}>미복습</span>
            )}
          </div>
        </div>

        {/* 태그 */}
        {(note.tags || []).length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {(note.tags || []).slice(0, 3).map((t, i) => (
              <TagBadge key={t.id || t.name || i} name={t.name || t} />
            ))}
            {(note.tags || []).length > 3 && (
              <span style={{ fontSize: 10, color: '#94a3b8', padding: '2px 4px' }}>
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 문제 미리보기 */}
        <div style={{
          background: hovered ? '#f0f7ff' : '#f8fafc',
          border: `1px solid ${hovered ? '#dbeafe' : '#f1f5f9'}`,
          borderRadius: 8,
          padding: '9px 12px',
          marginBottom: 10,
          fontSize: 12,
          color: '#334155',
          lineHeight: 1.7,
          fontFamily: (note.language) !== 'theory' ? 'JetBrains Mono, monospace' : 'inherit',
          overflow: 'hidden',
          maxHeight: hovered ? 120 : 64,
          transition: 'max-height 0.25s ease, background 0.18s',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {preview}
        </div>

        {/* 숙련도 미니 바 */}
        {mastery && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ height: 3, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                width: `${mastery.pct}%`, height: '100%',
                background: barColor, borderRadius: 99,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {card.repetitions > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10b981' }}>
              <CheckCircle size={11} strokeWidth={2.5} />
              복습 {card.repetitions}회
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
              <Circle size={11} strokeWidth={2} />
              미복습
            </div>
          )}
          {card.repetitions > 0 && (
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>
              {card.interval}일 간격
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94a3b8' }}>
            <Clock size={10} />
            {new Date(note.createdAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>
    </div>
  )
}
