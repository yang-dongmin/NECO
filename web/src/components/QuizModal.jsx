import { useState, useRef, useEffect } from 'react'
import { Zap, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { reviewCodeNoteQuiz } from '../api/client'
import { createPortal } from 'react-dom'

// noteId를 받아서 퀴즈 결과를 SRS에 반영
// 정답 → quality 4 (잘 맞춤), 오답 → quality 1 (거의 모름)
export default function QuizModal({ quiz, noteId, onClose, onReviewed }) {
  const [input,    setInput]    = useState('')
  const [result,   setResult]   = useState(null)   // 'correct' | 'wrong'
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async () => {
    if (!input.trim()) return
    const normalizeAnswer = (value) =>
      value.trim().toLowerCase().replace(/\s+/g, '')

    const correct = normalizeAnswer(input) === normalizeAnswer(quiz.answer)
    const outcome = correct ? 'correct' : 'wrong'
    setResult(outcome)

    // SRS 반영: 정답=4, 오답=1
    if (noteId) {
      try {
        const srsData = await reviewCodeNoteQuiz(noteId, correct ? 4 : 1)
        onReviewed?.(noteId, srsData)
      } catch {
        // SRS 실패는 조용히 넘김 (퀴즈 경험에 영향 없음)
      }
    }
  }

  const handleRetry = () => {
    setInput('')
    setResult(null)
    setShowHint(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // [___] 부분을 강조해서 렌더링
  const renderBlankedCode = (code) => {
    return code.split('[___]').map((part, i, arr) => (
      <span key={i}>
        {part}
        {i < arr.length - 1 && (
          <span style={{
            background: result === 'correct' ? '#d1fae5' : result === 'wrong' ? '#fee2e2' : '#fef3c7',
            color:      result === 'correct' ? '#065f46' : result === 'wrong' ? '#991b1b' : '#92400e',
            border:     `1px solid ${result === 'correct' ? '#6ee7b7' : result === 'wrong' ? '#fca5a5' : '#fcd34d'}`,
            borderRadius: 4, padding: '0 6px', fontWeight: 700,
          }}>
            {result ? quiz.answer : '___'}
          </span>
        )}
      </span>
    ))
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          maxHeight: '90vh', overflow: 'auto',
        }}
      >
        {/* 헤더 */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="#f59e0b" fill="#f59e0b" />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>빈칸 퀴즈</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '18px 22px' }}>
          {/* 빈칸 코드 */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
            padding: '12px 14px', marginBottom: 16,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
            lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            color: '#334155',
          }}>
            {renderBlankedCode(quiz.blankedCode)}
          </div>

          {/* 힌트 */}
          {quiz.hint && (
            <button
              onClick={() => setShowHint(p => !p)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: '#64748b', marginBottom: showHint ? 8 : 14, padding: 0,
              }}
            >
              {showHint ? <EyeOff size={12} /> : <Eye size={12} />}
              {showHint ? '힌트 숨기기' : '힌트 보기'}
            </button>
          )}
          {showHint && quiz.hint && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
              padding: '8px 12px', fontSize: 12, color: '#92400e', marginBottom: 14,
            }}>
              💡 {quiz.hint}
            </div>
          )}

          {/* 결과 메시지 */}
          {result && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: result === 'correct' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${result === 'correct' ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 14,
              fontSize: 13, fontWeight: 600,
              color: result === 'correct' ? '#15803d' : '#dc2626',
            }}>
              {result === 'correct'
                ? <><CheckCircle2 size={15} /> 정답입니다! 복습 주기가 늘어났어요 📈</>
                : <><XCircle size={15} /> 오답이에요. 정답: <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>{quiz.answer}</code> — 곧 다시 복습해요 🔁</>
              }
            </div>
          )}

          {/* 입력 + 버튼 */}
          {!result ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="빈칸에 들어갈 답을 입력하세요..."
                style={{
                  flex: 1, padding: '9px 13px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: 13,
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  background: input.trim() ? '#2563eb' : '#e2e8f0',
                  color: input.trim() ? '#fff' : '#94a3b8',
                  fontWeight: 600, fontSize: 13, cursor: input.trim() ? 'pointer' : 'default',
                }}
              >
                확인
              </button>
            </div>
          ) : (
            <button
              onClick={handleRetry}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 8,
                background: '#f1f5f9', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: '#475569',
              }}
            >
              다시 풀기
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
