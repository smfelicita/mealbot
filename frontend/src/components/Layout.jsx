import { useState } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useStore } from '../store'
import { api } from '../api'
import { Avatar, Modal } from './ui'
import InstallPrompt from './InstallPrompt'

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { to: '/',       icon: '⊞',  label: 'Главная'     },
  { to: '/dishes', icon: '📖', label: 'Рецепты'     },
  { to: '/fridge', icon: '🧊', label: 'Холодильник' },
  { to: '/plan',   icon: '📅', label: 'План'         },
]

// ─── Profile dropdown ─────────────────────────────────────────────────────────
function ProfileModal({ onClose }) {
  const user     = useStore(s => s.user)
  const logout   = useStore(s => s.logout)
  const navigate = useNavigate()
  const [tgLink, setTgLink]       = useState(null)
  const [tgLoading, setTgLoading] = useState(false)
  const [tgError, setTgError]     = useState('')

  async function connectTelegram() {
    setTgLoading(true); setTgError('')
    try {
      const { url } = await api.generateTelegramLink()
      setTgLink(url)
    } catch (e) { setTgError(e.message || 'Ошибка') }
    setTgLoading(false)
  }

  function go(path) { navigate(path); onClose() }
  function handleLogout() { logout(); onClose(); navigate('/auth') }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[200] flex items-start justify-end pt-[64px] px-4 animate-[fadeIn_.15s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl py-3 px-2 w-[272px] shadow-md overflow-y-auto max-h-[80dvh] animate-[fadeUp_.2s_ease]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-3 pb-3 mb-1 border-b border-border">
          <Avatar name={user?.name} size="md" />
          <div className="min-w-0">
            <p className="font-bold text-[15px] truncate">{user?.name || 'Пользователь'}</p>
            <p className="text-xs text-text-2 truncate">
              {user?.email || (user?.telegramUsername ? `@${user.telegramUsername}` : '')}
            </p>
          </div>
        </div>

        <MenuItem onClick={() => go('/groups')}>👥 Мои группы</MenuItem>
        <MenuItem onClick={() => go('/groups?action=create')}>＋ Создать группу</MenuItem>
        <Divider />

        {!tgLink ? (
          <MenuItem onClick={connectTelegram} disabled={tgLoading}>
            {tgLoading ? '...' : '🤖 Telegram-бот'}
          </MenuItem>
        ) : (
          <a href={tgLink} target="_blank" rel="noopener noreferrer" onClick={onClose}
            className="block px-3 py-2.5 rounded-xl text-[14px] bg-sage/10 text-sage font-semibold">
            🤖 Открыть бота →
          </a>
        )}
        {tgError && <p className="text-xs text-red-400 px-3 mt-1">{tgError}</p>}

        <Divider />
        <MenuItem onClick={() => go('/profile')}>👤 Профиль</MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} className="text-red-400">🚪 Выйти</MenuItem>
      </div>
    </div>
  )
}

function MenuItem({ children, onClick, disabled, className = '' }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={[
        'w-full text-left px-3 py-2.5 rounded-xl text-[14px] font-medium',
        'transition-colors hover:bg-bg-3 disabled:opacity-40',
        className,
      ].join(' ')}>
      {children}
    </button>
  )
}

function Divider() { return <div className="h-px bg-border my-1.5 mx-3" /> }

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout() {
  const token  = useStore(s => s.token)
  const user   = useStore(s => s.user)
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const tabs = token ? TABS : TABS.filter(t => t.to === '/' || t.to === '/dishes')

  return (
    <div className="flex flex-col min-h-dvh bg-bg max-w-app mx-auto">

      {/* ── Top bar (non-fixed, part of flow) ── */}
      <header className="flex items-center justify-between px-5 py-3.5 bg-bg shrink-0">
        {/* Logo + name */}
        <button type="button" onClick={() => navigate('/')}
          className="flex items-center gap-2 focus:outline-none">
          <span className="text-accent text-[22px]">🍽️</span>
          <span className="font-bold text-[17px] text-text">Моя кухня</span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {token ? (
            <>
              {/* Bell */}
              <button type="button"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-3 text-text-2 focus:outline-none">
                🔔
              </button>
              {/* Avatar */}
              <button type="button"
                onClick={() => setProfileOpen(p => !p)}
                className="focus:outline-none rounded-full">
                <Avatar name={user?.name} size="sm" />
              </button>
            </>
          ) : (
            <button type="button" onClick={() => navigate('/auth')}
              className="bg-accent text-white text-[13px] font-bold px-4 py-2 rounded-full">
              Войти
            </button>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 flex flex-col pb-[64px]">
        <Outlet />
      </main>

      <InstallPrompt />

      {/* ── Bottom tab bar (fixed) ── */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-app mx-auto
        flex bg-white border-t border-border z-[100] pb-safe">
        {tabs.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) => [
              'flex-1 flex flex-col items-center justify-center gap-1 py-3',
              'text-[10px] font-semibold tracking-wide focus:outline-none transition-colors',
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
