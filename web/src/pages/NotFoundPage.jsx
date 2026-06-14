import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', flexDirection: 'column', gap: 0, textAlign: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 72, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#e2e8f0', lineHeight: 1, marginBottom: 8 }}>
        404
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
        페이지를 찾을 수 없어요
      </div>
      <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32, maxWidth: 300, lineHeight: 1.7 }}>
        주소가 잘못됐거나 삭제된 페이지예요.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
            borderRadius: 9, background: '#f1f5f9', border: 'none',
            color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} /> 뒤로 가기
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
            borderRadius: 9, background: '#2563eb', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Home size={14} /> 홈으로
        </button>
      </div>
    </div>
  )
}
