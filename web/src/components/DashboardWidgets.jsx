import { useNavigate } from 'react-router-dom'
import { masteryLevel } from '../lib/sm2'
import { SUBJECTS } from '../api/mock'

// ── SVG 링 차트 ───────────────────────────────────────────────────────────────
function RingChart({ pct, size = 110, stroke = 10, color = '#2563eb', label, sub }) {
  const r   = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* 트랙 */}
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {/* 진행 */}
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        {/* 중앙 텍스트 */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{pct}%</span>
          {label && <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{label}</span>}
        </div>
      </div>
      {sub && <span style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>{sub}</span>}
    </div>
  )
}

// ── 오늘의 학습 목표 위젯 ─────────────────────────────────────────────────────
export function GoalWidget({ srsSummary, enriched }) {
  const total    = srsSummary.total   || 1
  const learned  = srsSummary.learned || 0
  const due      = srsSummary.due     || 0
  const reviewed = enriched.filter(n => n.srs.repetitions > 0 && !n.srs.due).length

  const learnedPct  = Math.round((learned  / total) * 100)
  const reviewedPct = due > 0 ? Math.round(((due - enriched.filter(n => n.srs.due).length) / due) * 100) : 100
  const overallPct  = Math.round(((learned + reviewed) / (total * 2)) * 100)

  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14,
      padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 20 }}>오늘의 학습 목표</div>

      {/* 메인 링 + 서브 링 2개 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 12, marginBottom: 20 }}>
        <RingChart pct={overallPct}  size={120} stroke={11} color="#2563eb" label="전체"   sub="종합 달성률" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <RingChart pct={learnedPct}  size={84}  stroke={8}  color="#10b981" label="학습"   sub="학습 완료" />
          <RingChart pct={reviewedPct} size={84}  stroke={8}  color="#f59e0b" label="복습"   sub="오늘 복습" />
        </div>
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: '전체 학습 완료', value: `${learned} / ${total}문제`, color: '#10b981' },
          { label: '오늘 복습 대기', value: `${due}문제 남음`,           color: '#f59e0b' },
          { label: '장기 기억(21일+)', value: `${srsSummary.mature}문제`, color: '#2563eb' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 12, color: '#475569' }}>{label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 취약점 카드 ───────────────────────────────────────────────────────────────
export function WeakConceptCard({ enriched }) {
  // EF 낮은 순으로 정렬, 복습 경험 있는 것만
  const weak = [...enriched]
    .filter(n => n.srs.repetitions > 0)
    .sort((a, b) => a.srs.ef - b.srs.ef)
    .slice(0, 4)

  if (weak.length === 0) return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14,
      padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 180, gap: 10,
    }}>
      <div style={{ fontSize: 28 }}>🎉</div>
      <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
        아직 복습 데이터가 없습니다.<br />문제를 풀면 취약점이 분석돼요!
      </div>
    </div>
  )

  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14,
      padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 16 }}>⚠️</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>취약 개념 Top {weak.length}</span>
        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>EF 기준</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {weak.map((n, i) => {
          const m       = masteryLevel(n.srs.ef)
          const subject = SUBJECTS.find(s => s.id === n.subject)
          const rankColors = ['#ef4444', '#f97316', '#f59e0b', '#eab308']

          return (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 9,
              background: i === 0 ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${i === 0 ? '#fecaca' : '#f1f5f9'}`,
            }}>
              {/* 순위 */}
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: rankColors[i], color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>
                {i + 1}
              </div>

              {/* 내용 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                  {n.wrongCode.split('\n')[0].slice(0, 36)}…
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {subject && (
                    <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: `${subject.color}14`, color: subject.color, fontWeight: 600 }}>
                      {subject.short}
                    </span>
                  )}
                  {n.tags.slice(0, 1).map(t => (
                    <span key={t.id} style={{ fontSize: 10, color: '#64748b' }}>#{t.name}</span>
                  ))}
                </div>
              </div>

              {/* EF 숙련도 */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>숙련도</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 40, height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: m.color }}>{m.label}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #dbeafe' }}>
        <div style={{ fontSize: 11, color: '#2563eb', lineHeight: 1.6 }}>
          💡 <strong>학습 팁:</strong> 취약 개념은 복습 세션에서 우선 출제됩니다. 오답 후 해설을 꼼꼼히 읽으면 EF가 빠르게 올라가요!
        </div>
      </div>
    </div>
  )
}

// ── 오늘의 추천 문제 (Daily Pick) ─────────────────────────────────────────────
export function DailyPickWidget({ allNotes, enriched }) {
  const navigate = useNavigate()

  // 날짜 seed 기반 일관된 랜덤 선택
  const seed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''))
  const unlearned = enriched.filter(n => n.srs.repetitions === 0)
  const weak      = enriched.filter(n => n.srs.repetitions > 0 && n.srs.ef < 2.0)
  const pool      = [...weak, ...unlearned]

  const picks = pool.length > 0
    ? [...pool].sort((a, b) => (a.id * seed % 100) - (b.id * seed % 100)).slice(0, 3)
    : [...allNotes].sort((a, b) => (a.id * seed % 100) - (b.id * seed % 100)).slice(0, 3)

  const today = new Date().toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'short' })

  return (
    <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:14, padding:'20px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>오늘의 추천 문제</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{today}</div>
        </div>
        <span style={{ fontSize:18 }}>🎯</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {picks.map((note, i) => {
          const subj = SUBJECTS.find(s => s.id === note.subject)
          const isWeak = note.srs.repetitions > 0 && note.srs.ef < 2.0
          return (
            <div key={note.id} onClick={() => navigate(`/notes/${note.id}`)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:9, cursor:'pointer', border:'1px solid #f1f5f9', background:'#f8fafc', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.borderColor='#dbeafe' }}
              onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#f1f5f9' }}
            >
              <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                {i + 1}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:'#1e293b', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {note.wrongCode.split('\n')[0].slice(0, 42)}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                  {subj && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:99, background:`${subj.color}14`, color:subj.color, fontWeight:600 }}>{subj.short}</span>}
                  {isWeak && <span style={{ fontSize:10, color:'#ef4444' }}>⚠ 취약</span>}
                  {note.srs.repetitions === 0 && <span style={{ fontSize:10, color:'#94a3b8' }}>미복습</span>}
                </div>
              </div>
              <span style={{ fontSize:18 }}>→</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
