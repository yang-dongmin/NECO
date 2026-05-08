import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import logo from '../assets/neco.png';

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const { login } = useAuthStore()
  const navigate  = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return }
    login({ name: email.split('@')[0], email }, 'mock-jwt-token')
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 400 }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb, #10b981)', fontSize: 24, marginBottom: 14, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
            <img src={logo} alt="로고" style={{ width: '80px', height: '60px', borderRadius: 30, objectFit: 'contain' }} />
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>코드 오답노트</div>
        </div>

        {/* 카드 */}
        <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 22 }}>로그인</div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="이메일" type="email"    value={email}    onChange={setEmail}    placeholder="you@example.com" />
            <Field label="비밀번호" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            <button
              type="submit"
              style={{
                marginTop: 6, padding: '12px 0', borderRadius: 9, background: '#2563eb',
                border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
            >
              로그인
            </button>
          </form>

          <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 18 }}>
            <span style={{ color: '#64748b' }}>아직 계정이 없으신가요? </span>
            <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/register')}>
              회원가입
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#94a3b8' }}>
          개발 모드: 아무 이메일/비밀번호나 입력 후 로그인
        </div>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
          border: `1px solid ${focused ? '#2563eb' : '#e2e8f0'}`,
          background: '#fff', color: '#1e293b', outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
          transition: 'all 0.15s', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
