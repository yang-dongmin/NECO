import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Star, ArrowUpDown } from 'lucide-react'
import { useNoteStore } from '../store'
import { useSrsStore } from '../store/srsStore'
import { getAllNotes, MOCK_TAGS, SUBJECTS, isBookmarked, invalidateCache } from '../api/mock'
import { isDue } from '../lib/sm2'
import NoteCard from '../components/NoteCard'
import { TagBadge, EmptyState } from '../components/ui'

const LANGS = [
  { value:'',       label:'전체 유형' },
  { value:'theory', label:'이론형'   },
  { value:'sql',    label:'SQL'      },
  { value:'c',      label:'C언어'    },
  { value:'python', label:'Python'   },
]

const SORT_OPTIONS = [
  { value:'newest', label:'최신순'   },
  { value:'oldest', label:'오래된순' },
  { value:'weak',   label:'취약 순'  },
  { value:'due',    label:'복습 필요 먼저' },
]

export default function NoteListPage() {
  const { filters, setFilter, setNotes, setTags } = useNoteStore()
  const { getCard, cards }                         = useSrsStore()
  const [allNotes, setAllNotes] = useState([])
  const [sort,     setSort]     = useState('newest')
  const [showSort, setShowSort] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    invalidateCache()
    const all = getAllNotes()
    setAllNotes(all)
    setTags(MOCK_TAGS)
    setNotes(all, { total: all.length })
  }, [])

  // ★ useMemo로 필터+정렬 메모이제이션
  const displayed = useMemo(() => {
    let f = [...allNotes]
    if (filters.tag)      f = f.filter(n => n.tags.some(t => t.name === filters.tag))
    if (filters.lang)     f = f.filter(n => n.language === filters.lang)
    if (filters.subject)  f = f.filter(n => n.subject  === filters.subject)
    if (filters.q)        f = f.filter(n => n.wrongCode.includes(filters.q) || n.explanation.includes(filters.q))
    if (filters.bookmark) f = f.filter(n => isBookmarked(n.id))

    // 정렬
    f = [...f].sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sort === 'weak') {
        const ea = getCard(a.id).ef, eb = getCard(b.id).ef
        return ea - eb  // EF 낮은(취약) 순
      }
      if (sort === 'due') {
        const da = isDue(getCard(a.id)), db = isDue(getCard(b.id))
        if (da && !db) return -1
        if (!da && db) return 1
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      return new Date(b.createdAt) - new Date(a.createdAt)  // newest
    })
    return f
  }, [allNotes, filters, sort, cards])

  const hasFilter = filters.tag || filters.lang || filters.subject || filters.q || filters.bookmark
  const sortLabel = SORT_OPTIONS.find(s => s.value === sort)?.label ?? '정렬'

  return (
    <div>
      {/* 상단 */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:18 }}>
        <div style={{ flex:1 }}>
          {/* 과목 필터 */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
            <button onClick={()=>setFilter('subject','')} style={{ fontSize:12, padding:'5px 14px', borderRadius:99, cursor:'pointer', background:!filters.subject?'#2563eb':'#f1f5f9', color:!filters.subject?'#fff':'#475569', border:'none', fontWeight:500 }}>전체</button>
            {SUBJECTS.map(s=>(
              <button key={s.id} onClick={()=>setFilter('subject', filters.subject===s.id?'':s.id)}
                style={{ fontSize:12, padding:'5px 14px', borderRadius:99, cursor:'pointer', background:filters.subject===s.id?s.color:'#f1f5f9', color:filters.subject===s.id?'#fff':'#475569', border:'none', fontWeight:500, transition:'all 0.15s' }}>
                {s.short}
              </button>
            ))}
            <button onClick={()=>setFilter('bookmark', filters.bookmark?'':'true')}
              style={{ fontSize:12, padding:'5px 12px', borderRadius:99, cursor:'pointer', background:filters.bookmark?'#fffbeb':'#f1f5f9', color:filters.bookmark?'#d97706':'#475569', border:`1px solid ${filters.bookmark?'#fde68a':'transparent'}`, fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>
              <Star size={11} fill={filters.bookmark?'#d97706':'none'} color={filters.bookmark?'#d97706':'#475569'} /> 즐겨찾기
            </button>
          </div>

          {/* 유형 + 태그 + 정렬 */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            {LANGS.map(l=>(
              <button key={l.value} onClick={()=>setFilter('lang',l.value)}
                style={{ fontSize:11, padding:'4px 12px', borderRadius:7, cursor:'pointer', background:filters.lang===l.value?'#eff6ff':'#fff', color:filters.lang===l.value?'#2563eb':'#64748b', border:`1px solid ${filters.lang===l.value?'#dbeafe':'#e2e8f0'}` }}>
                {l.label}
              </button>
            ))}
            <div style={{ width:1, height:16, background:'#e2e8f0', margin:'0 2px' }} />
            {MOCK_TAGS.slice(0,5).map(t=>(
              <TagBadge key={t.id} name={t.name} active={filters.tag===t.name} onClick={()=>setFilter('tag', filters.tag===t.name?'':t.name)} />
            ))}
            {hasFilter && (
              <button onClick={()=>{ setFilter('tag',''); setFilter('lang',''); setFilter('subject',''); setFilter('q',''); setFilter('bookmark','') }}
                style={{ fontSize:11, padding:'4px 10px', borderRadius:7, cursor:'pointer', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }}>
                ✕ 초기화
              </button>
            )}

            {/* ★ 정렬 드롭다운 */}
            <div style={{ marginLeft:'auto', position:'relative' }}>
              <button onClick={()=>setShowSort(s=>!s)}
                style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, padding:'4px 12px', borderRadius:7, cursor:'pointer', background:'#fff', border:'1px solid #e2e8f0', color:'#475569' }}>
                <ArrowUpDown size={12} /> {sortLabel}
              </button>
              {showSort && (
                <div style={{ position:'absolute', right:0, top:'100%', marginTop:4, background:'#fff', border:'1px solid #e2e8f0', borderRadius:9, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:100, overflow:'hidden', minWidth:140 }}>
                  {SORT_OPTIONS.map(o=>(
                    <div key={o.value} onClick={()=>{ setSort(o.value); setShowSort(false) }}
                      style={{ padding:'9px 14px', fontSize:12, cursor:'pointer', color:sort===o.value?'#2563eb':'#334155', fontWeight:sort===o.value?600:400, background:sort===o.value?'#eff6ff':'transparent' }}
                      onMouseEnter={e=>{ if(sort!==o.value) e.currentTarget.style.background='#f8fafc' }}
                      onMouseLeave={e=>{ if(sort!==o.value) e.currentTarget.style.background='transparent' }}
                    >
                      {o.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span style={{ fontSize:12, color:'#94a3b8' }}>{displayed.length}문제</span>
          </div>
        </div>

        <button onClick={()=>navigate('/notes/add')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:8, cursor:'pointer', flexShrink:0, background:'#2563eb', border:'none', color:'#fff', fontSize:13, fontWeight:600, boxShadow:'0 1px 3px rgba(37,99,235,0.3)' }}
          onMouseEnter={e=>e.currentTarget.style.background='#1d4ed8'}
          onMouseLeave={e=>e.currentTarget.style.background='#2563eb'}
        >
          <Plus size={15} /> 문제 추가
        </button>
      </div>

      {/* 정렬 드롭다운 닫기 오버레이 */}
      {showSort && <div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={()=>setShowSort(false)} />}

      {/* 그리드 */}
      {displayed.length===0 ? (
        <EmptyState icon="📭" message="조건에 맞는 문제가 없습니다." action={
          <button onClick={()=>navigate('/notes/add')} style={{ padding:'8px 20px', borderRadius:8, background:'#2563eb', border:'none', color:'#fff', cursor:'pointer', fontSize:13 }}>
            + 첫 번째 문제 추가하기
          </button>
        } />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
          {displayed.map(note=><NoteCard key={note.id} note={note} />)}
        </div>
      )}
    </div>
  )
}
