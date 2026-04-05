import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/',       icon: '🏠', label: 'Главная'     },
  { to: '/dishes', icon: '🍽️', label: 'Рецепты'     },
  { to: '/fridge', icon: '🧊', label: 'Холодильник'  },
  { to: '/plan',   icon: '📅', label: 'План'         },
]

export default function BottomTabBar({ tabs = TABS }) {
  return (
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
  )
}
