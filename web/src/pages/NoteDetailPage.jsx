import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, CheckCircle2, Clock, BookOpen, Edit2, Trash2, Star, Share2, Copy } from 'lucide-react'
import { getNote, deleteNote as apiDeleteNote } from '../api/client'
import { useBookmarkStore } from '../store/bookmarkStore'
import { useNoteStore } from '../store'
import { SubjectBadge, RoundBadge, TagBadge } from '../components/ui'
import { useToast } from '../components/Toast'

export default function NoteDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const toast      = useToast()
  const { deleteNote: storeDeleteNote } = useNoteStore()
  const bmStore = useBookmarkStore()

  const [note,            setNote]            = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [reviewed,        setReviewed]        = useState(false)
  const [bookmarked,      setBookmarked]      = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting,        setDeleting]        = useState(false)

  // ── API에서 노트 상세 로드 ────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
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

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:200, color:'#94a3b8', fontSize:13 }}>
      불러오는 중...
    </div>
  )
  if (!note) return null

  const isMono = (note.language || 'theory') !== 'theory'

  // ── 삭제 — API 호출 ───────────────────────────────────────────────────────
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
          <button onClick={()=>navigate(`/notes/${note.id}/edit`)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, background:'#fff', border:'1px solid #e2e8f0', color:'#64748b', cursor:'pointer', fontSize:12 }}>
            <Edit2 size={13} /> 편집
          </button>
          <button onClick={()=>setShowDeleteModal(true)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            <Trash2 size={13} /> 삭제
          </button>
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

      {/* 정답 */}
      {note.fixedCode && (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ padding:'10px 18px', background:'#ecfdf5', borderBottom:'1px solid #d1fae5', display:'flex', alignItems:'center', gap:8 }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span style={{ fontSize:12, fontWeight:600, color:'#059669' }}>정답</span>
            <button onClick={() => handleCopyCode(note.fixedCode, '정답이')}
              style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:6, background:'transparent', border:'1px solid #a7f3d0', color:'#059669', cursor:'pointer', fontSize:11 }}>
              <Copy size={11} /> 복사
            </button>
          </div>
          <div style={{ padding:'16px 22px', fontSize:20, fontWeight:800, color:'#10b981' }}>{note.fixedCode}</div>
        </div>
      )}

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

      {/* 복습 완료 버튼 */}
      <button
        onClick={() => { setReviewed(true); toast({ message:'복습 완료로 표시했습니다! ✓', type:'success' }) }}
        disabled={reviewed}
        style={{ width:'100%', padding:'13px 0', borderRadius:10, cursor:reviewed?'default':'pointer', background:reviewed?'#f0fdf4':'#10b981', border:`1px solid ${reviewed?'#bbf7d0':'transparent'}`, color:reviewed?'#16a34a':'#fff', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s', opacity:reviewed?0.8:1, boxShadow:reviewed?'none':'0 2px 8px rgba(16,185,129,0.35)' }}
      >
        <CheckCircle2 size={16} />
        {reviewed ? '복습 완료! ✓' : '복습 완료로 표시'}
      </button>

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
