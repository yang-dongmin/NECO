import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, RotateCcw, BarChart2, Plus } from 'lucide-react'
import { useSrsStore } from '../store/srsStore'
import { getAllNotes } from '../api/mock'

const NAV_ITEMS = [
  { to: '/',      icon: LayoutDashboard, label: '홈'   },
  { to: '/notes', icon: BookOpen,        label: '문제' },
  { to: '/srs',   icon: RotateCcw,       label: '복습', srs: true },
  { to: '/stats', icon: BarChart2,        label: '통계' },
]

export default function MobileNav() {
  const navigate   = useNavigate()
  const { getSummary } = useSrsStore()
  const due        = getSummary(getAllNotes()).due

  return (
    <nav style={{
      display: 'none',  // CSS @media (max-width:768px) 에서 flex로 override
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: '#fff', borderTop: '1px solid #f1f5f9',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}
      className="mobile-nav"
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label, srs }) => (
        <NavLink key={to} to={to} end={to === '/'} style={{ textDecoration: 'none', flex: 1 }}>
          {({ isActive }) => (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 0 6px', position: 'relative',
              color: isActive ? '#2563eb' : '#94a3b8',
              transition: 'color 0.15s',
            }}>
              <div style={{ position: 'relative' }}>
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {srs && due > 0 && (
                  <div style={{
                    position: 'absolute', top: -4, right: -6,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#f59e0b', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff',
                  }}>
                    {due > 9 ? '9+' : due}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, marginTop: 3, fontWeight: isActive ? 600 : 400 }}>{label}</span>
              {isActive && (
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 32, height: 3, background: '#2563eb', borderRadius: '0 0 4px 4px' }} />
              )}
            </div>
          )}
        </NavLink>
      ))}

      {/* 가운데 추가 버튼 */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6px 0' }}>
        <button
          onClick={() => navigate('/notes/add')}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#2563eb', border: 'none', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.4)', cursor: 'pointer',
            marginTop: -16,
          }}
        >
          <Plus size={22} />
        </button>
      </div>
    </nav>
  )
}
