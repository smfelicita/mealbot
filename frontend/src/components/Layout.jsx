import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { api } from '../api'
import InstallPrompt from './InstallPrompt'

const TABS = [
  { to: '/',       icon: '🏠', label: 'Главная',    auth: false },
  { to: '/dishes', icon: '🍽️', label: 'Мои блюда',  auth: false },
  { to: '/fridge', icon: '🧊', label: 'Холодильник', auth: true  },
  { to: '/plan',   icon: '📅', label: 'План',        auth: true  },
]

function SectionHeader({ label }) {
  return (
    <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
      {label}
    </div>
  )
}

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

  function go(path) { navigate(path); onClose() }
  function handleLogout() { logout(); onClose(); navigate('/auth') }

  const item = (onClick, children, style = {}) => (
    <button
      className="btn-ghost"
      onClick={onClick}
      style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10, fontSize: 15, width: '100%', ...style }}
    >
      {children}
    </button>
  )

  const divider = () => <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '60px 12px 0' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 8px', width: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'fadeUp .2s ease', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 14px 14px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
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

        {/* Группы */}
        <SectionHeader label="Группы" />
        {item(() => go('/groups'), '👥 Мои группы')}
        {item(() => go('/groups?action=create'), '＋ Создать группу')}

        {divider()}

        {/* Telegram */}
        {!tgLink ? (
          item(connectTelegram, tgLoading ? '...' : '🤖 Telegram-бот', { opacity: tgLoading ? 0.5 : 1 })
        ) : (
          <a
            href={tgLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={{ display: 'block', padding: '10px 14px', borderRadius: 10, fontSize: 15, background: 'rgba(45,212,191,.1)', color: 'var(--teal)', fontWeight: 600 }}
          >
            🤖 Открыть бота →
          </a>
        )}
        {tgError && <p style={{ fontSize: 12, color: '#e74c3c', padding: '0 14px' }}>{tgError}</p>}

        {divider()}

        {/* Настройки */}
        <SectionHeader label="Настройки" />
        {item(() => go('/profile'), '👤 Профиль')}
        <button
          className="btn-ghost"
          disabled
          style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10, fontSize: 15, width: '100%', opacity: 0.4, cursor: 'default' }}
        >
          🔔 Уведомления <span style={{ fontSize: 11, color: 'var(--text3)' }}>— скоро</span>
        </button>
        {item(() => {}, '❓ Помощь / FAQ')}
        {item(() => {}, 'ℹ️ О приложении')}

        {divider()}

        {item(handleLogout, '🚪 Выйти', { color: '#e74c3c' })}
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
