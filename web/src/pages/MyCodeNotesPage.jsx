import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, Trash2, Code2, Clock, Lock, Globe } from 'lucide-react'
import { fetchMyNotes } from '../api/necoApi'
import { EmptyState } from '../components/ui'
import api from '../api/client'

const LANG_MAP = {
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

const LANG_COLOR = {
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

const LANGS = [
  { value: '',               label: '전체 언어'   },
  { value: 'javascript',     label: 'JavaScript'  },
  { value: 'typescript',     label: 'TypeScript'  },
  { value: 'javascriptreact',label: 'JSX'         },
  { value: 'typescriptreact',label: 'TSX'         },
  { value: 'python',         label: 'Python'      },
  { value: 'java',           label: 'Java'        },
  { value: 'c',              label: 'C'           },
  { value: 'cpp',            label: 'C++'         },
  { value: 'kotlin',         label: 'Kotlin'      },
  { value: 'sql',            label: 'SQL'         },
]

const SORT_OPTIONS = [
  { value: 'newest', label: '최신순'   },
  { value: 'oldest', label: '오래된순' },
]

function CodeNoteCard({ note, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const lang      = note.languageId || ''
  const langLabel = LANG_MAP[lang] ?? lang
  const langStyle = LANG_COLOR[lang] ?? { bg: '#f1f5f9', color: '#475569' }

  const quiz = (() => {
    try { return typeof note.quiz === 'string' ? JSON.parse(note.quiz) : note.quiz }
    catch { return null }
  })()

  const codeLines = (note.code || '').split('\n')
  const codePreview = codeLines.slice(0, expanded ? undefined : 5).join('\n')
  const hasMore = codeLines.length > 5

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm('이 코드 노트를 삭제할까요?')) return
    setDeleting(true)
    try {
      await api.delete(`/code-notes/${note.id}`)
      onDelete(note.id)
    } catch {
      alert('삭제 실패')
      setDeleting(false)
    }
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
          <span style={{
            fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
            background: note.isPublic ? '#f0fdf4' : '#f8fafc',
            color: note.isPublic ? '#16a34a' : '#94a3b8',
            border: `1px solid ${note.isPublic ? '#bbf7d0' : '#e2e8f0'}`,
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            {note.isPublic ? <><Globe size={8} /> 공개</> : <><Lock size={8} /> 비공개</>}
          </span>
          {quiz && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
            }}>
              빈칸 퀴즈
            </span>
          )}

          {/* 삭제 버튼 */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', padding: 4, borderRadius: 6,
              color: hovered ? '#ef4444' : '#cbd5e1',
              transition: 'color 0.15s',
              display: 'flex', alignItems: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
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

        {/* 주석 */}
        {note.comment && (
          <div style={{
            fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 10,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {note.comment}
          </div>
        )}

        {/* 푸터 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94a3b8' }}>
            <Clock size={10} />
            {new Date(note.createdAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyCodeNotesPage() {
  const [notes,    setNotes]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [language, setLanguage] = useState('')
  const [keyword,  setKeyword]  = useState('')
  const [sort,     setSort]     = useState('newest')
  const [showSort, setShowSort] = useState(false)

  useEffect(() => {
    fetchMyNotes().then(data => {
      setNotes(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  const displayed = useMemo(() => {
    let result = [...notes]
    if (language) result = result.filter(n => (n.languageId || '') === language)
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase()
      result = result.filter(n =>
        (n.code || '').toLowerCase().includes(q) ||
        (n.comment || '').toLowerCase().includes(q) ||
        (n.fileName || '').toLowerCase().includes(q)
      )
    }
    result.sort((a, b) =>
      sort === 'oldest'
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    )
    return result
  }, [notes, language, keyword, sort])

  const handleDelete = (id) => setNotes(prev => prev.filter(n => n.id !== id))

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, color: '#1e293b' }}>내 코드 노트</h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
              VSCode NECO 확장에서 저장한 코드 노트예요.
            </p>
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{displayed.length}개</span>
        </div>

        {/* 언어 필터 + 정렬 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          {LANGS.map(lang => (
            <button key={lang.value} onClick={() => setLanguage(lang.value)} style={{
              fontSize: 11, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
              background: language === lang.value ? '#eff6ff' : '#fff',
              color:      language === lang.value ? '#2563eb' : '#64748b',
              border: `1px solid ${language === lang.value ? '#dbeafe' : '#e2e8f0'}`,
            }}>
              {lang.label}
            </button>
          ))}

          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <button onClick={() => setShowSort(p => !p)} style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
              padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
              background: '#fff', border: '1px solid #e2e8f0', color: '#475569',
            }}>
              <ArrowUpDown size={12} />
              {SORT_OPTIONS.find(o => o.value === sort)?.label}
            </button>
            {showSort && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                zIndex: 100, overflow: 'hidden', minWidth: 130,
              }}>
                {SORT_OPTIONS.map(o => (
                  <div key={o.value}
                    onClick={() => { setSort(o.value); setShowSort(false) }}
                    style={{
                      padding: '9px 14px', fontSize: 12, cursor: 'pointer',
                      color:      sort === o.value ? '#2563eb' : '#334155',
                      fontWeight: sort === o.value ? 600 : 400,
                      background: sort === o.value ? '#eff6ff' : 'transparent',
                    }}
                    onMouseEnter={e => { if (sort !== o.value) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (sort !== o.value) e.currentTarget.style.background = 'transparent' }}
                  >
                    {o.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 검색 */}
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="코드, 주석, 파일명으로 검색"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px', borderRadius: 9,
            border: '1px solid #e2e8f0', fontSize: 13, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#2563eb'}
          onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {showSort && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowSort(false)} />}

      {/* 목록 */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 200, borderRadius: 12, background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={keyword || language ? '🔍' : '💻'}
          message={keyword || language ? '검색 결과가 없어요' : '저장된 코드 노트가 없어요'}
          description={keyword || language
            ? '다른 키워드나 언어로 다시 시도해보세요.'
            : 'VSCode NECO 확장에서 코드를 저장하면 여기에 나타나요.'}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
          {displayed.map(note => (
            <CodeNoteCard key={note.id} note={note} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
