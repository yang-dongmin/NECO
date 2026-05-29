import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { fetchPublicNotes } from '../api/necoApi'
import NoteCard from '../components/NoteCard'
import { EmptyState } from '../components/ui'

const LANGS = [
  { value: '', label: '전체 언어' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascriptreact', label: 'JSX' },
  { value: 'typescriptreact', label: 'TSX' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
]

export default function PublicNoteListPage() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState('')
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState('newest')
  const [showSort, setShowSort] = useState(false)

  useEffect(() => {
    async function loadPublicNotes() {
      const data = await fetchPublicNotes()
      setNotes(data)
      setLoading(false)
    }

    loadPublicNotes()
  }, [])

  const displayed = useMemo(() => {
    let result = [...notes]

    if (language) {
      result = result.filter(note => {
        return (note.languageId || note.language) === language
      })
    }

    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase()

      result = result.filter(note => {
        const quiz =
          typeof note.quiz === 'string'
            ? JSON.parse(note.quiz)
            : note.quiz

        const code = quiz?.blankedCode || note.code || ''
        const comment = note.comment || ''
        const fileName = note.fileName || ''
        const author = note.authorNickname || ''

        return (
          code.toLowerCase().includes(q) ||
          comment.toLowerCase().includes(q) ||
          fileName.toLowerCase().includes(q) ||
          author.toLowerCase().includes(q)
        )
      })
    }

    result.sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt)
      }

      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    return result
  }, [notes, language, keyword, sort])

  const sortLabel = SORT_OPTIONS.find(option => option.value === sort)?.label ?? '정렬'

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 22,
              color: '#1e293b'
            }}>
              공개 문제
            </h2>

            <p style={{
              margin: '6px 0 0',
              fontSize: 13,
              color: '#64748b'
            }}>
              다른 사용자가 공개로 저장한 코드 문제를 볼 수 있어요.
            </p>
          </div>

          <span style={{
            fontSize: 12,
            color: '#94a3b8'
          }}>
            {displayed.length}문제
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 10
        }}>
          {LANGS.map(lang => (
            <button
              key={lang.value}
              onClick={() => setLanguage(lang.value)}
              style={{
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: language === lang.value ? '#eff6ff' : '#fff',
                color: language === lang.value ? '#2563eb' : '#64748b',
                border: `1px solid ${language === lang.value ? '#dbeafe' : '#e2e8f0'}`
              }}
            >
              {lang.label}
            </button>
          ))}

          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <button
              onClick={() => setShowSort(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: '#fff',
                border: '1px solid #e2e8f0',
                color: '#475569'
              }}
            >
              <ArrowUpDown size={12} />
              {sortLabel}
            </button>

            {showSort && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 4,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 9,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                zIndex: 100,
                overflow: 'hidden',
                minWidth: 130
              }}>
                {SORT_OPTIONS.map(option => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setSort(option.value)
                      setShowSort(false)
                    }}
                    style={{
                      padding: '9px 14px',
                      fontSize: 12,
                      cursor: 'pointer',
                      color: sort === option.value ? '#2563eb' : '#334155',
                      fontWeight: sort === option.value ? 600 : 400,
                      background: sort === option.value ? '#eff6ff' : 'transparent'
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <input
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="코드, 주석, 파일명, 작성자로 검색"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px',
            borderRadius: 9,
            border: '1px solid #e2e8f0',
            fontSize: 13,
            outline: 'none'
          }}
        />
      </div>

      {showSort && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setShowSort(false)}
        />
      )}

      {loading ? (
        <EmptyState icon="⏳" message="공개 문제를 불러오는 중입니다." />
      ) : displayed.length === 0 ? (
        <EmptyState icon="📭" message="조건에 맞는 공개 문제가 없습니다." />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))',
          gap: 14
        }}>
          {displayed.map(note => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}