// ProfilePage.jsx — MealBot, страница профиля (3 состояния).
// Без header/tab bar — только контент. pb-24 под tab bar.
// Одиночный .jsx, моки внутри, Tailwind core + lucide-react, useState.

import React, { useState } from 'react';
import {
  User, Crown, Globe, Bell, Info, LogOut, Trash2, ChevronRight, Check,
  MessageCircle, Flame, Heart, Calendar, ChefHat,
} from 'lucide-react';

// ─── Токены ───────────────────────────────────────────────────
const C = {
  bg:           '#F6F4EF',
  card:         '#FFFFFF',
  bg3:          '#F5EFE6',
  border:       '#E5D8C8',
  accent:       '#C4704A',
  accentMuted:  'rgba(196,112,74,0.10)',
  sage:         '#5C7A59',
  sageMuted:    'rgba(92,122,89,0.08)',
  sageBorder:   'rgba(92,122,89,0.30)',
  text:         '#1C1917',
  text2:        '#78716C',
  text3:        '#A8A29E',
  pro:          '#B8935A',
  proMuted:     'rgba(184,147,90,0.12)',
  proBorder:    'rgba(184,147,90,0.35)',
  red:          '#D14343',
};

// ─── Моки ─────────────────────────────────────────────────────
const USERS = {
  free: {
    name: 'Марина Фелициас', email: 'smfelicitasm@gmail.com', avatarInitial: 'М',
    isPro: false, joinedAt: '14 ноября 2025',
    stats: { dishes: 24, favorites: 18, days: 158, streak: 7 },
    telegramConnected: false, locale: 'ru', notifications: true,
  },
  pro: {
    name: 'Марина Фелициас', email: 'smfelicitasm@gmail.com', avatarInitial: 'М',
    isPro: true, proPlan: 'Ежемесячная · 499 ₽', proNextBill: '10 мая 2026',
    joinedAt: '14 ноября 2025',
    stats: { dishes: 24, favorites: 18, days: 158, streak: 7 },
    telegramConnected: true, telegramUsername: '@marina_f',
    locale: 'ru', notifications: true,
  },
};
const LANGUAGES = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

// ═══ SectionHeader ════════════════════════════════════════════
function SectionHeader({ children }) {
  return (
    <div
      className="text-[10.5px] font-bold uppercase tracking-wider mb-2.5 px-1"
      style={{ color: C.text3, letterSpacing: 1 }}
    >
      {children}
    </div>
  );
}

// ═══ Hero ═════════════════════════════════════════════════════
function Hero({ user }) {
  const pro = user.isPro;
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
    >
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          width: 72, height: 72,
          background: C.accentMuted,
          color: C.accent,
          fontWeight: 800, fontSize: 28,
          border: `2px solid #fff`,
          boxShadow: pro ? `0 0 0 2px ${C.pro}, 0 4px 14px rgba(184,147,90,0.25)` : '0 4px 14px rgba(0,0,0,0.06)',
        }}
      >
        {user.avatarInitial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="text-[18px] font-extrabold leading-tight"
            style={{ color: C.text, textWrap: 'pretty' }}
          >
            {user.name}
          </div>
          {pro ? (
            <span
              className="inline-flex items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: C.proMuted, border: `1px solid ${C.proBorder}`, color: C.pro, letterSpacing: 1 }}
            >
              <Crown size={10} strokeWidth={2.4} color={C.pro} />
              Pro
            </span>
          ) : (
            <span
              className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.text2, letterSpacing: 1 }}
            >
              Free
            </span>
          )}
        </div>
        <div className="text-[12.5px] mt-0.5 truncate" style={{ color: C.text3 }}>
          {user.email}
        </div>
        <div className="text-[11.5px] mt-1" style={{ color: C.text3 }}>
          С нами с {user.joinedAt}
        </div>
      </div>
    </div>
  );
}

// ═══ MetaStrip (4 stats) ══════════════════════════════════════
function StatCell({ icon: Icon, value, label, accentColor }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      <Icon size={16} strokeWidth={2.2} color={accentColor || C.accent} />
      <div
        className="text-[18px] font-extrabold tabular-nums leading-tight mt-0.5"
        style={{ color: C.text }}
      >
        {value}
      </div>
      <div
        className="text-[9.5px] font-bold uppercase tracking-wide"
        style={{ color: C.text3, letterSpacing: 0.6 }}
      >
        {label}
      </div>
    </div>
  );
}
function MetaStrip({ stats }) {
  return (
    <div
      className="rounded-2xl grid grid-cols-4 gap-2 p-3"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <StatCell icon={ChefHat}  value={stats.dishes}    label="Блюда" />
      <StatCell icon={Heart}    value={stats.favorites} label="Избр." />
      <StatCell icon={Calendar} value={stats.days}      label="Дней" />
      <StatCell icon={Flame}    value={stats.streak}    label="Серия" accentColor={stats.streak > 0 ? C.sage : C.accent} />
    </div>
  );
}

// ═══ ProUpgradeCard (Free) ════════════════════════════════════
function ProUpgradeCard() {
  const perks = [
    'Безлимитный ИИ-помощник',
    'Расширенный анализ холодильника',
    'Приоритетная поддержка',
  ];
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: C.proMuted, border: `1px solid ${C.proBorder}` }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: `1px solid ${C.proBorder}` }}
        >
          <Crown size={18} strokeWidth={2.2} color={C.pro} />
        </div>
        <h3 className="text-[17px] font-bold" style={{ color: C.text }}>
          MealBot Pro
        </h3>
      </div>
      <div
        className="text-[13px] mt-2.5 leading-relaxed"
        style={{ color: C.text2, textWrap: 'pretty' }}
      >
        Безлимитный ИИ-чат, расширенные рекомендации, приоритетная поддержка
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {perks.map(p => (
          <li key={p} className="flex items-center gap-2 text-[13px]" style={{ color: C.text }}>
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#fff', border: `1px solid ${C.proBorder}` }}
            >
              <Check size={11} strokeWidth={3} color={C.pro} />
            </span>
            {p}
          </li>
        ))}
      </ul>

      <button
        className="mt-5 w-full h-12 rounded-full text-white text-[14px] font-bold flex items-center justify-center"
        style={{ background: C.pro, border: 'none', boxShadow: '0 6px 18px rgba(184,147,90,0.40)' }}
      >
        Попробовать Pro — 499 ₽/мес
      </button>
      <button
        className="mt-2 w-full h-9 text-[12px] font-semibold"
        style={{ background: 'transparent', color: C.text3, border: 'none' }}
      >
        Подробнее о Pro
      </button>
    </div>
  );
}

// ═══ MySubscriptionCard (Pro) ═════════════════════════════════
function MySubscriptionCard({ user }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: C.card, border: `1px solid ${C.proBorder}` }}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <Crown size={20} strokeWidth={2.2} color={C.pro} />
        <h3 className="text-[17px] font-bold" style={{ color: C.text }}>
          MealBot Pro
        </h3>
        <span
          className="text-[10.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: C.proMuted, color: C.pro, letterSpacing: 1 }}
        >
          активна
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="text-[13px]" style={{ color: C.text }}>
          {user.proPlan}
        </div>
        <div className="text-[12.5px]" style={{ color: C.text3 }}>
          Следующее списание: {user.proNextBill}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="flex-1 h-10 rounded-full text-[13px] font-bold"
          style={{
            background: 'transparent',
            color: C.accent,
            border: `1px solid ${C.border}`,
          }}
        >
          Управлять
        </button>
        <button
          className="flex-1 h-10 rounded-full text-[13px] font-bold"
          style={{
            background: 'transparent',
            color: C.red,
            border: `1px solid ${C.border}`,
          }}
        >
          Отменить
        </button>
      </div>
    </div>
  );
}

// ═══ TelegramRow ══════════════════════════════════════════════
function TelegramRow({ connected, username }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: '#229ED9' }}
      >
        <MessageCircle size={20} strokeWidth={2} color="#fff" fill="#fff" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold" style={{ color: C.text }}>
          Telegram-бот
        </div>
        <div className="text-[12px] mt-0.5" style={{ color: C.text3 }}>
          {connected ? username : 'Управляй приложением прямо в Telegram'}
        </div>
      </div>
      {connected ? (
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 flex-shrink-0"
          style={{ background: C.sageMuted, color: C.sage, border: `1px solid ${C.sageBorder}` }}
        >
          <Check size={11} strokeWidth={3} color={C.sage} />
          Подключено
        </span>
      ) : (
        <button
          className="text-[12px] font-bold text-white px-3 h-8 rounded-full flex-shrink-0"
          style={{ background: C.accent, border: 'none' }}
        >
          Подключить
        </button>
      )}
    </div>
  );
}

// ═══ Toggle ═══════════════════════════════════════════════════
function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="rounded-full relative flex-shrink-0"
      style={{
        width: 40, height: 24,
        background: on ? C.accent : C.border,
        border: 'none', cursor: 'pointer',
        transition: 'background 0.18s',
      }}
      aria-label="Переключатель"
    >
      <span
        className="absolute rounded-full"
        style={{
          top: 2, left: 2, width: 20, height: 20,
          background: '#fff',
          transform: on ? 'translateX(16px)' : 'translateX(0)',
          transition: 'transform 0.18s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

// ═══ SettingRow ═══════════════════════════════════════════════
function SettingRow({ icon: Icon, label, right }) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: C.accentMuted }}
      >
        <Icon size={16} strokeWidth={2} color={C.accent} />
      </div>
      <div className="flex-1 text-[14px] font-semibold" style={{ color: C.text }}>
        {label}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {right}
      </div>
    </div>
  );
}

// ═══ Screen ═══════════════════════════════════════════════════
function Screen({ variant }) {
  const isGuest = variant === 'guest';
  const user = isGuest ? null : USERS[variant];

  const [notifs, setNotifs] = useState(user?.notifications ?? true);
  const [lang, setLang] = useState(user?.locale ?? 'ru');
  const [langOpen, setLangOpen] = useState(false);

  if (isGuest) {
    return (
      <div
        className="px-5 pt-12 pb-24 flex flex-col items-center text-center"
        style={{ background: C.bg, color: C.text, fontFamily: 'Nunito, system-ui, sans-serif', minHeight: 720 }}
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: 80, height: 80, background: C.bg3, border: `1px solid ${C.border}` }}
        >
          <User size={32} strokeWidth={1.8} color={C.text3} />
        </div>
        <h1
          className="mt-5 text-[19px] font-bold"
          style={{ color: C.text, textWrap: 'pretty' }}
        >
          Войдите в аккаунт
        </h1>
        <p
          className="mt-2 text-[14px] leading-relaxed max-w-[300px]"
          style={{ color: C.text2, textWrap: 'pretty' }}
        >
          Чтобы хранить свои блюда, план и холодильник — создайте аккаунт или войдите
        </p>

        <div className="mt-6 w-full max-w-[320px] flex flex-col gap-2">
          <button
            className="w-full h-12 rounded-full text-white text-[14px] font-bold"
            style={{ background: C.accent, border: 'none', boxShadow: '0 6px 18px rgba(196,112,74,0.35)' }}
          >
            Создать аккаунт
          </button>
          <button
            className="w-full h-12 rounded-full text-[14px] font-bold"
            style={{ background: C.card, color: C.text, border: `1px solid ${C.border}` }}
          >
            Войти
          </button>
        </div>

        <p
          className="mt-5 text-[12px] max-w-[280px] leading-relaxed"
          style={{ color: C.text3, textWrap: 'pretty' }}
        >
          Зачем это нужно? Данные синхронизируются между устройствами и сохранятся
        </p>
      </div>
    );
  }

  return (
    <div
      className="px-5 pt-4 pb-24"
      style={{ background: C.bg, color: C.text, fontFamily: 'Nunito, system-ui, sans-serif', textWrap: 'pretty', minHeight: 720 }}
    >
      <Hero user={user} />

      <div className="mt-7">
        <MetaStrip stats={user.stats} />
      </div>

      <div className="mt-7">
        {user.isPro
          ? <MySubscriptionCard user={user} />
          : <ProUpgradeCard />}
      </div>

      <div className="mt-7">
        <SectionHeader>Подключения</SectionHeader>
        <TelegramRow connected={user.telegramConnected} username={user.telegramUsername} />
      </div>

      <div className="mt-7">
        <SectionHeader>Настройки</SectionHeader>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setLangOpen(o => !o)}
            className="w-full text-left"
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <SettingRow
              icon={Globe}
              label="Язык интерфейса"
              right={
                <>
                  <span className="text-[13px]" style={{ color: C.text3 }}>
                    {LANGUAGES.find(l => l.code === lang).label} {LANGUAGES.find(l => l.code === lang).flag}
                  </span>
                  <ChevronRight size={16} strokeWidth={2} color={C.text3} />
                </>
              }
            />
          </button>

          {langOpen && (
            <div
              className="rounded-xl flex flex-col"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              {LANGUAGES.map((l, i) => {
                const on = l.code === lang;
                return (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className="flex items-center gap-2 px-4 h-11 text-[13.5px]"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
                      color: on ? C.accent : C.text,
                      fontWeight: on ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{l.flag}</span>
                    <span className="flex-1 text-left">{l.label}</span>
                    {on && <Check size={14} strokeWidth={2.5} color={C.accent} />}
                  </button>
                );
              })}
            </div>
          )}

          <SettingRow
            icon={Bell}
            label="Уведомления"
            right={<Toggle on={notifs} onChange={setNotifs} />}
          />
          <SettingRow
            icon={Info}
            label="О приложении"
            right={<ChevronRight size={16} strokeWidth={2} color={C.text3} />}
          />
        </div>
      </div>

      <div className="mt-7">
        <SectionHeader>Аккаунт</SectionHeader>
        <div className="flex flex-col gap-2">
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <LogOut size={18} strokeWidth={2} color={C.text2} />
            <div className="flex-1 text-[14px] font-semibold" style={{ color: C.text }}>
              Выйти
            </div>
            <ChevronRight size={16} strokeWidth={2} color={C.text3} />
          </div>
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <Trash2 size={18} strokeWidth={2} color={C.red} />
            <div className="flex-1 text-[14px] font-semibold" style={{ color: C.red }}>
              Удалить аккаунт
            </div>
            <ChevronRight size={16} strokeWidth={2} color={C.text3} />
          </div>
        </div>
      </div>

      <div
        className="mt-7 text-center text-[10.5px]"
        style={{ color: C.text3 }}
      >
        MealBot v2.4.0 · условия · приватность
      </div>
    </div>
  );
}

// ═══ Divider ══════════════════════════════════════════════════
function Divider({ label }) {
  return (
    <div className="h-8 flex items-center justify-center" style={{ background: '#E5E7EB' }}>
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>{label}</span>
    </div>
  );
}

// ═══ Default export ═══════════════════════════════════════════
export default function ProfilePageArtefact() {
  return (
    <div style={{ background: '#E5E7EB', fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[430px]">
        <Divider label="— 1. Гость —" />
        <Screen variant="guest" />
        <Divider label="— 2. Free-юзер —" />
        <Screen variant="free" />
        <Divider label="— 3. Pro-юзер —" />
        <Screen variant="pro" />
        <div className="py-4 text-center text-[10.5px]" style={{ color: '#6B7280', background: '#E5E7EB' }}>
          Без header / tab bar — только контент. pb-24 под tab bar.
        </div>
      </div>
    </div>
  );
}
