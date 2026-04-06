import { useState } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useStore } from '../store'
import { api } from '../api'
import { Avatar, Modal } from './ui'
import InstallPrompt from './InstallPrompt'

// ─── Tab icons ────────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9L12 2L21 9V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M9 21V13H15V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconRecipes = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19Z" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M8 7H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 11H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 15H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const IconFridge = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
    <line x1="6" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="10" cy="7" r="1" fill="currentColor"/>
    <circle cx="10" cy="16" r="1" fill="currentColor"/>
  </svg>
)

const IconPlan = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M16 3V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 3V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M4 10H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="9" cy="14" r="1" fill="currentColor"/>
    <circle cx="15" cy="14" r="1" fill="currentColor"/>
    <circle cx="9" cy="18" r="1" fill="currentColor"/>
  </svg>
)

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { to: '/',       Icon: IconHome,    label: 'Главная'     },
  { to: '/dishes', Icon: IconRecipes, label: 'Рецепты'     },
  { to: '/fridge', Icon: IconFridge,  label: 'Холодильник' },
  { to: '/plan',   Icon: IconPlan,    label: 'План'         },
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
      <header className="flex items-center justify-between px-5 py-3 bg-bg shrink-0">
        {/* Logo + name */}
        <button type="button" onClick={() => navigate('/')}
          className="flex items-center gap-2 focus:outline-none">
          <span className="text-[20px]">🍽️</span>
          <span className="font-bold text-[16px] text-text tracking-[-0.2px]">Моя кухня</span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {token ? (
            <>
              {/* Bell */}
              <button type="button"
                className="w-8 h-8 flex items-center justify-center rounded-full focus:outline-none text-[16px]"
                style={{ color: '#9e9e9e' }}>
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
              className="bg-accent text-white text-[13px] font-semibold px-4 py-1.5 rounded-full">
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
              'flex-1 flex flex-col items-center justify-center gap-1 py-2.5',
              'text-[10px] font-semibold tracking-wide focus:outline-none transition-colors',
              isActive ? 'text-accent' : 'text-text-3',
            ].join(' ')}
          >
            {({ isActive }) => (
              <>
                <t.Icon isActive={isActive} />
                {t.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  )
}
