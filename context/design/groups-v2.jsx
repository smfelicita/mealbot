// GroupsPage.jsx — MealBot, страницы семейных групп.
// Без app-header (52px) и tab bar (64px) — те в Layout.
// На GroupDetailPage оставляем top-bar 52px (ChevronLeft + title + MoreVertical).
// Одиночный .jsx, моки инлайном, Tailwind core + lucide-react, useState.

import React, { useState } from 'react';
import {
  Users, UserPlus, Crown, Copy, LogOut, Trash2, MoreVertical,
  Check, X, ChevronRight, ChevronLeft, Mail, QrCode, Home, Heart, Plus,
} from 'lucide-react';

// ─── Токены ───────────────────────────────────────────────────
const C = {
  bg:           '#F6F4EF',
  card:         '#FFFFFF',
  bg3:          '#F5EFE6',
  border:       '#E5D8C8',
  accent:       '#C4704A',
  accentMuted:  'rgba(196,112,74,0.10)',
  accentBorder: 'rgba(196,112,74,0.25)',
  sage:         '#5C7A59',
  sageMuted:    'rgba(92,122,89,0.08)',
  sageBorder:   'rgba(92,122,89,0.30)',
  text:         '#1C1917',
  text2:        '#78716C',
  text3:        '#A8A29E',
  red:          '#D14343',
};

// ─── Моки ─────────────────────────────────────────────────────
const userId = 'u-me';

const GROUPS = [
  {
    id: 'g1',
    name: 'Семья Фелициас',
    type: 'FAMILY',
    ownerId: 'u-me',
    members: [
      { id: 'u-me',      name: 'Марина', initial: 'М', role: 'OWNER',  joined: '2025-12-01' },
      { id: 'u-husband', name: 'Дима',   initial: 'Д', role: 'MEMBER', joined: '2025-12-02' },
      { id: 'u-mom',     name: 'Ольга',  initial: 'О', role: 'MEMBER', joined: '2026-01-15' },
    ],
    pending: [{ email: 'sister@example.com', invitedAt: '2026-04-18' }],
    stats: { dishes: 42, fridge: 18, plans: 6 },
    inviteCode: 'FML-4K2X-9PQR',
  },
  {
    id: 'g2',
    name: 'Друзья-готовальщики',
    type: 'FRIENDS',
    ownerId: 'u-friend',
    members: [
      { id: 'u-friend', name: 'Катя',   initial: 'К', role: 'OWNER',  joined: '2026-02-10' },
      { id: 'u-me',     name: 'Марина', initial: 'М', role: 'MEMBER', joined: '2026-02-12' },
      { id: 'u-nik',    name: 'Ник',    initial: 'Н', role: 'MEMBER', joined: '2026-02-12' },
      { id: 'u-lena',   name: 'Лена',   initial: 'Л', role: 'MEMBER', joined: '2026-03-01' },
    ],
    pending: [],
    stats: { dishes: 28 },
    inviteCode: 'FRN-7H3M-2BNK',
  },
];

const INCOMING_INVITES = [
  { id: 'inv1', groupName: 'Семья Петровых', type: 'FAMILY', invitedBy: 'Анна', invitedAt: '2026-04-19' },
];

// ═══ Avatar ═══════════════════════════════════════════════════
function Avatar({ initial, size = 32, isOwner = false, ringColor = '#fff' }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-bold"
        style={{
          width: size, height: size,
          background: C.bg3,
          border: `1.5px solid ${ringColor === '#fff' ? '#fff' : C.border}`,
          color: C.accent,
          fontSize: size * 0.42,
          boxShadow: ringColor === '#fff' ? `0 0 0 1px ${C.border}` : 'none',
        }}
      >
        {initial}
      </div>
      {isOwner && (
        <div
          className="absolute flex items-center justify-center rounded-full"
          style={{
            top: -3, right: -3, width: 14, height: 14,
            background: '#fff', border: `1px solid ${C.border}`,
          }}
        >
          <Crown size={9} strokeWidth={2.4} color={C.accent} fill={C.accent} />
        </div>
      )}
    </div>
  );
}

// ═══ AvatarStack ══════════════════════════════════════════════
function AvatarStack({ members }) {
  const visible = members.slice(0, 3);
  const extra = members.length - visible.length;
  return (
    <div className="flex" style={{ marginLeft: 0 }}>
      {visible.map((m, i) => (
        <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar initial={m.initial} size={28} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="rounded-full flex items-center justify-center font-bold tabular-nums"
          style={{
            marginLeft: -8, width: 28, height: 28,
            background: C.bg3, border: '1.5px solid #fff',
            boxShadow: `0 0 0 1px ${C.border}`,
            color: C.text2, fontSize: 11,
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

// ═══ TypeBadge ════════════════════════════════════════════════
function TypeBadge({ type }) {
  const isFamily = type === 'FAMILY';
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider"
      style={{
        padding: '3px 8px', borderRadius: 9999,
        background: isFamily ? C.accentMuted : C.sageMuted,
        color: isFamily ? C.accent : C.sage,
        border: `1px solid ${isFamily ? C.accentBorder : C.sageBorder}`,
        letterSpacing: 0.6,
      }}
    >
      {isFamily ? 'FAMILY · Семья' : 'FRIENDS · Друзья'}
    </span>
  );
}

// ═══ SectionLabel ═════════════════════════════════════════════
function SectionLabel({ children, count }) {
  return (
    <div
      className="text-[10.5px] font-bold uppercase mb-3"
      style={{ color: C.text2, letterSpacing: 0.8 }}
    >
      {children}{count != null && <span className="tabular-nums"> · {count}</span>}
    </div>
  );
}

// ═══ PageHeader ═══════════════════════════════════════════════
function PageHeader({ count }) {
  return (
    <div className="flex items-end justify-between">
      <h1 className="text-[26px] font-extrabold tracking-tight leading-tight" style={{ color: C.text, textWrap: 'balance' }}>
        Мои группы
      </h1>
      {count != null && (
        <div className="text-[12px] tabular-nums pb-1" style={{ color: C.text3 }}>
          {count} групп{count === 1 ? 'а' : count >= 2 && count <= 4 ? 'ы' : ''}
        </div>
      )}
    </div>
  );
}

// ═══ TopBar (только на detail) ════════════════════════════════
function TopBar({ title, owner = false, onOpenMenu, menuOpen }) {
  return (
    <div className="relative">
      <header
        className="h-[52px] px-2 flex items-center justify-between sticky top-0 z-30 relative"
        style={{ background: C.card, borderBottom: `1px solid ${C.border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
      >
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'transparent', border: 'none' }}
          aria-label="Назад"
        >
          <ChevronLeft size={20} strokeWidth={2} color={C.text2} />
        </button>
        <div
          className="absolute left-1/2 -translate-x-1/2 text-[15px] font-bold truncate max-w-[220px]"
          style={{ color: C.text }}
          title={title}
        >
          {title}
        </div>
        <button
          onClick={onOpenMenu}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: menuOpen ? C.bg3 : 'transparent', border: 'none' }}
          aria-label="Меню"
        >
          <MoreVertical size={19} strokeWidth={2} color={C.text2} />
        </button>
      </header>

      {menuOpen && (
        <div
          className="absolute z-40"
          style={{
            top: 50, right: 8, width: 220,
            background: C.card, borderRadius: 14,
            border: `1px solid ${C.border}`,
            boxShadow: '0 14px 40px rgba(0,0,0,0.15)',
            padding: 6,
          }}
        >
          {owner ? (
            <>
              <MenuItem>Переименовать</MenuItem>
              <MenuItem>Настройки</MenuItem>
              <MenuDivider />
              <MenuItem danger icon={Trash2}>Удалить группу</MenuItem>
            </>
          ) : (
            <MenuItem danger icon={LogOut}>Выйти из группы</MenuItem>
          )}
        </div>
      )}
    </div>
  );
}
function MenuItem({ children, danger, icon: Icon }) {
  return (
    <button
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13.5px] font-semibold text-left"
      style={{ background: 'transparent', border: 'none', color: danger ? C.red : C.text }}
    >
      {Icon && <Icon size={15} strokeWidth={2.2} color={danger ? C.red : C.text2} />}
      {children}
    </button>
  );
}
function MenuDivider() {
  return <div style={{ height: 1, background: C.border, margin: '4px 6px' }} />;
}

// ═══ Empty states ═════════════════════════════════════════════
function GuestEmpty() {
  return (
    <div className="flex flex-col items-center text-center" style={{ padding: '64px 16px 0' }}>
      <div
        className="flex items-center justify-center"
        style={{ width: 64, height: 64, borderRadius: '50%', background: C.bg3, border: `1px solid ${C.border}` }}
      >
        <Users size={26} strokeWidth={2} color={C.accent} />
      </div>
      <h2 className="mt-4 text-[17px] font-bold" style={{ color: C.text, textWrap: 'balance' }}>
        Готовьте вместе
      </h2>
      <p className="mt-1 text-[14px] leading-relaxed max-w-[280px]" style={{ color: C.text2, textWrap: 'pretty' }}>
        Создайте семейную группу — общий холодильник, план и любимые блюда
      </p>
      <button
        className="mt-6 h-12 px-6 rounded-full text-white text-[14px] font-bold"
        style={{ background: C.accent, border: 'none', boxShadow: '0 6px 18px rgba(196,112,74,0.35)' }}
      >
        Создать свою кухню
      </button>
      <button
        className="mt-2 h-10 px-4 rounded-full text-[13px] font-bold"
        style={{ background: 'transparent', color: C.text2, border: 'none' }}
      >
        Уже есть аккаунт? Войти
      </button>
    </div>
  );
}

function NoGroupsEmpty() {
  return (
    <div className="flex flex-col items-center text-center" style={{ padding: '40px 16px 0' }}>
      <div
        className="flex items-center justify-center"
        style={{ width: 72, height: 72, borderRadius: '50%', background: C.accentMuted, border: `1px solid ${C.accentBorder}` }}
      >
        <Users size={30} strokeWidth={2} color={C.accent} />
      </div>
      <h2 className="mt-4 text-[17px] font-bold" style={{ color: C.text, textWrap: 'balance' }}>
        У тебя пока нет групп
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed max-w-[290px]" style={{ color: C.text2, textWrap: 'pretty' }}>
        Создай FAMILY-группу чтобы делить холодильник с семьёй,
        или FRIENDS — чтобы обмениваться рецептами с друзьями
      </p>
      <div className="flex gap-2 mt-6">
        <button
          className="h-12 px-5 rounded-full text-white text-[13px] font-bold flex items-center gap-1.5"
          style={{ background: C.accent, border: 'none', boxShadow: '0 6px 18px rgba(196,112,74,0.30)' }}
        >
          <Plus size={15} strokeWidth={2.4} /> FAMILY
        </button>
        <button
          className="h-12 px-5 rounded-full text-white text-[13px] font-bold flex items-center gap-1.5"
          style={{ background: C.sage, border: 'none', boxShadow: '0 6px 18px rgba(92,122,89,0.30)' }}
        >
          <Plus size={15} strokeWidth={2.4} /> FRIENDS
        </button>
      </div>
    </div>
  );
}

// ═══ Pending invite card ═════════════════════════════════════
function IncomingInviteCard({ invite }) {
  return (
    <div
      className="rounded-2xl flex items-center gap-3 p-4"
      style={{ background: C.card, border: `1px solid ${C.accentBorder}` }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: C.accentMuted }}
      >
        <Mail size={18} strokeWidth={2} color={C.accent} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold leading-tight" style={{ color: C.text }}>
          {invite.groupName}
        </div>
        <div className="text-[12px] mt-0.5" style={{ color: C.text3 }}>
          от {invite.invitedBy} · 1 день назад
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          className="h-8 px-3 rounded-full text-white text-[12.5px] font-bold"
          style={{ background: C.accent, border: 'none' }}
        >
          Принять
        </button>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'transparent', border: 'none', color: C.text3 }}
          aria-label="Отклонить"
        >
          <X size={15} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

// ═══ Group card ═══════════════════════════════════════════════
function GroupCard({ group }) {
  const isFamily = group.type === 'FAMILY';
  const TypeIcon = isFamily ? Home : Heart;
  const me = group.members.find(m => m.id === userId);
  const meIsOwner = me?.role === 'OWNER';
  const stats = isFamily
    ? `${group.members.length} участника · ${group.stats.dishes} блюд · ${group.stats.fridge} в холодильнике`
    : `${group.members.length} участника · ${group.stats.dishes} блюд`;

  return (
    <button
      className="w-full text-left rounded-2xl p-4 block"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            width: 48, height: 48,
            background: isFamily ? C.accentMuted : C.sageMuted,
            border: `1px solid ${isFamily ? C.accentBorder : C.sageBorder}`,
          }}
        >
          <TypeIcon size={22} strokeWidth={2} color={isFamily ? C.accent : C.sage} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[16px] font-bold leading-tight truncate" style={{ color: C.text }}>
              {group.name}
            </div>
            {meIsOwner && (
              <Crown size={12} strokeWidth={2.4} color={C.accent} fill={C.accent} style={{ flexShrink: 0 }} />
            )}
          </div>
          <TypeBadge type={group.type} />
        </div>
        <ChevronRight size={18} strokeWidth={2} color={C.text3} style={{ flexShrink: 0, marginTop: 4 }} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px dashed ${C.border}` }}>
        <div className="text-[12px] tabular-nums" style={{ color: C.text3, textWrap: 'pretty' }}>
          {stats}
        </div>
        <AvatarStack members={group.members} />
      </div>
    </button>
  );
}

// ═══ FAB ══════════════════════════════════════════════════════
function FAB({ label = '+ Создать группу' }) {
  return (
    <button
      className="absolute h-12 px-4 rounded-full flex items-center gap-1 text-white text-[13.5px] font-bold"
      style={{
        right: 16, bottom: 80,
        background: C.accent, border: 'none',
        boxShadow: '0 8px 24px rgba(196,112,74,0.45)',
      }}
    >
      {label}
    </button>
  );
}

// ═══ Hero (Detail) ════════════════════════════════════════════
function GroupHero({ group }) {
  const isFamily = group.type === 'FAMILY';
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: isFamily ? C.accentMuted : C.sageMuted,
        border: `1px solid ${isFamily ? 'rgba(196,112,74,0.20)' : C.sageBorder}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <TypeBadge type={group.type} />
        <span className="text-[12px]" style={{ color: C.text3 }}>С декабря 2025</span>
      </div>
      <h1
        className="mt-2 text-[24px] font-extrabold tracking-tight leading-tight"
        style={{ color: C.text, textWrap: 'balance' }}
      >
        {group.name}
      </h1>
      <p className="mt-1 text-[13px]" style={{ color: C.text2 }}>
        {group.members.length} участника · {isFamily ? 'Общий холодильник и план' : 'Общий каталог блюд'}
      </p>

      {isFamily && (
        <div className="flex gap-2 mt-4">
          <HeroMetric label="Блюд"      value={group.stats.dishes} />
          <HeroMetric label="В холод."  value={group.stats.fridge} />
          <HeroMetric label="В плане"   value={group.stats.plans} />
        </div>
      )}
    </div>
  );
}
function HeroMetric({ label, value }) {
  return (
    <div
      className="flex-1 rounded-xl px-3 py-2 flex flex-col"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.text3, letterSpacing: 0.6 }}>{label}</div>
      <div className="text-[18px] font-extrabold tabular-nums leading-none mt-1" style={{ color: C.text }}>{value}</div>
    </div>
  );
}

// ═══ Member row ═══════════════════════════════════════════════
function MemberRow({ member, isMe, ownerView, menuOpen, onOpenMenu }) {
  const owner = member.role === 'OWNER';
  return (
    <div
      className="rounded-xl flex items-center gap-3 p-3 relative"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <Avatar initial={member.initial} size={40} isOwner={owner} />
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold leading-tight" style={{ color: C.text }}>{member.name}</div>
        <div className="text-[11px] mt-0.5" style={{ color: C.text3 }}>
          {owner ? 'владелец' : 'участник'} · с {monthRu(member.joined)}
        </div>
      </div>
      {isMe && (
        <span
          className="text-[10.5px] font-bold uppercase tracking-wider"
          style={{ padding: '3px 8px', borderRadius: 9999, background: C.accentMuted, color: C.accent, letterSpacing: 0.6 }}
        >
          Это вы
        </span>
      )}
      {ownerView && !isMe && (
        <button
          onClick={onOpenMenu}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: menuOpen ? C.bg3 : 'transparent', border: 'none' }}
          aria-label="Меню участника"
        >
          <MoreVertical size={16} strokeWidth={2} color={C.text2} />
        </button>
      )}

      {menuOpen && (
        <div
          className="absolute z-30"
          style={{
            top: 52, right: 8, width: 220,
            background: C.card, borderRadius: 14,
            border: `1px solid ${C.border}`,
            boxShadow: '0 14px 40px rgba(0,0,0,0.15)',
            padding: 6,
          }}
        >
          <MenuItem>Передать владение</MenuItem>
          <MenuDivider />
          <MenuItem danger>Удалить из группы</MenuItem>
        </div>
      )}
    </div>
  );
}
function monthRu(iso) {
  const m = new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { month: 'long' });
  return m;
}

// ═══ Pending member row ═══════════════════════════════════════
function PendingRow({ email }) {
  return (
    <div
      className="rounded-xl flex items-center gap-3 p-3"
      style={{ background: C.bg3, border: `1px dashed ${C.border}` }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: C.card, border: `1px dashed ${C.border}` }}
      >
        <Mail size={16} strokeWidth={2} color={C.text3} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold truncate" style={{ color: C.text2 }}>{email}</div>
        <div className="text-[11px] mt-0.5" style={{ color: C.text3 }}>приглашение отправлено · 2 дня назад</div>
      </div>
      <span
        className="text-[10.5px] font-bold uppercase tracking-wider flex-shrink-0"
        style={{ padding: '3px 8px', borderRadius: 9999, background: C.card, color: C.text3, border: `1px solid ${C.border}`, letterSpacing: 0.6 }}
      >
        ожидает
      </span>
    </div>
  );
}

// ═══ Invite block ═════════════════════════════════════════════
function InviteBlock({ code, emphasized = false }) {
  const [copied, setCopied] = useState(false);
  const link = `mealbot.app/g/${code}`;
  const onCopy = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: C.card,
        border: `1px solid ${emphasized ? C.accentBorder : C.border}`,
        boxShadow: emphasized ? `0 0 0 4px ${C.accentMuted}` : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[14px] font-bold" style={{ color: C.text }}>Пригласить в группу</div>
        {emphasized && (
          <span
            className="text-[10.5px] font-bold uppercase tracking-wider"
            style={{ padding: '3px 8px', borderRadius: 9999, background: C.accentMuted, color: C.accent, letterSpacing: 0.6 }}
          >
            Owner
          </span>
        )}
      </div>
      <div className="text-[12px] mb-3" style={{ color: C.text3, textWrap: 'pretty' }}>
        Отправь эту ссылку — приглашённый вступит как участник
      </div>

      <div
        className="flex items-center pl-4 pr-1 py-1 rounded-full relative"
        style={{ background: C.bg3, border: `1px solid ${C.border}` }}
      >
        <div className="flex-1 text-[13px] truncate font-mono" style={{ color: C.text2 }}>
          {link}
        </div>
        <button
          onClick={onCopy}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: C.accent, border: 'none' }}
          aria-label="Скопировать"
        >
          {copied ? <Check size={14} strokeWidth={2.6} color="#fff" /> : <Copy size={14} strokeWidth={2.2} color="#fff" />}
        </button>
        {copied && (
          <div
            className="absolute"
            style={{
              right: 8, top: -32,
              padding: '4px 10px', borderRadius: 9999,
              background: C.text, color: '#fff', fontSize: 11, fontWeight: 700,
              boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
            }}
          >
            Скопировано ✓
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 mt-3">
        <button
          className="h-9 px-3 rounded-full text-[12.5px] font-bold flex items-center gap-1.5"
          style={{ background: 'transparent', color: C.text2, border: 'none' }}
        >
          <Mail size={13} strokeWidth={2.2} /> Telegram
        </button>
        <span style={{ width: 1, height: 16, background: C.border }} />
        <button
          className="h-9 px-3 rounded-full text-[12.5px] font-bold flex items-center gap-1.5"
          style={{ background: 'transparent', color: C.text2, border: 'none' }}
        >
          <QrCode size={13} strokeWidth={2.2} /> QR-код
        </button>
      </div>
    </div>
  );
}

// ═══ Danger zone ══════════════════════════════════════════════
function DangerZone({ owner }) {
  return (
    <div className="pt-5 mt-7" style={{ borderTop: `1px solid ${C.border}` }}>
      {owner ? (
        <div className="flex flex-col gap-2 items-start">
          <button
            className="h-10 rounded-full text-[13px] font-semibold flex items-center gap-2 px-1"
            style={{ background: 'transparent', color: C.text3, border: 'none' }}
          >
            <UserPlus size={14} strokeWidth={2.2} />
            Передать владение и выйти
          </button>
          <button
            className="h-10 rounded-full text-[13px] font-bold flex items-center gap-2 px-1"
            style={{ background: 'transparent', color: C.red, border: 'none' }}
          >
            <Trash2 size={14} strokeWidth={2.2} />
            Удалить группу навсегда
          </button>
        </div>
      ) : (
        <button
          className="h-10 rounded-full text-[13px] font-semibold flex items-center gap-2 px-1"
          style={{ background: 'transparent', color: C.red, border: 'none' }}
        >
          <LogOut size={14} strokeWidth={2.2} />
          Выйти из группы
        </button>
      )}
    </div>
  );
}

// ═══ Screens ══════════════════════════════════════════════════
function GroupsScreen({ variant }) {
  const showInvites = variant === 'list';
  const showGroups  = variant === 'list';
  const showEmpty   = variant === 'empty';
  const showGuest   = variant === 'guest';

  return (
    <div
      className="relative"
      style={{
        background: C.bg, color: C.text,
        fontFamily: 'Nunito, system-ui, sans-serif',
        textWrap: 'pretty', minHeight: 760,
      }}
    >
      <div className="px-5 pt-5 pb-24">
        {showGuest ? (
          <GuestEmpty />
        ) : (
          <>
            <PageHeader count={showGroups ? GROUPS.length : null} />
            {showEmpty && <div className="mt-7"><NoGroupsEmpty /></div>}

            {showInvites && (
              <>
                <div className="mt-7">
                  <SectionLabel count={INCOMING_INVITES.length}>Приглашения</SectionLabel>
                  <div className="flex flex-col gap-2">
                    {INCOMING_INVITES.map(i => <IncomingInviteCard key={i.id} invite={i} />)}
                  </div>
                </div>
                <div className="mt-7">
                  <SectionLabel count={GROUPS.length}>Мои группы</SectionLabel>
                  <div className="flex flex-col gap-2">
                    {GROUPS.map(g => <GroupCard key={g.id} group={g} />)}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
      {showGroups && <FAB />}
    </div>
  );
}

function GroupDetailScreen({ ownerView }) {
  const group = GROUPS[0]; // FAMILY
  const me = group.members.find(m => m.id === userId);
  const [topMenu, setTopMenu] = useState(true);
  const [memberMenu, setMemberMenu] = useState(ownerView ? group.members[1].id : null);

  // Если это не owner-view — переопределим: я — не owner
  const meEffective = ownerView ? me : { ...me, role: 'MEMBER' };
  const groupEffective = ownerView
    ? group
    : { ...group, ownerId: 'u-husband', members: group.members.map(m => m.id === 'u-me' ? { ...m, role: 'MEMBER' } : m.id === 'u-husband' ? { ...m, role: 'OWNER' } : m) };

  return (
    <div
      className="relative"
      style={{
        background: C.bg, color: C.text,
        fontFamily: 'Nunito, system-ui, sans-serif',
        textWrap: 'pretty', minHeight: 760,
      }}
    >
      <TopBar
        title={group.name}
        owner={ownerView}
        onOpenMenu={() => setTopMenu(o => !o)}
        menuOpen={topMenu}
      />

      <div className="px-5 pt-4 pb-24">
        <GroupHero group={groupEffective} />

        <section className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] font-bold" style={{ color: C.text }}>
              Участники <span className="tabular-nums" style={{ color: C.text3, fontWeight: 600 }}>· {groupEffective.members.length}</span>
            </div>
            <button
              className="text-[13px] font-bold flex items-center gap-1"
              style={{ background: 'transparent', color: C.accent, border: 'none' }}
            >
              <UserPlus size={14} strokeWidth={2.2} />
              Пригласить
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {groupEffective.members.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                isMe={m.id === userId}
                ownerView={ownerView}
                menuOpen={memberMenu === m.id}
                onOpenMenu={() => setMemberMenu(o => o === m.id ? null : m.id)}
              />
            ))}
            {groupEffective.pending?.map(p => (
              <PendingRow key={p.email} email={p.email} />
            ))}
          </div>
        </section>

        <section className="mt-7">
          <InviteBlock code={group.inviteCode} emphasized={ownerView} />
        </section>

        <DangerZone owner={ownerView} />
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
export default function GroupsPagesArtefact() {
  return (
    <div style={{ background: '#E5E7EB', fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[430px]">
        <Divider label="— 1. GroupsPage · Гость —" />
        <GroupsScreen variant="guest" />

        <Divider label="— 2. GroupsPage · Пустой —" />
        <GroupsScreen variant="empty" />

        <Divider label="— 3. GroupsPage · Список групп —" />
        <GroupsScreen variant="list" />

        <Divider label="— 4. GroupDetailPage · FAMILY (member) —" />
        <GroupDetailScreen ownerView={false} />

        <Divider label="— 5. GroupDetailPage · FAMILY (owner) —" />
        <GroupDetailScreen ownerView={true} />

        <div className="py-4 text-center text-[10.5px]" style={{ color: '#6B7280', background: '#E5E7EB' }}>
          Без app-header / tab bar — только контент. На detail оставлен top-bar 52px.
        </div>
      </div>
    </div>
  );
}
