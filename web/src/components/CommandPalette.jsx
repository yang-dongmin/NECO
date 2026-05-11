import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, RotateCcw, BarChart2, LayoutDashboard, Play, Plus, Star } from 'lucide-react'
import { getAllNotes, SUBJECTS } from '../api/mock'
import { useNoteStore } from '../store'
import { createPortal } from 'react-dom'

const STATIC_ACTIONS = [
  { id:'dash',   label:'대시보드로 이동',         icon:LayoutDashboard, path:'/',         group:'페이지'   },
  { id:'notes',  label:'문제 목록',               icon:BookOpen,        path:'/notes',    group:'페이지'   },
  { id:'srs',    label:'복습 스케줄러',            icon:RotateCcw,       path:'/srs',      group:'페이지'   },
  { id:'stats',  label:'통계 보기',               icon:BarChart2,       path:'/stats',    group:'페이지'   },
  { id:'add',    label:'새 문제 추가',             icon:Plus,            path:'/notes/add',group:'액션'     },
  { id:'review', label:'복습 세션 시작 (전체)',    icon:Play,            path:'/review',   group:'액션'     },
  ...SUBJECTS.map(s => ({
    id:   `review-${s.id}`,
    label:`${s.name} 복습 시작`,
    icon: Play,
    path: `/review?subject=${s.id}`,
    group:'과목별 복습',
    color: s.color,
  })),
  { id:'bookmark', label:'즐겨찾기 문제 보기', icon:Star, path:'/notes', filter:{ bookmark:'true' }, group:'필터' },
]

export function CommandPalette({ open, onClose }) {
  const [query,   setQuery]   = useState('')
  const [selected, setSelected] = useState(0)
  const navigate  = useNavigate()
  const { setFilter, clearFilters } = useNoteStore()
  const inputRef  = useRef(null)
  const listRef   = useRef(null)

  // 노트 검색 결과
  const noteResults = query.length >= 1
    ? getAllNotes()
        .filter(n =>
          n.wrongCode.toLowerCase().includes(query.toLowerCase()) ||
          n.tags.some(t => t.name.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 4)
        .map(n => ({
          id:    `note-${n.id}`,
          label: n.wrongCode.split('\n')[0].slice(0, 48),
          sub:   SUBJECTS.find(s => s.id === n.subject)?.name,
          icon:  BookOpen,
          path:  `/notes/${n.id}`,
          group: '문제 검색',
        }))
    : []

  const staticFiltered = STATIC_ACTIONS.filter(a =>
    !query || a.label.toLowerCase().includes(query.toLowerCase()) || a.group.toLowerCase().includes(query.toLowerCase())
  )

  const allItems = [...noteResults, ...staticFiltered]

  useEffect(() => { setSelected(0) }, [query])
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery('') }
  }, [open])

  // 선택 항목 스크롤 유지
  useEffect(() => {
    const el = listRef.current?.children[selected]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const execute = (item) => {
    if (item.filter) {
      clearFilters()
      Object.entries(item.filter).forEach(([k, v]) => setFilter(k, v))
    }
    navigate(item.path)
    onClose()
  }

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && allItems[selected]) execute(allItems[selected])
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  // 그룹별 분리
  const groups = {}
  allItems.forEach((item, i) => {
    if (!groups[item.group]) groups[item.group] = []
    groups[item.group].push({ ...item, _idx: i })
  })

  return createPortal(
    <div
      style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:120, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ width:560, maxHeight:420, background:'#fff', borderRadius:14, boxShadow:'0 24px 64px rgba(0,0,0,0.18)', overflow:'hidden', display:'flex', flexDirection:'column' }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* 검색 입력 */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:'1px solid #f1f5f9' }}>
          <Search size={16} color="#94a3b8" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="문제 검색, 페이지 이동, 복습 시작..."
            style={{ flex:1, border:'none', outline:'none', fontSize:14, color:'#1e293b', background:'none' }}
          />
          <kbd style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0', fontFamily:'JetBrains Mono,monospace' }}>ESC</kbd>
        </div>

        {/* 결과 목록 */}
        <div ref={listRef} style={{ overflowY:'auto', flex:1 }}>
          {allItems.length === 0 && (
            <div style={{ padding:'32px 0', textAlign:'center', color:'#94a3b8', fontSize:13 }}>결과 없음</div>
          )}
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', padding:'10px 18px 4px' }}>{group}</div>
              {items.map(item => {
                const Icon    = item.icon
                const isActive = item._idx === selected
                return (
                  <div key={item.id} onClick={() => execute(item)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 18px', cursor:'pointer', background:isActive?'#eff6ff':'transparent', transition:'background 0.1s' }}
                    onMouseEnter={() => setSelected(item._idx)}
                  >
                    <div style={{ width:30, height:30, borderRadius:8, background:isActive?'#2563eb':( item.color ? `${item.color}14` : '#f1f5f9'), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                      <Icon size={14} color={isActive ? '#fff' : (item.color ?? '#64748b')} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:isActive?'#2563eb':'#1e293b', fontWeight:isActive?600:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</div>
                      {item.sub && <div style={{ fontSize:11, color:'#94a3b8' }}>{item.sub}</div>}
                    </div>
                    {isActive && <kbd style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:'#dbeafe', color:'#2563eb', border:'1px solid #bfdbfe', fontFamily:'JetBrains Mono,monospace' }}>↵</kbd>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* 하단 힌트 */}
        <div style={{ padding:'8px 18px', borderTop:'1px solid #f1f5f9', display:'flex', gap:16, fontSize:10, color:'#94a3b8' }}>
          <span><kbd style={{ fontFamily:'monospace' }}>↑↓</kbd> 탐색</span>
          <span><kbd style={{ fontFamily:'monospace' }}>↵</kbd> 이동</span>
          <span><kbd style={{ fontFamily:'monospace' }}>ESC</kbd> 닫기</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── 전역 ⌘K 훅 ──────────────────────────────────────────────────────────────
export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  return { open, setOpen }
}
