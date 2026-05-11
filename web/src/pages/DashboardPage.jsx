import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Play } from 'lucide-react'
import { useNoteStore } from '../store'
import { useSrsStore } from '../store/srsStore'
import { getAllNotes, MOCK_STATS, MOCK_TAGS, SUBJECTS } from '../api/mock'
import { masteryLevel } from '../lib/sm2'
import { Panel } from '../components/ui'
import { GoalWidget, WeakConceptCard, DailyPickWidget } from '../components/DashboardWidgets'
import { PageSkeleton } from '../components/Skeleton'

export default function DashboardPage() {
  const { setStats, setTags, setNotes } = useNoteStore()
  const { getSummary, getEnrichedCards } = useSrsStore()
  const navigate = useNavigate()

  useEffect(() => {
    const all = getAllNotes()
    setStats(MOCK_STATS)
    setTags(MOCK_TAGS)
    setNotes(all, { total: all.length })
  }, [])

  const [loading, setLoading] = useState(true)
  const allNotes   = getAllNotes()
  const srsSummary = getSummary(allNotes)
  const enriched   = getEnrichedCards(allNotes)
  const dueCards   = enriched.filter(n => n.srs.due).slice(0, 3)

  useEffect(() => { setLoading(false) }, [allNotes])

  if (loading) return <PageSkeleton />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* D-day 배너 */}
      {MOCK_STATS.dday > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
          borderRadius: 14, padding: '20px 28px',
          display: 'flex', alignItems: 'center', gap: 20, color: '#fff',
          boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>정보처리기사 시험까지</div>
            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, fontFamily: 'JetBrains Mono, monospace' }}>
              D-{MOCK_STATS.dday}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              오늘도 {srsSummary.due}문제 복습이 기다리고 있어요 💪
            </div>
          </div>
          <button
            onClick={() => navigate('/review')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              transition: 'background 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <Play size={14} fill="#fff" /> 복습 시작
          </button>
        </div>
      )}

      {/* 통계 카드 4개 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { icon: '📚', label: '전체 문제',      value: MOCK_STATS.totalNotes,    sub: '+6 이번 주',              color: '#2563eb', bg: '#eff6ff' },
          { icon: '✅', label: '총 복습 횟수',   value: MOCK_STATS.totalReview,   sub: '꾸준히 하고 있어요',      color: '#10b981', bg: '#ecfdf5' },
          { icon: '🔥', label: '오늘 복습 대상', value: srsSummary.due,           sub: `전체 ${srsSummary.total}문제`, color: '#f59e0b', bg: '#fffbeb' },
          { icon: '⚡', label: '연속 학습',      value: `${MOCK_STATS.streak}일`, sub: '최고 기록: 14일',         color: '#7c3aed', bg: '#f5f3ff' },
        ].map(({ icon, label, value, sub, color, bg }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12,
            padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ★ 링 차트 + 취약점 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <GoalWidget srsSummary={srsSummary} enriched={enriched} />
        <WeakConceptCard enriched={enriched} />
      </div>

      {/* ★ 오늘의 추천 문제 */}
      <DailyPickWidget allNotes={allNotes} enriched={enriched} />

      {/* 복습 대기 + 과목별 진도 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <Panel title="오늘 복습할 문제" action={
          <button onClick={() => navigate('/srs')} style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
            전체 보기 <ChevronRight size={13} />
          </button>
        }>
          {dueCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 13 }}>오늘 복습 완료!</div>
            </div>
          ) : (
            <>
              {dueCards.map(n => {
                const m = masteryLevel(n.srs.ef)
                return (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.wrongCode.split('\n')[0]}
                    </span>
                    <span style={{ fontSize: 10, color: m.color, fontWeight: 600 }}>{m.label}</span>
                  </div>
                )
              })}
              {srsSummary.due > 3 && (
                <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', paddingTop: 10 }}>+{srsSummary.due - 3}개 더...</div>
              )}
              <button onClick={() => navigate('/review')} style={{
                width: '100%', marginTop: 14, padding: '10px 0', borderRadius: 8,
                background: '#2563eb', border: 'none', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Play size={13} fill="#fff" /> 복습 시작하기
              </button>
            </>
          )}
        </Panel>

        <Panel title="과목별 문제 현황">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SUBJECTS.map(s => {
              const count = allNotes.filter(n => n.subject === s.id).length
              const pct   = allNotes.length > 0 ? Math.round((count / allNotes.length) * 100) : 0
              return (
                <div key={s.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: '#334155', fontWeight: 500 }}>{s.name}</span>
                    <span style={{ color: '#64748b' }}>{count}문제</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 99 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      {/* 숙련도 분포 */}
      <Panel title="카드 숙련도 분포">
        <MasteryDistribution enriched={enriched} />
      </Panel>

      {/* 최근 추가 문제 */}
      <Panel title="최근 추가 문제" action={
        <button onClick={() => navigate('/notes')} style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
          전체 보기 <ChevronRight size={13} />
        </button>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {allNotes.slice(0, 5).map(note => {
            const s = SUBJECTS.find(s => s.id === note.subject)
            return (
              <div key={note.id} onClick={() => navigate(`/notes/${note.id}`)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px',
                borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s?.color ?? '#94a3b8', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.wrongCode.split('\n')[0]}
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                  {new Date(note.createdAt).toLocaleDateString('ko-KR')}
                </span>
                <ChevronRight size={13} color="#cbd5e1" />
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

function MasteryDistribution({ enriched }) {
  const buckets = { '완벽': 0, '양호': 0, '보통': 0, '취약': 0, '미시작': 0 }
  const colors  = { '완벽':'#10b981', '양호':'#2563eb', '보통':'#f59e0b', '취약':'#ef4444', '미시작':'#e2e8f0' }
  enriched.forEach(n => {
    if (n.srs.repetitions === 0) { buckets['미시작']++; return }
    buckets[masteryLevel(n.srs.ef).label]++
  })
  const total = enriched.length
  return (
    <div>
      <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', marginBottom: 16, gap: 2 }}>
        {Object.entries(buckets).map(([label, count]) =>
          count > 0 ? <div key={label} style={{ flex: count, background: colors[label] }} /> : null
        )}
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {Object.entries(buckets).map(([label, count]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[label] }} />
            <span style={{ fontSize: 12, color: '#475569' }}>{label}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {count} ({total > 0 ? Math.round(count/total*100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
