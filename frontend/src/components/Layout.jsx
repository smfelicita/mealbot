import { useState } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useStore } from '../store'
import { api } from '../api'
import { Avatar, Modal, Toggle } from './ui'
import InstallPrompt from './InstallPrompt'

const TABS = [
  { to: '/',       icon: '🏠', label: 'Главная'    },
  { to: '/dishes', icon: '🍽️', label: 'Рецепты'    },
  { to: '/fridge', icon: '🧊', label: 'Холодильник' },
  { to: '/plan',   icon: '📅', label: 'План'        },
]

function ProfileModal({ onClose }) {
  const user      = useStore(s => s.user)
  const logout    = useStore(s => s.logout)
  const navigate  = useNavigate()
  const [tgLink, setTgLink]       = useState(null)
  const [tgLoading, setTgLoading] = useState(false)
  const [tgError, setTgError]     = useState('')

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

  return (
    <div
      className="fixed inset-0 bg-black/55 z-[200] flex items-start justify-end pt-[60px] px-3 animate-[fadeIn_.15s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl py-4 px-2 w-[280px] shadow-card max-h-[calc(100vh-80px)] overflow-y-auto animate-[fadeUp_.2s_ease]"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center gap-3 px-3.5 pb-3.5 border-b border-border mb-1.5">
          <Avatar name={user?.name} size="md" />
          <div className="min-w-0">
            <p className="font-bold text-[15px] truncate">{user?.name || 'Пользователь'}</p>
            <p className="text-xs text-text-2 truncate">
              {user?.email || (user?.telegramUsername ? `@${user.telegramUsername}` : '')}
            </p>
          </div>
        </div>

        {/* Группы */}
        <SectionLabel>Группы</SectionLabel>
        <MenuItem onClick={() => go('/groups')}>👥 Мои группы</MenuItem>
        <MenuItem onClick={() => go('/groups?action=create')}>＋ Создать группу</MenuItem>

        <Divider />

        {/* Telegram */}
        {!tgLink ? (
          <MenuItem onClick={connectTelegram} disabled={tgLoading}>
            {tgLoading ? '...' : '🤖 Telegram-бот'}
          </MenuItem>
        ) : (
          <a
            href={tgLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="block px-3.5 py-2.5 rounded-[10px] text-[15px] bg-teal/10 text-teal font-semibold"
          >
            🤖 Открыть бота →
          </a>
        )}
        {tgError && <p className="text-xs text-red-400 px-3.5 mt-1">{tgError}</p>}

        <Divider />

        {/* Настройки */}
        <SectionLabel>Настройки</SectionLabel>
        <MenuItem onClick={() => go('/profile')}>👤 Профиль</MenuItem>
        <MenuItem disabled>
          🔔 Уведомления <span className="text-[11px] text-text-3 ml-1">— скоро</span>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout} className="text-red-400">🚪 Выйти</MenuItem>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="px-3.5 pt-2 pb-1 text-[11px] font-bold text-text-3 uppercase tracking-widest">
      {children}
    </p>
  )
}

function MenuItem({ children, onClick, disabled, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-full text-left px-3.5 py-2.5 rounded-[10px] text-[15px]',
        'transition-colors duration-150 focus:outline-none',
        'disabled:opacity-40 disabled:cursor-default',
        'hover:bg-bg-3',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="h-px bg-border my-1.5" />
}

export default function Layout() {
  const token          = useStore(s => s.token)
  const user           = useStore(s => s.user)
  const fridgeMode     = useStore(s => s.fridgeMode)
  const toggleFridgeMode = useStore(s => s.toggleFridgeMode)
  const navigate       = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const tabs = token ? TABS : TABS.filter(t => t.to === '/' || t.to === '/dishes')

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      {/* App header */}
      <header className="fixed top-0 left-0 right-0 h-[52px] flex items-center justify-between px-4 bg-bg/95 backdrop-blur-md border-b border-border z-[100]">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-[17px] font-extrabold text-text tracking-tight focus:outline-none"
        >
          🍽️ MealBot
        </button>

        <div className="flex items-center gap-3">
          {token && (
            <Toggle
              checked={fridgeMode}
              onChange={toggleFridgeMode}
              label="🧊"
            />
          )}
          {token ? (
            <button
              type="button"
              onClick={() => setProfileOpen(p => !p)}
              aria-label="Профиль"
              className="focus:outline-none focus:ring-2 focus:ring-accent/30 rounded-full"
            >
              <Avatar name={user?.name} size="sm" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="bg-accent text-white text-xs font-bold px-3.5 py-1.5 rounded-sm min-h-[36px]
                hover:bg-accent-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              Войти
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col pt-[52px] pb-[48px]">
        <Outlet />
      </main>

      <InstallPrompt />

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex bg-bg/95 backdrop-blur-md border-t border-border z-[100] pb-[env(safe-area-inset-bottom,0)]">
        {tabs.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) => [
              'flex-1 flex flex-col items-center gap-0.5 min-h-[48px] pt-2.5 pb-2',
              'text-[10px] font-bold uppercase tracking-wider transition-colors duration-150',
              'focus:outline-none',
              isActive ? 'text-accent' : 'text-text-3',
            ].join(' ')}
          >
            <span className="text-[22px] leading-none">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  )
}
