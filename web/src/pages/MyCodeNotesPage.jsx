import { useEffect, useMemo, useState, useCallback } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { fetchMyCodeNotes, fetchCodeNoteSrs } from '../api/client'
import { subscribeToNotes } from '../api/necoApi'
import { EmptyState } from '../components/ui'
import CodeNoteCard from '../components/CodeNoteCard'

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

export default function MyCodeNotesPage() {
  const [notes,    setNotes]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [language, setLanguage] = useState('')
  const [keyword,  setKeyword]  = useState('')
  const [sort,     setSort]     = useState('newest')
  const [showSort, setShowSort] = useState(false)

  // SRS 카드 맵: { [code_note_id]: { ef, interval_days, repetitions, next_review_at, ... } }
  const [srsMap, setSrsMap] = useState({})

  useEffect(() => {
    Promise.all([
      fetchMyCodeNotes().catch(() => []),
      fetchCodeNoteSrs().catch(() => ({ cards: [] })),
    ]).then(([notesData, srsData]) => {
      setNotes(Array.isArray(notesData) ? notesData : [])
      // cards 배열을 code_note_id 키 맵으로 변환
      const map = {}
      const cards = srsData?.cards ?? []
      for (const card of cards) {
        map[card.code_note_id] = card
      }
      setSrsMap(map)
    }).finally(() => setLoading(false))

    // VSCode에서 새 노트 저장 시 실시간 반영
    const unsubscribe = subscribeToNotes((newNote) => {
      setNotes(prev => [newNote, ...prev])
    })
    return unsubscribe
  }, [])

  // QuizModal의 onReviewed 콜백 — SRS 결과로 맵 업데이트
  const handleSrsUpdate = useCallback((noteId, srsData) => {
    // srsData: { ef, intervalDays, repetitions, nextReviewAt }
    setSrsMap(prev => ({
      ...prev,
      [noteId]: {
        ...prev[noteId],
        code_note_id:   noteId,
        ef:             srsData.ef,
        interval_days:  srsData.intervalDays,
        repetitions:    srsData.repetitions,
        next_review_at: srsData.nextReviewAt,
      },
    }))
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
            <CodeNoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              srsCard={srsMap[note.id] ?? null}
              onSrsUpdate={handleSrsUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
