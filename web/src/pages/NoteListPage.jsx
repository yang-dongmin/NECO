import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Star, ArrowUpDown } from 'lucide-react'
import { useNoteStore } from '../store'
import { useSrsStore } from '../store/srsStore'
import { getNotes, getTags } from '../api/client'
import { SUBJECTS } from '../api/mock'
import { useBookmarkStore } from '../store/bookmarkStore'
import { isDue } from '../lib/sm2'
import NoteCard from '../components/NoteCard'
import { TagBadge, EmptyState } from '../components/ui'
import { PageSkeleton } from '../components/Skeleton'

const LANGS = [
  { value:'',       label:'전체 유형' },
  { value:'theory', label:'이론형'   },
  { value:'sql',    label:'SQL'      },
  { value:'c',      label:'C언어'    },
  { value:'python', label:'Python'   },
]

const SORT_OPTIONS = [
  { value:'newest', label:'최신순'       },
  { value:'oldest', label:'오래된순'     },
  { value:'weak',   label:'취약 순'      },
  { value:'due',    label:'복습 필요 먼저' },
]

export default function NoteListPage() {
  const { filters, setFilter, setNotes, setTags, notes, pagination } = useNoteStore()
  const { getCard, cards } = useSrsStore()
  const bmIds = useBookmarkStore(s => s.ids)
  const [loading, setLoading] = useState(true)
  const [sort, setSort]       = useState('newest')
  const [showSort, setShowSort] = useState(false)
  const navigate = useNavigate()

  // ── API에서 노트 불러오기 ──────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      // weak/due 정렬은 클라이언트에서 처리 → 서버엔 newest/oldest만 전달
      const serverSort = (sort === 'weak' || sort === 'due') ? 'newest' : sort
      const params = {
        page:    filters.page || 1,
        limit:   50,
        sort:    serverSort,
        ...(filters.subject && { subject: filters.subject }),
        ...(filters.lang    && { language: filters.lang }),
        ...(filters.tag     && { tag: filters.tag }),
      }
      const data = await getNotes(params)   // { notes, pagination }
      setNotes(data.notes, data.pagination)
    } catch (err) {
      console.error('[NoteListPage] 노트 조회 실패:', err)
      setNotes([], { total: 0, page: 1, totalPages: 1 })
    } finally {
      setLoading(false)
    }
  }, [filters.page, filters.subject, filters.lang, filters.tag, sort])

  // 태그 목록 API 로드 (최초 1회)
  const [apiTags, setApiTags] = useState([])
  useEffect(() => {
    getTags()
      .then(data => {
        const tags = data.tags ?? []
        setApiTags(tags)
        setTags(tags)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])


  // ── 클라이언트 사이드: 검색어·북마크·취약/복습 정렬 ─────────────────────
  const displayed = useMemo(() => {
    let f = [...notes]

    // 검색어 필터 (서버 미지원 → 클라이언트)
    if (filters.q) {
      const q = filters.q.toLowerCase()
      f = f.filter(n =>
        (n.wrongCode    || '').toLowerCase().includes(q) ||
        (n.explanation  || '').toLowerCase().includes(q)
      )
    }

    // 북마크 필터 (bookmarkStore — DB + localStorage 통합)
    if (filters.bookmark) {
      f = f.filter(n => bmIds.has(Number(n.id)))
    }

    // 취약/복습 정렬 (SRS 기반 → 클라이언트)
    if (sort === 'weak') {
      f = [...f].sort((a, b) => getCard(a.id).ef - getCard(b.id).ef)
    } else if (sort === 'due') {
      f = [...f].sort((a, b) => {
        const da = isDue(getCard(a.id)), db = isDue(getCard(b.id))
        if (da && !db) return -1
        if (!da && db) return 1
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
    }

    return f
  }, [notes, filters.q, filters.bookmark, sort, cards])

  const hasFilter = filters.tag || filters.lang || filters.subject || filters.q || filters.bookmark
  const sortLabel = SORT_OPTIONS.find(s => s.value === sort)?.label ?? '정렬'

  if (loading) return <PageSkeleton />

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
            {apiTags.slice(0,5).map(t=>(
              <TagBadge key={t.id} name={t.name} active={filters.tag===t.name} onClick={()=>setFilter('tag', filters.tag===t.name?'':t.name)} />
            ))}
            {hasFilter && (
              <button onClick={()=>{ setFilter('tag',''); setFilter('lang',''); setFilter('subject',''); setFilter('q',''); setFilter('bookmark','') }}
                style={{ fontSize:11, padding:'4px 10px', borderRadius:7, cursor:'pointer', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }}>
                ✕ 초기화
              </button>
            )}

            {/* 정렬 드롭다운 */}
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

            <span style={{ fontSize:12, color:'#94a3b8' }}>
              {pagination?.total ?? displayed.length}문제
            </span>
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
      {displayed.length === 0 ? (
        <EmptyState
          icon={hasFilter ? '🔍' : '📭'}
          message={hasFilter ? '검색 결과가 없어요' : '아직 문제가 없어요'}
          description={hasFilter
            ? '다른 키워드나 필터로 다시 시도해보세요.'
            : 'VSCode에서 NECO로 코드를 저장하거나, 직접 문제를 추가해보세요.'}
          action={
            <div style={{ display:'flex', gap:8 }}>
              {hasFilter && (
                <button onClick={()=>{ setFilter('tag',''); setFilter('lang',''); setFilter('subject',''); setFilter('q',''); setFilter('bookmark','') }}
                  style={{ padding:'8px 16px', borderRadius:8, background:'#f1f5f9', border:'none', color:'#475569', cursor:'pointer', fontSize:13 }}>
                  필터 초기화
                </button>
              )}
              <button onClick={()=>navigate('/notes/add')}
                style={{ padding:'8px 16px', borderRadius:8, background:'#2563eb', border:'none', color:'#fff', cursor:'pointer', fontSize:13 }}>
                + 문제 추가하기
              </button>
            </div>
          }
        />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
          {displayed.map(note=><NoteCard key={note.id} note={note} />)}
        </div>
      )}
    </div>
  )
}
