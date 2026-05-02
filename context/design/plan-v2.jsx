// PlanPage.jsx — MealBot, страница плана питания (3 состояния).
// Без header/tab bar, только контент. pb-24 под tab bar.
// Одиночный .jsx, моки инлайном, Tailwind core + lucide-react, useState.

import React, { useState } from 'react';
import {
  Calendar, CalendarPlus, Sun, Utensils, Moon, Cookie,
  X, Users, Check, ChevronRight, Sparkles, Flame, Clock, Plus,
} from 'lucide-react';

// ─── Токены ───────────────────────────────────────────────────
const C = {
  bg:           '#F6F4EF',
  card:         '#FFFFFF',
  bg3:          '#F5EFE6',
  border:       '#E5D8C8',
  accent:       '#C4704A',
  accentMuted:  'rgba(196,112,74,0.10)',
  accentBorder: 'rgba(196,112,74,0.20)',
  sage:         '#5C7A59',
  sageMuted:    'rgba(92,122,89,0.08)',
  sageBorder:   'rgba(92,122,89,0.30)',
  text:         '#1C1917',
  text2:        '#78716C',
  text3:        '#A8A29E',
};

// ─── Моки ─────────────────────────────────────────────────────
const userId = 'u-me';

const PLANS = [
  { id: 'p1', date: '2026-04-20', mealType: 'BREAKFAST', dish: { id: 'd1', name: 'Овсянка с ягодами и мёдом', img: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=300', time: 5,  cal: 320 }, addedBy: { id: 'u-me',      name: 'Марина', initial: 'М' } },
  { id: 'p2', date: '2026-04-20', mealType: 'LUNCH',     dish: { id: 'd2', name: 'Борщ украинский с говядиной', img: 'https://images.unsplash.com/photo-1518291344630-4857135fb581?w=300', time: 90, cal: 280 }, addedBy: { id: 'u-husband', name: 'Дима',   initial: 'Д' } },
  { id: 'p3', date: '2026-04-20', mealType: 'DINNER',    dish: { id: 'd3', name: 'Курица с грибами в сливках', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300', time: 30, cal: 480 }, addedBy: { id: 'u-me',      name: 'Марина', initial: 'М' } },
  { id: 'p4', date: '2026-04-21', mealType: 'BREAKFAST', dish: { id: 'd4', name: 'Сырники со сметаной',       img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300', time: 15, cal: 420 }, addedBy: { id: 'u-me',      name: 'Марина', initial: 'М' } },
  { id: 'p5', date: '2026-04-21', mealType: 'DINNER',    dish: { id: 'd5', name: 'Паста карбонара',           img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300', time: 25, cal: 620 }, addedBy: { id: 'u-husband', name: 'Дима',   initial: 'Д' } },
  { id: 'p6', date: '2026-04-23', mealType: 'ANYTIME',   dish: { id: 'd6', name: 'Запеканка творожная',       img: 'https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=300', time: 40, cal: 380 }, addedBy: { id: 'u-me',      name: 'Марина', initial: 'М' } },
];

const MEAL_META = {
  BREAKFAST: { label: 'Завтрак',  icon: Sun },
  LUNCH:     { label: 'Обед',     icon: Utensils },
  DINNER:    { label: 'Ужин',     icon: Moon },
  SNACK:     { label: 'Перекус',  icon: Cookie },
  ANYTIME:   { label: null,       icon: null },
};

const TODAY = '2026-04-20';
const MEAL_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'ANYTIME'];

// ─── Helpers ──────────────────────────────────────────────────
function fmtDate(iso) {
  // 'понедельник, 20 апреля'
  return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
}
function fmtDateUpper(iso) {
  return fmtDate(iso).toUpperCase();
}

function groupByDate(items) {
  const map = new Map();
  items.forEach(p => {
    if (!map.has(p.date)) map.set(p.date, []);
    map.get(p.date).push(p);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}
function groupByMeal(items) {
  const map = new Map();
  items.forEach(p => {
    if (!map.has(p.mealType)) map.set(p.mealType, []);
    map.get(p.mealType).push(p);
  });
  return [...map.entries()].sort(([a], [b]) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b));
}

// ═══ PageHeader ═══════════════════════════════════════════════
function PageHeader({ count, days }) {
  return (
    <div className="flex items-end justify-between">
      <h1 className="text-[26px] font-extrabold tracking-tight leading-tight" style={{ color: C.text, textWrap: 'balance' }}>
        План готовки
      </h1>
      <div className="text-[12px] tabular-nums pb-1" style={{ color: C.text3 }}>
        {count} блюд · {days} дня
      </div>
    </div>
  );
}

// ═══ FilterChips ══════════════════════════════════════════════
function FilterChips({ active, onChange, counts }) {
  const items = [
    { id: 'all',    label: 'Все',       n: counts.all },
    { id: 'mine',   label: 'Мои',       n: counts.mine },
    { id: 'family', label: 'Семейные',  n: counts.family },
  ];
  return (
    <div className="-mx-5 px-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-2" style={{ width: 'max-content' }}>
        {items.map(t => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="h-9 px-3.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
              style={{
                background: on ? C.accentMuted : C.card,
                border: `1px solid ${on ? C.accentBorder : C.border}`,
                color: on ? C.accent : C.text2,
              }}
            >
              {t.label}
              <span className="tabular-nums" style={{ color: on ? C.accent : C.text3, fontWeight: 700 }}>· {t.n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══ MetaStrip ════════════════════════════════════════════════
function MetaStrip({ today, week, total, sageTotal }) {
  const Cell = ({ label, value, sage }) => (
    <div
      className="flex-1 rounded-xl px-3 py-2.5 flex flex-col"
      style={{
        background: sage ? C.sageMuted : C.card,
        border: `1px solid ${sage ? C.sageBorder : C.border}`,
      }}
    >
      <div className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: sage ? C.sage : C.text3, letterSpacing: 0.6 }}>
        {label}
      </div>
      <div className="text-[18px] font-extrabold tabular-nums leading-none mt-1" style={{ color: sage ? C.sage : C.text }}>
        {value}
      </div>
    </div>
  );
  return (
    <div className="flex gap-2">
      <Cell label="Сегодня" value={today} />
      <Cell label="Неделя" value={week} />
      <Cell label="Всего" value={total} sage={sageTotal} />
    </div>
  );
}

// ═══ AuthorAvatar ═════════════════════════════════════════════
function AuthorAvatar({ author, size = 24 }) {
  if (!author || author.id === userId) return null;
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size, height: size,
        background: C.bg3,
        border: `1px solid ${C.border}`,
        color: C.accent,
        fontSize: size * 0.46,
      }}
      title={`Добавил${author.name === 'Дима' ? '' : 'а'}: ${author.name}`}
    >
      {author.initial}
    </div>
  );
}

// ═══ MealSubLabel ═════════════════════════════════════════════
function MealSubLabel({ mealType, accent = false }) {
  const meta = MEAL_META[mealType];
  if (!meta?.label) return null;
  const Icon = meta.icon;
  const color = accent ? C.accent : C.text;
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} strokeWidth={2.2} color={color} />
      <span className="text-[13px] font-bold" style={{ color }}>
        {meta.label}
      </span>
    </div>
  );
}

// ═══ PlanItem ═════════════════════════════════════════════════
function PlanItem({ plan, onRemove, accent = false }) {
  const { dish, addedBy } = plan;
  return (
    <div
      className="flex items-center gap-3"
      style={{
        background: accent ? 'transparent' : C.card,
        borderRadius: accent ? 0 : 16,
        border: accent ? 'none' : `1px solid ${C.border}`,
        padding: accent ? '10px 0' : 12,
      }}
    >
      <img
        src={dish.img}
        alt=""
        style={{
          width: 60, height: 60, borderRadius: 12, objectFit: 'cover',
          border: `1px solid ${C.border}`, display: 'block', flexShrink: 0,
        }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="text-[14.5px] font-semibold leading-snug"
          style={{
            color: C.text,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            textWrap: 'pretty',
          }}
        >
          {dish.name}
        </div>
        <div className="flex items-center gap-3 mt-1" style={{ color: C.text3 }}>
          <span className="inline-flex items-center gap-1 text-[11px] tabular-nums">
            <Clock size={10} strokeWidth={2.2} />{dish.time} мин
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] tabular-nums">
            <Flame size={10} strokeWidth={2.2} />{dish.cal}
          </span>
        </div>
      </div>
      <AuthorAvatar author={addedBy} />
      <button
        onClick={() => onRemove?.(plan.id)}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'transparent', color: C.text3, border: 'none' }}
        aria-label="Убрать из плана"
      >
        <X size={15} strokeWidth={2.2} />
      </button>
    </div>
  );
}

// ═══ TodayPinned ══════════════════════════════════════════════
function TodayPinned({ items, onRemove, variant = 'A' }) {
  const groups = groupByMeal(items);
  if (variant === 'B') {
    // B — раздельные карточки с accent-left-border
    return (
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} strokeWidth={2.2} color={C.accent} />
          <h2 className="text-[15px] font-bold" style={{ color: C.accent }}>
            Сегодня · {fmtDate(TODAY)}
          </h2>
        </div>
        <div className="text-[12px] mb-3" style={{ color: C.accent, opacity: 0.7 }}>
          {items.length} приёма пищи запланировано
        </div>
        <div className="flex flex-col gap-2">
          {groups.map(([mealType, list]) => (
            <div key={mealType}>
              <MealSubLabel mealType={mealType} accent />
              <div className="flex flex-col gap-2">
                {list.map(p => (
                  <div
                    key={p.id}
                    style={{
                      background: C.card,
                      borderRadius: 16,
                      border: `1px solid ${C.border}`,
                      borderLeft: `4px solid ${C.accent}`,
                      padding: 12,
                    }}
                  >
                    <PlanItem plan={p} onRemove={onRemove} accent />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // A — group-box pinned
  return (
    <section
      className="rounded-2xl"
      style={{
        background: C.accentMuted,
        border: `1px solid ${C.accentBorder}`,
        padding: 16,
      }}
    >
      <div className="flex items-center gap-2">
        <Sparkles size={16} strokeWidth={2.2} color={C.accent} />
        <h2 className="text-[15px] font-bold" style={{ color: C.accent }}>
          Сегодня · {fmtDate(TODAY)}
        </h2>
      </div>
      <div className="text-[12px] mt-0.5 mb-3" style={{ color: C.accent, opacity: 0.7 }}>
        {items.length} приёма пищи запланировано
      </div>

      <div
        className="rounded-xl"
        style={{ background: C.card, border: `1px solid ${C.accentBorder}`, padding: '4px 12px' }}
      >
        {groups.map(([mealType, list], gi) => (
          <div
            key={mealType}
            style={{
              borderTop: gi === 0 ? 'none' : `1px solid ${C.accentBorder}`,
              padding: '10px 0',
            }}
          >
            <MealSubLabel mealType={mealType} accent />
            <div>
              {list.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    borderTop: i === 0 ? 'none' : `1px dashed ${C.accentMuted}`,
                  }}
                >
                  <PlanItem plan={p} onRemove={onRemove} accent />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══ DayBlock ═════════════════════════════════════════════════
function DayBlock({ date, items, onRemove }) {
  const groups = groupByMeal(items);
  return (
    <section>
      <div
        className="text-[11px] font-bold uppercase tracking-wider pb-2 mb-3"
        style={{ color: C.text2, borderBottom: `1px solid ${C.border}`, letterSpacing: 0.8 }}
      >
        {fmtDateUpper(date)}
      </div>
      <div className="flex flex-col gap-4">
        {groups.map(([mealType, list]) => (
          <div key={mealType}>
            <MealSubLabel mealType={mealType} />
            <div className="flex flex-col gap-2">
              {list.map(p => <PlanItem key={p.id} plan={p} onRemove={onRemove} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══ FAB ══════════════════════════════════════════════════════
function FAB() {
  return (
    <button
      className="absolute h-12 px-4 rounded-full flex items-center gap-2 text-white text-[13.5px] font-bold"
      style={{
        right: 16, bottom: 80,
        background: C.accent, border: 'none',
        boxShadow: '0 8px 24px rgba(196,112,74,0.45)',
      }}
    >
      <Plus size={16} strokeWidth={2.4} />
      В план
    </button>
  );
}

// ═══ EmptyState ═══════════════════════════════════════════════
function EmptyState({ icon: Icon, title, body, primary, secondary }) {
  return (
    <div className="flex flex-col items-center text-center" style={{ padding: '64px 16px 0' }}>
      <div
        className="flex items-center justify-center"
        style={{ width: 64, height: 64, borderRadius: '50%', background: C.bg3, border: `1px solid ${C.border}` }}
      >
        <Icon size={26} strokeWidth={2} color={C.accent} />
      </div>
      <h2 className="mt-4 text-[17px] font-bold" style={{ color: C.text, textWrap: 'balance' }}>
        {title}
      </h2>
      <p className="mt-1 text-[14px] leading-relaxed max-w-[280px]" style={{ color: C.text2, textWrap: 'pretty' }}>
        {body}
      </p>
      <button
        className="mt-6 h-12 px-6 rounded-full text-white text-[14px] font-bold"
        style={{ background: C.accent, border: 'none', boxShadow: '0 6px 18px rgba(196,112,74,0.35)' }}
      >
        {primary}
      </button>
      {secondary && (
        <button
          className="mt-2 h-10 px-4 rounded-full text-[13px] font-bold"
          style={{ background: 'transparent', color: C.text2, border: 'none' }}
        >
          {secondary}
        </button>
      )}
    </div>
  );
}

// ═══ Screen ═══════════════════════════════════════════════════
function Screen({ variant, todayVariant = 'A' }) {
  const [filter, setFilter] = useState('all');
  const [plans, setPlans] = useState(PLANS);
  const remove = id => setPlans(ps => ps.filter(p => p.id !== id));

  const isFamily = true;
  const filtered = plans.filter(p =>
    filter === 'all' ? true :
    filter === 'mine' ? p.addedBy.id === userId :
    /* family */ true
  );

  const counts = {
    all:    plans.length,
    mine:   plans.filter(p => p.addedBy.id === userId).length,
    family: plans.length,
  };

  const today = filtered.filter(p => p.date === TODAY);
  const future = filtered.filter(p => p.date !== TODAY);
  const futureByDate = groupByDate(future);
  const days = new Set(filtered.map(p => p.date)).size;

  return (
    <div
      className="relative"
      style={{
        background: C.bg, color: C.text,
        fontFamily: 'Nunito, system-ui, sans-serif',
        textWrap: 'pretty',
        minHeight: 720,
      }}
    >
      {variant === 'guest' && (
        <div className="px-5 pt-5 pb-24">
          <PageHeader count={0} days={0} />
          <div className="mt-7">
            <EmptyState
              icon={Calendar}
              title="Планируй меню заранее"
              body="Добавляй блюда на неделю вперёд — и больше не думай, что готовить каждый день"
              primary="Создать свою кухню"
              secondary="Уже есть аккаунт? Войти"
            />
          </div>
        </div>
      )}

      {variant === 'empty' && (
        <div className="px-5 pt-5 pb-24">
          <PageHeader count={0} days={0} />
          <div className="mt-7">
            <EmptyState
              icon={CalendarPlus}
              title="План пока пустой"
              body={'Добавляй блюда в план прямо из карточки рецепта — кнопка «В план готовки»'}
              primary="Посмотреть блюда"
            />
          </div>
        </div>
      )}

      {variant === 'normal' && (
        <>
          <div className="px-5 pt-5 pb-24">
            <PageHeader count={filtered.length} days={days} />

            {isFamily && (
              <div className="mt-7">
                <FilterChips active={filter} onChange={setFilter} counts={counts} />
              </div>
            )}

            <div className="mt-7">
              <MetaStrip
                today={today.length}
                week={filtered.length}
                total={filtered.length}
                sageTotal={filtered.length >= 5}
              />
            </div>

            {today.length > 0 && (
              <div className="mt-7">
                <TodayPinned items={today} onRemove={remove} variant={todayVariant} />
              </div>
            )}

            <div className="mt-7 flex flex-col gap-7">
              {futureByDate.map(([date, items]) => (
                <DayBlock key={date} date={date} items={items} onRemove={remove} />
              ))}
            </div>
          </div>
          <FAB />
        </>
      )}
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
export default function PlanPageArtefact() {
  return (
    <div style={{ background: '#E5E7EB', fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[430px]">
        <Divider label="— 1. Гость —" />
        <Screen variant="guest" />

        <Divider label="— 2. Пустой план —" />
        <Screen variant="empty" />

        <Divider label="— 3. Рабочий вид (FAMILY) · today = group-box (A) —" />
        <Screen variant="normal" todayVariant="A" />

        <Divider label="— 3b. Рабочий вид · today = accent-left-border (B) —" />
        <Screen variant="normal" todayVariant="B" />

        <div className="py-4 text-center text-[10.5px]" style={{ color: '#6B7280', background: '#E5E7EB' }}>
          Без header / tab bar — только контент. pb-24 под tab bar.
        </div>
      </div>
    </div>
  );
}
