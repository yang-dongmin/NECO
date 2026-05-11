import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useNoteStore } from '../store'
import { addUserNote, updateUserNote, getAllNotes, MOCK_TAGS, SUBJECTS, isMockNote } from '../api/mock'
import { useToast } from '../components/Toast'

const LANGUAGES = [
  { value:'theory', label:'이론형' }, { value:'sql', label:'SQL' },
  { value:'c',      label:'C언어' }, { value:'python', label:'Python' },
  { value:'javascript', label:'JS' }, { value:'java', label:'Java' },
]
const ROUNDS = [1, 2, 3]
const DRAFT_KEY = 'ct_add_draft'

function Field({ label, required, error, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:6 }}>
        {label} {required && <span style={{ color:'#ef4444' }}>*</span>}
      </label>
      {children}
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5, fontSize:11, color:'#dc2626' }}>
          <AlertCircle size={11} /> {error}
        </div>
      )}
    </div>
  )
}

function CodeTextarea({ value, onChange, placeholder, accent }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
      onKeyDown={e=>{
        if (e.key==='Tab') {
          e.preventDefault()
          const s = e.target.selectionStart
          const next = value.substring(0,s)+'  '+value.substring(e.target.selectionEnd)
          onChange(next)
          requestAnimationFrame(()=>{ e.target.selectionStart=e.target.selectionEnd=s+2 })
        }
      }}
      style={{
        width:'100%', minHeight:160, resize:'vertical',
        background:'#f8fafc', borderRadius:8, padding:'12px 14px',
        fontFamily:'JetBrains Mono,monospace', fontSize:12.5, lineHeight:1.8,
        color:'#1e293b', outline:'none', boxSizing:'border-box',
        border:`1.5px solid ${focused?(accent??'#2563eb'):'#e2e8f0'}`,
        boxShadow: focused?`0 0 0 3px ${accent?accent+'22':'rgba(37,99,235,0.1)'}`:'-none',
        transition:'all 0.15s',
      }}
    />
  )
}

function TagInput({ selected, onChange }) {
  const [input, setInput] = useState('')
  const suggestions = MOCK_TAGS.map(t=>t.name).filter(n=>!selected.includes(n))
  const filtered = input ? suggestions.filter(n=>n.toLowerCase().includes(input.toLowerCase())) : suggestions
  const add    = (name)=>{ if(name.trim()&&!selected.includes(name.trim())) onChange([...selected,name.trim()]); setInput('') }
  const remove = (name)=>onChange(selected.filter(t=>t!==name))
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:selected.length?8:0 }}>
        {selected.map(name=>(
          <span key={name} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, padding:'3px 10px', borderRadius:99, background:'#eff6ff', color:'#2563eb', border:'1px solid #dbeafe' }}>
            {name}
            <span onClick={()=>remove(name)} style={{ cursor:'pointer', opacity:0.6, fontSize:12 }}>✕</span>
          </span>
        ))}
      </div>
      <div style={{ position:'relative' }}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&input.trim()){e.preventDefault();add(input)} }}
          placeholder="태그 입력 후 Enter"
          style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', fontSize:13, outline:'none', boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor='#2563eb'}
          onBlur={e=>{ e.target.style.borderColor='#e2e8f0'; setTimeout(()=>setInput(''),150) }}
        />
        {input && filtered.length > 0 && (
          <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:10, background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, marginTop:4, overflow:'hidden', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}>
            {filtered.slice(0,6).map(name=>(
              <div key={name} onMouseDown={()=>add(name)}
                style={{ padding:'8px 12px', cursor:'pointer', fontSize:13, color:'#334155' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}
              >{name}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


// ── 객관식 보기 빌더 ─────────────────────────────────────────────────────────
const CHOICE_MARKERS = ['①', '②', '③', '④']

function QuizBuilder({ onInsert }) {
  const [question, setQuestion] = useState('')
  const [choices,  setChoices]  = useState(['', '', '', ''])
  const [open,     setOpen]     = useState(false)

  const updateChoice = (i, val) => {
    const next = [...choices]
    next[i]    = val
    setChoices(next)
  }

  const handleInsert = () => {
    if (!question.trim()) return
    const body = question + '\n\n' + choices
      .filter(c => c.trim())
      .map((c, i) => `${CHOICE_MARKERS[i]} ${c}`)
      .join('\n')
    onInsert(body)
    setQuestion('')
    setChoices(['', '', '', ''])
    setOpen(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ fontSize: 11, padding: '4px 12px', borderRadius: 7, cursor: 'pointer', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', marginBottom: 8 }}>
      ✦ 객관식 빌더 열기
    </button>
  )

  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginBottom: 10 }}>객관식 문제 빌더</div>
      <textarea value={question} onChange={e => setQuestion(e.target.value)}
        placeholder="문제 지문을 입력하세요"
        style={{ width: '100%', minHeight: 56, padding: '8px 10px', borderRadius: 7, border: '1px solid #bbf7d0', background: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 8, resize: 'vertical' }} />
      {choices.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>{CHOICE_MARKERS[i]}</span>
          <input value={c} onChange={e => updateChoice(i, e.target.value)}
            placeholder={`선택지 ${i + 1}`}
            style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: '1px solid #bbf7d0', background: '#fff', fontSize: 12, outline: 'none' }} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={handleInsert} style={{ flex: 1, padding: '7px 0', borderRadius: 7, background: '#10b981', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          문제에 삽입
        </button>
        <button onClick={() => setOpen(false)} style={{ padding: '7px 14px', borderRadius: 7, background: 'transparent', border: '1px solid #bbf7d0', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
          닫기
        </button>
      </div>
    </div>
  )
}

export default function AddNotePage() {
  const navigate   = useNavigate()
  const { id }     = useParams()           // edit 모드일 때 id 존재
  const isEdit     = !!id
  const { addNote, updateNote } = useNoteStore()
  const toast      = useToast()

  const EMPTY = { subject:'sw-design', year:new Date().getFullYear(), round:1, wrongCode:'', fixedCode:'', explanation:'', language:'theory', tags:[] }

  const [form,       setForm]       = useState(EMPTY)
  const [errors,     setErrors]     = useState({})
  const [success,    setSuccess]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hasDraft,   setHasDraft]   = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const debounceRef = useRef(null)

  // ── edit 모드: 기존 데이터 로드 ───────────────────────────────────────────
  useEffect(() => {
    if (isEdit) {
      const note = getAllNotes().find(n=>n.id===Number(id))
      if (!note) { navigate('/notes'); return }
      setForm({ ...note, tags: note.tags.map(t=>t.name) })
    } else {
      // draft 복원 확인
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) setHasDraft(true)
    }
  }, [id])

  // ── 자동저장 (create 모드만) ──────────────────────────────────────────────
  const set = (key, val) => {
    const next = { ...form, [key]: val }
    setForm(next)
    setErrors(e=>({ ...e, [key]:'' }))
    if (!isEdit) {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(()=>{
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
      }, 3000)
    }
  }

  const restoreDraft = () => {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) { setForm(JSON.parse(draft)); setHasDraft(false); toast({ message:'임시 저장된 내용을 복원했습니다.', type:'info' }) }
  }
  const discardDraft = () => { localStorage.removeItem(DRAFT_KEY); setHasDraft(false) }

  const validate = () => {
    const e = {}
    if (!form.wrongCode.trim())   e.wrongCode   = '문제 내용을 입력해주세요.'
    if (!form.fixedCode.trim())   e.fixedCode   = '정답을 입력해주세요.'
    if (!form.explanation.trim()) e.explanation = '해설을 입력해주세요.'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length>0) { setErrors(e); return }
    setSubmitting(true)

    if (isEdit) {
      updateUserNote(Number(id), { ...form, tags: form.tags })
      updateNote(Number(id), { ...form, tags: form.tags.map((name,i)=>({id:Number(id)*100+i,name})) })
      toast({ message:'문제가 수정됐습니다! ✓', type:'success' })
      navigate(`/notes/${id}`)
    } else {
      const note = addUserNote(form)
      addNote(note)
      localStorage.removeItem(DRAFT_KEY)
      setSubmitting(false)
      setSuccess(true)
      toast({ message:'문제가 추가됐습니다! 📝', type:'success' })
      setTimeout(()=>navigate('/notes'), 1200)
    }
  }

  if (success) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:320, gap:14 }}>
      <div style={{ width:60, height:60, borderRadius:'50%', background:'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <CheckCircle2 size={28} color="#10b981" />
      </div>
      <div style={{ fontSize:18, fontWeight:700, color:'#1e293b' }}>문제가 추가됐습니다!</div>
      <div style={{ fontSize:13, color:'#64748b' }}>문제 목록으로 이동 중...</div>
    </div>
  )

  return (
    <div style={{ maxWidth:860, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>
      {/* 헤더 */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={()=>navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:7, background:'#fff', border:'1px solid #e2e8f0', color:'#64748b', cursor:'pointer', fontSize:12 }}>
          <ArrowLeft size={13} /> 뒤로
        </button>
        <span style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>{isEdit ? '문제 수정' : '새 문제 추가'}</span>
        {!isEdit && (
          <button onClick={()=>setShowPreview(p=>!p)} style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:7, background:showPreview?'#2563eb':'#fff', border:'1px solid #e2e8f0', color:showPreview?'#fff':'#64748b', cursor:'pointer', fontSize:12 }}>
            {showPreview ? '편집 모드' : '미리보기'}
          </button>
        )}
      </div>

      {/* Draft 복원 배너 */}
      {hasDraft && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <RotateCcw size={16} color="#d97706" />
          <span style={{ fontSize:13, color:'#92400e', flex:1 }}>저장되지 않은 임시 작성 내용이 있습니다. 복원하시겠어요?</span>
          <button onClick={restoreDraft} style={{ padding:'5px 14px', borderRadius:7, background:'#d97706', border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>복원</button>
          <button onClick={discardDraft} style={{ padding:'5px 10px', borderRadius:7, background:'transparent', border:'1px solid #fde68a', color:'#92400e', cursor:'pointer', fontSize:12 }}>무시</button>
        </div>
      )}

      {/* 메타 정보 */}
      <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        <Field label="과목">
          <select value={form.subject} onChange={e=>set('subject',e.target.value)}
            style={{ width:'100%', padding:'9px 10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', fontSize:13, color:'#1e293b', outline:'none' }}>
            {SUBJECTS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="시행 연도">
          <select value={form.year} onChange={e=>set('year',Number(e.target.value))}
            style={{ width:'100%', padding:'9px 10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', fontSize:13, color:'#1e293b', outline:'none' }}>
            {[2025,2024,2023,2022,2021].map(y=><option key={y} value={y}>{y}년</option>)}
          </select>
        </Field>
        <Field label="회차">
          <select value={form.round} onChange={e=>set('round',Number(e.target.value))}
            style={{ width:'100%', padding:'9px 10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', fontSize:13, color:'#1e293b', outline:'none' }}>
            {ROUNDS.map(r=><option key={r} value={r}>{r}회</option>)}
          </select>
        </Field>
      </div>

      {/* 문제 / 정답 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ background:'#fff', border:`1px solid ${errors.wrongCode?'#fecaca':'#f1f5f9'}`, borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <Field label="문제 내용" required error={errors.wrongCode}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444' }} />
              <span style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>문제</span>
            </div>
            <QuizBuilder onInsert={v => set('wrongCode', v)} />
            <CodeTextarea value={form.wrongCode} onChange={v=>set('wrongCode',v)} accent="#ef4444"
              placeholder={`다음 중 OCP에 대한 설명으로 옳은 것은?\n\n① ...\n② ...\n③ ...\n④ ...`} />
          </Field>
        </div>
        <div style={{ background:'#fff', border:`1px solid ${errors.fixedCode?'#fecaca':'#f1f5f9'}`, borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <Field label="정답" required error={errors.fixedCode}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#10b981' }} />
              <span style={{ fontSize:11, color:'#059669', fontWeight:600 }}>정답</span>
            </div>
            <CodeTextarea value={form.fixedCode} onChange={v=>set('fixedCode',v)} accent="#10b981"
              placeholder="정답: ②" />
          </Field>
        </div>
      </div>

      {/* 해설 + 미리보기 */}
      <div style={{ background:'#fff', border:`1px solid ${errors.explanation?'#fecaca':'#f1f5f9'}`, borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <Field label="해설 (마크다운 지원)" required error={errors.explanation}>
          {showPreview ? (
            <div style={{ minHeight:110, padding:'12px 14px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:13, color:'#334155', lineHeight:1.8 }}>
              <ReactMarkdown
                components={{
                  p:      ({children})=><p style={{marginBottom:8}}>{children}</p>,
                  strong: ({children})=><strong style={{color:'#1e293b'}}>{children}</strong>,
                  code:   ({children})=><code style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,background:'#e0e7ff',color:'#2563eb',padding:'1px 6px',borderRadius:4}}>{children}</code>,
                  table:  ({children})=><div style={{overflowX:'auto'}}><table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>{children}</table></div>,
                  th:     ({children})=><th style={{background:'#f1f5f9',padding:'6px 12px',border:'1px solid #e2e8f0',fontWeight:600,textAlign:'left'}}>{children}</th>,
                  td:     ({children})=><td style={{padding:'6px 12px',border:'1px solid #e2e8f0',color:'#475569'}}>{children}</td>,
                }}
              >{form.explanation || '_내용을 입력하면 여기서 미리볼 수 있어요_'}</ReactMarkdown>
            </div>
          ) : (
            <textarea value={form.explanation} onChange={e=>set('explanation',e.target.value)}
              placeholder={`**굵게**, \`코드\`, | 표 | 지원\n\n예) OCP는 확장에는 열려 있고, 변경에는 닫혀 있어야 합니다.`}
              style={{ width:'100%', minHeight:110, resize:'vertical', padding:'12px 14px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', fontSize:13, lineHeight:1.8, color:'#1e293b', outline:'none', boxSizing:'border-box' }}
              onFocus={e=>e.target.style.borderColor='#2563eb'}
              onBlur={e=>e.target.style.borderColor='#e2e8f0'}
            />
          )}
        </Field>
      </div>

      {/* 유형 + 태그 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <Field label="문제 유형">
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {LANGUAGES.map(l=>(
                <button key={l.value} onClick={()=>set('language',l.value)} style={{ fontSize:12, padding:'5px 14px', borderRadius:7, cursor:'pointer', background:form.language===l.value?'#2563eb':'#f8fafc', color:form.language===l.value?'#fff':'#64748b', border:`1px solid ${form.language===l.value?'#2563eb':'#e2e8f0'}`, fontWeight:form.language===l.value?600:400 }}>
                  {l.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <Field label="태그">
            <TagInput selected={form.tags} onChange={tags=>set('tags',tags)} />
          </Field>
        </div>
      </div>

      {/* 제출 */}
      <div style={{ display:'flex', gap:10, paddingBottom:20 }}>
        <button onClick={()=>navigate(-1)} style={{ padding:'11px 28px', borderRadius:9, cursor:'pointer', background:'#fff', border:'1px solid #e2e8f0', color:'#64748b', fontSize:13 }}>
          취소
        </button>
        <button onClick={handleSubmit} disabled={submitting} style={{ flex:1, padding:'12px 0', borderRadius:9, cursor:submitting?'default':'pointer', background:'#2563eb', border:'none', color:'#fff', fontSize:14, fontWeight:700, boxShadow:'0 2px 8px rgba(37,99,235,0.3)', opacity:submitting?0.6:1 }}>
          {submitting ? '저장 중...' : isEdit ? '✓ 수정 완료' : '✓ 문제 추가하기'}
        </button>
      </div>
    </div>
  )
}
