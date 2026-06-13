import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, BookOpen, RotateCcw, CheckCircle2,
  CalendarClock, Code2, AlertCircle, Play
} from 'lucide-react'
import { fetchDueCodeNotes, reviewCodeNoteQuiz, getNotes } from '../api/client'
import { useSrsStore } from '../store/srsStore'
import { LANG_MAP, LANG_COLOR } from '../components/CodeNoteCard'
import QuizModal from '../components/QuizModal'

// ── 통계 카드 ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, bg, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12,
      padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  )
}

// ── 코드노트 복습 카드 ─────────────────────────────────────────────────────
function DueCodeNoteCard({ note, onQuizDone }) {
  const [quizOpen, setQuizOpen] = useState(false)
  const [done,     setDone]     = useState(false)

  const lang      = note.languageId || ''
  const langLabel = LANG_MAP[lang] ?? lang
  const langStyle = LANG_COLOR[lang] ?? { bg: '#f1f5f9', color: '#475569' }

  const quiz = (() => {
    try { return typeof note.quiz === 'string' ? JSON.parse(note.quiz) : note.quiz }
    catch { return null }
  })()

  const isNew = !note.lastReviewedAt

  const handleReviewed = (noteId, srsData) => {
    setDone(true)
    onQuizDone?.(noteId, srsData)
  }

  return (
    <div style={{
      background: done ? '#f0fdf4' : '#fff',
      border: `1px solid ${done ? '#bbf7d0' : '#f1f5f9'}`,
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
      opacity: done ? 0.7 : 1,
      transition: 'all 0.2s',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {langLabel && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: langStyle.bg, color: langStyle.color,
            border: `1px solid ${langStyle.color}30`,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {langLabel}
          </span>
        )}
        {note.fileName && (
          <span style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'JetBrains Mono, monospace' }}>
            <Code2 size={10} />
            {note.fileName.split(/[\\/]/).pop()}
          </span>
        )}
        {isNew && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#fdf4ff', color: '#a21caf', border: '1px solid #e9d5ff' }}>
            NEW
          </span>
        )}
        {done && (
          <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
            <CheckCircle2 size={13} /> 완료
          </span>
        )}
      </div>

      {/* 주석 미리보기 */}
      {note.comment && (
        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {note.comment}
        </div>
      )}

      {/* SRS 정보 */}
      {note.nextReviewAt && !isNew && (
        <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarClock size={10} />
          EF {note.ef?.toFixed(1)} · {note.intervalDays}일 주기 · {note.repetitions}회 복습
        </div>
      )}

      {/* 퀴즈 버튼 */}
      {quiz && !done && (
        <button
          onClick={() => setQuizOpen(true)}
          style={{
            padding: '8px 0', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: '#fff', fontWeight: 600, fontSize: 12,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Zap size={13} fill="#fff" /> 퀴즈 풀기
        </button>
      )}
      {!quiz && (
        <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: '4px 0' }}>퀴즈 없음</div>
      )}

      {quizOpen && quiz && (
        <QuizModal
          quiz={quiz}
          noteId={note.id}
          onClose={() => setQuizOpen(false)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  )
}

// ── 정처기 복습 행 ──────────────────────────────────────────────────────────
function DueNoteRow({ note, navigate }) {
  const dueLabel = (() => {
    if (!note.srs?.nextReviewAt) return '미시작'
    const diff = Math.ceil((new Date(note.srs.nextReviewAt) - new Date()) / 86400000)
    if (diff < 0) return `${Math.abs(diff)}일 연체`
    if (diff === 0) return '오늘'
    return `${diff}일 후`
  })()

  const isOverdue = dueLabel.includes('연체') || dueLabel === '오늘' || dueLabel === '미시작'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px', borderRadius: 10,
      background: '#fff', border: '1px solid #f1f5f9',
      cursor: 'pointer', transition: 'all 0.15s',
    }}
      onClick={() => navigate(`/review?subject=${note.subject}`)}
      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#dbeafe' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#f1f5f9' }}
    >
      <BookOpen size={14} color="#64748b" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {note.wrongCode?.slice(0, 60) || '정처기 문제'}
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8' }}>{note.subject} · {note.language}</div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, flexShrink: 0,
        background: isOverdue ? '#fef2f2' : '#f8fafc',
        color:      isOverdue ? '#dc2626' : '#94a3b8',
        border:     `1px solid ${isOverdue ? '#fecaca' : '#e2e8f0'}`,
      }}>
        {dueLabel}
      </span>
      <Play size={13} color="#94a3b8" />
    </div>
  )
}

// ── 메인 페이지 ────────────────────────────────────────────────────────────
export default function ReviewDashboardPage() {
  const navigate = useNavigate()
  const { getEnrichedCards, getSummary } = useSrsStore()

  const [dueCodeNotes,    setDueCodeNotes]    = useState([])
  const [totalSrsCards,   setTotalSrsCards]   = useState(0)
  const [completedToday,  setCompletedToday]  = useState(0)
  const [allNotes,        setAllNotes]        = useState([])
  const [loading,         setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      fetchDueCodeNotes().catch(() => ({ due: [], totalSrsCards: 0 })),
      getNotes({ limit: 200, sort: 'newest' }).catch(() => ({ notes: [] })),
    ]).then(([codeData, noteData]) => {
      setDueCodeNotes(codeData.due ?? [])
      setTotalSrsCards(codeData.totalSrsCards ?? 0)
      setAllNotes(noteData.notes ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const enriched   = getEnrichedCards(allNotes)
  const srsSummary = getSummary(allNotes)
  const dueNotes   = enriched.filter(n => n.srs?.due)

  // 코드노트 퀴즈 완료 콜백
  const handleQuizDone = useCallback(() => {
    setCompletedToday(p => p + 1)
  }, [])

  const totalDue = (dueCodeNotes?.length ?? 0) + srsSummary.due
  const allDone  = totalDue > 0 && completedToday >= (dueCodeNotes?.filter(n => n.quiz).length ?? 0)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 14 }}>
        복습 데이터 불러오는 중...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 헤더 */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, color: '#1e293b' }}>복습 대시보드</h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
          오늘 복습해야 할 카드를 한눈에 확인하세요.
        </p>
      </div>

      {/* 통계 카드 4개 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard
          icon={<AlertCircle size={18} color="#d97706" />}
          label="오늘 복습 대상"
          value={totalDue}
          bg="#fffbeb" color="#d97706"
        />
        <StatCard
          icon={<Code2 size={18} color="#2563eb" />}
          label="코드노트 복습"
          value={dueCodeNotes.length}
          bg="#eff6ff" color="#2563eb"
        />
        <StatCard
          icon={<BookOpen size={18} color="#7c3aed" />}
          label="정처기 복습"
          value={srsSummary.due}
          bg="#f5f3ff" color="#7c3aed"
        />
        <StatCard
          icon={<CheckCircle2 size={18} color="#10b981" />}
          label="오늘 완료"
          value={completedToday}
          bg="#ecfdf5" color="#10b981"
        />
      </div>

      {/* 전부 완료 배너 */}
      {allDone && (
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)',
          border: '1px solid #bbf7d0', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <CheckCircle2 size={22} color="#16a34a" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#15803d' }}>오늘 복습 완료! 🎉</div>
            <div style={{ fontSize: 12, color: '#4ade80' }}>다음 복습은 SRS가 자동으로 예약했어요.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ── 코드노트 복습 ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Code2 size={15} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>코드노트 복습</span>
              {dueCodeNotes.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: '#dbeafe', color: '#2563eb' }}>
                  {dueCodeNotes.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/code-notes')}
              style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              전체 보기 →
            </button>
          </div>

          {dueCodeNotes.length === 0 ? (
            <div style={{
              background: '#f8fafc', border: '1px dashed #e2e8f0',
              borderRadius: 12, padding: '32px 16px', textAlign: 'center',
            }}>
              <Code2 size={24} color="#cbd5e1" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>오늘 복습할 코드노트가 없어요</div>
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>VSCode에서 코드를 저장하고 퀴즈를 풀어보세요</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dueCodeNotes.map(note => (
                <DueCodeNoteCard key={note.id} note={note} onQuizDone={handleQuizDone} />
              ))}
            </div>
          )}
        </div>

        {/* ── 정처기 복습 ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <BookOpen size={15} color="#7c3aed" />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>정처기 복습</span>
              {srsSummary.due > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: '#ede9fe', color: '#7c3aed' }}>
                  {srsSummary.due}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/srs')}
              style={{ fontSize: 11, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              전체 보기 →
            </button>
          </div>

          {dueNotes.length === 0 ? (
            <div style={{
              background: '#f8fafc', border: '1px dashed #e2e8f0',
              borderRadius: 12, padding: '32px 16px', textAlign: 'center',
            }}>
              <RotateCcw size={24} color="#cbd5e1" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>오늘 복습할 정처기 문제가 없어요</div>
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>문제를 추가하고 복습 스케줄을 시작해보세요</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dueNotes.slice(0, 8).map(note => (
                  <DueNoteRow key={note.id} note={note} navigate={navigate} />
                ))}
              </div>
              {dueNotes.length > 0 && (
                <button
                  onClick={() => navigate('/review')}
                  style={{
                    marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 9,
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    border: 'none', color: '#fff', fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Play size={14} fill="#fff" /> 복습 세션 시작 ({srsSummary.due}개)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
