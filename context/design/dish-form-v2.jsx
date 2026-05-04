// DishFormPage.jsx — MealBot, страница создания/редактирования блюда.
// Без tab bar (он в Layout). Свой sticky header 52px (back + Сохранить).
// Одиночный .jsx, моки инлайном, Tailwind core + lucide-react, useState.

import React, { useState } from 'react';
import {
  ChevronLeft, Check, X, Plus, Camera, Video, Upload, Star,
  AlertCircle, Eye, Lock, Users, Globe, Search, Sparkles,
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
const CATEGORIES = [
  { value: 'SOUP',    label: 'Суп'      },
  { value: 'SALAD',   label: 'Салат'    },
  { value: 'MAIN',    label: 'Основное' },
  { value: 'SIDE',    label: 'Гарнир'   },
  { value: 'DESSERT', label: 'Десерт'   },
  { value: 'DRINK',   label: 'Напиток'  },
  { value: 'BAKERY',  label: 'Выпечка'  },
  { value: 'SAUCE',   label: 'Соус'     },
];
const MEAL_TIMES = [
  { value: 'BREAKFAST', label: 'Утро'    },
  { value: 'LUNCH',     label: 'Обед'    },
  { value: 'DINNER',    label: 'Вечер'   },
  { value: 'SNACK',     label: 'Перекус' },
  { value: 'ANYTIME',   label: 'Любое'   },
];
const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'зубчик', 'пучок', 'щепотка', 'ст.л.', 'ч.л.'];
const VISIBILITY_OPTIONS = [
  { value: 'PRIVATE',    label: 'Личный',          desc: 'Только вы',                         Icon: Lock  },
  { value: 'FAMILY',     label: 'Семья',           desc: 'Только участники семейной группы',  Icon: Users },
  { value: 'ALL_GROUPS', label: 'Все мои группы',  desc: 'Участники всех ваших групп',        Icon: Globe },
];
const SELECTED_INGREDIENTS = [
  { id: 'i1', name: 'Куриное филе', emoji: '🍗', amountValue: '500', unit: 'г',      toTaste: false, optional: false },
  { id: 'i2', name: 'Шампиньоны',   emoji: '🍄', amountValue: '300', unit: 'г',      toTaste: false, optional: false },
  { id: 'i3', name: 'Сливки 20%',   emoji: '🥛', amountValue: '200', unit: 'мл',     toTaste: false, optional: false },
  { id: 'i4', name: 'Чеснок',       emoji: '🧄', amountValue: '3',   unit: 'зубчик', toTaste: false, optional: false },
  { id: 'i5', name: 'Соль и перец', emoji: '🧂', amountValue: '',    unit: 'г',      toTaste: true,  optional: false },
];
const ALL_INGREDIENTS = [
  { id: 'a1',  name: 'Помидоры',     emoji: '🍅', category: 'vegetable' },
  { id: 'a2',  name: 'Огурцы',       emoji: '🥒', category: 'vegetable' },
  { id: 'a3',  name: 'Лук репчатый', emoji: '🧅', category: 'vegetable' },
  { id: 'a4',  name: 'Курица',       emoji: '🍗', category: 'meat' },
  { id: 'a5',  name: 'Сыр',          emoji: '🧀', category: 'dairy' },
  { id: 'a6',  name: 'Молоко',       emoji: '🥛', category: 'dairy' },
  { id: 'a7',  name: 'Хлеб',         emoji: '🍞', category: 'bread' },
  { id: 'a8',  name: 'Яйца',         emoji: '🥚', category: 'protein' },
  { id: 'a9',  name: 'Картофель',    emoji: '🥔', category: 'vegetable' },
  { id: 'a10', name: 'Морковь',      emoji: '🥕', category: 'vegetable' },
];
const ING_CATEGORIES = [
  { value: 'all',       label: 'Все' },
  { value: 'meat',      label: 'Мясо' },
  { value: 'vegetable', label: 'Овощи' },
  { value: 'dairy',     label: 'Молочное' },
  { value: 'bread',     label: 'Хлеб' },
  { value: 'protein',   label: 'Белки' },
];
const UPLOADED_IMAGES = [
  'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=300',
  'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300',
  'https://images.unsplash.com/photo-1588013273468-315fd88ea34c?w=300',
];

// ═══ Atoms ════════════════════════════════════════════════════
function Label({ children, required }) {
  return (
    <div
      className="text-[10.5px] font-bold uppercase mb-2 px-1"
      style={{ color: C.text3, letterSpacing: 0.6 }}
    >
      {children}{required && <span style={{ color: C.red, marginLeft: 4 }}>*</span>}
    </div>
  );
}

function PillInput({ value, onChange, placeholder, type = 'text', tabular = false }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      placeholder={placeholder}
      className="w-full"
      style={{
        height: 44, padding: '0 16px', borderRadius: 9999,
        background: C.card,
        border: `1px solid ${focus ? C.accent : C.border}`,
        boxShadow: focus ? `0 0 0 3px ${C.accentMuted}` : 'none',
        fontSize: 14.5, color: C.text, outline: 'none',
        fontFamily: 'inherit',
        fontVariantNumeric: tabular ? 'tabular-nums' : 'normal',
      }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      value={value}
      onChange={e => onChange?.(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      placeholder={placeholder}
      rows={rows}
      className="w-full block"
      style={{
        padding: '12px 16px', borderRadius: 14,
        background: C.card,
        border: `1px solid ${focus ? C.accent : C.border}`,
        boxShadow: focus ? `0 0 0 3px ${C.accentMuted}` : 'none',
        fontSize: 14.5, color: C.text, outline: 'none',
        fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5,
      }}
    />
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="font-bold whitespace-nowrap"
      style={{
        height: 36, padding: '0 14px', borderRadius: 9999, fontSize: 13,
        background: active ? C.accentMuted : C.card,
        border: `1px solid ${active ? C.accentBorder : C.border}`,
        color: active ? C.accent : C.text2,
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function ErrorLine({ children }) {
  return (
    <div className="flex items-center gap-1 mt-1.5 px-1" style={{ color: C.red, fontSize: 12 }}>
      <AlertCircle size={12} strokeWidth={2.4} />
      {children}
    </div>
  );
}

function MiniSwitch({ on, onChange }) {
  return (
    <button
      onClick={() => onChange?.(!on)}
      style={{
        width: 32, height: 18, borderRadius: 9999,
        background: on ? C.accent : C.border,
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.15s',
      }}
    >
      <span
        style={{
          position: 'absolute', top: 2, left: on ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff', transition: 'left 0.15s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        }}
      />
    </button>
  );
}

// ═══ Sticky header ════════════════════════════════════════════
function FormHeader({ title, canSave }) {
  return (
    <header
      className="h-[52px] px-2 flex items-center justify-between sticky top-0 z-30"
      style={{
        background: 'rgba(246,244,239,0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: 'transparent', border: 'none' }}
        aria-label="Назад"
      >
        <ChevronLeft size={20} strokeWidth={2} color={C.text2} />
      </button>
      <div className="text-[15px] font-bold truncate max-w-[200px]" style={{ color: C.text }}>
        {title}
      </div>
      <button
        disabled={!canSave}
        className="font-bold"
        style={{
          height: 36, padding: '0 16px', borderRadius: 9999, fontSize: 13,
          background: C.accent, color: '#fff', border: 'none',
          opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          boxShadow: canSave ? '0 4px 12px rgba(196,112,74,0.30)' : 'none',
        }}
      >
        Сохранить
      </button>
    </header>
  );
}

// ═══ Banners ══════════════════════════════════════════════════
function GroupBanner({ name }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 flex items-center gap-2 text-[13px]"
      style={{ background: C.accentMuted, border: `1px solid ${C.accentBorder}`, color: C.accent }}
    >
      <Sparkles size={14} strokeWidth={2.2} />
      <span style={{ textWrap: 'pretty' }}>Блюдо будет добавлено в группу «{name}»</span>
    </div>
  );
}
function CopyBanner({ from }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 flex items-center gap-2 text-[13px]"
      style={{ background: C.sageMuted, border: `1px solid ${C.sageBorder}`, color: C.sage }}
    >
      <Eye size={14} strokeWidth={2.2} />
      <span style={{ textWrap: 'pretty' }}>Это копия рецепта «{from}». Адаптируйте под себя.</span>
    </div>
  );
}

// ═══ Mode switcher ════════════════════════════════════════════
function ModeSwitcher({ mode, onChange }) {
  return (
    <div
      className="flex p-1 rounded-full"
      style={{ background: C.bg3, border: `1px solid ${C.border}` }}
    >
      {[{ id: 'quick', label: 'Быстро' }, { id: 'extended', label: 'Расширенно' }].map(o => {
        const on = o.id === mode;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="flex-1 font-bold"
            style={{
              height: 36, borderRadius: 9999, fontSize: 13,
              background: on ? C.accent : 'transparent',
              color: on ? '#fff' : C.text2,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.12s',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ═══ ChipsField ═══════════════════════════════════════════════
function ChipsField({ items, value, onChange, multi = true }) {
  const isOn = v => multi ? value.has(v) : value === v;
  const toggle = v => {
    if (multi) {
      const n = new Set(value);
      n.has(v) ? n.delete(v) : n.add(v);
      onChange(n);
    } else {
      onChange(v === value ? null : v);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(it => (
        <Chip key={it.value} active={isOn(it.value)} onClick={() => toggle(it.value)}>
          {it.label}
        </Chip>
      ))}
    </div>
  );
}

// ═══ Photo grid ═══════════════════════════════════════════════
function PhotoGrid({ images, mainIndex, onSetMain, onRemove }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => {
          const isMain = i === mainIndex;
          return (
            <div
              key={i}
              className="relative rounded-xl overflow-hidden"
              style={{
                aspectRatio: '1', background: C.card,
                boxShadow: isMain ? `0 0 0 2px ${C.accent}` : `0 0 0 1px ${C.border}`,
              }}
            >
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => onSetMain(i)}
                className="absolute flex items-center justify-center"
                style={{
                  top: 6, left: 6, width: 22, height: 22, borderRadius: '50%',
                  background: isMain ? C.accent : 'rgba(0,0,0,0.55)',
                  border: 'none', cursor: 'pointer',
                }}
                aria-label={isMain ? 'Главное фото' : 'Сделать главным'}
              >
                <Star size={12} strokeWidth={2.4} color="#fff" fill={isMain ? '#fff' : 'none'} />
              </button>
              <button
                onClick={() => onRemove(i)}
                className="absolute flex items-center justify-center"
                style={{
                  top: 6, right: 6, width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer',
                }}
                aria-label="Удалить фото"
              >
                <X size={12} strokeWidth={2.6} color="#fff" />
              </button>
            </div>
          );
        })}
      </div>
      {images.length < 10 && (
        <button
          className="w-full mt-2 font-bold flex items-center justify-center gap-2"
          style={{
            height: 44, borderRadius: 9999,
            background: C.card, border: `1px solid ${C.border}`,
            color: C.text2, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Camera size={15} strokeWidth={2.2} /> Добавить ещё
        </button>
      )}
    </>
  );
}

// ═══ Video field ══════════════════════════════════════════════
function VideoField({ uploaded }) {
  if (uploaded) {
    return (
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-2"
        style={{ background: C.sageMuted, border: `1px solid ${C.sageBorder}` }}
      >
        <Check size={15} strokeWidth={2.4} color={C.sage} />
        <span className="text-[13.5px] font-bold flex-1" style={{ color: C.sage }}>Видео загружено</span>
        <button
          className="text-[12.5px] font-bold"
          style={{ background: 'transparent', color: C.red, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Удалить
        </button>
      </div>
    );
  }
  return (
    <button
      className="w-full font-bold flex items-center justify-center gap-2"
      style={{
        height: 44, borderRadius: 9999,
        background: C.card, border: `1px solid ${C.border}`,
        color: C.text2, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      <Video size={15} strokeWidth={2.2} /> Загрузить видео
    </button>
  );
}

// ═══ Ingredient row ═══════════════════════════════════════════
function IngredientRow({ ing, onRemove, onChange }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 flex items-center gap-2"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <span style={{ fontSize: 16 }}>{ing.emoji}</span>
      <span
        className="text-[13px] font-semibold flex-1 truncate"
        style={{ color: C.text }}
      >
        {ing.name}
      </span>

      <div className="flex items-center gap-1">
        <MiniSwitch on={ing.toTaste} onChange={v => onChange?.({ ...ing, toTaste: v })} />
        <span className="text-[10px]" style={{ color: C.text2 }}>вкус</span>
      </div>

      {ing.toTaste ? (
        <span
          className="text-[11px] font-bold uppercase"
          style={{ color: C.text3, letterSpacing: 0.4, padding: '0 4px' }}
        >
          по вкусу
        </span>
      ) : (
        <>
          <input
            value={ing.amountValue}
            onChange={e => onChange?.({ ...ing, amountValue: e.target.value })}
            className="text-center"
            style={{
              width: 56, height: 30, borderRadius: 9999,
              background: C.bg3, border: `1px solid ${C.border}`,
              fontSize: 13, color: C.text, outline: 'none',
              fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit',
            }}
          />
          <select
            value={ing.unit}
            onChange={e => onChange?.({ ...ing, unit: e.target.value })}
            style={{
              width: 70, height: 30, borderRadius: 9999, padding: '0 8px',
              background: C.bg3, border: `1px solid ${C.border}`,
              fontSize: 12, color: C.text2, outline: 'none', fontFamily: 'inherit',
              appearance: 'none', WebkitAppearance: 'none',
            }}
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </>
      )}

      <button
        onClick={onRemove}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'transparent', color: C.text3, border: 'none', cursor: 'pointer' }}
        aria-label="Удалить"
      >
        <X size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
}

// ═══ Visibility radio cards ═══════════════════════════════════
function VisibilityCards({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {VISIBILITY_OPTIONS.map(o => {
        const on = value === o.value;
        const Ic = o.Icon;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="text-left flex items-center gap-3"
            style={{
              padding: '12px 16px', borderRadius: 16,
              background: on ? C.accentMuted : C.card,
              border: `1px solid ${on ? C.accentBorder : C.border}`,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <span
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                width: 20, height: 20,
                background: on ? C.accent : 'transparent',
                border: `2px solid ${on ? C.accent : C.border}`,
              }}
            >
              {on && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
            </span>
            <Ic size={18} strokeWidth={2} color={on ? C.accent : C.text2} />
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold" style={{ color: on ? C.accent : C.text }}>{o.label}</div>
              <div className="text-[11.5px]" style={{ color: C.text2, textWrap: 'pretty' }}>{o.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ═══ Section ══════════════════════════════════════════════════
function Section({ label, required, hint, children }) {
  return (
    <div className="mt-7">
      <div className="flex items-baseline justify-between">
        <Label required={required}>{label}</Label>
        {hint && <div className="text-[10.5px] mb-2 px-1" style={{ color: C.text3 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

// ═══ Submit ═══════════════════════════════════════════════════
function SubmitButton({ children, disabled }) {
  return (
    <button
      disabled={disabled}
      className="w-full font-bold mt-7"
      style={{
        height: 52, borderRadius: 9999,
        background: C.accent, color: '#fff', fontSize: 15,
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: '0 8px 22px rgba(196,112,74,0.35)',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

// ═══ Picker (bottom sheet) ════════════════════════════════════
function IngredientPicker({ selected, query, setQuery, cat, setCat, onClose, onToggle }) {
  const list = ALL_INGREDIENTS.filter(i =>
    (cat === 'all' || i.category === cat) &&
    (query === '' || i.name.toLowerCase().includes(query.toLowerCase()))
  );
  const empty = list.length === 0;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" style={{ background: 'rgba(28,25,23,0.45)' }}>
      <div
        className="flex flex-col"
        style={{
          background: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: '12px 20px 24px', maxHeight: '85%',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div className="flex justify-center mb-3 flex-shrink-0">
          <div style={{ width: 40, height: 4, borderRadius: 9999, background: C.border }} />
        </div>

        <div className="flex items-center justify-between flex-shrink-0">
          <h2 className="text-[17px] font-bold" style={{ color: C.text, margin: 0 }}>Добавить ингредиент</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: C.bg3, border: 'none', cursor: 'pointer' }}
            aria-label="Закрыть"
          >
            <X size={15} strokeWidth={2.2} color={C.text2} />
          </button>
        </div>

        <div className="mt-4 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-4"
            style={{
              height: 44, borderRadius: 9999,
              background: C.card, border: `1px solid ${C.border}`,
            }}
          >
            <Search size={16} strokeWidth={2} color={C.text3} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск ингредиента…"
              className="flex-1"
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: C.text, fontFamily: 'inherit' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: C.border, border: 'none', cursor: 'pointer' }}
                aria-label="Очистить"
              >
                <X size={11} strokeWidth={2.4} color={C.text2} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 -mx-5 px-5 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-2" style={{ width: 'max-content' }}>
            {ING_CATEGORIES.map(cc => (
              <Chip key={cc.value} active={cat === cc.value} onClick={() => setCat(cc.value)}>
                {cc.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto" style={{ maxHeight: 320 }}>
          {empty ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="text-[13px] mb-3" style={{ color: C.text3 }}>
                Ничего не найдено
              </div>
              <button
                className="font-bold flex items-center gap-1.5"
                style={{
                  height: 40, padding: '0 16px', borderRadius: 9999,
                  background: C.accentMuted, color: C.accent,
                  border: `1px solid ${C.accentBorder}`,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Plus size={14} strokeWidth={2.4} /> Создать «{query || 'новый'}»
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {list.map(i => {
                const on = selected.has(i.id);
                return (
                  <button
                    key={i.id}
                    onClick={() => onToggle(i.id)}
                    className="rounded-xl px-3 py-2.5 flex items-center gap-2 text-left"
                    style={{
                      background: on ? C.accentMuted : C.card,
                      border: `1px solid ${on ? C.accentBorder : C.border}`,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{i.emoji}</span>
                    <span className="text-[13px] font-semibold flex-1 truncate" style={{ color: on ? C.accent : C.text }}>
                      {i.name}
                    </span>
                    {on && <Check size={14} strokeWidth={2.4} color={C.accent} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full font-bold flex items-center justify-center gap-2 mt-4 flex-shrink-0"
          style={{
            height: 48, borderRadius: 9999,
            background: C.accent, color: '#fff', fontSize: 14,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 18px rgba(196,112,74,0.35)',
          }}
        >
          Готово
          {selected.size > 0 && (
            <span className="tabular-nums" style={{ opacity: 0.85 }}>· {selected.size} выбрано</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ═══ Screen ═══════════════════════════════════════════════════
function Screen({ variant }) {
  const isEdit = variant === 'edit-with-image-uploaded';
  const isExt  = variant === 'extended' || variant === 'edit-with-picker' || isEdit;
  const showPicker = variant === 'edit-with-picker';

  const [mode, setMode] = useState(isExt ? 'extended' : 'quick');
  const [name, setName] = useState(isEdit ? 'Курица с грибами в сливках' : '');
  const [desc, setDesc] = useState(isEdit ? 'Нежная курица в сливочном соусе с шампиньонами. Готовится за 30 минут.' : '');
  const [cats, setCats] = useState(new Set(isEdit ? ['MAIN'] : []));
  const [meals, setMeals] = useState(new Set(isEdit ? ['LUNCH', 'DINNER'] : []));
  const [time, setTime] = useState(isEdit ? '30' : '');
  const [tags, setTags] = useState(isEdit ? 'быстро, сытно, мясо' : '');
  const [ings, setIngs] = useState(isEdit ? SELECTED_INGREDIENTS : []);
  const [recipe, setRecipe] = useState(isEdit ? '1. Нарежьте курицу.\n2. Обжарьте грибы.\n3. Добавьте сливки.' : '');
  const [vis, setVis] = useState(isEdit ? 'FAMILY' : 'PRIVATE');

  const [images, setImages] = useState(isEdit ? UPLOADED_IMAGES : []);
  const [mainIdx, setMainIdx] = useState(0);

  // Picker state (для variant='edit-with-picker')
  const [pQuery, setPQuery] = useState('');
  const [pCat, setPCat] = useState('all');
  const [pSelected, setPSelected] = useState(new Set(['a4']));

  const canSave = name.trim() && cats.size && meals.size && (mode === 'quick' || ings.length > 0);
  const isCopy = false;
  const fromGroup = variant === 'extended' ? 'Семья' : null;

  return (
    <div
      className="relative"
      style={{
        background: C.bg, color: C.text,
        fontFamily: 'Nunito, system-ui, sans-serif',
        textWrap: 'pretty', minHeight: 760,
      }}
    >
      <FormHeader title={isEdit || showPicker ? 'Редактировать рецепт' : 'Новый рецепт'} canSave={canSave} />

      <div className="px-5 pt-5 pb-24">
        {fromGroup && <GroupBanner name={fromGroup} />}
        {isCopy && <div className={fromGroup ? 'mt-2' : ''}><CopyBanner from="Карбонара" /></div>}

        {!isEdit && !showPicker && (
          <div className={fromGroup || isCopy ? 'mt-7' : ''}>
            <ModeSwitcher mode={mode} onChange={setMode} />
          </div>
        )}

        {/* Название */}
        <Section label="Название" required>
          <PillInput value={name} onChange={setName} placeholder="Например, Курица с грибами" />
          {!name && <ErrorLine>Обязательное поле</ErrorLine>}
        </Section>

        {/* Описание (extended) */}
        {isExt && (
          <Section label="Краткое описание">
            <TextArea value={desc} onChange={setDesc} rows={2} placeholder="В двух словах, чем особенное это блюдо…" />
          </Section>
        )}

        {/* Категории */}
        <Section label="Категории" required={isExt}>
          <ChipsField items={CATEGORIES} value={cats} onChange={setCats} multi />
        </Section>

        {/* Время приёма */}
        <Section label="Когда есть" required>
          <ChipsField items={MEAL_TIMES} value={meals} onChange={setMeals} multi />
        </Section>

        {/* Время готовки (extended) */}
        {isExt && (
          <Section label="Время готовки (минут)">
            <PillInput value={time} onChange={setTime} placeholder="30" type="number" tabular />
          </Section>
        )}

        {/* Теги (extended) */}
        {isExt && (
          <Section label="Теги (через запятую)">
            <PillInput value={tags} onChange={setTags} placeholder="быстро, сытно, мясо" />
          </Section>
        )}

        {/* Фото (extended) */}
        {isExt && (
          <Section label="Фото блюда" hint="до 10 штук">
            {images.length > 0 ? (
              <PhotoGrid
                images={images}
                mainIndex={mainIdx}
                onSetMain={setMainIdx}
                onRemove={i => setImages(arr => arr.filter((_, j) => j !== i))}
              />
            ) : (
              <button
                className="w-full font-bold flex items-center justify-center gap-2"
                style={{
                  height: 44, borderRadius: 9999,
                  background: C.card, border: `1px solid ${C.border}`,
                  color: C.text2, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Upload size={15} strokeWidth={2.2} /> Загрузить фото
              </button>
            )}
          </Section>
        )}

        {/* Видео (extended) */}
        {isExt && (
          <Section label="Видео (необязательно)">
            <VideoField uploaded={isEdit} />
          </Section>
        )}

        {/* Ингредиенты */}
        <Section label="Ингредиенты" required={isExt}>
          {ings.length === 0 ? (
            <div className="text-[13px] mb-2 px-1" style={{ color: C.text3 }}>
              Пока не выбрано
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {ings.map(it => (
                <IngredientRow
                  key={it.id}
                  ing={it}
                  onRemove={() => setIngs(arr => arr.filter(x => x.id !== it.id))}
                  onChange={u => setIngs(arr => arr.map(x => x.id === u.id ? u : x))}
                />
              ))}
            </div>
          )}
          <button
            className="w-full mt-2 font-bold flex items-center justify-center gap-2"
            style={{
              height: 40, borderRadius: 9999,
              background: C.card, border: `1px solid ${C.border}`,
              color: C.accent, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={14} strokeWidth={2.4} /> Добавить ингредиент
          </button>
        </Section>

        {/* Рецепт (extended) */}
        {isExt && (
          <Section label="Рецепт (шаги приготовления)">
            <TextArea value={recipe} onChange={setRecipe} rows={8} placeholder="Опишите шаги приготовления…" />
          </Section>
        )}

        {/* Доступ */}
        <Section label="Доступ">
          <VisibilityCards value={vis} onChange={setVis} />
        </Section>

        <SubmitButton disabled={!canSave}>
          {isEdit ? 'Сохранить изменения' : 'Создать блюдо'}
        </SubmitButton>
      </div>

      {showPicker && (
        <IngredientPicker
          selected={pSelected}
          query={pQuery}
          setQuery={setPQuery}
          cat={pCat}
          setCat={setPCat}
          onClose={() => {}}
          onToggle={id => setPSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; })}
        />
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
export default function DishFormPageArtefact() {
  return (
    <div style={{ background: '#E5E7EB', fontFamily: 'Nunito, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[430px]">
        <Divider label="— 1. Quick mode (минимум полей) —" />
        <Screen variant="quick" />

        <Divider label="— 2. Extended mode (новое, расширенный) —" />
        <Screen variant="extended" />

        <Divider label="— 3. Picker ингредиентов открыт —" />
        <Screen variant="edit-with-picker" />

        <Divider label="— 4. Edit mode · 3 фото загружены —" />
        <Screen variant="edit-with-image-uploaded" />

        <div className="py-4 text-center text-[10.5px]" style={{ color: '#6B7280', background: '#E5E7EB' }}>
          Свой sticky-header 52px (back + Сохранить). Tab bar — в Layout.
        </div>
      </div>
    </div>
  );
}
