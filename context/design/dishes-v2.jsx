// CatalogPage.jsx — MealBot, страница каталога блюд (4 состояния).
// Без header/tab bar — только контент. pb-24 под tab bar.
// Одиночный .jsx, моки внутри, Tailwind core + lucide-react, useState.

import React, { useState } from 'react';
import {
  Search, Heart, Refrigerator, SlidersHorizontal, ArrowUpDown,
  Plus, Clock, Flame, X, Check,
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
};

// ─── Моки ─────────────────────────────────────────────────────
const DISHES = [
  { id: '1', name: 'Борщ украинский с говядиной', img: 'https://images.unsplash.com/photo-1518291344630-4857135fb581?w=300', time: 90, cal: 280, tags: ['сытно', 'суп'],     mealTime: ['LUNCH', 'DINNER'], inFridge: false, missing: 3, fav: true  },
  { id: '2', name: 'Салат Цезарь с курицей',      img: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300', time: 20, cal: 340, tags: ['быстро', 'салат'],   mealTime: ['LUNCH'],           inFridge: true,  missing: 0, fav: false },
  { id: '3', name: 'Паста карбонара',             img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300', time: 25, cal: 620, tags: ['быстро'],            mealTime: ['LUNCH', 'DINNER'], inFridge: false, missing: 2, fav: true  },
  { id: '4', name: 'Плов с бараниной',            img: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=300', time: 75, cal: 520, tags: ['сытно'],             mealTime: ['DINNER'],          inFridge: false, missing: 4, fav: false },
  { id: '5', name: 'Гречка с грибами и луком',    img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300', time: 30, cal: 310, tags: ['постно', 'просто'],  mealTime: ['LUNCH', 'DINNER'], inFridge: true,  missing: 0, fav: false },
  { id: '6', name: 'Куриный бульон с лапшой',     img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300', time: 45, cal: 180, tags: ['суп', 'лёгкое'],     mealTime: ['LUNCH'],           inFridge: true,  missing: 1, fav: false },
];

const MEAL_TIMES = [
  { id: 'ALL', label: 'Все' },
  { id: 'BREAKFAST', label: 'Завтрак' },
  { id: 'LUNCH', label: 'Обед' },
  { id: 'DINNER', label: 'Ужин' },
  { id: 'SNACK', label: 'Перекус' },
];

const TAGS = ['быстро', 'сытно', 'лёгкое', 'постно', 'суп', 'салат', 'просто', 'мясо', 'без глютена'];
const CUISINES = ['Русская', 'Итальянская', 'Азиатская', 'Грузинская', 'Французская'];
const DIFFICULTIES = [{ id: 'easy', label: 'Легко' }, { id: 'medium', label: 'Средне' }, { id: 'hard', label: 'Сложно' }];

// ═══ PageHeader ═══════════════════════════════════════════════
function PageHeader({ count }) {
  return (
    <div className="flex items-end justify-between">
      <h1
        className="text-[26px] font-extrabold tracking-tight leading-tight"
        style={{ color: C.text, textWrap: 'balance' }}
      >
        Мои блюда
      </h1>
      <div className="text-[12px] tabular-nums pb-1" style={{ color: C.text3 }}>
        {count} блюд
      </div>
    </div>
  );
}

// ═══ SearchInput ══════════════════════════════════════════════
function SearchInput({ value, onChange, focused }) {
  return (
    <div
      className="flex items-center gap-2 h-11 px-4 rounded-full"
      style={{
        background: C.card,
        border: `1px solid ${focused ? C.accent : C.border}`,
        boxShadow: focused ? `0 0 0 3px ${C.accentMuted}` : 'none',
      }}
    >
      <Search size={18} strokeWidth={2} color={C.text3} />
      <input
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder="Искать блюда, ингредиенты…"
        className="flex-1 bg-transparent outline-none text-[14px]"
        style={{ color: C.text, fontFamily: 'inherit' }}
      />
      {value && (
        <button
          onClick={() => onChange?.('')}
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: C.border, color: C.text2 }}
          aria-label="Очистить"
        >
          <X size={11} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

// ═══ MealTypeChips ════════════════════════════════════════════
function MealTypeChips({ active, onChange }) {
  return (
    <div className="-mx-5 px-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-2" style={{ width: 'max-content' }}>
        {MEAL_TIMES.map(t => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="h-9 px-3.5 rounded-full text-[13px] font-bold whitespace-nowrap flex-shrink-0"
              style={{
                background: on ? C.accentMuted : C.card,
                border: `1px solid ${on ? C.accentBorder : C.border}`,
                color: on ? C.accent : C.text2,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══ QuickFilters ═════════════════════════════════════════════
function QuickFilters({ inFridge, fav, hasFilters, onToggleFridge, onToggleFav, onOpenFilters }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleFridge}
        className="h-9 px-3 rounded-full text-[12.5px] font-bold flex items-center gap-1.5"
        style={{
          background: inFridge ? C.sageMuted : C.card,
          border: `1px solid ${inFridge ? C.sageBorder : C.border}`,
          color: inFridge ? C.sage : C.text2,
        }}
      >
        <Refrigerator size={14} strokeWidth={2} color={inFridge ? C.sage : C.text2} />
        Холодильник
      </button>
      <button
        onClick={onToggleFav}
        className="h-9 px-3 rounded-full text-[12.5px] font-bold flex items-center gap-1.5"
        style={{
          background: fav ? C.accentMuted : C.card,
          border: `1px solid ${fav ? C.accentBorder : C.border}`,
          color: fav ? C.accent : C.text2,
        }}
      >
        <Heart size={14} strokeWidth={2} color={fav ? C.accent : C.text2} fill={fav ? C.accent : 'none'} />
        Избранное
      </button>
      <div className="flex-1" />
      <button
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
        aria-label="Сортировка"
      >
        <ArrowUpDown size={15} strokeWidth={2} color={C.text2} />
      </button>
      <button
        onClick={onOpenFilters}
        className="w-9 h-9 rounded-full flex items-center justify-center relative"
        style={{
          background: hasFilters ? C.accent : C.card,
          border: `1px solid ${hasFilters ? C.accent : C.border}`,
        }}
        aria-label="Фильтры"
      >
        <SlidersHorizontal size={15} strokeWidth={2} color={hasFilters ? '#fff' : C.text2} />
        {hasFilters && (
          <span
            className="absolute rounded-full"
            style={{ top: -2, right: -2, width: 8, height: 8, background: C.sage, border: '2px solid #fff' }}
          />
        )}
      </button>
    </div>
  );
}

// ═══ HintBanner ═══════════════════════════════════════════════
function HintBanner({ onClose }) {
  return (
    <div
      className="rounded-xl flex items-center gap-2 relative"
      style={{ background: C.card, border: `1px dashed ${C.accentBorder}`, padding: '10px 14px' }}
    >
      <span className="text-[16px]">✨</span>
      <div className="flex-1 text-[12.5px] leading-snug" style={{ color: C.text2 }}>
        Несколько блюд — добавь <span style={{ color: C.accent, fontWeight: 700 }}>через запятую</span>
      </div>
      <button
        onClick={onClose}
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ color: C.text3 }}
        aria-label="Закрыть"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

// ═══ DishRow ══════════════════════════════════════════════════
function DishRow({ dish }) {
  const [fav, setFav] = useState(dish.fav);
  return (
    <div
      className="rounded-2xl flex items-center gap-3"
      style={{ background: C.card, border: `1px solid ${C.border}`, padding: 12 }}
    >
      <div className="relative flex-shrink-0">
        <img
          src={dish.img}
          alt=""
          style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: `1px solid ${C.border}`, display: 'block' }}
        />
        {dish.inFridge && (
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: -4, right: -4, width: 18, height: 18, borderRadius: '50%',
              background: C.sage, border: '2px solid #fff',
            }}
          >
            <Check size={10} strokeWidth={3} color="#fff" />
          </div>
        )}
        {dish.missing > 0 && (
          <div
            className="absolute flex items-center justify-center tabular-nums"
            style={{
              bottom: -4, right: -4, minWidth: 22, height: 18, padding: '0 5px',
              borderRadius: 9999,
              background: C.accent, color: '#fff', fontSize: 10.5, fontWeight: 800,
              border: '2px solid #fff', lineHeight: 1,
            }}
          >
            −{dish.missing}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="text-[14.5px] font-semibold leading-snug"
          style={{
            color: C.text,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textWrap: 'pretty',
          }}
        >
          {dish.name}
        </div>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1" style={{ color: C.text3 }}>
          <span className="inline-flex items-center gap-1 text-[12px] tabular-nums" style={{ whiteSpace: 'nowrap' }}>
            <Clock size={11} strokeWidth={2.2} />
            {dish.time} мин
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] tabular-nums" style={{ whiteSpace: 'nowrap' }}>
            <Flame size={11} strokeWidth={2.2} />
            {dish.cal}
          </span>
          {dish.tags.slice(0, 2).map(t => (
            <span
              key={t}
              className="text-[10.5px] font-bold uppercase tracking-wide"
              style={{
                padding: '1px 7px', borderRadius: 9999,
                background: C.bg3, color: C.text2, letterSpacing: 0.4,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 items-center flex-shrink-0">
        <button
          onClick={() => setFav(f => !f)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: fav ? C.accent : C.bg3,
            border: `1px solid ${fav ? C.accent : C.border}`,
          }}
          aria-label="Избранное"
        >
          <Heart size={14} strokeWidth={2.2} color={fav ? '#fff' : C.text3} fill={fav ? '#fff' : 'none'} />
        </button>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: C.bg3, border: `1px solid ${C.border}` }}
          aria-label="Добавить в план"
        >
          <Plus size={14} strokeWidth={2.4} color={C.text2} />
        </button>
      </div>
    </div>
  );
}

// ═══ Sentinel (loading spinner) ══════════════════════════════
function Sentinel() {
  return (
    <div className="flex justify-center mt-5">
      <div
        className="w-6 h-6 rounded-full animate-spin"
        style={{
          border: `2.5px solid ${C.accentMuted}`,
          borderTopColor: C.accent,
        }}
      />
    </div>
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
      Добавить блюдо
    </button>
  );
}

// ═══ EmptyState ═══════════════════════════════════════════════
function EmptyState({ onReset }) {
  return (
    <div className="flex flex-col items-center text-center" style={{ padding: '64px 16px 0' }}>
      <div
        className="flex items-center justify-center"
        style={{
          width: 56, height: 56, borderRadius: '50%',
          background: C.bg3, border: `1px solid ${C.border}`,
        }}
      >
        <Search size={22} strokeWidth={2} color={C.text3} />
      </div>
      <div className="mt-4 text-[15px] font-bold" style={{ color: C.text }}>
        Ничего не найдено
      </div>
      <div className="mt-1 text-[13px] max-w-[260px] leading-relaxed" style={{ color: C.text2, textWrap: 'pretty' }}>
        Попробуй изменить поиск или сбросить фильтры
      </div>
      <button
        onClick={onReset}
        className="mt-4 h-10 px-4 rounded-full text-[13px] font-bold"
        style={{ background: 'transparent', color: C.accent, border: 'none' }}
      >
        Сбросить фильтры
      </button>
    </div>
  );
}

// ═══ FilterSheet ══════════════════════════════════════════════
function FilterSheet({ tags, cuisines, difficulty, onToggleTag, onToggleCuisine, onSetDifficulty, onReset, onApply }) {
  return (
    <div
      className="absolute left-0 right-0 bottom-0"
      style={{
        background: C.card,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: '12px 20px 24px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        maxHeight: '88%', overflowY: 'auto',
      }}
    >
      <div className="flex justify-center mb-3">
        <div style={{ width: 40, height: 4, borderRadius: 9999, background: C.border }} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold" style={{ color: C.text }}>Фильтры</h2>
        <button onClick={onReset} className="text-[13px] font-bold" style={{ color: C.accent, background: 'transparent', border: 'none' }}>
          Сбросить
        </button>
      </div>

      <FilterSection title="Теги">
        <div className="flex flex-wrap gap-2">
          {TAGS.map(t => {
            const on = tags.has(t);
            return (
              <button
                key={t}
                onClick={() => onToggleTag(t)}
                className="h-8 px-3 rounded-full text-[12.5px] font-bold"
                style={{
                  background: on ? C.accentMuted : C.card,
                  border: `1px solid ${on ? C.accentBorder : C.border}`,
                  color: on ? C.accent : C.text2,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Кухня">
        <div className="flex flex-wrap gap-2">
          {CUISINES.map(c => {
            const on = cuisines.has(c);
            return (
              <button
                key={c}
                onClick={() => onToggleCuisine(c)}
                className="h-8 px-3 rounded-full text-[12.5px] font-bold"
                style={{
                  background: on ? C.accentMuted : C.card,
                  border: `1px solid ${on ? C.accentBorder : C.border}`,
                  color: on ? C.accent : C.text2,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Сложность">
        <div
          className="flex rounded-full p-1"
          style={{ background: C.bg3, border: `1px solid ${C.border}` }}
        >
          {DIFFICULTIES.map(d => {
            const on = difficulty === d.id;
            return (
              <button
                key={d.id}
                onClick={() => onSetDifficulty(on ? null : d.id)}
                className="flex-1 h-9 rounded-full text-[13px] font-bold"
                style={{
                  background: on ? C.accent : 'transparent',
                  color: on ? '#fff' : C.text2,
                  border: 'none',
                  transition: 'background 0.12s',
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <button
        onClick={onApply}
        className="mt-7 w-full h-12 rounded-full text-white text-[14px] font-bold flex items-center justify-center gap-2"
        style={{
          background: C.accent,
          border: 'none',
          boxShadow: '0 6px 18px rgba(196,112,74,0.35)',
        }}
      >
        Показать <span className="tabular-nums">42</span> блюда
      </button>
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="mt-6">
      <div className="text-[11.5px] font-bold uppercase tracking-wider mb-2.5" style={{ color: C.text3 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ═══ Screen ═══════════════════════════════════════════════════
function Screen({ variant }) {
  const [active, setActive] = useState(variant === 'search' ? 'LUNCH' : 'ALL');
  const [search, setSearch] = useState(variant === 'search' ? 'паст' : '');
  const [inFridge, setInFridge] = useState(false);
  const [fav, setFav] = useState(false);
  const [hint, setHint] = useState(true);
  const [tags, setTags] = useState(() => new Set(variant === 'filters' ? ['быстро'] : []));
  const [cuisines, setCuisines] = useState(() => new Set(variant === 'filters' ? ['Итальянская'] : []));
  const [difficulty, setDifficulty] = useState(variant === 'filters' ? 'medium' : null);

  const list = variant === 'search'
    ? DISHES.filter(d => d.name.toLowerCase().includes('паст'))
    : DISHES;

  const showHint = variant === 'initial' && hint;
  const showFilters = variant === 'filters';
  const showEmpty = variant === 'empty';

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
      <div className="px-5 pt-5 pb-24">
        <PageHeader count={128} />

        <div className="mt-7">
          <SearchInput value={search} onChange={setSearch} focused={variant === 'search'} />
        </div>

        <div className="mt-7">
          <MealTypeChips active={active} onChange={setActive} />
        </div>

        <div className="mt-7">
          <QuickFilters
            inFridge={inFridge}
            fav={fav}
            hasFilters={tags.size > 0 || cuisines.size > 0 || !!difficulty}
            onToggleFridge={() => setInFridge(v => !v)}
            onToggleFav={() => setFav(v => !v)}
          />
        </div>

        {showHint && (
          <div className="mt-7">
            <HintBanner onClose={() => setHint(false)} />
          </div>
        )}

        {showEmpty ? (
          <div className="mt-7">
            <EmptyState onReset={() => { setTags(new Set()); setCuisines(new Set()); setDifficulty(null); setSearch(''); }} />
          </div>
        ) : (
          <>
            <div className="mt-7 flex flex-col gap-2">
              {list.map(d => <DishRow key={d.id} dish={d} />)}
            </div>
            {variant !== 'search' && <Sentinel />}
          </>
        )}
      </div>

      <FAB />

      {showFilters && (
        <>
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(28,25,23,0.45)' }}
          />
          <FilterSheet
            tags={tags}
            cuisines={cuisines}
            difficulty={difficulty}
            onToggleTag={t => setTags(s => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; })}
            onToggleCuisine={c => setCuisines(s => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; })}
            onSetDifficulty={setDifficulty}
            onReset={() => { setTags(new Set()); setCuisines(new Set()); setDifficulty(null); }}
            onApply={() => { /* close */ }}
          />
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
export default function CatalogPageArtefact() {
  return (
    <div style={{ background: '#E5E7EB', fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[430px]">
        <Divider label="— 1. Начальный (есть блюда + hint) —" />
        <Screen variant="initial" />
        <Divider label="— 2. Поиск активен («паст») —" />
        <Screen variant="search" />
        <Divider label="— 3. Фильтр-модалка открыта —" />
        <Screen variant="filters" />
        <Divider label="— 4. Пустое состояние —" />
        <Screen variant="empty" />
        <div className="py-4 text-center text-[10.5px]" style={{ color: '#6B7280', background: '#E5E7EB' }}>
          Без header / tab bar — только контент. pb-24 под tab bar.
        </div>
      </div>
    </div>
  );
}
