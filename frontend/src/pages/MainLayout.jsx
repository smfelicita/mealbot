import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import DishesPage from './DishesPage'
import FridgePage from './FridgePage'
import ChatPage from './ChatPage'
import ProfilePage from './ProfilePage'

const NAV = [
  { path: '/', label: 'Блюда', icon: IconDishes },
  { path: '/fridge', label: 'Холодильник', icon: IconFridge },
  { path: '/chat', label: 'ИИ-чат', icon: IconChat },
  { path: '/profile', label: 'Профиль', icon: IconProfile },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const loc = useLocation()

  return (
    <>
      <Routes>
        <Route path="/" element={<DishesPage />} />
        <Route path="/fridge" element={<FridgePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>

      <nav className="nav">
        {NAV.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item ${loc.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}

function IconDishes() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
  </svg>
}
function IconFridge() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="5" y1="10" x2="19" y2="10"/><line x1="9" y1="6" x2="9" y2="8"/><line x1="9" y1="14" x2="9" y2="18"/>
  </svg>
}
function IconChat() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
}
function IconProfile() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
}
