import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Upload } from 'lucide-react'
import { useNoteStore } from '../store'
import { useSrsStore } from '../store/srsStore'
import { getNotes, getStats } from '../api/client'
import { SUBJECTS, exportData, importData, getExamDate, setExamDate, getDday } from '../api/mock'
import { masteryLevel } from '../lib/sm2'
import { Panel } from '../components/ui'
import { useToast } from '../components/Toast'

const TAG_HEX = { SQL:'#2563eb', 객체지향:'#7c3aed', 테스트:'#0891b2', 정규화:'#059669', 암호화:'#d97706', 'C언어':'#dc2626' }

export default function StatsPage() {
  const { setStats } = useNoteStore()
  const { cards, getSummary, getEnrichedCards } = useSrsStore()
  const toast    = useToast()
  const navigate = useNavigate()

  const [examDate,      setExamDateState] = useState(getExamDate())
  const [editDate,      setEditDate]      = useState(false)
  const [tempDate,      setTempDate]      = useState(getExamDate())
  const [allNotes,      setAllNotes]      = useState([])
  const [apiStats,      setApiStats]      = useState(null)   // 실제 API 통계
  const [loading,       setLoading]       = useState(true)

  // ── API 데이터 로드 ────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [notesData, statsData] = await Promise.all([
          getNotes({ limit: 200, sort: 'newest' }),
          getStats(),
        ])
        const notes = notesData.notes ?? []
        setAllNotes(notes)
        setApiStats(statsData)
        setStats(statsData)
      } catch (err) {
        console.error('[StatsPage] 데이터 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const enriched = getEnrichedCards(allNotes)
  const summary  = getSummary(allNotes)
  const dday     = getDday()

  // SRS 집계 — localStorage 기반 (즉시 반영)
  const reviewedCards = Object.values(cards).filter(c => c.repetitions > 0)
  const avgEF = reviewedCards.length > 0
    ? (reviewedCards.reduce((s,c) => s + c.ef, 0) / reviewedCards.length).toFixed(2)
    : '—'
  const totalReviews = reviewedCards.reduce((s,c) => s + c.repetitions, 0)

  // streak: API 값 우선, 없으면 localStorage 기반 추산
  const streak = apiStats?.streak ?? 0

  // 과목별 통계
  const subjectStats = SUBJECTS.map(s => {
    const notes   = allNotes.filter(n => n.subject === s.id)
    const enr     = enriched.filter(n => n.subject === s.id)
    const learned = enr.filter(n => n.srs.repetitions > 0).length
    const pct     = notes.length > 0 ? Math.round((learned / notes.length) * 100) : 0
    const reviewed = enr.filter(n=>n.srs.repetitions>0)
    const avgSubEF  = reviewed.length > 0
      ? reviewed.reduce((sum,n)=>sum+n.srs.ef,0) / reviewed.length
      : 2.5
    return { ...s, total: notes.length, learned, pct, mastery: masteryLevel(avgSubEF) }
  })

  // 태그: API topTags 우선, 없으면 allNotes에서 집계
  const displayTags = useMemo(() => {
    if (apiStats?.topTags?.length > 0) return apiStats.topTags.slice(0, 8)
    const tagCount = {}
    allNotes.forEach(n => {
      (n.tags || []).forEach(t => {
        const name = t.name || t
        tagCount[name] = (tagCount[name] || 0) + 1
      })
    })
    return Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [allNotes, apiStats])

  const maxTagCount = displayTags[0]?.count ?? 1

  // 히트맵: API recentActivity 우선
  const heatmapData = useMemo(() => {
    if (apiStats?.recentActivity?.length > 0) {
      // 28일치 배열로 정규화
      const map = {}
      apiStats.recentActivity.forEach(d => { map[d.date] = d.count })
      return Array.from({ length: 28 }, (_, i) => {
        const date = new Date(Date.now() - (27 - i) * 86400000).toISOString().slice(0, 10)
        return { date, count: map[date] ?? 0 }
      })
    }
    return Array.from({ length: 28 }, (_, i) => ({
      date:  new Date(Date.now() - (27-i) * 86400000).toISOString().slice(0,10),
      count: 0,
    }))
  }, [apiStats])

  const handleSaveDate = () => {
    setExamDate(tempDate)
    setExamDateState(tempDate)
    setEditDate(false)
    toast({ message: `시험일이 ${tempDate}로 설정됐습니다!`, type: 'success' })
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type  = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          importData(ev.target.result)
          toast({ message: '데이터를 성공적으로 가져왔습니다! 새로고침하세요.', type: 'success' })
        } catch {
          toast({ message: '파일 형식이 올바르지 않습니다.', type: 'error' })
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

      {/* 상단 헤더 + 버튼 */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>학습 통계</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>실제 복습 데이터 기반 분석</div>
        </div>
        <button onClick={() => { exportData(); toast({ message:'백업 파일이 다운로드됐습니다!', type:'success' }) }}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, background:'#fff', border:'1px solid #e2e8f0', color:'#475569', cursor:'pointer', fontSize:12 }}>
          <Download size={14} /> 내보내기
        </button>
        <button onClick={handleImport}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, background:'#2563eb', border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
          <Upload size={14} /> 가져오기
        </button>
      </div>

      {/* D-day + 시험일 설정 */}
      <div style={{ background: dday > 0 ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'linear-gradient(135deg,#059669,#10b981)', borderRadius:14, padding:'20px 24px', color:'#fff', display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, opacity:0.8, marginBottom:4 }}>
            {dday > 0 ? '정보처리기사 시험까지' : dday === 0 ? '오늘이 시험일!' : '시험이 종료됐습니다'}
          </div>
          <div style={{ fontSize:36, fontWeight:800, fontFamily:'JetBrains Mono,monospace', lineHeight:1.1 }}>
            {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `D+${Math.abs(dday)}`}
          </div>
          <div style={{ fontSize:11, opacity:0.7, marginTop:6 }}>시험일: {examDate}</div>
        </div>
        {editDate ? (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="date" value={tempDate} onChange={e=>setTempDate(e.target.value)}
              style={{ padding:'6px 10px', borderRadius:7, border:'none', fontSize:13, fontFamily:'JetBrains Mono,monospace' }} />
            <button onClick={handleSaveDate} style={{ padding:'6px 14px', borderRadius:7, background:'rgba(255,255,255,0.25)', border:'1px solid rgba(255,255,255,0.4)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>저장</button>
            <button onClick={()=>setEditDate(false)} style={{ padding:'6px 10px', borderRadius:7, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', fontSize:12 }}>취소</button>
          </div>
        ) : (
          <button onClick={()=>setEditDate(true)} style={{ padding:'9px 18px', borderRadius:9, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            시험일 변경
          </button>
        )}
      </div>

      {/* SRS 요약 카드 — 실제 데이터 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { icon:'📚', label:'전체 문제',    value: loading ? '...' : (apiStats?.totalNotes ?? allNotes.length), color:'#2563eb', bg:'#eff6ff' },
          { icon:'🔄', label:'총 복습 횟수', value: loading ? '...' : (apiStats?.totalReview ?? totalReviews),  color:'#7c3aed', bg:'#f5f3ff' },
          { icon:'🧠', label:'평균 EF',      value: loading ? '...' : avgEF,                                    color:'#10b981', bg:'#ecfdf5' },
          { icon:'🔥', label:'연속 학습',    value: loading ? '...' : (streak > 0 ? `${streak}일` : '—'),       color:'#f59e0b', bg:'#fffbeb' },
        ].map(({ icon, label, value, color, bg }) => (
          <div key={label} style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:9, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:22, fontWeight:700, color, lineHeight:1.2 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 과목별 진도 + 태그 차트 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Panel title="과목별 학습 진도">
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {subjectStats.map(s => (
              <div key={s.id}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }} />
                    <span style={{ fontSize:12, fontWeight:500, color:'#1e293b' }}>{s.name}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:s.mastery.color }}>{s.mastery.label}</span>
                    <span style={{ fontSize:11, color:'#64748b' }}>{s.learned}/{s.total}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:s.color }}>{s.pct}%</span>
                  </div>
                </div>
                <div style={{ height:7, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ width:`${s.pct}%`, height:'100%', background:s.color, borderRadius:99, transition:'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="태그별 문제 수">
          {displayTags.length === 0 ? (
            <div style={{ color:'#94a3b8', fontSize:12, textAlign:'center', padding:'20px 0' }}>
              {loading ? '로딩 중...' : '태그 데이터가 없습니다'}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {displayTags.map(t => {
                const pct   = Math.round((t.count / maxTagCount) * 100)
                const color = TAG_HEX[t.name] ?? '#2563eb'
                return (
                  <div key={t.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:11, color:'#475569', width:70, textAlign:'right', flexShrink:0 }}>{t.name}</span>
                    <div style={{ flex:1, height:8, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:99, transition:'width 0.6s' }} />
                    </div>
                    <span style={{ fontSize:11, color:'#94a3b8', width:24 }}>{t.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* 숙련도 분포 */}
      <Panel title="카드 숙련도 분포">
        <MasteryDist enriched={enriched} />
      </Panel>

      {/* 28일 히트맵 — API recentActivity */}
      <Panel title="28일 활동 히트맵">
        <HeatMap data={heatmapData} />
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
          <span style={{ fontSize:10, color:'#94a3b8' }}>적음</span>
          {['#f1f5f9','#bfdbfe','#60a5fa','#2563eb','#1d4ed8'].map((c,i) => (
            <div key={i} style={{ width:13, height:13, borderRadius:3, background:c }} />
          ))}
          <span style={{ fontSize:10, color:'#94a3b8' }}>많음</span>
        </div>
      </Panel>
    </div>
  )
}

function MasteryDist({ enriched }) {
  const b = { 완벽:0, 양호:0, 보통:0, 취약:0, 미시작:0 }
  const c = { 완벽:'#10b981', 양호:'#2563eb', 보통:'#f59e0b', 취약:'#ef4444', 미시작:'#e2e8f0' }
  enriched.forEach(n => {
    if (n.srs.repetitions === 0) { b['미시작']++; return }
    b[masteryLevel(n.srs.ef).label]++
  })
  const total = enriched.length
  return (
    <div>
      <div style={{ display:'flex', height:12, borderRadius:99, overflow:'hidden', marginBottom:16, gap:2 }}>
        {Object.entries(b).map(([label,count]) =>
          count > 0 ? <div key={label} style={{ flex:count, background:c[label] }} title={`${label}: ${count}`} /> : null
        )}
      </div>
      <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
        {Object.entries(b).map(([label,count]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:c[label] }} />
            <span style={{ fontSize:12, color:'#475569' }}>{label}</span>
            <span style={{ fontSize:12, color:'#94a3b8' }}>{count} ({total>0?Math.round(count/total*100):0}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeatMap({ data }) {
  const maxCount = Math.max(...data.map(d=>d.count), 1)
  const getColor = (count) => {
    if (count === 0) return '#f1f5f9'
    const r = count / maxCount
    if (r <= 0.25) return '#bfdbfe'
    if (r <= 0.50) return '#60a5fa'
    if (r <= 0.75) return '#2563eb'
    return '#1d4ed8'
  }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5 }}>
      {data.map((d,i) => (
        <div key={i} title={`${d.date}: ${d.count}개`}
          style={{ aspectRatio:1, borderRadius:4, background:getColor(d.count), transition:'all 0.15s', cursor:'default' }}
        />
      ))}
    </div>
  )
}
