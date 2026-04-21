// HomePage.jsx — MealBot, главная страница (редизайн)
// Три состояния друг под другом: гость / юзер пустой холодильник / рабочий вид.
// Одиночный .jsx, мок внутри, только core Tailwind + lucide-react, useState.

import React, { useState } from 'react';
import {
  ChevronRight, Heart, Refrigerator,
  Sun, Utensils, Moon, Cookie,
  Plus, Clock, Flame, Sparkles,
  Bell, X, Check,
} from 'lucide-react';

// ─── Токены ───────────────────────────────────────────────────
const C = {
  bg: '#F6F4EF',
  card: '#FFFFFF',
  bg3: '#F5EFE6',
  border: '#E5D8C8',
  accent: '#C4704A',
  accentMuted: 'rgba(196,112,74,0.1)',
  accentBorder: 'rgba(196,112,74,0.25)',
  sage: '#5C7A59',
  sageMuted: 'rgba(92,122,89,0.08)',
  sageBorder: 'rgba(92,122,89,0.30)',
  text: '#1C1917',
  text2: '#78716C',
  text3: '#A8A29E',
};

// ─── Моки ─────────────────────────────────────────────────────
const DISHES = [
  { id: '1', name: 'Омлет с помидорами и сыром',      img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400', cookTime: 10, calories: 285, mealTime: ['BREAKFAST'],          inFridge: true,  missingCount: 0 },
  { id: '2', name: 'Овсянка с ягодами и мёдом',       img: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400', cookTime: 5,  calories: 320, mealTime: ['BREAKFAST'],          inFridge: true,  missingCount: 0 },
  { id: '3', name: 'Сырники со сметаной',             img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400', cookTime: 15, calories: 420, mealTime: ['BREAKFAST', 'SNACK'], inFridge: false, missingCount: 2 },
  { id: '4', name: 'Творожная запеканка с изюмом',    img: 'https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=400', cookTime: 40, calories: 380, mealTime: ['BREAKFAST'],          inFridge: true,  missingCount: 0 },
];

const MEAL_TIMES = [
  { id: 'BREAKFAST', label: 'Завтрак', Icon: Sun },
  { id: 'LUNCH',     label: 'Обед',    Icon: Utensils },
  { id: 'DINNER',    label: 'Ужин',    Icon: Moon },
  { id: 'SNACK',     label: 'Перекус', Icon: Cookie },
];

const USER = { name: 'Марина', initial: 'М' };
const PLANNED_TODAY = DISHES[0]; // «В плане на сегодня» для варианта 3

// ═══ Header ═══════════════════════════════════════════════════
function Header({ guest }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.accent }}>
          <Utensils size={14} strokeWidth={2.4} color="#fff" />
        </div>
        <div className="text-[15px] font-extrabold tracking-tight" style={{ color: C.text }}>Моя кухня</div>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Bell size={16} strokeWidth={2} color={C.text2} />
        </button>
        {guest ? (
          <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-bold"
               style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.text3 }}>?</div>
        ) : (
          <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-bold"
               style={{ background: C.accent, color: '#fff' }}>{USER.initial}</div>
        )}
      </div>
    </div>
  );
}

// ═══ Title block ══════════════════════════════════════════════
function TitleBlock({ guest }) {
  return (
    <div className="px-5 mt-2">
      {!guest && (
        <div className="text-[13px]" style={{ color: C.text2 }}>Добрый день, {USER.name} 👋</div>
      )}
      <h1 className="text-[26px] font-extrabold leading-tight tracking-tight mt-1" style={{ color: C.text, textWrap: 'balance' }}>
        Что приготовить<br />сегодня?
      </h1>
    </div>
  );
}

// ═══ Guest CTA banner ═════════════════════════════════════════
function GuestBanner({ onClose }) {
  return (
    <div
      className="mx-5 mt-5 rounded-2xl relative overflow-hidden"
      style={{ background: C.card, border: `1px solid ${C.border}`, padding: '16px 16px 14px' }}
    >
      <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center" style={{ color: C.text3 }}>
        <X size={16} strokeWidth={2} />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.accentMuted }}>
          <Sparkles size={18} strokeWidth={2.2} color={C.accent} />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <div className="text-[15px] font-extrabold leading-snug" style={{ color: C.text, textWrap: 'pretty' }}>
            Добавь свои блюда — и больше не думай, что готовить
          </div>
          <div className="text-[12.5px] mt-1" style={{ color: C.text3 }}>
            Подборка по холодильнику, план на неделю, любимые рецепты.
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => console.log('signup')}
          className="h-10 px-4 rounded-full text-[13px] font-bold text-white flex-1"
          style={{ background: C.accent }}
        >
          Создать свою кухню
        </button>
        <button
          onClick={() => console.log('login')}
          className="h-10 px-3 rounded-full text-[13px] font-semibold"
          style={{ color: C.text2 }}
        >
          Войти
        </button>
      </div>
    </div>
  );
}

// ═══ Empty fridge hint (вариант 2) ════════════════════════════
function EmptyFridgeHint() {
  return (
    <div
      className="mx-5 mt-5 rounded-2xl flex items-center gap-3"
      style={{ background: C.sageMuted, border: `1px solid ${C.sageBorder}`, padding: '12px 14px' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff', border: `1px solid ${C.sageBorder}` }}>
        <Refrigerator size={17} strokeWidth={2} color={C.sage} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-bold" style={{ color: C.sage }}>Заполни холодильник</div>
        <div className="text-[12px]" style={{ color: C.text2 }}>Покажем рецепты из того, что есть дома</div>
      </div>
      <ChevronRight size={16} strokeWidth={2.2} color={C.sage} />
    </div>
  );
}

// ═══ Meta strip (3 metrics) ═══════════════════════════════════
function DayMetaStrip({ metrics }) {
  return (
    <div
      className="mx-5 mt-5 rounded-2xl flex items-stretch justify-between"
      style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px 6px' }}
    >
      {metrics.map((m, i) => (
        <React.Fragment key={i}>
          <div className="flex-1 flex flex-col items-center gap-0.5 px-1">
            <div className="text-[17px] font-extrabold tabular-nums tracking-tight" style={{ color: C.text }}>
              {m.value}
            </div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-center" style={{ color: C.text3 }}>
              {m.label}
            </div>
          </div>
          {i < metrics.length - 1 && <div className="w-px my-1" style={{ background: C.border }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ═══ Meal-type chips ══════════════════════════════════════════
function MealTypeChips({ active, setActive }) {
  const all = [{ id: 'ALL', label: 'Все', Icon: null }, ...MEAL_TIMES];
  return (
    <div className="mt-5 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-1.5 w-max">
        {all.map(({ id, label, Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-bold transition flex-shrink-0"
              style={{
                background: isActive ? C.accentMuted : C.card,
                border: `1px solid ${isActive ? C.accentBorder : C.border}`,
                color: isActive ? C.accent : C.text2,
              }}
            >
              {Icon && <Icon size={14} strokeWidth={2} color={isActive ? C.accent : C.text2} />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══ Fridge suggest row (вариант 3) ═══════════════════════════
function FridgeSuggest({ count }) {
  return (
    <button
      onClick={() => console.log('filter-fridge')}
      className="mx-5 mt-4 w-[calc(100%-40px)] rounded-2xl flex items-center gap-2.5 text-left"
      style={{ background: C.sageMuted, border: `1px solid ${C.sageBorder}`, padding: '10px 14px' }}
    >
      <Refrigerator size={16} strokeWidth={2} color={C.sage} />
      <div className="flex-1 text-[12.5px] font-bold" style={{ color: C.sage }}>
        Из вашего холодильника можно приготовить <span className="tabular-nums">{count}</span> блюд
      </div>
      <ChevronRight size={14} strokeWidth={2.2} color={C.sage} />
    </button>
  );
}

// ═══ Pinned "today" block (вариант 3) ═════════════════════════
function TodayPinned({ dish }) {
  return (
    <div
      className="mx-5 mt-4 rounded-2xl"
      style={{ background: C.accentMuted, border: `1px solid ${C.accentBorder}`, padding: 10 }}
    >
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Flame size={12} strokeWidth={2.4} color={C.accent} />
        <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: C.accent }}>
          Сегодня в плане
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-xl" style={{ background: C.card, padding: 8 }}>
        <img src={dish.img} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" style={{ border: `1px solid ${C.border}` }} />
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-bold leading-tight" style={{ color: C.text, textWrap: 'pretty' }}>
            {dish.name}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11.5px]" style={{ color: C.text2 }}>
            <span className="flex items-center gap-0.5"><Clock size={10} strokeWidth={2.2} />{dish.cookTime} мин</span>
          </div>
        </div>
        <button
          onClick={() => console.log('cook-now')}
          className="h-9 px-3.5 rounded-full text-[12.5px] font-bold text-white flex-shrink-0"
          style={{ background: C.accent }}
        >
          Готовлю!
        </button>
      </div>
    </div>
  );
}

// ═══ Dish row card ════════════════════════════════════════════
function DishRow({ dish }) {
  const [fav, setFav] = useState(false);
  const mealLabel = MEAL_TIMES.find(m => m.id === dish.mealTime[0])?.label;
  return (
    <div
      className="rounded-2xl flex items-center gap-3"
      style={{ background: C.card, border: `1px solid ${C.border}`, padding: 10 }}
    >
      <div className="relative flex-shrink-0">
        <img src={dish.img} alt="" className="w-16 h-16 rounded-xl object-cover" style={{ border: `1px solid ${C.border}` }} />
        {dish.inFridge && (
          <div className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center"
               style={{ background: C.sage, border: '2px solid #fff' }}>
            <Check size={10} strokeWidth={3} color="#fff" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold leading-tight" style={{ color: C.text, textWrap: 'pretty' }}>
          {dish.name}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="flex items-center gap-0.5 text-[11.5px]" style={{ color: C.text2 }}>
            <Clock size={10} strokeWidth={2.2} />{dish.cookTime} мин
          </span>
          {mealLabel && (
            <span className="text-[10.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                  style={{ background: C.bg3, color: C.text2 }}>
              {mealLabel}
            </span>
          )}
          {dish.missingCount > 0 && (
            <span className="text-[11px] font-bold" style={{ color: C.accent }}>
              · докупить {dish.missingCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 items-center flex-shrink-0">
        <button
          onClick={() => setFav(f => !f)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition"
          style={{ background: fav ? C.accent : C.bg3, border: `1px solid ${fav ? C.accent : C.border}` }}
          aria-label="Избранное"
        >
          <Heart size={14} strokeWidth={2.2} color={fav ? '#fff' : C.text2} fill={fav ? '#fff' : 'none'} />
        </button>
        <button
          onClick={() => console.log('add-to-plan', dish.id)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: C.bg3, border: `1px solid ${C.border}` }}
          aria-label="В план"
        >
          <Plus size={14} strokeWidth={2.4} color={C.text2} />
        </button>
      </div>
    </div>
  );
}

// ═══ Add-own dish button ══════════════════════════════════════
function AddOwnDish({ guest }) {
  if (guest) {
    return (
      <button
        onClick={() => console.log('signup')}
        className="mx-5 mt-3 w-[calc(100%-40px)] h-12 rounded-full text-[14px] font-bold text-white flex items-center justify-center gap-2"
        style={{ background: C.accent, boxShadow: '0 6px 18px rgba(196,112,74,0.35)' }}
      >
        <Sparkles size={16} strokeWidth={2.2} />
        Создать свою кухню
      </button>
    );
  }
  return (
    <button
      onClick={() => console.log('add-own-dish')}
      className="mx-5 mt-3 w-[calc(100%-40px)] h-12 rounded-full text-[14px] font-bold flex items-center justify-center gap-2"
      style={{ background: C.card, border: `1px dashed ${C.accentBorder}`, color: C.accent }}
    >
      <Plus size={16} strokeWidth={2.4} />
      Добавить своё блюдо
    </button>
  );
}

// ═══ Quick actions (вариант 3) ════════════════════════════════
function QuickActions() {
  return (
    <div className="px-5 mt-3 flex gap-2">
      <button
        onClick={() => console.log('favorites')}
        className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-[13px] font-bold text-white"
        style={{ background: C.accent }}
      >
        <Heart size={14} strokeWidth={2.4} fill="#fff" color="#fff" />
        Избранное
      </button>
      <button
        onClick={() => console.log('fridge')}
        className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-[13px] font-bold"
        style={{ background: C.sageMuted, border: `1px solid ${C.sageBorder}`, color: C.sage }}
      >
        <Refrigerator size={14} strokeWidth={2.4} />
        Холодильник
      </button>
    </div>
  );
}

// ═══ Main Home Screen ═════════════════════════════════════════
function HomeScreen({ variant }) {
  // variant: 'guest' | 'empty' | 'normal'
  const guest = variant === 'guest';
  const [active, setActive] = useState('BREAKFAST');
  const [bannerOpen, setBannerOpen] = useState(true);

  const metrics = guest
    ? null
    : [
        { value: 2, label: 'в плане' },
        { value: variant === 'empty' ? 0 : 12, label: 'в холодильнике' },
        { value: 8, label: 'в избранном' },
      ];

  const filteredDishes = active === 'ALL'
    ? DISHES
    : DISHES.filter(d => d.mealTime.includes(active));

  return (
    <div style={{ background: C.bg, fontFamily: 'Nunito, system-ui, sans-serif', color: C.text }} className="w-full min-h-[820px]">
      <Header guest={guest} />
      <TitleBlock guest={guest} />

      {guest && bannerOpen && <GuestBanner onClose={() => setBannerOpen(false)} />}
      {variant === 'empty' && <EmptyFridgeHint />}

      {metrics && <DayMetaStrip metrics={metrics} />}
      <MealTypeChips active={active} setActive={setActive} />

      {variant === 'normal' && <FridgeSuggest count={7} />}
      {variant === 'normal' && <TodayPinned dish={PLANNED_TODAY} />}

      {/* Список блюд */}
      <div className="px-5 mt-4 flex flex-col gap-2">
        {filteredDishes.map(d => <DishRow key={d.id} dish={d} />)}
      </div>

      <AddOwnDish guest={guest} />

      {variant === 'normal' && <QuickActions />}

      <div className="h-6" />
    </div>
  );
}

// ═══ Artefact wrapper: three variants stacked ═════════════════
function Divider({ label }) {
  return (
    <div className="h-8 flex items-center justify-center" style={{ background: '#E5E7EB' }}>
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>
        {label}
      </span>
    </div>
  );
}

export default function HomePageArtefact() {
  return (
    <div style={{ background: '#E5E7EB', fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[430px]">
        <Divider label="— Вариант 1: гость —" />
        <HomeScreen variant="guest" />
        <Divider label="— Вариант 2: юзер, пустой холодильник —" />
        <HomeScreen variant="empty" />
        <Divider label="— Вариант 3: рабочий вид —" />
        <HomeScreen variant="normal" />
        <div className="py-4 text-center text-[10.5px]" style={{ color: '#6B7280', background: '#E5E7EB' }}>
          viewport: 375–430px · при 4 блюдах список может частично уходить под fold —
          <br />увеличена плотность карточек (row 76px)
        </div>
      </div>
    </div>
  );
}
