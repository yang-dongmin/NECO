import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, TrendingUp, Clock, AlertCircle, Star } from 'lucide-react'
import { getAllNotes, SUBJECTS, isBookmarked } from '../api/mock'
import { useSrsStore } from '../store/srsStore'
import { masteryLevel } from '../lib/sm2'
import { SubjectBadge, TagBadge, Panel } from '../components/ui'

function DueBadge({ days }) {
  if (days === -Infinity) return <span style={{ fontSize:11, color:'#94a3b8' }}>미시작</span>
  if (days < 0)   return <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99, background:'#fef2f2', color:'#dc2626' }}>연체 {Math.abs(days)}일</span>
  if (days === 0) return <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99, background:'#fffbeb', color:'#d97706' }}>오늘</span>
  if (days <= 3)  return <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99, background:'#eff6ff', color:'#2563eb' }}>{days}일 후</span>
  return <span style={{ fontSize:11, color:'#94a3b8' }}>{days}일 후</span>
}

export default function SrsOverviewPage() {
  const navigate = useNavigate()
  const { getEnrichedCards, getSummary } = useSrsStore()
  const [filter,          setFilter]          = useState('all')
  const [subjectFilter,   setSubjectFilter]   = useState('')

  const allNotes = getAllNotes()
  const enriched = getEnrichedCards(allNotes)
  const summary  = getSummary(allNotes)

  const displayed = enriched.filter(n => {
    if (filter === 'due')       return n.srs.due
    if (filter === 'weak')      return n.srs.mastery?.label === '취약'
    if (filter === 'bookmarked') return isBookmarked(n.id)
    return true
  }).filter(n => subjectFilter ? n.subject === subjectFilter : true)

  // 과목별 due 수
  const subjectDue = Object.fromEntries(
    SUBJECTS.map(s => [s.id, enriched.filter(n=>n.subject===s.id && n.srs.due).length])
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* 통계 카드 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { label:'오늘 복습 대상', value:summary.due,                    icon:<AlertCircle size={18} color="#d97706"/>, bg:'#fffbeb', color:'#d97706' },
          { label:'학습 완료',      value:summary.learned,                 icon:<TrendingUp  size={18} color="#2563eb"/>, bg:'#eff6ff', color:'#2563eb' },
          { label:'장기 기억',      value:summary.mature,                  icon:<TrendingUp  size={18} color="#10b981"/>, bg:'#ecfdf5', color:'#10b981' },
          { label:'미시작',         value:summary.total-summary.learned,  icon:<Clock       size={18} color="#94a3b8"/>, bg:'#f8fafc', color:'#64748b' },
        ].map(({ label, value, icon, bg, color }) => (
          <div key={label} style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', display:'flex', gap:12, alignItems:'flex-start' }}>
            <div style={{ width:38, height:38, borderRadius:9, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:22, fontWeight:700, color }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 과목별 복습 세션 시작 */}
      <Panel title="과목별 복습 시작">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
          {SUBJECTS.map(s => {
            const due = subjectDue[s.id]
            return (
              <button key={s.id} onClick={()=>navigate(`/review?subject=${s.id}`)}
                style={{ padding:'12px 8px', borderRadius:10, cursor:'pointer', border:`1px solid ${s.color}22`, background:`${s.color}08`, display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=`${s.color}16`; e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={e=>{ e.currentTarget.style.background=`${s.color}08`; e.currentTarget.style.transform='none' }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <Play size={11} fill={s.color} color={s.color} />
                  <span style={{ fontSize:11, fontWeight:700, color:s.color }}>{s.short}</span>
                </div>
                {due > 0 && (
                  <span style={{ fontSize:10, padding:'1px 7px', borderRadius:99, background:s.color, color:'#fff', fontWeight:600 }}>
                    {due}개 대기
                  </span>
                )}
                {due === 0 && (
                  <span style={{ fontSize:10, color:'#94a3b8' }}>완료</span>
                )}
              </button>
            )
          })}
        </div>
      </Panel>

      {/* 전체 복습 시작 배너 */}
      {summary.due > 0 && (
        <div style={{ background:'linear-gradient(135deg,#eff6ff,#ecfdf5)', border:'1px solid #dbeafe', borderRadius:12, padding:'16px 22px', display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#1e293b', marginBottom:3 }}>
              오늘 복습할 문제 <span style={{ color:'#2563eb' }}>{summary.due}개</span>가 있습니다
            </div>
            <div style={{ fontSize:12, color:'#64748b' }}>예상 소요시간: 약 {Math.ceil(summary.due * 1.5)}분</div>
          </div>
          <button onClick={()=>navigate('/review')} style={{ display:'flex', alignItems:'center', gap:7, padding:'11px 22px', borderRadius:9, cursor:'pointer', background:'#2563eb', border:'none', color:'#fff', fontSize:13, fontWeight:700, boxShadow:'0 2px 8px rgba(37,99,235,0.3)', flexShrink:0 }}>
            <Play size={14} fill="#fff" /> 전체 복습
          </button>
        </div>
      )}

      {/* 필터 탭 + 과목 필터 */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
        {[
          { key:'all',        label:`전체 (${summary.total})` },
          { key:'due',        label:`오늘 복습 (${summary.due})` },
          { key:'weak',       label:'취약 카드' },
          { key:'bookmarked', label:'⭐ 즐겨찾기' },
        ].map(({ key, label }) => (
          <button key={key} onClick={()=>setFilter(key)} style={{ fontSize:12, padding:'6px 14px', borderRadius:7, cursor:'pointer', background:filter===key?'#2563eb':'#fff', color:filter===key?'#fff':'#64748b', border:`1px solid ${filter===key?'#2563eb':'#e2e8f0'}`, fontWeight:filter===key?600:400, transition:'all 0.15s' }}>
            {label}
          </button>
        ))}
        <div style={{ width:1, height:20, background:'#e2e8f0', margin:'0 2px' }} />
        <select value={subjectFilter} onChange={e=>setSubjectFilter(e.target.value)}
          style={{ fontSize:12, padding:'6px 12px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', color:'#475569', cursor:'pointer', outline:'none' }}>
          <option value="">전체 과목</option>
          {SUBJECTS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span style={{ fontSize:12, color:'#94a3b8', marginLeft:'auto' }}>{displayed.length}개</span>
      </div>

      {/* 카드 목록 */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {displayed.map(note => {
          const { srs } = note
          const m = masteryLevel(srs.ef)
          const bm = isBookmarked(note.id)
          return (
            <div key={note.id}
              style={{ background:'#fff', border:`1px solid ${srs.due?'#fde68a':'#f1f5f9'}`, borderRadius:10, padding:'14px 18px', cursor:'pointer', display:'grid', gridTemplateColumns:'1fr 180px 140px 120px', alignItems:'center', gap:16, transition:'all 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}
              onClick={()=>navigate(`/notes/${note.id}`)}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform='none' }}
            >
              <div>
                <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap', alignItems:'center' }}>
                  <SubjectBadge subjectId={note.subject} size="sm" />
                  {note.tags.slice(0,2).map(t=><TagBadge key={t.id} name={t.name} />)}
                  {bm && <Star size={11} fill="#d97706" color="#d97706" />}
                </div>
                <div style={{ fontSize:12, color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {note.wrongCode.split('\n')[0]}
                </div>
              </div>
              <div>
                <div style={{ fontSize:10, color:'#94a3b8', marginBottom:5 }}>숙련도 (EF {srs.ef.toFixed(1)})</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ flex:1, height:5, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ width:`${m.pct}%`, height:'100%', background:m.color, borderRadius:99 }} />
                  </div>
                  <span style={{ fontSize:10, color:m.color, fontWeight:600, width:28 }}>{m.label}</span>
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:10, color:'#94a3b8', marginBottom:4 }}>복습 / 간격</div>
                <div style={{ fontSize:12, color:'#475569', fontFamily:'JetBrains Mono,monospace' }}>
                  {srs.repetitions}회 / {srs.interval>0?`${srs.interval}일`:'-'}
                </div>
              </div>
              <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                <DueBadge days={srs.daysUntil} />
                <button
                  onClick={e=>{ e.stopPropagation(); navigate(`/review?subject=${note.subject}`) }}
                  style={{ fontSize:10, padding:'3px 10px', borderRadius:6, background:'#eff6ff', border:'1px solid #dbeafe', color:'#2563eb', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontWeight:600 }}
                >
                  <Play size={9} fill="#2563eb" /> 복습
                </button>
              </div>
            </div>
          )
        })}
        {displayed.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#94a3b8' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
            <div style={{ fontSize:14 }}>해당 조건의 문제가 없습니다.</div>
          </div>
        )}
      </div>
    </div>
  )
}
