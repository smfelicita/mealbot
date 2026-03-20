import { Outlet, NavLink } from 'react-router-dom'

const TABS = [
  { to: '/',       icon: '🏠', label: 'Главная' },
  { to: '/dishes', icon: '🍽️', label: 'Блюда'   },
  { to: '/fridge', icon: '🧊', label: 'Холодильник' },
  { to: '/chat',   icon: '✨', label: 'ИИ-чат'  },
]

export default function Layout() {
  return (
    <div className="app-layout">
      <div className="main-content">
        <Outlet />
      </div>
      <nav className="bottom-nav">
        {TABS.map(t => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'}>
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
