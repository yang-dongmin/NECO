import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Trash2, ChevronLeft, Check, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../store'
import { updateProfile, changePassword, deleteAccount } from '../api/client'

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()

  // 닉네임 변경
  const [nickname, setNickname] = useState(user?.name ?? user?.nickname ?? '')
  const [nickLoading, setNickLoading] = useState(false)
  const [nickMsg, setNickMsg] = useState(null) // { type: 'success'|'error', text }

  // 비밀번호 변경
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [pwLoading, setPwLoading]   = useState(false)
  const [pwMsg, setPwMsg]           = useState(null)

  // 회원탈퇴
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePw, setDeletePw]               = useState('')
  const [deleteLoading, setDeleteLoading]     = useState(false)
  const [deleteMsg, setDeleteMsg]             = useState(null)

  // ── 닉네임 변경 ─────────────────────────────────────────────
  const handleNickname = async (e) => {
    e.preventDefault()
    setNickMsg(null)
    if (nickname.trim().length < 2) {
      setNickMsg({ type: 'error', text: '닉네임은 2자 이상이어야 합니다.' })
      return
    }
    setNickLoading(true)
    try {
      await updateProfile({ nickname: nickname.trim() })
      updateUser({ name: nickname.trim(), nickname: nickname.trim() })
      setNickMsg({ type: 'success', text: '닉네임이 변경되었습니다.' })
    } catch (err) {
      setNickMsg({ type: 'error', text: err?.response?.data?.message ?? '변경에 실패했습니다.' })
    } finally {
      setNickLoading(false)
    }
  }

  // ── 비밀번호 변경 ─────────────────────────────────────────────
  const handlePassword = async (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ type: 'error', text: '모든 항목을 입력해주세요.' })
      return
    }
    if (newPw.length < 6) {
      setPwMsg({ type: 'error', text: '새 비밀번호는 6자 이상이어야 합니다.' })
      return
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' })
      return
    }
    setPwLoading(true)
    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw })
      setPwMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      setPwMsg({ type: 'error', text: err?.response?.data?.message ?? '변경에 실패했습니다.' })
    } finally {
      setPwLoading(false)
    }
  }

  // ── 회원탈퇴 ─────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteMsg(null)
    if (!deletePw) {
      setDeleteMsg({ type: 'error', text: '비밀번호를 입력해주세요.' })
      return
    }
    setDeleteLoading(true)
    try {
      await deleteAccount({ password: deletePw })
      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setDeleteMsg({ type: 'error', text: err?.response?.data?.message ?? '탈퇴에 실패했습니다.' })
      setDeleteLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 13 }}
        >
          <ChevronLeft size={15} /> 뒤로
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>마이페이지</h1>
      </div>

      {/* 프로필 요약 */}
      <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 14, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 16, color: '#fff' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
          {(user?.name ?? user?.nickname ?? 'U').slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.name ?? user?.nickname}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>

      {/* 닉네임 변경 */}
      <Card icon={<User size={16} color="#2563eb" />} title="닉네임 변경">
        <form onSubmit={handleNickname} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="닉네임" type="text" value={nickname} onChange={setNickname} placeholder="새 닉네임" />
          {nickMsg && <Msg {...nickMsg} />}
          <button type="submit" disabled={nickLoading} style={btnStyle(nickLoading)}>
            {nickLoading ? '저장 중...' : '변경하기'}
          </button>
        </form>
      </Card>

      {/* 비밀번호 변경 */}
      <Card icon={<Lock size={16} color="#7c3aed" />} title="비밀번호 변경">
        <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="현재 비밀번호" type="password" value={currentPw} onChange={setCurrentPw} placeholder="현재 비밀번호" />
          <Field label="새 비밀번호" type="password" value={newPw} onChange={setNewPw} placeholder="6자 이상" />
          <Field label="새 비밀번호 확인" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="새 비밀번호 재입력" />
          {pwMsg && <Msg {...pwMsg} />}
          <button type="submit" disabled={pwLoading} style={btnStyle(pwLoading, '#7c3aed', '#6d28d9')}>
            {pwLoading ? '변경 중...' : '변경하기'}
          </button>
        </form>
      </Card>

      {/* 회원탈퇴 */}
      <Card icon={<Trash2 size={16} color="#ef4444" />} title="회원탈퇴">
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
          탈퇴하면 모든 노트와 학습 기록이 영구적으로 삭제됩니다.
        </p>
        <button
          onClick={() => { setShowDeleteModal(true); setDeleteMsg(null); setDeletePw('') }}
          style={{ padding: '9px 18px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          회원 탈퇴
        </button>
      </Card>

      {/* 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} color="#ef4444" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>정말 탈퇴할까요?</div>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18, lineHeight: 1.6 }}>
              모든 노트, 복습 기록, 코드 노트가 <strong style={{ color: '#ef4444' }}>영구 삭제</strong>됩니다.
              확인을 위해 비밀번호를 입력해주세요.
            </p>
            <Field label="비밀번호" type="password" value={deletePw} onChange={setDeletePw} placeholder="비밀번호 입력" />
            {deleteMsg && <div style={{ marginTop: 10 }}><Msg {...deleteMsg} /></div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: '#f1f5f9', border: 'none', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: deleteLoading ? '#fca5a5' : '#ef4444', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleteLoading ? 'not-allowed' : 'pointer' }}
              >
                {deleteLoading ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 서브 컴포넌트 ────────────────────────────────────────────────

function Card({ icon, title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
          border: `1px solid ${focused ? '#2563eb' : '#e2e8f0'}`,
          background: '#fff', color: '#1e293b', outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
          transition: 'all 0.15s', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function Msg({ type, text }) {
  const isSuccess = type === 'success'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '9px 12px', borderRadius: 8, fontSize: 12,
      background: isSuccess ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
      color: isSuccess ? '#16a34a' : '#dc2626',
    }}>
      {isSuccess ? <Check size={13} /> : <AlertTriangle size={13} />}
      {text}
    </div>
  )
}

function btnStyle(loading, bg = '#2563eb', hoverBg = '#1d4ed8') {
  return {
    padding: '10px 0', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600,
    background: loading ? '#93c5fd' : bg, color: '#fff',
    cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
  }
}
