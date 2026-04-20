// DishDetailPage.jsx — MealBot, вариант Б (чек-боксы в 2 колонки)
// Одиночный файл для claude.ai/design — мок внутри, только core Tailwind,
// без localStorage, иконки lucide-react.

import React, { useState } from 'react';
import {
  ChevronLeft, Heart, Share2, MoreVertical,
  Clock, Users, ChefHat, Utensils,
  CalendarPlus, Refrigerator, Pin, ArrowUp,
} from 'lucide-react';

const DISH = {
  name: 'Паста с курицей и грибами в сливочном соусе',
  description: 'Классическая итальянская паста с нежным сливочным соусом, сочной курицей и шампиньонами. Готовится за 30 минут.',
  images: [
    'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800',
    'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800',
    'https://images.unsplash.com/photo-1588013273468-315fd88ea34c?w=800',
  ],
  cookTimeMin: 30,
  servings: 4,
  difficulty: 'easy',
  categories: ['LUNCH', 'DINNER'],
  cuisine: 'Итальянская',
  tags: ['быстро', 'сытно', 'мясо'],
  nutrition: { calories: 485, protein: 28, fat: 22, carbs: 42 },
  ingredients: [
    { name: 'Паста (пенне)', amount: '400 г', inFridge: true },
    { name: 'Куриное филе', amount: '500 г', inFridge: true },
    { name: 'Шампиньоны', amount: '300 г', inFridge: false },
    { name: 'Сливки 20%', amount: '200 мл', inFridge: false },
    { name: 'Лук репчатый', amount: '1 шт', inFridge: true },
    { name: 'Чеснок', amount: '3 зубч', inFridge: true },
    { name: 'Пармезан', amount: '50 г', inFridge: false },
    { name: 'Соль, перец', amount: 'по вкусу', inFridge: true, basic: true },
  ],
  steps: [
    'Нарежь куриное филе кубиками, обжарь на сковороде до золотистой корочки 5–7 минут.',
    'Добавь нарезанный лук и чеснок, готовь ещё 2 минуты.',
    'Положи шампиньоны, обжаривай 5 минут до испарения жидкости.',
    'Влей сливки, посоли, поперчи, туши на среднем огне 5 минут.',
    'Отвари пасту в подсоленной воде согласно инструкции на упаковке.',
    'Смешай пасту с соусом, посыпь тёртым пармезаном, подавай сразу.',
  ],
  author: { name: 'Марина', avatarInitial: 'М' },
  isOwner: true,
  comments: [
    { id: 1, author: 'Анна', avatarInitial: 'А', pinned: true, text: 'Готовила уже 3 раза — получается каждый раз идеально. Добавляю немного белого вина.', createdAt: '2 дня назад' },
    { id: 2, author: 'Дмитрий', avatarInitial: 'Д', pinned: false, text: 'Можно заменить сливки на сметану — тоже вкусно.', createdAt: '5 дней назад' },
  ],
  similar: [
    { id: 'a', name: 'Карбонара', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', time: 25 },
    { id: 'b', name: 'Ризотто с грибами', img: 'https://images.unsplash.com/photo-1673425301373-de9df8a8f54e?w=400', time: 35 },
    { id: 'c', name: 'Феттучини Альфредо', img: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400', time: 20 },
  ],
};

const CAT_LABELS = { LUNCH: 'Обед', DINNER: 'Ужин', BREAKFAST: 'Завтрак', SNACK: 'Перекус' };
const DIFF_LABELS = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' };

// Дизайн-токены (в arbitrary-value классах Tailwind)
const C = {
  bg: '#F6F4EF',
  card: '#FFFFFF',
  bg3: '#F5EFE6',
  border: '#E5D8C8',
  accent: '#C4704A',
  accentMuted: 'rgba(196,112,74,0.1)',
  sage: '#5C7A59',
  text: '#1C1917',
  text2: '#78716C',
  text3: '#A8A29E',
};

export default function DishDetailPage() {
  const [favorite, setFavorite] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [fridgeMode, setFridgeMode] = useState(false);
  const [draft, setDraft] = useState('');

  const missingCount = DISH.ingredients.filter(i => !i.inFridge && !i.basic).length;
  const haveCount = DISH.ingredients.filter(i => i.inFridge && !i.basic).length;
  const totalCount = DISH.ingredients.filter(i => !i.basic).length;

  return (
    <div className="min-h-screen w-full font-sans" style={{ background: C.bg, color: C.text, fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <div className="relative mx-auto max-w-[430px] pb-32">
        {/* ═══ HERO ═══ */}
        <div className="relative w-full h-[320px] overflow-hidden" style={{ background: '#EADDC9' }}>
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ width: `${DISH.images.length * 100}%`, transform: `translateX(-${photoIdx * (100 / DISH.images.length)}%)` }}
          >
            {DISH.images.map((src, i) => (
              <div key={i} style={{ width: `${100 / DISH.images.length}%` }} className="h-full">
                <img src={src} alt="" className="w-full h-full object-cover block" />
              </div>
            ))}
          </div>

          {/* верхний градиент — для читаемости кнопок */}
          <div className="absolute top-0 inset-x-0 h-28 pointer-events-none"
               style={{ background: 'linear-gradient(180deg, rgba(28,25,23,0.5) 0%, rgba(28,25,23,0) 100%)' }} />
          {/* нижний градиент — переход к бежу */}
          <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
               style={{ background: `linear-gradient(0deg, ${C.bg} 0%, rgba(246,244,239,0) 100%)` }} />

          {/* верхние контролы */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between">
            <button onClick={() => console.log('back')} className="w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm active:scale-95 transition">
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <div className="flex gap-2">
              <button onClick={() => console.log('share')} className="w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm active:scale-95 transition">
                <Share2 size={18} strokeWidth={2} />
              </button>
              <button
                onClick={() => setFavorite(f => !f)}
                className="w-10 h-10 rounded-full backdrop-blur flex items-center justify-center shadow-sm active:scale-95 transition"
                style={{ background: favorite ? C.accent : 'rgba(255,255,255,0.95)' }}
              >
                <Heart size={18} strokeWidth={2.2} fill={favorite ? '#fff' : 'none'} color={favorite ? '#fff' : C.text} />
              </button>
              <button onClick={() => console.log('more')} className="w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm active:scale-95 transition">
                <MoreVertical size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* индикаторы фото */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
            {DISH.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setPhotoIdx(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === photoIdx ? 20 : 6,
                  background: i === photoIdx ? C.text : 'rgba(28,25,23,0.28)',
                }}
                aria-label={`Фото ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ═══ ЗАГОЛОВОК ═══ */}
        <div className="px-5 -mt-4 relative">
          <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-tight" style={{ textWrap: 'pretty' }}>
            {DISH.name}
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: C.text2 }}>
            {DISH.description}
          </p>

          {/* автор */}
          <div className="mt-3.5 flex items-center gap-2">
            <div
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-bold border"
              style={{ background: C.bg3, borderColor: C.border, color: C.accent }}
            >
              {DISH.author.avatarInitial}
            </div>
            <div className="text-[13px]" style={{ color: C.text2 }}>
              Рецепт от <span className="font-semibold" style={{ color: C.text }}>{DISH.author.name}</span>
              {DISH.isOwner && <span className="ml-2 font-semibold" style={{ color: C.accent }}>· Ваш рецепт</span>}
            </div>
          </div>
        </div>

        {/* ═══ МЕТА-ПОЛОСКА ═══ */}
        <div
          className="mx-5 mt-5 rounded-2xl bg-white flex justify-between items-stretch"
          style={{ border: `1px solid ${C.border}`, padding: '14px 10px' }}
        >
          {[
            { Icon: Clock, value: DISH.cookTimeMin, unit: 'мин', label: 'время' },
            { Icon: Users, value: DISH.servings, unit: 'порц.', label: 'на' },
            { Icon: ChefHat, value: DIFF_LABELS[DISH.difficulty], label: 'сложность' },
            { Icon: Utensils, value: DISH.cuisine, label: 'кухня' },
          ].map((it, i, arr) => (
            <React.Fragment key={i}>
              <div className="flex-1 min-w-0 flex flex-col items-center gap-1 px-0.5">
                <it.Icon size={17} strokeWidth={1.8} color={C.accent} />
                <div className="text-[13px] font-bold leading-tight text-center" style={{ color: C.text, overflowWrap: 'anywhere' }}>
                  {it.value}
                  {it.unit && <span className="ml-0.5 text-[10.5px] font-semibold" style={{ color: C.text2 }}>{it.unit}</span>}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: C.text3 }}>{it.label}</div>
              </div>
              {i < arr.length - 1 && <div className="w-px my-1" style={{ background: C.border }} />}
            </React.Fragment>
          ))}
        </div>

        {/* ═══ ИНГРЕДИЕНТЫ — Вариант Б ═══ */}
        <section className="mt-7">
          <div className="px-5 flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[17px] font-bold tracking-tight">Ингредиенты</h2>
              <div className="text-[12px] mt-0.5" style={{ color: C.text3 }}>на {DISH.servings} порции</div>
            </div>
            <button
              onClick={() => setFridgeMode(m => !m)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-bold transition"
              style={{
                background: fridgeMode ? 'rgba(92,122,89,0.12)' : C.accentMuted,
                border: `1px solid ${fridgeMode ? 'rgba(92,122,89,0.3)' : 'rgba(196,112,74,0.25)'}`,
                color: fridgeMode ? C.sage : C.accent,
              }}
            >
              <Refrigerator size={14} strokeWidth={2.2} />
              {fridgeMode ? 'из моего' : `не хватает ${missingCount}`}
            </button>
          </div>

          {/* сетка 2 колонки с чек-боксами */}
          <div className="px-5 grid grid-cols-2 gap-x-3.5 gap-y-2.5">
            {DISH.ingredients.map((ing, i) => {
              const checked = ing.inFridge;
              const dim = fridgeMode && !checked && !ing.basic;
              return (
                <div key={i} className="flex items-start gap-2" style={{ opacity: dim ? 0.35 : 1 }}>
                  {/* чек-бокс */}
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      border: checked ? `1.5px solid ${C.sage}` : `1.5px solid ${C.border}`,
                      background: checked ? C.sage : '#fff',
                    }}
                  >
                    {checked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[14px] font-semibold leading-tight"
                      style={{ color: ing.basic ? C.text3 : C.text, textWrap: 'pretty' }}
                    >
                      {ing.name}
                    </div>
                    <div className="text-[12px] mt-0.5 tabular-nums" style={{ color: C.text3 }}>
                      {ing.amount}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* сводка по холодильнику */}
          <div
            className="mx-5 mt-3.5 rounded-xl flex items-center gap-2.5 text-[12.5px] font-semibold"
            style={{ background: 'rgba(92,122,89,0.08)', color: C.sage, padding: '10px 14px' }}
          >
            <Refrigerator size={16} strokeWidth={2} />
            В холодильнике есть {haveCount} из {totalCount}
          </div>
        </section>

        {/* ═══ ПРИГОТОВЛЕНИЕ ═══ */}
        <section className="mt-8">
          <div className="px-5 mb-3">
            <h2 className="text-[17px] font-bold tracking-tight">Приготовление</h2>
            <div className="text-[12px] mt-0.5" style={{ color: C.text3 }}>{DISH.steps.length} шагов</div>
          </div>
          <div className="px-5 flex flex-col gap-3.5">
            {DISH.steps.map((s, i) => (
              <div key={i} className="flex gap-3.5 items-start">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[20px] font-extrabold tabular-nums"
                  style={{ background: C.accentMuted, color: C.accent }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 pt-1 text-[14.5px] leading-relaxed" style={{ color: C.text, textWrap: 'pretty' }}>
                  {s}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ КБЖУ ═══ */}
        <section className="mt-8">
          <div className="px-5 mb-3">
            <h2 className="text-[17px] font-bold tracking-tight">Пищевая ценность</h2>
            <div className="text-[12px] mt-0.5" style={{ color: C.text3 }}>на порцию</div>
          </div>
          <div className="px-5 grid grid-cols-4 gap-2">
            {[
              { value: DISH.nutrition.calories, unit: 'ккал', label: 'Калории', color: C.accent },
              { value: DISH.nutrition.protein, unit: 'г', label: 'Белки', color: C.sage },
              { value: DISH.nutrition.fat, unit: 'г', label: 'Жиры', color: '#D4A441' },
              { value: DISH.nutrition.carbs, unit: 'г', label: 'Углеводы', color: '#8C6D9E' },
            ].map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-[14px] relative overflow-hidden flex flex-col items-center"
                style={{ border: `1px solid ${C.border}`, padding: '12px 4px 10px' }}
              >
                <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                <div className="text-[17px] font-extrabold tabular-nums tracking-tight" style={{ color: C.text }}>{t.value}</div>
                <div className="text-[10.5px] font-semibold mt-0.5" style={{ color: C.text3 }}>{t.unit}</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.text2 }}>{t.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ КАТЕГОРИИ + ТЕГИ ═══ */}
        <section className="mt-8">
          <div className="px-5 mb-3">
            <h2 className="text-[17px] font-bold tracking-tight">Категории и теги</h2>
          </div>
          <div className="px-5 flex flex-wrap gap-1.5">
            {DISH.categories.map(c => (
              <button
                key={c}
                onClick={() => console.log('cat', c)}
                className="px-3 py-1.5 rounded-full text-[12.5px] font-bold"
                style={{ background: C.accentMuted, color: C.accent, border: '1px solid rgba(196,112,74,0.25)' }}
              >
                {CAT_LABELS[c] || c}
              </button>
            ))}
            {DISH.tags.map(t => (
              <button
                key={t}
                onClick={() => console.log('tag', t)}
                className="px-3 py-1.5 rounded-full text-[12.5px] font-semibold bg-white"
                style={{ color: C.text2, border: `1px solid ${C.border}` }}
              >
                #{t}
              </button>
            ))}
          </div>
        </section>

        {/* ═══ ПОХОЖИЕ БЛЮДА ═══ */}
        <section className="mt-8">
          <div className="px-5 mb-3">
            <h2 className="text-[17px] font-bold tracking-tight">Попробуй также</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 pb-1.5" style={{ scrollbarWidth: 'none' }}>
            {DISH.similar.map(it => (
              <div key={it.id} onClick={() => console.log('similar', it.id)} className="w-[168px] flex-shrink-0 cursor-pointer">
                <div className="w-full h-[120px] rounded-[14px] overflow-hidden relative" style={{ background: '#EADDC9', border: `1px solid ${C.border}` }}>
                  <img src={it.img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-0.5" style={{ color: C.text }}>
                    <Clock size={10} strokeWidth={2.5} />
                    {it.time}м
                  </div>
                </div>
                <div className="mt-2 text-[13.5px] font-bold leading-tight" style={{ color: C.text, textWrap: 'pretty' }}>
                  {it.name}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ КОММЕНТАРИИ ═══ */}
        <section className="mt-8">
          <div className="px-5 mb-3 flex items-baseline gap-2">
            <h2 className="text-[17px] font-bold tracking-tight">Комментарии</h2>
            <div className="text-[12px]" style={{ color: C.text3 }}>{DISH.comments.length}</div>
          </div>
          <div className="px-5 flex flex-col gap-3.5">
            {DISH.comments.map(c => (
              <div
                key={c.id}
                className="flex gap-2.5"
                style={{
                  padding: c.pinned ? 12 : 0,
                  background: c.pinned ? 'rgba(196,112,74,0.06)' : 'transparent',
                  borderRadius: c.pinned ? 12 : 0,
                  border: c.pinned ? '1px solid rgba(196,112,74,0.2)' : 'none',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 border"
                  style={{ background: C.bg3, borderColor: C.border, color: C.accent }}
                >
                  {c.avatarInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13.5px] font-bold" style={{ color: C.text }}>{c.author}</span>
                    {c.pinned && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10.5px] font-bold uppercase tracking-wide rounded-full"
                        style={{ background: 'rgba(196,112,74,0.12)', color: C.accent, padding: '2px 6px' }}
                      >
                        <Pin size={9} strokeWidth={2.5} />
                        закреплено
                      </span>
                    )}
                    <span className="text-[11.5px]" style={{ color: C.text3 }}>· {c.createdAt}</span>
                  </div>
                  <div className="text-[13.5px] leading-relaxed mt-1" style={{ color: C.text, textWrap: 'pretty' }}>
                    {c.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* инпут нового комментария */}
          <div className="px-5 mt-4">
            <div
              className="flex items-center gap-2 bg-white rounded-full"
              style={{ border: `1px solid ${C.border}`, padding: '6px 6px 6px 14px' }}
            >
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Написать комментарий…"
                className="flex-1 bg-transparent outline-none border-none text-[13.5px] min-w-0"
                style={{ color: C.text }}
              />
              <button
                onClick={() => { console.log('comment', draft); setDraft(''); }}
                disabled={!draft.trim()}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition"
                style={{ background: draft.trim() ? C.accent : C.border, color: '#fff' }}
                aria-label="Отправить"
              >
                <ArrowUp size={16} strokeWidth={2.6} />
              </button>
            </div>
          </div>
        </section>

        {/* ═══ FAB ═══ */}
        <button
          onClick={() => console.log('add-to-plan')}
          className="fixed bottom-6 right-6 h-[52px] rounded-full flex items-center gap-2 text-[14.5px] font-bold text-white active:scale-95 transition"
          style={{
            background: C.accent,
            padding: '0 20px 0 16px',
            boxShadow: '0 8px 24px rgba(196,112,74,0.45), 0 2px 6px rgba(196,112,74,0.3)',
          }}
        >
          <CalendarPlus size={18} strokeWidth={2.2} />
          В план готовки
        </button>
      </div>
    </div>
  );
}
