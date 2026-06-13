import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, RotateCcw, BarChart2, LayoutDashboard, Play, Plus, Star, Code2, Loader2 } from 'lucide-react'
import { SUBJECTS } from '../api/mock'
import { useNoteStore } from '../store'
import { searchAll } from '../api/client'
import { createPortal } from 'react-dom'

const STATIC_ACTIONS = [
  { id:'dash',   label:'대시보드로 이동',         icon:LayoutDashboard, path:'/',                group:'페이지' },
  { id:'notes',  label:'문제 목록',               icon:BookOpen,        path:'/notes',           group:'페이지' },
  { id:'review-dashboard', label:'복습 대시보드', icon:RotateCcw,       path:'/review-dashboard', group:'페이지' },
  { id:'stats',  label:'통계 보기',               icon:BarChart2,       path:'/stats',           group:'페이지' },
  { id:'add',    label:'새 문제 추가',             icon:Plus,            path:'/notes/add',       group:'액션'   },
  { id:'review', label:'복습 세션 시작 (전체)',    icon:Play,            path:'/review',          group:'액션'   },
  ...SUBJECTS.map(s => ({
    id:    'review-' + s.id,
    label: s.name + ' 복습 시작',
    icon:  Play,
    path:  '/review?subject=' + s.id,
    group: '과목별 복습',
    color: s.color,
  })),
  { id:'bookmark', label:'즐겨찾기 문제 보기', icon:Star, path:'/notes', filter:{ bookmark:'true' }, group:'필터' },
]

export function CommandPalette({ open, onClose }) {
  const [query,          setQuery]          = useState('')
  const [selected,       setSelected]       = useState(0)
  const [searching,      setSearching]      = useState(false)
  const [backendResults, setBackendResults] = useState({ notes: [], codeNotes: [] })
  const navigate    = useNavigate()
  const { setFilter, clearFilters, notes } = useNoteStore()
  const inputRef    = useRef(null)
  const listRef     = useRef(null)
  const debounceRef = useRef(null)

  const localNoteResults = query.length >= 1
    ? notes
        .filter(n => {
          const q    = query.toLowerCase()
          const text = (n.wrongCode || n.code || '').toLowerCase()
          return text.includes(q) || (n.tags || []).some(t => t.name.toLowerCase().includes(q))
        })
        .slice(0, 3)
        .map(n => ({
          id:    'note-' + n.id,
          label: (n.wrongCode || n.code || '문제').split('\n')[0].slice(0, 48),
          sub:   (SUBJECTS.find(s => s.id === n.subject) || {}).name || '',
          icon:  BookOpen,
          path:  '/notes/' + n.id,
          group: '정처기 문제',
        }))
    : []

  const backendNoteItems = (backendResults.notes || []).map(n => ({
    id:    'bn-' + n.id,
    label: (n.wrongCode || '').split('\n')[0].slice(0, 48) || '문제 #' + n.id,
    sub:   (SUBJECTS.find(s => s.id === n.subject) || {}).name || '',
    icon:  BookOpen,
    path:  '/notes/' + n.id,
    group: '정처기 문제',
  }))

  const backendCodeItems = (backendResults.codeNotes || []).map(n => ({
    id:    'bc-' + n.id,
    label: (n.comment || '').slice(0, 48) || (n.codeSnippet || '').split('\n')[0].slice(0, 48) || '코드노트 #' + n.id,
    sub:   n.fileName ? (n.languageId || '') + ' · ' + n.fileName : (n.languageId || ''),
    icon:  Code2,
    path:  '/code-notes',
    group: '코드 노트',
  }))

  const localPaths          = new Set(localNoteResults.map(r => r.path))
  const filteredBackendNotes = backendNoteItems.filter(r => !localPaths.has(r.path))
  const searchResults        = [...localNoteResults, ...filteredBackendNotes, ...backendCodeItems]

  const staticFiltered = STATIC_ACTIONS.filter(a =>
    !query ||
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.group.toLowerCase().includes(query.toLowerCase())
  )

  const allItems = [...searchResults, ...staticFiltered]

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.length < 2) { setBackendResults({ notes: [], codeNotes: [] }); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchAll(query)
        setBackendResults(data || { notes: [], codeNotes: [] })
      } catch (_) {
        setBackendResults({ notes: [], codeNotes: [] })
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [query])

  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current && inputRef.current.focus(), 50)
      setQuery('')
      setBackendResults({ notes: [], codeNotes: [] })
    }
  }, [open])

  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.children[selected]
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const execute = (item) => {
    if (item.filter) {
      clearFilters()
      Object.entries(item.filter).forEach(function(e) { setFilter(e[0], e[1]) })
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

  const groups = {}
  allItems.forEach(function(item, i) {
    if (!groups[item.group]) groups[item.group] = []
    groups[item.group].push(Object.assign({}, item, { _idx: i }))
  })

  return createPortal(
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:120, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)' }}
    >
      <div
        onClick={function(e) { e.stopPropagation() }}
        onKeyDown={handleKey}
        style={{ width:560, maxHeight:420, background:'#fff', borderRadius:14, boxShadow:'0 24px 64px rgba(0,0,0,0.18)', overflow:'hidden', display:'flex', flexDirection:'column' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:'1px solid #f1f5f9' }}>
          <Search size={16} color="#94a3b8" />
          <input
            ref={inputRef}
            value={query}
            onChange={function(e) { setQuery(e.target.value) }}
            placeholder="정처기 문제, 코드 노트, 페이지 검색..."
            style={{ flex:1, border:'none', outline:'none', fontSize:14, color:'#1e293b', background:'none' }}
          />
          {searching
            ? <Loader2 size={14} color="#94a3b8" style={{ animation:'spin 1s linear infinite' }} />
            : <kbd style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0' }}>ESC</kbd>
          }
        </div>

        <div ref={listRef} style={{ overflowY:'auto', flex:1 }}>
          {allItems.length === 0 && (
            <div style={{ padding:'32px 0', textAlign:'center', color:'#94a3b8', fontSize:13 }}>결과 없음</div>
          )}
          {Object.entries(groups).map(function(entry) {
            const group = entry[0]
            const items = entry[1]
            return (
              <div key={group}>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', padding:'10px 18px 4px' }}>{group}</div>
                {items.map(function(item) {
                  const Icon     = item.icon
                  const isActive = item._idx === selected
                  const iconBg   = isActive ? '#2563eb' : (item.color ? item.color + '14' : '#f1f5f9')
                  const iconColor = isActive ? '#fff' : (item.color || '#64748b')
                  return (
                    <div
                      key={item.id}
                      onClick={function() { execute(item) }}
                      onMouseEnter={function() { setSelected(item._idx) }}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 18px', cursor:'pointer', background:isActive?'#eff6ff':'transparent', transition:'background 0.1s' }}
                    >
                      <div style={{ width:30, height:30, borderRadius:8, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                        <Icon size={14} color={iconColor} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, color:isActive?'#2563eb':'#1e293b', fontWeight:isActive?600:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</div>
                        {item.sub && <div style={{ fontSize:11, color:'#94a3b8' }}>{item.sub}</div>}
                      </div>
                      {isActive && <kbd style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:'#dbeafe', color:'#2563eb', border:'1px solid #bfdbfe' }}>Enter</kbd>}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        <div style={{ padding:'8px 18px', borderTop:'1px solid #f1f5f9', display:'flex', gap:16, fontSize:10, color:'#94a3b8' }}>
          <span>Up/Down 탐색</span>
          <span>Enter 이동</span>
          <span>ESC 닫기</span>
          <span style={{ marginLeft:'auto' }}>정처기 + 코드노트 통합 검색</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(function() {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(function(o) { return !o })
      }
    }
    window.addEventListener('keydown', handler)
    return function() { window.removeEventListener('keydown', handler) }
  }, [])
  return { open, setOpen }
}
