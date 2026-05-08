import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Command } from 'lucide-react'
import { useNoteStore } from '../store'
import { getDday } from '../api/mock'

const TITLES = {
  '/':           { label:'대시보드',     sub:'학습 현황을 확인하세요'   },
  '/notes':      { label:'문제 목록',     sub:'전체 기출 문제'           },
  '/notes/add':  { label:'문제 추가',     sub:'새 오답 노트 작성'        },
  '/srs':        { label:'복습 스케줄러', sub:'SM-2 간격 반복 학습'      },
  '/stats':      { label:'학습 통계',     sub:'나의 학습 분석'           },
  '/review':     { label:'복습 세션',     sub:'오늘의 복습을 시작합니다' },
}

export default function Topbar({ onOpenPalette }) {
  const { pathname } = useLocation()
  const navigate      = useNavigate()
  const { setFilter } = useNoteStore()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const info = TITLES[pathname] ?? { label:'문제 상세', sub:'문제 풀이 및 해설' }
  const dday = getDday()

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setFilter('q', query.trim())
      navigate('/notes')
      setQuery('')
    }
  }

  // ⌘K 클릭으로 팔레트 오픈
  const handleSearchClick = () => { if (onOpenPalette) onOpenPalette() }

  return (
    <header style={{ height:60, background:'#fff', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', padding:'0 24px', gap:16, flexShrink:0 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#1e293b', lineHeight:1.2 }}>{info.label}</div>
        <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{info.sub}</div>
      </div>

      {/* D-day 뱃지 */}
      {dday > 0 && (
        <div style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:700, background:'#fef3c7', color:'#d97706', border:'1px solid #fde68a', fontFamily:'JetBrains Mono,monospace' }}>
          D-{dday}
        </div>
      )}
      {dday < 0 && (
        <div style={{ padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:700, background:'#ecfdf5', color:'#10b981', border:'1px solid #a7f3d0', fontFamily:'JetBrains Mono,monospace' }}>
          D+{Math.abs(dday)}
        </div>
      )}

      {/* 검색창 — 클릭 시 커맨드 팔레트 오픈 */}
      <div
        onClick={handleSearchClick}
        style={{ display:'flex', alignItems:'center', gap:8, background:'#f8fafc', border:`1px solid ${focused?'#2563eb':'#e2e8f0'}`, borderRadius:8, padding:'0 12px', height:36, width:240, cursor:'pointer', transition:'all 0.15s' }}
      >
        <Search size={14} color="#94a3b8" />
        <span style={{ flex:1, fontSize:13, color:'#94a3b8' }}>검색 또는 이동...</span>
        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          <kbd style={{ fontSize:10, padding:'1px 5px', borderRadius:4, background:'#e2e8f0', color:'#64748b', border:'1px solid #cbd5e1', fontFamily:'monospace' }}>⌘</kbd>
          <kbd style={{ fontSize:10, padding:'1px 5px', borderRadius:4, background:'#e2e8f0', color:'#64748b', border:'1px solid #cbd5e1', fontFamily:'monospace' }}>K</kbd>
        </div>
      </div>
    </header>
  )
}
