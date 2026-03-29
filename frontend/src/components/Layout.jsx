import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const TABS = [
  { to: '/',           icon: '🏠', label: 'Главная' },
  { to: '/dishes',     icon: '🍽️', label: 'Блюда'   },
  { to: '/fridge',     icon: '🧊', label: 'Холодильник' },
  { to: '/my-recipes', icon: '📖', label: 'Рецепты' },
  { to: '/groups',     icon: '👥', label: 'Группы'  },
  { to: '/chat',       icon: '✨', label: 'ИИ-чат'  },
]

export default function Layout() {
  const token = useStore(s => s.token)
  const navigate = useNavigate()

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
