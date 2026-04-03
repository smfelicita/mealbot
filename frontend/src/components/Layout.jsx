import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { api } from '../api'
import InstallPrompt from './InstallPrompt'

const TABS = [
  { to: '/',       icon: '🏠', label: 'Главная',    auth: false },
  { to: '/dishes', icon: '🍽️', label: 'Рецепты',    auth: false },
  { to: '/fridge', icon: '🧊', label: 'Холодильник', auth: true  },
  { to: '/plan',   icon: '📅', label: 'Готовлю',     auth: true  },
  { to: '/chat',   icon: '✨', label: 'ИИ-чат',     auth: false },
]

function ProfileModal({ onClose }) {
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)
  const navigate = useNavigate()
  const [tgLink, setTgLink] = useState(null)
  const [tgLoading, setTgLoading] = useState(false)
  const [tgError, setTgError] = useState('')

  async function connectTelegram() {
    setTgLoading(true); setTgError('')
    try {
      const { url } = await api.generateTelegramLink()
      setTgLink(url)
    } catch (e) {
      setTgError(e.message || 'Ошибка')
    }
    setTgLoading(false)
  }

  function handleLogout() {
    logout(); onClose(); navigate('/auth')
  }

  const menuItem = (onClick, children, style = {}) => (
    <button
      className="btn-ghost"
      onClick={onClick}
      style={{ textAlign: 'left', padding: '11px 14px', borderRadius: 10, fontSize: 15, width: '100%', ...style }}
    >
      {children}
    </button>
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '60px 12px 0' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 8px', width: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'fadeUp .2s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 14px 14px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() || '👤'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Пользователь'}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || (user?.telegramUsername ? `@${user.telegramUsername}` : '')}
            </div>
          </div>
        </div>

        {/* Пункты меню */}
        {menuItem(() => { navigate('/profile'); onClose() }, '👤 Профиль')}

        {!tgLink ? (
          menuItem(connectTelegram, tgLoading ? '...' : '✈️ Подключить Telegram', { opacity: tgLoading ? 0.5 : 1 })
        ) : (
          <a
            href={tgLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', padding: '11px 14px', borderRadius: 10, fontSize: 15, background: 'rgba(45,212,191,.1)', color: 'var(--teal)', fontWeight: 600 }}
          >
            ✈️ Открыть бота →
          </a>
        )}
        {tgError && <p style={{ fontSize: 12, color: '#e74c3c', padding: '0 14px' }}>{tgError}</p>}

        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

        {menuItem(handleLogout, '🚪 Выйти', { color: '#e74c3c' })}
      </div>
    </div>
  )
}

export default function Layout() {
  const token = useStore(s => s.token)
  const user = useStore(s => s.user)
  const fridgeMode = useStore(s => s.fridgeMode)
  const toggleFridgeMode = useStore(s => s.toggleFridgeMode)
  const navigate = useNavigate()
  const tabs = TABS.filter(t => !t.auth || token)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          🍽️ MealBot
        </div>
        {token && (
          <div className="toggle-wrap" onClick={toggleFridgeMode} style={{ marginLeft: 'auto', marginRight: 8 }}>
            <div className={`toggle ${fridgeMode ? 'on' : ''}`} />
            <span className="toggle-label" style={{ color: fridgeMode ? 'var(--accent)' : 'var(--text2)', fontSize: 12 }}>🧊</span>
          </div>
        )}
        {token ? (
          <button className="profile-avatar-btn" onClick={() => setProfileOpen(p => !p)} aria-label="Профиль">
            {user?.name?.[0]?.toUpperCase() || '👤'}
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/auth')}>Войти</button>
        )}
      </header>

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

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  )
}
