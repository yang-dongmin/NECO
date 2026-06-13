import { useState } from 'react'
import { Trash2, Code2, Clock, Lock, Globe, Zap, Pencil, Check, X } from 'lucide-react'
import { deleteCodeNote, updateCodeNote } from '../api/client'
import { useToast } from './Toast'
import QuizModal from './QuizModal'

export const LANG_MAP = {
  javascript:       'JavaScript',
  typescript:       'TypeScript',
  javascriptreact:  'JSX',
  typescriptreact:  'TSX',
  python:           'Python',
  java:             'Java',
  c:                'C',
  cpp:              'C++',
  kotlin:           'Kotlin',
  sql:              'SQL',
}

export const LANG_COLOR = {
  javascript:       { bg: '#fef3c7', color: '#d97706' },
  typescript:       { bg: '#eff6ff', color: '#2563eb' },
  javascriptreact:  { bg: '#fef3c7', color: '#d97706' },
  typescriptreact:  { bg: '#eff6ff', color: '#2563eb' },
  python:           { bg: '#f0fdf4', color: '#16a34a' },
  java:             { bg: '#fef2f2', color: '#dc2626' },
  c:                { bg: '#f5f3ff', color: '#7c3aed' },
  cpp:              { bg: '#f5f3ff', color: '#7c3aed' },
  kotlin:           { bg: '#fdf4ff', color: '#a21caf' },
  sql:              { bg: '#ecfdf5', color: '#059669' },
}

// SRS 뱃지 계산: next_review_at 기준으로 오늘/N일 후 반환
function getSrsBadge(srsCard) {
  if (!srsCard) return null
  const nextReview = new Date(srsCard.next_review_at ?? srsCard.nextReviewAt)
  if (isNaN(nextReview.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((nextReview - today) / 86400000)
  return diffDays <= 0
    ? { label: '오늘 복습 📌', urgent: true }
    : { label: `${diffDays}일 후 복습`, urgent: false }
}

// props:
//   note       — code note object
//   onDelete   — (id) → remove note from parent list
//   srsCard    — SRS 카드 데이터 (next_review_at 포함), 없으면 null
//   onSrsUpdate— (noteId, srsData) → parent updates srsMap
export default function CodeNoteCard({ note, onDelete, srsCard, onSrsUpdate }) {
  const toast = useToast()

  // UI state
  const [hovered,          setHovered]          = useState(false)
  const [expanded,         setExpanded]         = useState(false)
  const [deleting,         setDeleting]         = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [quizOpen,         setQuizOpen]         = useState(false)

  // 인라인 편집 state
  const [editing,      setEditing]      = useState(false)
  const [editComment,  setEditComment]  = useState(note.comment || '')
  const [editIsPublic, setEditIsPublic] = useState(!!note.isPublic)
  const [saving,       setSaving]       = useState(false)

  // 편집 중에도 로컬 표시용 (저장 후 반영)
  const [localComment,  setLocalComment]  = useState(note.comment || '')
  const [localIsPublic, setLocalIsPublic] = useState(!!note.isPublic)

  const lang      = note.languageId || ''
  const langLabel = LANG_MAP[lang] ?? lang
  const langStyle = LANG_COLOR[lang] ?? { bg: '#f1f5f9', color: '#475569' }

  const quiz = (() => {
    try { return typeof note.quiz === 'string' ? JSON.parse(note.quiz) : note.quiz }
    catch { return null }
  })()

  const codeLines   = (note.code || '').split('\n')
  const codePreview = codeLines.slice(0, expanded ? undefined : 5).join('\n')
  const hasMore     = codeLines.length > 5

  const srsBadge = getSrsBadge(srsCard)

  // ── 삭제 핸들러 ──────────────────────────────────────────────
  const handleDeleteClick = (e) => { e.stopPropagation(); setConfirmingDelete(true) }
  const handleDeleteCancel = (e) => { e.stopPropagation(); setConfirmingDelete(false) }
  const handleDeleteConfirm = async (e) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      await deleteCodeNote(note.id)
      toast({ message: '코드 노트가 삭제됐어요.', type: 'success' })
      onDelete(note.id)
    } catch {
      toast({ message: '삭제에 실패했어요. 다시 시도해주세요.', type: 'error' })
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  // ── 편집 핸들러 ──────────────────────────────────────────────
  const handleEditOpen = (e) => {
    e.stopPropagation()
    setEditComment(localComment)
    setEditIsPublic(localIsPublic)
    setEditing(true)
  }
  const handleEditCancel = (e) => { e.stopPropagation(); setEditing(false) }
  const handleEditSave = async (e) => {
    e.stopPropagation()
    setSaving(true)
    try {
      await updateCodeNote(note.id, { comment: editComment, isPublic: editIsPublic })
      setLocalComment(editComment)
      setLocalIsPublic(editIsPublic)
      setEditing(false)
      toast({ message: '노트가 수정됐어요.', type: 'success' })
    } catch {
      toast({ message: '수정에 실패했어요. 다시 시도해주세요.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // ── SRS 결과 콜백 ─────────────────────────────────────────────
  const handleReviewed = (noteId, srsData) => {
    onSrsUpdate?.(noteId, srsData)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? '#bfdbfe' : '#f1f5f9'}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: hovered ? '0 4px 16px rgba(37,99,235,0.10)' : '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* 언어 인디케이터 */}
      <div style={{ width: 4, flexShrink: 0, background: langStyle.color, borderRadius: '12px 0 0 12px' }} />

      <div style={{ flex: 1, padding: '14px 16px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {langLabel && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
              background: langStyle.bg, color: langStyle.color,
              border: `1px solid ${langStyle.color}30`,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {langLabel}
            </span>
          )}
          {note.fileName && (
            <span style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'JetBrains Mono, monospace' }}>
              <Code2 size={10} />
              {note.fileName.split(/[\\/]/).pop()}
            </span>
          )}

          {/* 공개/비공개 뱃지 (편집 모드 아닐 때) */}
          {!editing && (
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
              background: localIsPublic ? '#f0fdf4' : '#f8fafc',
              color: localIsPublic ? '#16a34a' : '#94a3b8',
              border: `1px solid ${localIsPublic ? '#bbf7d0' : '#e2e8f0'}`,
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              {localIsPublic ? <><Globe size={8} /> 공개</> : <><Lock size={8} /> 비공개</>}
            </span>
          )}

          {/* SRS 뱃지 */}
          {srsBadge && !editing && (
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
              background: srsBadge.urgent ? '#fef2f2' : '#f0f9ff',
              color:      srsBadge.urgent ? '#dc2626'  : '#0369a1',
              border:     `1px solid ${srsBadge.urgent ? '#fecaca' : '#bae6fd'}`,
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              {srsBadge.label}
            </span>
          )}

          {/* 퀴즈 버튼 */}
          {quiz && !editing && (
            <button
              onClick={e => { e.stopPropagation(); setQuizOpen(true) }}
              style={{
                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              <Zap size={8} fill="#d97706" /> 퀴즈 풀기
            </button>
          )}

          {/* 액션 버튼 영역 */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            {editing ? (
              /* 편집 모드: 저장/취소 */
              <>
                <button
                  onClick={handleEditSave}
                  disabled={saving}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 6,
                    background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}
                >
                  <Check size={11} /> {saving ? '저장 중' : '저장'}
                </button>
                <button
                  onClick={handleEditCancel}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                    background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}
                >
                  <X size={11} /> 취소
                </button>
              </>
            ) : confirmingDelete ? (
              /* 삭제 확인 */
              <>
                <span style={{ fontSize: 11, color: '#64748b' }}>삭제할까요?</span>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 6,
                    background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer',
                  }}
                >
                  {deleting ? '...' : '삭제'}
                </button>
                <button
                  onClick={handleDeleteCancel}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 6,
                    background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer',
                  }}
                >
                  취소
                </button>
              </>
            ) : (
              /* 기본: 편집 + 삭제 아이콘 */
              <>
                <button
                  onClick={handleEditOpen}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6,
                    color: hovered ? '#2563eb' : '#cbd5e1', transition: 'color 0.15s',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={handleDeleteClick}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6,
                    color: hovered ? '#ef4444' : '#cbd5e1', transition: 'color 0.15s',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 코드 미리보기 */}
        <div style={{
          background: hovered ? '#f0f7ff' : '#f8fafc',
          border: `1px solid ${hovered ? '#dbeafe' : '#f1f5f9'}`,
          borderRadius: 8, padding: '9px 12px', marginBottom: 10,
          fontSize: 11, color: '#334155', lineHeight: 1.7,
          fontFamily: 'JetBrains Mono, monospace',
          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          transition: 'background 0.18s',
        }}>
          {codePreview || '코드 없음'}
          {hasMore && (
            <button
              onClick={() => setExpanded(p => !p)}
              style={{
                display: 'block', marginTop: 6, background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 10, color: '#2563eb', padding: 0,
              }}
            >
              {expanded ? '접기 ▲' : `+${codeLines.length - 5}줄 더 보기 ▼`}
            </button>
          )}
        </div>

        {/* 주석 — 편집 모드일 때 textarea로 전환 */}
        {editing ? (
          <div style={{ marginBottom: 10 }}>
            <textarea
              value={editComment}
              onChange={e => setEditComment(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="주석을 입력하세요"
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px', borderRadius: 8,
                border: '1px solid #93c5fd', fontSize: 12, lineHeight: 1.6,
                resize: 'vertical', outline: 'none', color: '#334155',
                fontFamily: 'inherit',
              }}
            />
            {/* 공개/비공개 토글 */}
            <button
              onClick={e => { e.stopPropagation(); setEditIsPublic(p => !p) }}
              style={{
                marginTop: 6, display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: editIsPublic ? '#16a34a' : '#94a3b8',
                padding: 0,
              }}
            >
              {editIsPublic ? <><Globe size={11} /> 공개</> : <><Lock size={11} /> 비공개</>}
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>— 클릭해서 전환</span>
            </button>
          </div>
        ) : (
          localComment && (
            <div style={{
              fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 10,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {localComment}
            </div>
          )
        )}

        {/* 푸터 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94a3b8' }}>
            <Clock size={10} />
            {new Date(note.createdAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 퀴즈 모달 */}
      {quizOpen && quiz && (
        <QuizModal
          quiz={quiz}
          noteId={note.id}
          onClose={() => setQuizOpen(false)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  )
}
