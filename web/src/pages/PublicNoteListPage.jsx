import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { fetchPublicNotes } from '../api/necoApi'
import PublicNoteCard from '../components/PublicNoteCard'
import { EmptyState } from '../components/ui'

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

export default function PublicNoteListPage() {
  const [notes,    setNotes]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [language, setLanguage] = useState('')
  const [keyword,  setKeyword]  = useState('')
  const [sort,     setSort]     = useState('newest')
  const [showSort, setShowSort] = useState(false)

  useEffect(() => {
    async function load() {
      const data = await fetchPublicNotes()
      setNotes(data)
      setLoading(false)
    }
    load()
  }, [])

  const displayed = useMemo(() => {
    let result = [...notes]

    // 언어 필터
    if (language) {
      result = result.filter(n => (n.languageId || n.language) === language)
    }

    // 키워드 검색 (코드, 주석, 파일명, 작성자)
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase()
      result = result.filter(n => {
        const quiz = typeof n.quiz === 'string' ? JSON.parse(n.quiz) : n.quiz
        const code     = (quiz?.blankedCode || n.code || '').toLowerCase()
        const comment  = (n.comment  || '').toLowerCase()
        const fileName = (n.fileName || '').toLowerCase()
        const author   = (n.authorNickname || '').toLowerCase()
        return code.includes(q) || comment.includes(q) || fileName.includes(q) || author.includes(q)
      })
    }

    // 정렬
    result.sort((a, b) =>
      sort === 'oldest'
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    )
    return result
  }, [notes, language, keyword, sort])

  const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? '정렬'

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12, marginBottom:14 }}>
          <div>
            <h2 style={{ margin:0, fontSize:22, color:'#1e293b' }}>공개 문제</h2>
            <p style={{ margin:'6px 0 0', fontSize:13, color:'#64748b' }}>
              다른 사용자가 공개로 저장한 코드 문제를 볼 수 있어요.
            </p>
          </div>
          <span style={{ fontSize:12, color:'#94a3b8' }}>{displayed.length}문제</span>
        </div>

        {/* 언어 필터 + 정렬 */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:10 }}>
          {LANGS.map(lang => (
            <button key={lang.value} onClick={() => setLanguage(lang.value)} style={{
              fontSize:11, padding:'5px 12px', borderRadius:8, cursor:'pointer',
              background: language === lang.value ? '#eff6ff' : '#fff',
              color:      language === lang.value ? '#2563eb' : '#64748b',
              border: `1px solid ${language === lang.value ? '#dbeafe' : '#e2e8f0'}`,
            }}>
              {lang.label}
            </button>
          ))}

          {/* 정렬 드롭다운 */}
          <div style={{ marginLeft:'auto', position:'relative' }}>
            <button onClick={() => setShowSort(p => !p)} style={{
              display:'flex', alignItems:'center', gap:5, fontSize:11,
              padding:'5px 12px', borderRadius:8, cursor:'pointer',
              background:'#fff', border:'1px solid #e2e8f0', color:'#475569',
            }}>
              <ArrowUpDown size={12} /> {sortLabel}
            </button>
            {showSort && (
              <div style={{
                position:'absolute', right:0, top:'100%', marginTop:4,
                background:'#fff', border:'1px solid #e2e8f0',
                borderRadius:9, boxShadow:'0 8px 24px rgba(0,0,0,0.1)',
                zIndex:100, overflow:'hidden', minWidth:130,
              }}>
                {SORT_OPTIONS.map(o => (
                  <div key={o.value}
                    onClick={() => { setSort(o.value); setShowSort(false) }}
                    style={{
                      padding:'9px 14px', fontSize:12, cursor:'pointer',
                      color:      sort === o.value ? '#2563eb' : '#334155',
                      fontWeight: sort === o.value ? 600 : 400,
                      background: sort === o.value ? '#eff6ff' : 'transparent',
                    }}
                    onMouseEnter={e => { if (sort !== o.value) e.currentTarget.style.background='#f8fafc' }}
                    onMouseLeave={e => { if (sort !== o.value) e.currentTarget.style.background='transparent' }}
                  >
                    {o.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 키워드 검색창 */}
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="코드, 주석, 파일명, 작성자로 검색"
          style={{
            width:'100%', boxSizing:'border-box',
            padding:'10px 12px', borderRadius:9,
            border:'1px solid #e2e8f0', fontSize:13, outline:'none',
            transition:'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor='#2563eb'}
          onBlur={e  => e.target.style.borderColor='#e2e8f0'}
        />
      </div>

      {/* 정렬 드롭다운 닫기 오버레이 */}
      {showSort && (
        <div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={() => setShowSort(false)} />
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height:180, borderRadius:12 }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={keyword || language ? '🔍' : '📭'}
          message={keyword || language ? '검색 결과가 없어요' : '공개 문제가 아직 없어요'}
          description={keyword || language
            ? '다른 키워드나 언어로 다시 시도해보세요.'
            : 'VSCode NECO에서 코드를 공개로 저장하면 여기에 나타나요.'}
        />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
          {displayed.map(note => (
            <PublicNoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}
