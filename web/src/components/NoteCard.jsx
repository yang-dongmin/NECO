import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, Circle } from 'lucide-react'
import { SubjectBadge, RoundBadge, TagBadge } from './ui'
import { useSrsStore } from '../store/srsStore'
import { masteryLevel } from '../lib/sm2'

const MASTERY_COLORS = {
  '완벽': '#10b981',
  '양호': '#2563eb',
  '보통': '#f59e0b',
  '취약': '#ef4444',
  default: '#e2e8f0',
}

export default function NoteCard({ note }) {
  const navigate  = useNavigate()
  const { getCard } = useSrsStore()
  const card      = getCard(note.id)
  const mastery   = card.repetitions > 0 ? masteryLevel(card.ef) : null
  const barColor  = mastery ? MASTERY_COLORS[mastery.label] : MASTERY_COLORS.default
  const preview   = note.wrongCode.split('\n').slice(0, 3).join('\n')

  return (
    <div
      onClick={() => navigate(`/notes/${note.id}`)}
      className="card-hover"
      style={{
        background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12,
        overflow: 'hidden', cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
      }}
    >
      {/* ★ 숙련도 컬러 인디케이터 바 */}
      <div style={{
        width: 4, flexShrink: 0,
        background: barColor,
        borderRadius: '12px 0 0 12px',
        transition: 'background 0.3s',
      }} />

      {/* 카드 본문 */}
      <div style={{ flex: 1, padding: '16px 18px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <SubjectBadge subjectId={note.subject} size="sm" />
          <RoundBadge year={note.year} round={note.round} />
          {/* 숙련도 텍스트 배지 */}
          {mastery && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
              background: `${barColor}14`, color: barColor, border: `1px solid ${barColor}30`,
              marginLeft: 'auto',
            }}>
              {mastery.label}
            </span>
          )}
          {!mastery && (
            <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>미복습</span>
          )}
        </div>

        {/* 태그 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {note.tags.slice(0, 3).map(t => <TagBadge key={t.id} name={t.name} />)}
        </div>

        {/* 문제 미리보기 */}
        <div style={{
          background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8,
          padding: '10px 12px', marginBottom: 12,
          fontSize: 12.5, color: '#334155', lineHeight: 1.7,
          fontFamily: note.language !== 'theory' ? 'JetBrains Mono, monospace' : 'inherit',
          overflow: 'hidden', maxHeight: 68,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        }}>
          {preview}
        </div>

        {/* 숙련도 미니 바 */}
        {mastery && (
          <div style={{ marginBottom: 10 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {card.repetitions > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10b981' }}>
              <CheckCircle size={12} strokeWidth={2.5} /> 복습 {card.repetitions}회
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
              <Circle size={12} strokeWidth={2} /> 미복습
            </div>
          )}
          {card.repetitions > 0 && (
            <span style={{ fontSize: 10, color: '#94a3b8' }}>
              EF {card.ef.toFixed(1)} · {card.interval}일 간격
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
            <Clock size={11} />
            {new Date(note.createdAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>
    </div>
  )
}
