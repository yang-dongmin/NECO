import { useState } from 'react'
import { Clock, User, Code2, Heart } from 'lucide-react'
import { toggleCodeNoteLike } from '../api/client'

// 언어 ID → 표시 이름
const LANG_MAP = {
  javascript:      'JavaScript',
  typescript:      'TypeScript',
  javascriptreact: 'JSX',
  typescriptreact: 'TSX',
  python:          'Python',
  java:            'Java',
  c:               'C',
  cpp:             'C++',
  kotlin:          'Kotlin',
  sql:             'SQL',
}

// 언어별 색상
const LANG_COLOR = {
  javascript:      { bg: '#fef3c7', color: '#d97706' },
  typescript:      { bg: '#eff6ff', color: '#2563eb' },
  javascriptreact: { bg: '#fef3c7', color: '#d97706' },
  typescriptreact: { bg: '#eff6ff', color: '#2563eb' },
  python:          { bg: '#f0fdf4', color: '#16a34a' },
  java:            { bg: '#fef2f2', color: '#dc2626' },
  c:               { bg: '#f5f3ff', color: '#7c3aed' },
  cpp:             { bg: '#f5f3ff', color: '#7c3aed' },
  kotlin:          { bg: '#fdf4ff', color: '#a21caf' },
  sql:             { bg: '#ecfdf5', color: '#059669' },
}

export default function PublicNoteCard({ note, onClick }) {
  const [hovered,   setHovered]   = useState(false)
  const [liked,     setLiked]     = useState(Boolean(note.likedByMe))
  const [likeCount, setLikeCount] = useState(Number(note.likeCount) || 0)
  const [liking,    setLiking]    = useState(false)

  const lang      = note.languageId || note.language || ''
  const langLabel = LANG_MAP[lang] ?? lang
  const langStyle = LANG_COLOR[lang] ?? { bg: '#f1f5f9', color: '#475569' }

  const quiz = (() => {
    try {
      return typeof note.quiz === 'string' ? JSON.parse(note.quiz) : note.quiz
    } catch { return null }
  })()

  const codePreview = (quiz?.blankedCode || note.code || '').split('\n').slice(0, 4).join('\n')

  const handleLike = async (e) => {
    e.stopPropagation()
    if (liking) return
    setLiking(true)
    // 낙관적 업데이트
    const nextLiked = !liked
    setLiked(nextLiked)
    setLikeCount(c => c + (nextLiked ? 1 : -1))
    try {
      const data = await toggleCodeNoteLike(note.id)
      setLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch {
      // 실패 시 롤백
      setLiked(liked)
      setLikeCount(likeCount)
    } finally {
      setLiking(false)
    }
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? '#bfdbfe' : '#f1f5f9'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: hovered
          ? '0 4px 16px rgba(37,99,235,0.10)'
          : '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* 언어 컬러 인디케이터 */}
      <div style={{
        width: 4, flexShrink: 0,
        background: langStyle.color,
        borderRadius: '12px 0 0 12px',
      }} />

      <div style={{ flex: 1, padding: '14px 16px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {langLabel && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '2px 9px', borderRadius: 99,
              background: langStyle.bg, color: langStyle.color,
              border: `1px solid ${langStyle.color}30`,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {langLabel}
            </span>
          )}
          {note.fileName && (
            <span style={{
              fontSize: 10, color: '#64748b',
              display: 'flex', alignItems: 'center', gap: 3,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              <Code2 size={10} />
              {note.fileName.split('/').pop()}
            </span>
          )}
          {/* 빈칸 퀴즈 배지 */}
          {quiz && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 8px',
              borderRadius: 99, background: '#fffbeb',
              color: '#d97706', border: '1px solid #fde68a',
              marginLeft: 'auto',
            }}>
              빈칸 퀴즈
            </span>
          )}
        </div>

        {/* 코드 미리보기 */}
        <div style={{
          background: hovered ? '#f0f7ff' : '#f8fafc',
          border: `1px solid ${hovered ? '#dbeafe' : '#f1f5f9'}`,
          borderRadius: 8, padding: '9px 12px', marginBottom: 10,
          fontSize: 11, color: '#334155', lineHeight: 1.7,
          fontFamily: 'JetBrains Mono, monospace',
          overflow: 'hidden',
          maxHeight: hovered ? 100 : 70,
          transition: 'max-height 0.25s ease, background 0.18s',
          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>
          {codePreview || '코드 없음'}
        </div>

        {/* 주석 미리보기 */}
        {note.comment && (
          <div style={{
            fontSize: 12, color: '#475569', lineHeight: 1.6,
            marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {note.comment}
          </div>
        )}

        {/* 푸터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {note.authorNickname && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
              <User size={11} />
              {note.authorNickname}
            </div>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* 좋아요 버튼 */}
            <button
              onClick={handleLike}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 11, color: liked ? '#ef4444' : '#94a3b8',
                transition: 'color 0.15s',
              }}
            >
              <Heart
                size={13}
                fill={liked ? '#ef4444' : 'none'}
                color={liked ? '#ef4444' : '#94a3b8'}
                style={{ transition: 'all 0.15s' }}
              />
              {likeCount > 0 && likeCount}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94a3b8' }}>
              <Clock size={10} />
              {new Date(note.createdAt).toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
