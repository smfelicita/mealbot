// FridgePage.jsx — MealBot, страница холодильника (редизайн)
// Три состояния друг под другом: пустой / рабочий вид / picker (grouped + search).
// Одиночный .jsx, мок внутри, только core Tailwind + lucide-react, useState.

import React, { useState } from 'react';
import {
  Refrigerator, Search, Plus, X, Check, Sparkles, Trash2, Users, Edit3, MessageCircle,
} from 'lucide-react';

// ─── Токены ───────────────────────────────────────────────────
const C = {
  bg: '#F6F4EF', card: '#FFFFFF', bg3: '#F5EFE6', border: '#E5D8C8',
  accent: '#C4704A', accentMuted: 'rgba(196,112,74,0.1)', accentBorder: 'rgba(196,112,74,0.25)',
  sage: '#5C7A59', sageMuted: 'rgba(92,122,89,0.08)', sageBorder: 'rgba(92,122,89,0.30)',
  text: '#1C1917', text2: '#78716C', text3: '#A8A29E',
};

// ─── Моки ─────────────────────────────────────────────────────
const FRIDGE = [
  { id: 'milk',    name: 'Молоко',          emoji: '🥛', cat: 'dairy',     qty: 1,   unit: 'л' },
  { id: 'cheese',  name: 'Сыр',             emoji: '🧀', cat: 'dairy',     qty: 200, unit: 'г' },
  { id: 'butter',  name: 'Сливочное масло', emoji: '🧈', cat: 'dairy',     qty: null, unit: null, basic: true },
  { id: 'eggs',    name: 'Яйца',            emoji: '🥚', cat: 'protein',   qty: 6,   unit: 'шт' },
  { id: 'tomato',  name: 'Помидоры',        emoji: '🍅', cat: 'vegetable', qty: 4,   unit: 'шт' },
  { id: 'onion',   name: 'Лук репчатый',    emoji: '🧅', cat: 'vegetable', qty: 2,   unit: 'шт' },
  { id: 'cucumber',name: 'Огурцы',          emoji: '🥒', cat: 'vegetable', qty: 3,   unit: 'шт' },
  { id: 'pasta',   name: 'Паста',           emoji: '🍝', cat: 'grain',     qty: 500, unit: 'г' },
  { id: 'rice',    name: 'Рис',             emoji: '🍚', cat: 'grain',     qty: 1,   unit: 'кг' },
  { id: 'chicken', name: 'Куриное филе',    emoji: '🍗', cat: 'meat',      qty: 500, unit: 'г' },
  { id: 'salt',    name: 'Соль',            emoji: '🧂', cat: 'spice',     basic: true },
  { id: 'pepper',  name: 'Чёрный перец',    emoji: '🌶', cat: 'spice',     basic: true },
  { id: 'oil',     name: 'Подсолнечное масло', emoji: '🫒', cat: 'oil',    basic: true },
  { id: 'garlic',  name: 'Чеснок',          emoji: '🧄', cat: 'herb',      qty: 1, unit: 'шт' },
];

const CAT_META = {
  dairy:     { label: 'Молочное',  emoji: '🥛' },
  protein:   { label: 'Белки',     emoji: '🥚' },
  vegetable: { label: 'Овощи',     emoji: '🥕' },
  fruit:     { label: 'Фрукты',    emoji: '🍎' },
  grain:     { label: 'Злаки',     emoji: '🌾' },
  meat:      { label: 'Мясо',      emoji: '🥩' },
  spice:     { label: 'Специи',    emoji: '🌶' },
  herb:      { label: 'Зелень',    emoji: '🌿' },
  oil:       { label: 'Масла',     emoji: '🫒' },
  pantry:    { label: 'Кладовая',  emoji: '🥫' },
  legume:    { label: 'Бобовые',   emoji: '🫘' },
  other:     { label: 'Остальное', emoji: '📦' },
};

const AVAILABLE_TO_ADD = [
  { id: 'apple',    name: 'Яблоки',            emoji: '🍎', cat: 'fruit' },
  { id: 'banana',   name: 'Бананы',            emoji: '🍌', cat: 'fruit' },
  { id: 'lemon',    name: 'Лимон',             emoji: '🍋', cat: 'fruit' },
  { id: 'carrot',   name: 'Морковь',           emoji: '🥕', cat: 'vegetable' },
  { id: 'potato',   name: 'Картофель',         emoji: '🥔', cat: 'vegetable' },
  { id: 'pepper_v', name: 'Болгарский перец',  emoji: '🫑', cat: 'vegetable' },
  { id: 'beef',     name: 'Говядина',          emoji: '🥩', cat: 'meat' },
  { id: 'fish',     name: 'Рыба',              emoji: '🐟', cat: 'protein' },
  { id: 'yogurt',   name: 'Йогурт',            emoji: '🥛', cat: 'dairy' },
  { id: 'flour',    name: 'Мука',              emoji: '🌾', cat: 'grain' },
  { id: 'honey',    name: 'Мёд',               emoji: '🍯', cat: 'pantry' },
  { id: 'beans',    name: 'Фасоль',            emoji: '🫘', cat: 'legume' },
];

const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'ст.л.', 'ч.л.'];

// ─── Helpers ──────────────────────────────────────────────────
function groupByCat(list) {
  const out = {};
  for (const it of list) (out[it.cat] ||= []).push(it);
  return out;
}

// ─── Common pieces ────────────────────────────────────────────
function PageHeader({ title }) {
  return (
    <div className="px-5 pt-4">
      <h1 className="text-[26px] font-extrabold leading-tight tracking-tight" style={{ color: C.text }}>
        {title}
      </h1>
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="h-8 flex items-center justify-center" style={{ background: '#E5E7EB' }}>
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>{label}</span>
    </div>
  );
}

// ═══ State 1: Empty ═══════════════════════════════════════════
function FridgeEmpty() {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'Nunito, system-ui, sans-serif' }} className="min-h-[820px] w-full">
      <PageHeader title="Холодильник" />
      <div className="px-5 mt-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: C.bg3, border: `1px solid ${C.border}` }}>
          <Refrigerator size={28} strokeWidth={1.8} color={C.accent} />
        </div>
        <h2 className="mt-4 text-[17px] font-bold" style={{ color: C.text }}>Холодильник пустой</h2>
        <p className="mt-2 text-[13px] max-w-[280px] leading-relaxed" style={{ color: C.text2 }}>
          Добавь продукты — MealBot подберёт что приготовить из того, что есть
        </p>
        <button
          onClick={() => console.log('add')}
          className="mt-5 h-11 px-5 rounded-full flex items-center gap-2 text-white text-[13.5px] font-bold"
          style={{ background: C.accent, boxShadow: '0 6px 18px rgba(196,112,74,0.35)' }}
        >
          <Plus size={16} strokeWidth={2.4} />
          Добавить продукты
        </button>
      </div>
    </div>
  );
}

// ═══ State 2: Full working view ═══════════════════════════════
function FamilyBanner() {
  return (
    <div
      className="mx-5 mt-3 rounded-xl flex items-center gap-2"
      style={{ background: C.sageMuted, border: `1px solid ${C.sageBorder}`, padding: '10px 14px' }}
    >
      <Users size={15} strokeWidth={2.2} color={C.sage} />
      <div className="text-[13px] font-semibold flex-1" style={{ color: C.sage }}>
        Общий холодильник с семьёй
      </div>
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#fff', color: C.sage, border: `1px solid ${C.sageBorder}` }}>
        2 участника
      </span>
    </div>
  );
}

function TelegramBanner({ onClose }) {
  return (
    <div
      className="mx-5 mt-3 rounded-2xl flex items-center gap-3 relative"
      style={{ background: C.card, border: `1px solid ${C.accentBorder}`, padding: '12px 14px' }}
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#E6F3FB' }}>
        {/* Telegram-ish paper plane (original SVG, not the brand mark) */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 3L3 10l6 3m12-10l-9 15-3-7m12-8l-9 8" stroke="#2AABEE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <div className="text-[13.5px] font-bold leading-snug" style={{ color: C.text }}>
          Управляй холодильником в Telegram
        </div>
        <div className="text-[11.5px] mt-0.5" style={{ color: C.text3 }}>
          Голосом или текстом, быстрее чем в приложении
        </div>
      </div>
      <button
        className="px-3 py-1.5 rounded-full text-[12px] font-bold flex-shrink-0"
        style={{ background: C.accentMuted, color: C.accent, border: `1px solid ${C.accentBorder}` }}
      >
        Подключить
      </button>
      <button onClick={onClose} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ color: C.text3 }}>
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

function MetaStrip({ total, basic, possibleDishes }) {
  const items = [
    { value: total, label: 'всего' },
    { value: basic, label: 'базовых' },
    { value: possibleDishes, label: 'блюд готовы', sage: true },
  ];
  return (
    <div
      className="mx-5 mt-4 rounded-2xl flex items-stretch justify-between"
      style={{ background: C.card, border: `1px solid ${C.border}`, padding: '12px 6px' }}
    >
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <div className="flex-1 flex flex-col items-center gap-0.5 px-1">
            <div
              className="text-[17px] font-extrabold tabular-nums tracking-tight"
              style={{ color: it.sage ? C.sage : C.text }}
            >
              {it.value}
            </div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-center" style={{ color: it.sage ? C.sage : C.text3 }}>
              {it.label}
            </div>
          </div>
          {i < items.length - 1 && <div className="w-px my-1" style={{ background: C.border }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function AICookCTA() {
  return (
    <div className="px-5 mt-4">
      <button
        onClick={() => console.log('ai-cook')}
        className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-white text-[14px] font-bold"
        style={{ background: C.sage, boxShadow: '0 6px 18px rgba(92,122,89,0.35)' }}
      >
        <Sparkles size={16} strokeWidth={2.2} />
        Что можно приготовить?
      </button>
      <div className="text-[11.5px] text-center mt-1.5" style={{ color: C.text3 }}>
        ИИ подберёт блюдо по твоему холодильнику
      </div>
    </div>
  );
}

function ProductCard({ item, editing, onEdit, onDelete, onSave, onCancel }) {
  const [qty, setQty] = useState(item.qty ?? '');
  const [unit, setUnit] = useState(item.unit ?? 'шт');
  const accentBorder = item.basic ? C.accentBorder : C.border;

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{ background: C.card, border: `1px solid ${accentBorder}`, padding: 10 }}
    >
      <div className="flex items-start gap-2">
        <div className="text-[20px] leading-none select-none flex-shrink-0" style={{ marginTop: 1 }}>{item.emoji}</div>
        <button
          onClick={onEdit}
          className="text-[13px] font-semibold flex-1 min-w-0 text-left truncate"
          style={{ color: C.text }}
          title={item.name}
        >
          {item.name}
        </button>
        <button onClick={onDelete} className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" aria-label="Удалить">
          <X size={13} strokeWidth={2} color={C.text3} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        {item.basic && (
          <span
            className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
            style={{ background: C.sageMuted, color: C.sage, border: `1px solid ${C.sageBorder}` }}
          >
            базовый
          </span>
        )}
        {item.qty != null && !editing && (
          <span className="text-[11px] tabular-nums" style={{ color: C.text3 }}>
            {item.qty} {item.unit}
          </span>
        )}
      </div>

      {editing && (
        <div className="flex gap-1.5 mt-2">
          <input
            type="number"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="flex-1 min-w-0 h-8 px-2 rounded-lg text-[12.5px] outline-none tabular-nums"
            style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.text }}
          />
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="h-8 px-1.5 rounded-lg text-[12px] outline-none"
            style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.text, maxWidth: 58 }}
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button
            onClick={() => onSave(qty, unit)}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: C.sage, color: '#fff' }}
            aria-label="Сохранить"
          >
            <Check size={14} strokeWidth={3} />
          </button>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.text2 }}
            aria-label="Отмена"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryBlock({ cat, items, editingId, setEditingId, onDelete }) {
  const meta = CAT_META[cat] || CAT_META.other;
  return (
    <section className="mt-6 px-5">
      <div
        className="text-[11px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5"
        style={{ color: C.text2 }}
      >
        <span className="text-[13px] leading-none">{meta.emoji}</span>
        <span>{meta.label}</span>
        <span style={{ color: C.text3 }}>· {items.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(it => (
          <ProductCard
            key={it.id}
            item={it}
            editing={editingId === it.id}
            onEdit={() => setEditingId(it.id)}
            onDelete={() => onDelete(it.id)}
            onSave={(qty, unit) => { console.log('save', it.id, qty, unit); setEditingId(null); }}
            onCancel={() => setEditingId(null)}
          />
        ))}
      </div>
    </section>
  );
}

function FridgeFull() {
  const [editingId, setEditingId] = useState('cheese'); // pre-show inline editor на одном продукте
  const [tgBannerOpen, setTgBannerOpen] = useState(true);
  const [items, setItems] = useState(FRIDGE);

  const grouped = groupByCat(items);
  const orderedCats = ['dairy', 'protein', 'meat', 'vegetable', 'herb', 'grain', 'spice', 'oil', 'pantry', 'legume', 'fruit', 'other']
    .filter(c => grouped[c]?.length);

  const total = items.length;
  const basic = items.filter(i => i.basic).length;

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: 'Nunito, system-ui, sans-serif' }} className="min-h-[820px] w-full relative">
      <PageHeader title="Холодильник" />
      <FamilyBanner />
      {tgBannerOpen && <TelegramBanner onClose={() => setTgBannerOpen(false)} />}
      <MetaStrip total={total} basic={basic} possibleDishes={12} />
      <AICookCTA />

      {orderedCats.map(cat => (
        <CategoryBlock
          key={cat}
          cat={cat}
          items={grouped[cat]}
          editingId={editingId}
          setEditingId={setEditingId}
          onDelete={(id) => setItems(xs => xs.filter(x => x.id !== id))}
        />
      ))}

      <div className="flex justify-center mt-8 pb-24">
        <button
          onClick={() => console.log('clear-all')}
          className="flex items-center gap-1.5 text-[12.5px]"
          style={{ color: C.text3 }}
        >
          <Trash2 size={13} strokeWidth={1.8} />
          Очистить всё
        </button>
      </div>

      <button
        onClick={() => console.log('add')}
        className="absolute bottom-5 right-4 h-12 px-4 rounded-full flex items-center gap-2 text-white text-[13.5px] font-bold"
        style={{ background: C.accent, boxShadow: '0 8px 24px rgba(196,112,74,0.45)' }}
      >
        <Plus size={16} strokeWidth={2.4} />
        Добавить продукты
      </button>
    </div>
  );
}

// ═══ State 3: Picker modal (2 substates) ══════════════════════
function PickerSheet({ mode }) {
  // mode: 'grouped' | 'search'
  const [selected, setSelected] = useState(() => new Set(['apple', 'carrot', 'fish', 'honey', 'lemon']));
  const toggle = id => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const q = mode === 'search' ? 'яб' : '';

  const filtered = mode === 'search'
    ? AVAILABLE_TO_ADD.filter(x => x.name.toLowerCase().startsWith('яб') || x.name.toLowerCase().includes('яб'))
    : null;

  const groupedAdd = groupByCat(AVAILABLE_TO_ADD);
  const orderedCats = ['fruit', 'vegetable', 'meat', 'protein', 'dairy', 'grain', 'pantry', 'legume']
    .filter(c => groupedAdd[c]?.length);

  const count = selected.size;

  return (
    <div
      className="relative flex flex-col h-[760px]"
      style={{ background: C.card, borderRadius: 24, overflow: 'hidden' }}
    >
      {/* handle */}
      <div className="flex justify-center pt-2.5 pb-1">
        <div className="w-10 h-1 rounded-full" style={{ background: C.border }} />
      </div>

      {/* header */}
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <h2 className="text-[17px] font-bold" style={{ color: C.text }}>Что у вас есть?</h2>
        <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.bg3, color: C.text2 }}>
          <X size={15} strokeWidth={2} />
        </button>
      </div>

      {/* search */}
      <div className="px-5 pb-3">
        <div
          className="flex items-center gap-2 rounded-full h-10 px-3.5"
          style={{ background: C.bg3, border: `1px solid ${C.border}` }}
        >
          <Search size={15} strokeWidth={2} color={C.text3} />
          <input
            value={q}
            readOnly
            placeholder="Найти продукт…"
            className="flex-1 bg-transparent outline-none text-[13.5px]"
            style={{ color: C.text }}
          />
          {q && (
            <button className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: C.border, color: C.text2 }}>
              <X size={11} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {mode === 'search' ? (
          <div className="flex flex-col gap-1">
            <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: C.text3 }}>
              Результаты по «{q}»
            </div>
            {filtered.map(it => {
              const on = selected.has(it.id);
              return (
                <button
                  key={it.id}
                  onClick={() => toggle(it.id)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                  style={{
                    background: on ? C.accentMuted : C.card,
                    border: `1px solid ${on ? C.accentBorder : C.border}`,
                  }}
                >
                  <span className="text-[20px] leading-none">{it.emoji}</span>
                  <span className="flex-1 text-[13.5px] font-semibold" style={{ color: C.text }}>{it.name}</span>
                  <span className="text-[11px]" style={{ color: C.text3 }}>{CAT_META[it.cat]?.label}</span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: on ? C.accent : 'transparent',
                      border: on ? 'none' : `1px solid ${C.border}`,
                      color: on ? '#fff' : C.accent,
                    }}
                  >
                    {on ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.4} />}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-[13px] text-center py-8" style={{ color: C.text3 }}>
                Ничего не найдено. Добавить «{q}» как своё?
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orderedCats.map(cat => {
              const meta = CAT_META[cat];
              return (
                <div key={cat}>
                  <div
                    className="text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                    style={{ color: C.text2 }}
                  >
                    <span className="text-[13px] leading-none">{meta.emoji}</span>
                    {meta.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {groupedAdd[cat].map(it => {
                      const on = selected.has(it.id);
                      return (
                        <button
                          key={it.id}
                          onClick={() => toggle(it.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12.5px] font-semibold transition"
                          style={{
                            background: on ? C.accentMuted : C.bg3,
                            border: `1px solid ${on ? C.accent : C.border}`,
                            color: on ? C.accent : C.text2,
                          }}
                        >
                          <span className="text-[13px] leading-none">{it.emoji}</span>
                          {it.name}
                          {on && <Check size={11} strokeWidth={3} color={C.accent} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* footer button */}
      <div className="px-5 pb-5 pt-2" style={{ borderTop: `1px solid ${C.border}`, background: C.card }}>
        <button
          disabled={count === 0}
          onClick={() => console.log('add', Array.from(selected))}
          className="w-full h-12 rounded-full text-[14px] font-bold flex items-center justify-center gap-2 transition"
          style={{
            background: count > 0 ? C.accent : C.bg3,
            color: count > 0 ? '#fff' : C.text3,
            border: count > 0 ? 'none' : `1px solid ${C.border}`,
            boxShadow: count > 0 ? '0 6px 18px rgba(196,112,74,0.35)' : 'none',
          }}
        >
          {count > 0 ? (
            <>
              <Plus size={16} strokeWidth={2.4} />
              Добавить {count} {count === 1 ? 'продукт' : count < 5 ? 'продукта' : 'продуктов'}
            </>
          ) : 'Готово'}
        </button>
      </div>
    </div>
  );
}

function FridgePicker({ mode }) {
  return (
    <div style={{ background: C.bg, fontFamily: 'Nunito, system-ui, sans-serif' }} className="min-h-[820px] w-full relative">
      {/* dimmed backdrop hint of page */}
      <div style={{ opacity: 0.35, pointerEvents: 'none' }}>
        <PageHeader title="Холодильник" />
        <div className="px-5 mt-6 grid grid-cols-2 gap-2">
          {FRIDGE.slice(0, 4).map(it => (
            <div key={it.id} className="rounded-xl flex items-center gap-2" style={{ background: C.card, border: `1px solid ${C.border}`, padding: 10 }}>
              <span className="text-[18px]">{it.emoji}</span>
              <span className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{it.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* overlay scrim */}
      <div className="absolute inset-0" style={{ background: 'rgba(28,25,23,0.35)' }} />

      {/* sheet */}
      <div className="absolute left-0 right-0 bottom-0 px-0" style={{ paddingBottom: 0 }}>
        <PickerSheet mode={mode} />
      </div>
    </div>
  );
}

// ═══ Artefact wrapper ═════════════════════════════════════════
export default function FridgePageArtefact() {
  return (
    <div style={{ background: '#E5E7EB', fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[430px]">
        <Divider label="— Вариант 1: пустой холодильник —" />
        <FridgeEmpty />
        <Divider label="— Вариант 2: рабочий вид —" />
        <FridgeFull />
        <Divider label="— Picker: grouped chips (по умолчанию) —" />
        <FridgePicker mode="grouped" />
        <Divider label="— Picker: search active (введено «яб») —" />
        <FridgePicker mode="search" />
        <div className="py-4 text-center text-[10.5px]" style={{ color: '#6B7280', background: '#E5E7EB' }}>
          viewport 375–430px · карточки продуктов в сетке 2×, базовые — с accent-рамкой
        </div>
      </div>
    </div>
  );
}
