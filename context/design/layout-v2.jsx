// LayoutShell.jsx — MealBot, общий Layout мобильного PWA
// Header (52px) + Tab bar (64px + safe-area). Семь состояний друг под другом.
// Одиночный .jsx, мок внутри, только core Tailwind + lucide-react, useState.

import React, { useState } from 'react';
import {
  Home, ChefHat, Calendar, Sparkles, User,
  Bell, ChevronLeft, Heart, Share2,
} from 'lucide-react';

// ─── Токены ───────────────────────────────────────────────────
const C = {
  bg:          '#F6F4EF',
  card:        '#FFFFFF',
  bg3:         '#F5EFE6',
  border:      '#E5D8C8',
  accent:      '#C4704A',
  accentMuted: 'rgba(196,112,74,0.1)',
  sage:        '#5C7A59',
  text:        '#1C1917',
  text2:       '#78716C',
  text3:       '#A8A29E',
  pro:         '#B8935A',
  red:         '#D14343',
};

// ─── Моки ─────────────────────────────────────────────────────
const TABS = [
  { id: 'home',    label: 'Главная', icon: Home,      path: '/' },
  { id: 'dishes',  label: 'Блюда',   icon: ChefHat,   path: '/dishes' },
  { id: 'plan',    label: 'План',    icon: Calendar,  path: '/plan' },
  { id: 'chat',    label: 'Чат',     icon: Sparkles,  path: '/chat' },
  { id: 'profile', label: 'Профиль', icon: User,      path: '/profile' },
];

const USER = { name: 'Марина', initial: 'М', isPro: false, notifications: 2 };

// ═══ Header ═══════════════════════════════════════════════════
function Header({
  variant = 'user',     // 'guest' | 'user' | 'pro' | 'back'
  notifications = 0,
  backTitle = '',
  backActions = 'default', // 'default' (bell+avatar) | 'bellOnly' | 'dishDetail' (heart+share)
}) {
  const renderBell = () => (
    <button
      className="w-10 h-10 rounded-full flex items-center justify-center relative transition"
      style={{ background: 'transparent' }}
      onMouseEnter={e => e.currentTarget.style.background = C.bg3}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      aria-label="Уведомления"
    >
      <Bell size={20} strokeWidth={2} color={C.text2} />
      {notifications > 0 && notifications <= 9 && (
        <span
          className="absolute rounded-full"
          style={{
            top: 8, right: 8, width: 8, height: 8,
            background: C.red, border: '2px solid #fff',
          }}
        />
      )}
      {notifications > 9 && (
        <span
          className="absolute rounded-full flex items-center justify-center tabular-nums"
          style={{
            top: 4, right: 4,
            minWidth: 16, height: 16, padding: '0 4px',
            background: C.red, color: '#fff',
            fontSize: 9, fontWeight: 800, lineHeight: 1,
          }}
        >9+</span>
      )}
    </button>
  );

  const renderAvatar = () => {
    if (variant === 'guest') {
      return (
        <button
          className="h-8 px-3 rounded-full text-[13px] font-bold text-white"
          style={{ background: C.accent }}
        >
          Войти
        </button>
      );
    }
    const pro = variant === 'pro';
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold"
        style={{
          background: C.bg3,
          border: `1px solid ${C.border}`,
          color: C.accent,
          boxShadow: pro ? `0 0 0 2px ${C.pro}` : 'none',
        }}
      >
        {USER.initial}
      </div>
    );
  };

  return (
    <header
      className="h-[52px] px-4 flex items-center justify-between sticky top-0 z-40 relative"
      style={{
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}
    >
      {variant === 'back' ? (
        <>
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center transition"
            onMouseEnter={e => e.currentTarget.style.background = C.bg3}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            aria-label="Назад"
          >
            <ChevronLeft size={20} strokeWidth={2} color={C.text2} />
          </button>
          <div
            className="absolute left-1/2 -translate-x-1/2 text-[15px] font-bold truncate max-w-[200px]"
            style={{ color: C.text }}
            title={backTitle}
          >
            {backTitle}
          </div>
          <div className="flex items-center gap-1">
            {backActions === 'dishDetail' && (
              <>
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center transition"
                  onMouseEnter={e => e.currentTarget.style.background = C.bg3}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  aria-label="В избранное"
                >
                  <Heart size={19} strokeWidth={2} color={C.text2} />
                </button>
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center transition"
                  onMouseEnter={e => e.currentTarget.style.background = C.bg3}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  aria-label="Поделиться"
                >
                  <Share2 size={18} strokeWidth={2} color={C.text2} />
                </button>
              </>
            )}
            {backActions === 'bellOnly' && renderBell()}
            {backActions === 'default' && (
              <>
                {renderBell()}
                {renderAvatar()}
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: C.accentMuted }}
            >
              <ChefHat size={16} strokeWidth={2.2} color={C.accent} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[16px] font-extrabold tracking-tight" style={{ color: C.text }}>
                MealBot
              </span>
              <span className="text-[10.5px]" style={{ color: C.text3 }}>
                Моя кухня
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {renderBell()}
            {renderAvatar()}
          </div>
        </>
      )}
    </header>
  );
}

// ═══ Tab bar ══════════════════════════════════════════════════
function TabBar({
  active = 'home',
  bellCount = 0,      // не используется здесь, оставлено из API
  planBadge = 0,
  chatDot = false,
  activeStyle = 'line', // 'line' | 'pill'
  onChange = () => {},
  fixed = true,
}) {
  return (
    <nav
      className={`${fixed ? 'fixed' : 'relative'} bottom-0 left-0 right-0 px-2 pt-1.5 flex items-end justify-around z-40`}
      style={{
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        boxShadow: '0 -1px 12px rgba(0,0,0,0.04)',
        paddingBottom: fixed ? 'max(8px, env(safe-area-inset-bottom))' : 8,
      }}
    >
      {TABS.map(t => {
        const Icon = t.icon;
        const isActive = t.id === active;
        const badge = t.id === 'plan' && planBadge > 0 ? planBadge : 0;
        const dot = t.id === 'chat' && chatDot;

        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 relative min-h-[52px]"
            aria-label={t.label}
          >
            {/* active indicator: line (A) */}
            {isActive && activeStyle === 'line' && (
              <span
                className="absolute rounded-full"
                style={{
                  top: 0, width: 32, height: 2,
                  background: C.accent,
                }}
              />
            )}

            {/* icon + optional pill bg (B) */}
            <div
              className="flex items-center justify-center rounded-full relative"
              style={{
                width: 36, height: 36,
                background: isActive && activeStyle === 'pill' ? C.accentMuted : 'transparent',
              }}
            >
              <Icon size={22} strokeWidth={2} color={isActive ? C.accent : C.text3} />

              {badge > 0 && (
                <span
                  className="absolute rounded-full flex items-center justify-center tabular-nums"
                  style={{
                    top: -2, right: -4,
                    minWidth: 16, height: 16, padding: '0 4px',
                    background: C.accent, color: '#fff',
                    fontSize: 9, fontWeight: 800, lineHeight: 1,
                    border: `2px solid ${C.card}`,
                  }}
                >{badge}</span>
              )}
              {dot && (
                <span
                  className="absolute rounded-full"
                  style={{
                    top: 2, right: 2, width: 8, height: 8,
                    background: C.accent, border: `2px solid ${C.card}`,
                  }}
                />
              )}
            </div>

            <span
              className="text-[10.5px] leading-none"
              style={{
                color: isActive ? C.accent : C.text3,
                fontWeight: isActive ? 700 : 600,
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ═══ Helpers ══════════════════════════════════════════════════
function Divider({ label }) {
  return (
    <div className="h-8 flex items-center justify-center" style={{ background: '#E5E7EB' }}>
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>
        {label}
      </span>
    </div>
  );
}

function StateFrame({ children }) {
  return (
    <div
      className="mx-auto max-w-[390px]"
      style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}
    >
      {children}
    </div>
  );
}

// ═══ Artefact ═════════════════════════════════════════════════
export default function LayoutShellArtefact() {
  const [active5, setActive5] = useState('home');
  const [activeStyle5, setActiveStyle5] = useState('line');
  const [active6, setActive6] = useState('plan');
  const [active7, setActive7] = useState('home');

  return (
    <div style={{ background: '#E5E7EB', fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[430px]">

        {/* ── 1. Header — гость ─────────────────────────────── */}
        <Divider label="— 1. Header: гость —" />
        <StateFrame>
          <Header variant="guest" notifications={0} />
          <div className="h-12" />
        </StateFrame>

        {/* ── 2. Header — залогинен, free, 0 notifications ──── */}
        <Divider label="— 2. Header: free, 0 notifications —" />
        <StateFrame>
          <Header variant="user" notifications={0} />
          <div className="h-12" />
        </StateFrame>

        {/* ── 3. Header — Pro, 2 notifications ──────────────── */}
        <Divider label="— 3. Header: Pro, 2 notifications —" />
        <StateFrame>
          <Header variant="pro" notifications={2} />
          <div className="h-12" />
        </StateFrame>

        {/* ── 4. Header — back-button: два варианта ─────────── */}
        <Divider label="— 4a. Header back: DishDetail (Heart + Share) —" />
        <StateFrame>
          <Header variant="back" backTitle="Борщ украинский" backActions="dishDetail" />
          <div className="h-12" />
        </StateFrame>

        <Divider label="— 4b. Header back: обычная вложенная (Bell only) —" />
        <StateFrame>
          <Header variant="back" backTitle="Настройки уведомлений" backActions="bellOnly" notifications={2} />
          <div className="h-12" />
        </StateFrame>

        {/* ── 5. Tab bar default: две опции активного ─────── */}
        <Divider label="— 5a. Tab bar default · активный = accent-линия сверху —" />
        <StateFrame>
          <div className="h-12" />
          <TabBar active={active5} onChange={setActive5} activeStyle="line" fixed={false} />
        </StateFrame>

        <Divider label="— 5b. Tab bar default · активный = accent-muted подложка —" />
        <StateFrame>
          <div className="h-12" />
          <TabBar active={active5} onChange={setActive5} activeStyle="pill" fixed={false} />
        </StateFrame>

        <div className="mx-auto max-w-[390px] py-2 text-center text-[11px]" style={{ color: '#6B7280' }}>
          Активный таб управляется общим state — потыкай в 5a / 5b, меняется везде.
        </div>

        {/* ── 6. Tab bar с бейджами ─────────────────────────── */}
        <Divider label="— 6. Tab bar: активен «План», бейдж «3», dot на «Чате» —" />
        <StateFrame>
          <div className="h-12" />
          <TabBar
            active={active6}
            onChange={setActive6}
            activeStyle="line"
            planBadge={3}
            chatDot={true}
            fixed={false}
          />
        </StateFrame>

        {/* ── 7. Layout в сборе ─────────────────────────────── */}
        <Divider label="— 7. Layout в сборе (375×812) —" />
        <div className="flex justify-center py-6" style={{ background: '#E5E7EB' }}>
          <div
            className="relative overflow-hidden"
            style={{
              width: 375, height: 812, background: C.bg,
              borderRadius: 40, border: `1px solid #D1D5DB`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <Header variant="user" notifications={0} />
            <div
              className="flex items-center justify-center text-[13px]"
              style={{
                height: 'calc(812px - 52px - 80px)',
                background: C.bg3,
                color: C.text3,
              }}
            >
              Page content
            </div>
            <TabBar
              active={active7}
              onChange={setActive7}
              activeStyle="line"
              planBadge={3}
              fixed={false}
            />
          </div>
        </div>

        <div className="py-4 text-center text-[10.5px]" style={{ color: '#6B7280', background: '#E5E7EB' }}>
          Header 52px · Tab bar 64px + safe-area iOS · Content скроллится между ними
        </div>
      </div>
    </div>
  );
}
