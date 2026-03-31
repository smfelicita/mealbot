import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import InstallPrompt from './InstallPrompt'

const TABS = [
  { to: '/',           icon: '🏠', label: 'Главная',      auth: false },
  { to: '/dishes',     icon: '🍽️', label: 'Рецепты',      auth: false },
  { to: '/fridge',     icon: '🧊', label: 'Холодильник',  auth: true  },
  { to: '/plan',       icon: '📅', label: 'План',          auth: true  },
  { to: '/chat',       icon: '✨', label: 'ИИ-чат',       auth: false },
]

export default function Layout() {
  const token = useStore(s => s.token)
  const navigate = useNavigate()
  const tabs = TABS.filter(t => !t.auth || token)

  return (
    <div className="app-layout">
      {!token && (
        <div className="guest-banner">
          <span>Войдите, чтобы открыть холодильник, рецепты и группы</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/auth')}>Войти</button>
        </div>
      )}
      <div className="main-content">
        <Outlet />
      </div>
      <InstallPrompt />
      <nav className="bottom-nav">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'}>
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
