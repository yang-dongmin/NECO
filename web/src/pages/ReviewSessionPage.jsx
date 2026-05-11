import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, RotateCcw, Play, Clock, CheckCircle2 } from 'lucide-react'
import { getAllNotes } from '../api/mock'
import { useSrsStore } from '../store/srsStore'
import { QUALITY_OPTIONS } from '../lib/sm2'
import { SubjectBadge, RoundBadge, TagBadge } from '../components/ui'
import { useToast } from '../components/Toast'

// ── 전역 flip 애니메이션 스타일 ───────────────────────────────────────────────
const FLIP_STYLE = `
  .flip-scene {
    perspective: 1200px;
    width: 100%;
  }
  .flip-card {
    position: relative;
    width: 100%;
    transform-style: preserve-3d;
    transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .flip-card.flipped {
    transform: rotateY(180deg);
  }
  .flip-front, .flip-back {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    width: 100%;
  }
  .flip-back {
    position: absolute;
    top: 0; left: 0;
    transform: rotateY(180deg);
  }
`

// ── 타이머 훅 ─────────────────────────────────────────────────────────────────
function useTimer(active) {
  const [elapsed, setElapsed] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (active) {
      setElapsed(0)
      ref.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(ref.current)
    }
    return () => clearInterval(ref.current)
  }, [active])

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const isOver = elapsed > 30
  return { elapsed, fmt: fmt(elapsed), isOver, reset: () => setElapsed(0) }
}

// ── 스텝 인디케이터 ───────────────────────────────────────────────────────────
function StepIndicator({ total, current, results, onJump }) {
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: total }, (_, i) => {
        const done   = i < current
        const active = i === current
        const r      = results[i]
        const color  = r ? (r.quality >= 4 ? '#10b981' : r.quality >= 2 ? '#f59e0b' : '#ef4444') : '#2563eb'
        return (
          <div key={i}
            onClick={() => done && onJump && onJump(i)}
            title={done ? `${i+1}번 문제로 이동` : undefined}
            style={{
              width: active ? 24 : 8, height: 8, borderRadius: 99,
              background: active ? '#2563eb' : done ? color : '#e2e8f0',
              transition: 'all 0.3s ease',
              cursor: done ? 'pointer' : 'default',
            }} />
        )
      })}
    </div>
  )
}

// ── 플립 카드 ─────────────────────────────────────────────────────────────────
function FlipCard({ note, revealed, onReveal, timer }) {
  const isMono    = note.language !== 'theory'
  const isOver    = timer.isOver
  const frontRef  = useRef(null)
  const backRef   = useRef(null)
  const [cardHeight, setCardHeight] = useState('auto')

  useEffect(() => {
    if (revealed && backRef.current) {
      setCardHeight(backRef.current.scrollHeight + 'px')
    } else if (!revealed && frontRef.current) {
      setCardHeight(frontRef.current.scrollHeight + 'px')
    }
  }, [revealed, note])

  return (
    <div className="flip-scene" style={{ height: cardHeight, minHeight: 260 }}>
      <div className={`flip-card ${revealed ? 'flipped' : ''}`} style={{ height: '100%' }}>

        {/* 앞면: 문제 */}
        <div className="flip-front" ref={frontRef}>
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          }}>
            {/* 헤더 */}
            <div style={{
              padding: '10px 18px', background: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>문제</span>
              </div>
              {/* 타이머 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                color: isOver ? '#ef4444' : '#64748b',
                padding: '2px 10px', borderRadius: 99,
                background: isOver ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${isOver ? '#fecaca' : '#e2e8f0'}`,
                transition: 'all 0.3s',
              }}>
                <Clock size={11} />
                {timer.fmt}
                {isOver && <span style={{ fontSize: 10 }}>⚠</span>}
              </div>
            </div>

            <pre style={{
              margin: 0, padding: '22px 24px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              fontSize: isMono ? 13 : 14.5,
              fontFamily: isMono ? 'JetBrains Mono, monospace' : 'inherit',
              color: '#1e293b', lineHeight: 1.9, minHeight: 160,
            }}>
              {note.wrongCode}
            </pre>

            {/* 정답 보기 버튼 */}
            <div style={{ padding: '0 24px 20px' }}>
              <button
                onClick={onReveal}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 10,
                  background: '#f8fafc', border: '2px dashed #cbd5e1',
                  color: '#64748b', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#2563eb'
                  e.currentTarget.style.color = '#2563eb'
                  e.currentTarget.style.background = '#eff6ff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.color = '#64748b'
                  e.currentTarget.style.background = '#f8fafc'
                }}
              >
                🔍 정답 보기
                <span style={{ fontSize: 11, opacity: 0.5 }}>(Space)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 뒷면: 정답 + 해설 */}
        <div className="flip-back" ref={backRef}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 정답 */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <div style={{ padding: '10px 18px', background: '#ecfdf5', borderBottom: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>정답</span>
              </div>
              <div style={{ padding: '16px 24px', fontSize: 20, fontWeight: 800, color: '#10b981' }}>
                {note.fixedCode}
              </div>
            </div>
            {/* 해설 */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <div style={{ padding: '10px 18px', background: '#eff6ff', borderBottom: '1px solid #dbeafe', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13 }}>💡</span>
                <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>해설</span>
              </div>
              <div style={{ padding: '18px 24px', fontSize: 13, color: '#334155', lineHeight: 1.9 }}>
                <ReactMarkdown components={{
                  p:      ({ children }) => <p style={{ marginBottom: 10 }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ color: '#1e293b' }}>{children}</strong>,
                  code:   ({ children }) => <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, background: '#f1f5f9', color: '#2563eb', padding: '1px 6px', borderRadius: 4 }}>{children}</code>,
                  table:  ({ children }) => <div style={{ overflowX: 'auto', marginBottom: 10 }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>{children}</table></div>,
                  th:     ({ children }) => <th style={{ background: '#f1f5f9', padding: '6px 12px', border: '1px solid #e2e8f0', fontWeight: 600, textAlign: 'left' }}>{children}</th>,
                  td:     ({ children }) => <td style={{ padding: '6px 12px', border: '1px solid #e2e8f0', color: '#475569' }}>{children}</td>,
                }}>
                  {note.explanation}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 평가 버튼 ─────────────────────────────────────────────────────────────────
function QualityButtons({ onSelect }) {
  const groups = [
    { label: '모름',  items: QUALITY_OPTIONS.slice(0,2), bg:'#fef2f2', border:'#fecaca', color:'#dc2626' },
    { label: '애매',  items: QUALITY_OPTIONS.slice(2,4), bg:'#fffbeb', border:'#fde68a', color:'#d97706' },
    { label: '완벽',  items: QUALITY_OPTIONS.slice(4,6), bg:'#f0fdf4', border:'#bbf7d0', color:'#16a34a' },
  ]
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textAlign: 'center', marginBottom: 14 }}>
        얼마나 잘 기억했나요? 솔직하게 선택하세요
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {groups.map(({ label, items, bg, border, color }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 600, color, textAlign: 'center', marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(({ q, label: ql, desc }) => (
                <button key={q} onClick={() => onSelect(q)} title={desc}
                  style={{
                    padding: '10px 8px', borderRadius: 9, cursor: 'pointer',
                    background: bg, border: `1px solid ${border}`, color,
                    fontWeight: 600, fontSize: 12, transition: 'all 0.15s', textAlign: 'center',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div>{ql}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2, opacity: 0.7 }}>{desc.slice(0,10)}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>
        키보드: Space(정답 보기) · 0~5 숫자키(평가)
      </div>
    </div>
  )
}

// ── 세션 완료 ─────────────────────────────────────────────────────────────────
function SessionComplete({ results, onRestart, onExit }) {
  const perfect = results.filter(r => r.quality >= 4).length
  const okay    = results.filter(r => r.quality >= 2 && r.quality < 4).length
  const failed  = results.filter(r => r.quality < 2).length
  const score   = Math.round((perfect / results.length) * 100)

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>{score>=80?'🎉':score>=50?'👍':'💪'}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>오늘 복습 완료!</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 32 }}>
        {results.length}문제 중 {perfect}문제를 완벽히 기억했어요
      </div>
      {/* 원형 점수 */}
      <div style={{
        width: 110, height: 110, borderRadius: '50%', margin: '0 auto 28px',
        background: `conic-gradient(#10b981 0% ${score}%, #f1f5f9 ${score}% 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
          {score}%
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 28 }}>
        {[
          { label:'완벽', count:perfect, bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
          { label:'보통', count:okay,    bg:'#fffbeb', color:'#d97706', border:'#fde68a' },
          { label:'다시', count:failed,  bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
        ].map(({ label, count, bg, color, border }) => (
          <div key={label} style={{ background: bg, border:`1px solid ${border}`, borderRadius: 10, padding:'14px 0' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color, marginBottom: 2 }}>{count}</div>
            <div style={{ fontSize: 11, color, opacity: 0.75 }}>{label}</div>
          </div>
        ))}
      </div>
      {results.slice(0,3).length > 0 && (
        <div style={{ background:'#eff6ff', border:'1px solid #dbeafe', borderRadius:10, padding:'14px 18px', marginBottom:20, textAlign:'left' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#2563eb', marginBottom:8 }}>다음 복습 일정 (클릭하면 해설 확인)</div>
          {results.slice(0,3).map(r => (
            <div key={r.noteId}
              onClick={() => onExit && window.open(`/notes/${r.noteId}`, '_self')}
              style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#475569', marginBottom:4, cursor:'pointer', padding:'4px 6px', borderRadius:6 }}
              onMouseEnter={e=>e.currentTarget.style.background='#dbeafe'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'75%' }}>{r.noteTitle}</span>
              <span style={{ color:'#2563eb', fontWeight:600, flexShrink:0, marginLeft:8 }}>{r.interval===1?'내일':`${r.interval}일 후`}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:10 }}>
        {failed > 0 && (
          <button onClick={onRestart} style={{ flex:1, padding:'11px 0', borderRadius:9, cursor:'pointer', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:13, fontWeight:600 }}>
            <RotateCcw size={13} style={{ marginRight:6, display:'inline', verticalAlign:'middle' }} />
            틀린 것만 재복습
          </button>
        )}
        <button onClick={onExit} style={{ flex:1, padding:'11px 0', borderRadius:9, cursor:'pointer', background:'#2563eb', border:'none', color:'#fff', fontSize:13, fontWeight:700 }}>
          대시보드로 →
        </button>
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function ReviewSessionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const subjectFilter = searchParams.get("subject")
  const toast    = useToast()
  const { getDueNotes, submitReview } = useSrsStore()

  const [queue,    setQueue]    = useState([])
  const [idx,      setIdx]      = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results,  setResults]  = useState([])
  const [done,     setDone]     = useState(false)

  const timer = useTimer(!revealed && queue.length > 0 && !done)

  useEffect(() => {
    const all = getAllNotes()
    const filtered = subjectFilter ? all.filter(n => n.subject === subjectFilter) : all
    const due = getDueNotes(filtered)
    setQueue(due.length > 0 ? due : filtered)
  }, [subjectFilter])

  const current = queue[idx]

  const handleReveal = useCallback(() => {
    setRevealed(true)
    if (timer.isOver) toast({ message: '30초 초과! 다음엔 더 빠르게 풀어보세요 💪', type: 'warning' })
  }, [timer.isOver, toast])

  const handleQuality = useCallback((quality) => {
    if (!current) return
    const updated = submitReview(current.id, quality)
    const next = [...results, {
      noteId: current.id,
      noteTitle: current.wrongCode.split('\n')[0].slice(0, 40),
      quality, interval: updated.interval,
    }]
    setResults(next)

    // 토스트 피드백
    const msgs = {
      5: { message: '완벽해요! 🎉 다음 복습까지 ' + updated.interval + '일', type: 'success' },
      4: { message: '잘 했어요! 👍',                                           type: 'success' },
      3: { message: '아쉽지만 통과! 조금 더 반복해요',                          type: 'info'    },
      2: { message: '힌트가 필요했군요. 해설을 다시 확인하세요',               type: 'warning' },
    }
    if (msgs[quality]) toast(msgs[quality])
    else toast({ message: '다시 복습하겠습니다. 포기하지 마세요! 💪', type: 'error' })

    if (idx + 1 >= queue.length) { setDone(true) }
    else { setIdx(idx + 1); setRevealed(false); timer.reset() }
  }, [current, idx, queue, results, submitReview, toast])

  // 키보드 단축키
  useEffect(() => {
    const handler = (e) => {
      if (!revealed && e.code === 'Space') { e.preventDefault(); handleReveal(); return }
      if (revealed) {
        const map = { Digit0:0, Digit1:1, Digit2:2, Digit3:3, Digit4:4, Digit5:5 }
        if (e.code in map) handleQuality(map[e.code])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [revealed, handleReveal, handleQuality])

  if (done) return (
    <SessionComplete
      results={results}
      onRestart={() => {
        const failedIds = results.filter(r => r.quality < 2).map(r => r.noteId)
        setQueue(queue.filter(n => failedIds.includes(n.id)))
        setIdx(0); setRevealed(false); setResults([]); setDone(false)
      }}
      onExit={() => navigate('/')}
    />
  )

  if (!current) return (
    <div style={{ textAlign:'center', padding:60 }}>
      <div style={{ fontSize:14, color:'#64748b' }}>복습할 문제가 없습니다.</div>
      <button onClick={() => navigate('/')} style={{ marginTop:16, padding:'9px 20px', borderRadius:8, background:'#2563eb', border:'none', color:'#fff', cursor:'pointer', fontSize:13 }}>
        대시보드로
      </button>
    </div>
  )

  return (
    <>
      <style>{FLIP_STYLE}</style>
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:7, background:'#fff', border:'1px solid #e2e8f0', color:'#64748b', cursor:'pointer', fontSize:12 }}>
            <ArrowLeft size={13} /> 나가기
          </button>
          <div style={{ flex:1 }}>
            {/* 스텝 인디케이터 */}
            <StepIndicator total={queue.length} current={idx} results={results}
              onJump={(i) => { setIdx(i); setRevealed(true) }} />
          </div>
          <span style={{ fontSize:12, color:'#64748b', fontFamily:'JetBrains Mono, monospace', flexShrink:0 }}>
            {idx+1} / {queue.length}
          </span>
        </div>

        {/* 과목 / 태그 정보 */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <SubjectBadge subjectId={current.subject} />
          <RoundBadge year={current.year} round={current.round} />
          {current.tags.map(t => <TagBadge key={t.id} name={t.name} />)}
        </div>

        {/* ★ 플립 카드 */}
        <FlipCard
          note={current}
          revealed={revealed}
          onReveal={handleReveal}
          timer={timer}
        />

        {/* 평가 버튼 (정답 공개 후만) */}
        {revealed && <QualityButtons onSelect={handleQuality} />}
      </div>
    </>
  )
}
