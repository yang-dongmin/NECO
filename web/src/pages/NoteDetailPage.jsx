import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, CheckCircle2, Clock, BookOpen, Edit2, Trash2, Star, Share2, Copy, Eye, Send, MoreHorizontal } from 'lucide-react'
import { getNote, deleteNote as apiDeleteNote } from '../api/client'
import { useBookmarkStore } from '../store/bookmarkStore'
import { useNoteStore, useAuthStore } from '../store'
import { useSrsStore } from '../store/srsStore'
import { SubjectBadge, RoundBadge, TagBadge } from '../components/ui'
import { useToast } from '../components/Toast'
import { PageSkeleton } from '../components/Skeleton'

// 정답 비교용 정규화 (공백·대소문자·세미콜론 무시)
function normalize(s) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/;$/, '')
}

// 유사도 계산 (단순 토큰 겹침)
function similarity(a, b) {
  const ta = new Set(normalize(a).split(/\s+/))
  const tb = new Set(normalize(b).split(/\s+/))
  const inter = [...ta].filter(t => tb.has(t)).length
  const union = new Set([...ta, ...tb]).size
  return union === 0 ? 1 : inter / union
}

export default function NoteDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const toast      = useToast()
  const { deleteNote: storeDeleteNote } = useNoteStore()
  const bmStore    = useBookmarkStore()
  const srsStore   = useSrsStore()
  const currentUser = useAuthStore(s => s.user)

  const [note,            setNote]            = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [bookmarked,      setBookmarked]      = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting,        setDeleting]        = useState(false)
  const [showMoreMenu,    setShowMoreMenu]    = useState(false)
  const moreMenuRef = useRef(null)

  // ── 답안 작성 / 비교 단계 ─────────────────────────────────────────────────
  // phase: 'writing' | 'comparing' | 'done'
  const [phase,       setPhase]       = useState('writing')
  const [userAnswer,  setUserAnswer]  = useState('')
  const [srsResult,   setSrsResult]   = useState(null)   // 제출 후 업데이트된 SRS 카드

  // ── 노트 로드 ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setPhase('writing')
    setUserAnswer('')
    setSrsResult(null)
    getNote(id)
      .then(data => {
        const note = data.note ?? data
        setNote(note)
        setBookmarked(bmStore.ids.has(Number(note.id)))
      })
      .catch(() => {
        toast({ message: '노트를 불러오지 못했습니다.', type: 'error' })
        navigate('/notes')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageSkeleton />
  if (!note) return null

  const isMono   = (note.language || 'theory') !== 'theory'
  const sim      = similarity(userAnswer, note.fixedCode)
  // 공용 문제: is_public=1이고 내 소유가 아닌 경우 → 편집/삭제 불가
  const isShared = note.isPublic && note.userId !== currentUser?.id
  const autoMatch = sim >= 0.75   // 75% 이상 유사하면 자동으로 "비슷해요" 표시

  // ── 삭제 ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiDeleteNote(note.id)
      storeDeleteNote(note.id)
      toast({ message: '문제가 삭제됐습니다.', type: 'info' })
      navigate('/notes')
    } catch (err) {
      const msg = err.response?.data?.message || '삭제에 실패했습니다.'
      toast({ message: msg, type: 'error' })
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleCopyCode = (code, label) => {
    navigator.clipboard.writeText(code)
      .then(() => toast({ message: `${label} 복사됐습니다! 📋`, type: 'success' }))
      .catch(() => toast({ message: '복사에 실패했습니다.', type: 'error' }))
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast({ message: '링크가 클립보드에 복사됐습니다! 🔗', type: 'success' }))
      .catch(() => toast({ message: '복사에 실패했습니다.', type: 'error' }))
  }

  const handleBookmark = async () => {
    const next = await bmStore.toggle(note.id)
    setBookmarked(next)
    toast({ message: next ? '즐겨찾기에 추가됐습니다 ⭐' : '즐겨찾기에서 제거됐습니다.', type: next ? 'success' : 'info' })
  }

  // ── 정답 확인 버튼 ────────────────────────────────────────────────────────
  const handleCheck = () => {
    if (!userAnswer.trim()) {
      toast({ message: '답을 먼저 작성해주세요.', type: 'error' })
      return
    }
    setPhase('comparing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── 정답 바로보기 (패스) ──────────────────────────────────────────────────
  const handleSkip = () => {
    setPhase('comparing')
  }

  // ── SRS 평가 제출 ─────────────────────────────────────────────────────────
  // quality: 5=완벽, 4=맞음, 2=헷갈림, 1=틀림
  const handleSrsSubmit = async (quality) => {
    const updated = await srsStore.submitReview(note.id, quality)
    setSrsResult({ quality, card: updated })
    setPhase('done')
    toast({
      message: quality >= 4 ? '잘했어요! 복습 간격이 늘어났습니다 🎉' : '다음엔 꼭 맞출 수 있어요! 💪',
      type: quality >= 4 ? 'success' : 'info'
    })
  }

  const QUALITY_BTNS = [
    { q: 5, label: '완벽해요',  emoji: '🎯', bg: '#10b981', border: '#059669', desc: '막힘 없이 정확히 답함' },
    { q: 4, label: '맞았어요',  emoji: '✅', bg: '#2563eb', border: '#1d4ed8', desc: '약간 고민했지만 정답'  },
    { q: 2, label: '헷갈렸어요',emoji: '😅', bg: '#f59e0b', border: '#d97706', desc: '알 것 같았지만 틀림'  },
    { q: 1, label: '틀렸어요',  emoji: '❌', bg: '#ef4444', border: '#dc2626', desc: '전혀 몰랐음'          },
  ]

  return (
    <div style={{ maxWidth:760, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <button onClick={()=>navigate('/notes')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:7, background:'#fff', border:'1px solid #e2e8f0', color:'#64748b', cursor:'pointer', fontSize:12 }}>
          <ArrowLeft size={13} /> 목록으로
        </button>
        {note.subject && <SubjectBadge subjectId={note.subject} />}
        {note.year > 0 && <RoundBadge year={note.year} round={note.round} />}
        {(note.tags||[]).map((t,i)=><TagBadge key={t.id||i} name={t.name||t} />)}

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={handleShare} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, background:'#fff', border:'1px solid #e2e8f0', color:'#64748b', cursor:'pointer', fontSize:12 }}>
            <Share2 size={13} /> 링크 복사
          </button>
          <button onClick={handleBookmark} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, background:bookmarked?'#fffbeb':'#fff', border:`1px solid ${bookmarked?'#fde68a':'#e2e8f0'}`, color:bookmarked?'#d97706':'#64748b', cursor:'pointer', fontSize:12, fontWeight:bookmarked?600:400 }}>
            {bookmarked ? <Star size={13} fill="#d97706" color="#d97706" /> : <Star size={13} />}
            {bookmarked ? '즐겨찾기' : '북마크'}
          </button>
          {isShared ? (
            <span style={{ fontSize:11, padding:'4px 10px', borderRadius:99, background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', fontWeight:600 }}>
              공용 문제
            </span>
          ) : (
            <div ref={moreMenuRef} style={{ position:'relative' }}>
              <button
                onClick={() => setShowMoreMenu(p => !p)}
                style={{ display:'flex', alignItems:'center', padding:'6px 10px', borderRadius:7, background: showMoreMenu ? '#f1f5f9' : '#fff', border:'1px solid #e2e8f0', color:'#64748b', cursor:'pointer' }}
              >
                <MoreHorizontal size={15} />
              </button>
              {showMoreMenu && (
                <>
                  <div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={() => setShowMoreMenu(false)} />
                  <div style={{ position:'absolute', right:0, top:'calc(100% + 6px)', zIndex:100, background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.10)', overflow:'hidden', minWidth:130 }}>
                    <button
                      onClick={() => { setShowMoreMenu(false); navigate(`/notes/${note.id}/edit`) }}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#334155', textAlign:'left' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}
                    >
                      <Edit2 size={13} /> 편집
                    </button>
                    <button
                      onClick={() => { setShowMoreMenu(false); setShowDeleteModal(true) }}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#dc2626', textAlign:'left' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}
                    >
                      <Trash2 size={13} /> 삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94a3b8' }}>
            <Clock size={12} />
            {new Date(note.createdAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 문제 */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'10px 18px', background:'#fef2f2', borderBottom:'1px solid #fecaca', display:'flex', alignItems:'center', gap:8 }}>
          <BookOpen size={14} color="#dc2626" />
          <span style={{ fontSize:12, fontWeight:600, color:'#dc2626' }}>문제</span>
          <button onClick={() => handleCopyCode(note.wrongCode || '', '코드가')}
            style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:6, background:'transparent', border:'1px solid #fecaca', color:'#dc2626', cursor:'pointer', fontSize:11 }}>
            <Copy size={11} /> 복사
          </button>
        </div>
        <pre style={{ margin:0, padding:'20px 22px', whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:isMono?13:14, fontFamily:isMono?'JetBrains Mono,monospace':'inherit', color:'#1e293b', lineHeight:1.85 }}>
          {note.wrongCode || ''}
        </pre>
      </div>

      {/* ── Phase: writing — 답안 작성 ──────────────────────────────────────── */}
      {phase === 'writing' && (
        <div style={{ background:'#fff', border:'2px solid #dbeafe', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ padding:'10px 18px', background:'#eff6ff', borderBottom:'1px solid #dbeafe', display:'flex', alignItems:'center', gap:8 }}>
            <Send size={14} color="#2563eb" />
            <span style={{ fontSize:12, fontWeight:600, color:'#2563eb' }}>내 답안 작성</span>
            <span style={{ marginLeft:'auto', fontSize:11, color:'#93c5fd' }}>정답을 확인하기 전에 먼저 풀어보세요</span>
          </div>
          <div style={{ padding:'16px 18px' }}>
            <textarea
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder={isMono ? '-- SQL 답안을 여기에 작성하세요...' : '답을 여기에 적어주세요...'}
              style={{
                width:'100%', minHeight:120, padding:'12px 14px',
                border:'1px solid #e2e8f0', borderRadius:8,
                fontSize: isMono ? 13 : 14,
                fontFamily: isMono ? 'JetBrains Mono, monospace' : 'inherit',
                color:'#1e293b', lineHeight:1.8, resize:'vertical',
                background:'#f8fafc', outline:'none',
                boxSizing:'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#93c5fd'}
              onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
            />
            <div style={{ display:'flex', gap:10, marginTop:12 }}>
              <button
                onClick={handleCheck}
                style={{ flex:1, padding:'11px 0', borderRadius:9, background:'#2563eb', border:'none', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:'0 2px 8px rgba(37,99,235,0.3)' }}
              >
                <CheckCircle2 size={15} /> 정답 확인하기
              </button>
              <button
                onClick={handleSkip}
                style={{ padding:'11px 18px', borderRadius:9, background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#64748b', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:5 }}
              >
                <Eye size={13} /> 바로 보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Phase: comparing / done — 정답 비교 ─────────────────────────────── */}
      {(phase === 'comparing' || phase === 'done') && (
        <>
          {/* 내 답안 (작성한 경우만) */}
          {userAnswer.trim() && (
            <div style={{ background:'#fff', border:`2px solid ${autoMatch ? '#a7f3d0' : '#fed7aa'}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ padding:'10px 18px', background: autoMatch ? '#ecfdf5' : '#fff7ed', borderBottom:`1px solid ${autoMatch ? '#d1fae5' : '#fed7aa'}`, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13 }}>{autoMatch ? '✍️' : '✍️'}</span>
                <span style={{ fontSize:12, fontWeight:600, color: autoMatch ? '#059669' : '#ea580c' }}>내 답안</span>
                <span style={{ marginLeft:'auto', fontSize:11, padding:'2px 9px', borderRadius:99, background: autoMatch ? '#d1fae5' : '#ffedd5', color: autoMatch ? '#065f46' : '#9a3412', fontWeight:600 }}>
                  {autoMatch ? '✓ 정답과 유사해요' : '정답과 다를 수 있어요'}
                </span>
              </div>
              <pre style={{ margin:0, padding:'16px 22px', whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:isMono?13:14, fontFamily:isMono?'JetBrains Mono,monospace':'inherit', color:'#1e293b', lineHeight:1.85 }}>
                {userAnswer}
              </pre>
            </div>
          )}

          {/* 정답 */}
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding:'10px 18px', background:'#ecfdf5', borderBottom:'1px solid #d1fae5', display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span style={{ fontSize:12, fontWeight:600, color:'#059669' }}>정답</span>
              <button onClick={() => handleCopyCode(note.fixedCode, '정답이')}
                style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:6, background:'transparent', border:'1px solid #a7f3d0', color:'#059669', cursor:'pointer', fontSize:11 }}>
                <Copy size={11} /> 복사
              </button>
            </div>
            <pre style={{ margin:0, padding:'16px 22px', whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:isMono?13:14, fontFamily:isMono?'JetBrains Mono,monospace':'inherit', color:'#10b981', fontWeight:600, lineHeight:1.85 }}>
              {note.fixedCode}
            </pre>
          </div>

          {/* 해설 */}
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding:'10px 18px', background:'#eff6ff', borderBottom:'1px solid #dbeafe', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:14 }}>💡</span>
              <span style={{ fontSize:12, fontWeight:600, color:'#2563eb' }}>해설</span>
            </div>
            <div style={{ padding:'20px 22px', fontSize:13, color:'#334155', lineHeight:1.9 }}>
              <ReactMarkdown components={{
                p:     ({children})=><p style={{marginBottom:10}}>{children}</p>,
                strong:({children})=><strong style={{color:'#1e293b'}}>{children}</strong>,
                code:  ({children})=><code style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,background:'#f1f5f9',color:'#2563eb',padding:'1px 6px',borderRadius:4}}>{children}</code>,
                table: ({children})=><div style={{overflowX:'auto',marginBottom:10}}><table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>{children}</table></div>,
                th:    ({children})=><th style={{background:'#f1f5f9',padding:'6px 12px',border:'1px solid #e2e8f0',fontWeight:600,textAlign:'left'}}>{children}</th>,
                td:    ({children})=><td style={{padding:'6px 12px',border:'1px solid #e2e8f0',color:'#475569'}}>{children}</td>,
              }}>{note.explanation || ''}</ReactMarkdown>
            </div>
          </div>

          {/* ── SRS 자기 평가 버튼 ─────────────────────────────────────────── */}
          {phase === 'comparing' && (
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#475569', marginBottom:4, textAlign:'center' }}>
                이 문제를 얼마나 잘 풀었나요?
              </div>
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:14, textAlign:'center' }}>
                정직하게 평가할수록 복습 스케줄이 정확해집니다
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {QUALITY_BTNS.map(({ q, label, emoji, bg, border, desc }) => (
                  <button
                    key={q}
                    onClick={() => handleSrsSubmit(q)}
                    style={{ padding:'12px 10px', borderRadius:9, background:bg, border:`1px solid ${border}`, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', flexDirection:'column', alignItems:'center', gap:3, transition:'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <span style={{ fontSize:18 }}>{emoji}</span>
                    <span>{label}</span>
                    <span style={{ fontSize:10, fontWeight:400, opacity:0.85 }}>{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── 완료 상태 ─────────────────────────────────────────────────── */}
          {phase === 'done' && srsResult && (
            <div style={{ background: srsResult.quality >= 4 ? '#ecfdf5' : '#fff7ed', border:`1px solid ${srsResult.quality >= 4 ? '#a7f3d0' : '#fed7aa'}`, borderRadius:12, padding:'20px', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>
                {srsResult.quality >= 4 ? '🎉' : '💪'}
              </div>
              <div style={{ fontSize:14, fontWeight:700, color: srsResult.quality >= 4 ? '#059669' : '#ea580c', marginBottom:4 }}>
                {srsResult.quality >= 4 ? '복습 완료!' : '다음엔 꼭 맞출 수 있어요!'}
              </div>
              <div style={{ fontSize:12, color:'#64748b' }}>
                다음 복습:{' '}
                {srsResult.card.interval === 0
                  ? '오늘'
                  : srsResult.card.interval === 1
                  ? '내일'
                  : `${srsResult.card.interval}일 후`}
              </div>
              <button
                onClick={() => navigate('/notes')}
                style={{ marginTop:14, padding:'8px 20px', borderRadius:8, background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#475569', cursor:'pointer', fontSize:12 }}
              >
                목록으로 돌아가기
              </button>
            </div>
          )}
        </>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={()=>!deleting && setShowDeleteModal(false)}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:'#fff', borderRadius:16, padding:'28px 32px', width:380, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Trash2 size={22} color="#dc2626" />
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:'#1e293b', textAlign:'center', marginBottom:8 }}>문제를 삭제하시겠어요?</div>
            <div style={{ fontSize:13, color:'#64748b', textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
              삭제된 문제와 복습 기록은 복구할 수 없습니다.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowDeleteModal(false)} disabled={deleting}
                style={{ flex:1, padding:'10px 0', borderRadius:8, background:'#f1f5f9', border:'none', color:'#475569', cursor:'pointer', fontSize:13, fontWeight:600, opacity:deleting?0.5:1 }}>
                취소
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex:1, padding:'10px 0', borderRadius:8, background:'#dc2626', border:'none', color:'#fff', cursor:deleting?'default':'pointer', fontSize:13, fontWeight:700, opacity:deleting?0.7:1 }}>
                {deleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
