import { NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, LayoutDashboard, RotateCcw, BarChart2, Plus, Star } from 'lucide-react'
import { useAuthStore, useNoteStore } from '../store'
import { useSrsStore } from '../store/srsStore'
import { getAllNotes, SUBJECTS } from '../api/mock'
import logo from "../assets/neco.png";

const NAV = [
  { to:'/',      icon:LayoutDashboard, label:'대시보드'     },
  { to:'/notes', icon:BookOpen,        label:'문제 목록'    },
  { to:'/srs',   icon:RotateCcw,       label:'복습 스케줄러', srs:true },
  { to:'/stats', icon:BarChart2,        label:'통계'         },
]

export default function Sidebar() {
  const { user, logout }  = useAuthStore()
  const { setFilter }     = useNoteStore()
  const { getSummary }    = useSrsStore()
  const navigate          = useNavigate()
  const due               = getSummary(getAllNotes()).due

  const handleSubject = (id) => { setFilter('subject', id); navigate('/notes') }
  const handleBookmark = () => { setFilter('bookmark', 'true'); navigate('/notes') }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside style={{ width:232, minWidth:232, background:'#fff', borderRight:'1px solid #f1f5f9', display:'flex', flexDirection:'column', height:'100vh' }}>
      {/* 로고 */}
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#2563eb,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#fff', flexShrink:0 }}>
              <img src={logo} alt="로고" style={{ width:'60px', height:'60px', borderRadius:8, objectFit:'contain' }} />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#1e293b', lineHeight:1.2 }}>Neco</div>
            <div style={{ fontSize:10, color:'#94a3b8' }}>코드 오답노트</div>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav style={{ padding:'12px 12px 0', flex:1, overflowY:'auto' }}>
        <SLabel>메뉴</SLabel>
        {NAV.map(({ to, icon:Icon, label, srs }) => (
          <NavLink key={to} to={to} end={to==='/'} style={{ textDecoration:'none' }}>
            {({ isActive }) => (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, marginBottom:2, cursor:'pointer', background:isActive?'#eff6ff':'transparent', color:isActive?'#2563eb':'#475569', fontWeight:isActive?600:400, fontSize:13, transition:'all 0.12s' }}
                onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='#f8fafc' }}
                onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background='transparent' }}
              >
                <Icon size={16} strokeWidth={isActive?2.2:1.8} />
                <span style={{ flex:1 }}>{label}</span>
                {srs && due>0 && (
                  <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:99, background:'#fef3c7', color:'#d97706', border:'1px solid #fde68a' }}>{due}</span>
                )}
              </div>
            )}
          </NavLink>
        ))}

        {/* 즐겨찾기 */}
        <div onClick={handleBookmark} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, marginBottom:2, cursor:'pointer', fontSize:13, color:'#475569', transition:'all 0.12s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <Star size={16} strokeWidth={1.8} />
          <span>즐겨찾기</span>
        </div>

        {/* 과목별 */}
        <SLabel style={{ marginTop:16 }}>과목별</SLabel>
        {SUBJECTS.map(s => (
          <div key={s.id} onClick={()=>handleSubject(s.id)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:'pointer', fontSize:12, color:'#475569', marginBottom:1, transition:'all 0.12s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <div style={{ width:6, height:6, borderRadius:'50%', background:s.color, flexShrink:0 }} />
            <span style={{ flex:1 }}>{s.name}</span>
          </div>
        ))}

        {/* 복습 빠른 시작 */}
        {due > 0 && (
          <div onClick={()=>navigate('/review')} style={{ margin:'14px 0 0', padding:'11px 12px', borderRadius:10, cursor:'pointer', background:'linear-gradient(135deg,#eff6ff,#ecfdf5)', border:'1px solid #dbeafe', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <RotateCcw size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'#1e293b' }}>복습 시작하기</div>
              <div style={{ fontSize:10, color:'#64748b' }}>{due}개 대기 중</div>
            </div>
          </div>
        )}
      </nav>

      {/* 하단 */}
      <div style={{ padding:12, borderTop:'1px solid #f1f5f9' }}>
        <button onClick={()=>navigate('/notes/add')} style={{ width:'100%', padding:'9px 0', borderRadius:8, cursor:'pointer', background:'#2563eb', border:'none', color:'#fff', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'background 0.15s', marginBottom:8 }}
          onMouseEnter={e=>e.currentTarget.style.background='#1d4ed8'}
          onMouseLeave={e=>e.currentTarget.style.background='#2563eb'}
        >
          <Plus size={15} /> 문제 추가
        </button>
        <div onClick={handleLogout} title="클릭하여 로그아웃" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:'pointer', transition:'background 0.12s' }}
          onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>
            {(user?.name??'G').slice(0,1)}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#1e293b' }}>{user?.name??'Guest'}</div>
            <div style={{ fontSize:10, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email??'로그아웃하려면 클릭'}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function SLabel({ children }) {
  return <div style={{ fontSize:10, fontWeight:600, color:'#94a3b8', padding:'0 8px', margin:'8px 0 4px', letterSpacing:'0.08em', textTransform:'uppercase' }}>{children}</div>
}
