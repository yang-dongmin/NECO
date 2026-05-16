import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import logo from '../assets/neco.png';

export default function LoginPage() {
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { login } = useAuthStore()
  const navigate = useNavigate()

  const resetMessage = () => {
    setError('')
    setSuccess('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    resetMessage()

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || '로그인에 실패했습니다.')
        return
      }

      login(
        {
          id: data.user.id,
          name: data.user.nickname,
          email: data.user.email,
        },
        data.token
      )

      navigate('/')
    } catch (error) {
      console.error(error)
      setError('서버에 연결할 수 없습니다.')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    resetMessage()

    if (!nickname || !email || !password) {
      setError('닉네임, 이메일, 비밀번호를 모두 입력해주세요.')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || '회원가입에 실패했습니다.')
        return
      }

      setSuccess('회원가입이 완료되었습니다. 로그인해주세요.')
      setIsRegisterMode(false)
      setPassword('')
      setNickname('')
    } catch (error) {
      console.error(error)
      setError('서버에 연결할 수 없습니다.')
    }
  }

  const changeMode = (mode) => {
    resetMessage()
    setIsRegisterMode(mode)
    setPassword('')
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
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 18 }}>
            {isRegisterMode ? '회원가입' : '로그인'}
          </div>

          {/* 로그인 / 회원가입 탭 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => changeMode(false)}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '9px 0',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: !isRegisterMode ? '#fff' : 'transparent',
                color: !isRegisterMode ? '#2563eb' : '#64748b',
                boxShadow: !isRegisterMode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              로그인
            </button>

            <button
              type="button"
              onClick={() => changeMode(true)}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '9px 0',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: isRegisterMode ? '#fff' : 'transparent',
                color: isRegisterMode ? '#2563eb' : '#64748b',
                boxShadow: isRegisterMode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              회원가입
            </button>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#dc2626' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#16a34a' }}>
              {success}
            </div>
          )}

          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isRegisterMode && (
              <Field
                label="닉네임"
                type="text"
                value={nickname}
                onChange={setNickname}
                placeholder="닉네임을 입력하세요"
                autoComplete="nickname"
              />
            )}

            <Field
              label="이메일"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <Field
              label="비밀번호"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
            />

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
              {isRegisterMode ? '회원가입' : '로그인'}
            </button>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#94a3b8' }}>
          {isRegisterMode
            ? '이메일과 비밀번호로 새 계정을 생성해주세요.'
            : '회원가입한 이메일과 비밀번호로 로그인해주세요.'}
        </div>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false)

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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