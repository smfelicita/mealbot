// FridgePageV2 — страница холодильника, редизайн.
// Портировано из context/design/fridge-v2.jsx.
// Три состояния: guest / user пустой / user рабочий вид + picker-modal.
// Токены через Tailwind (bg-accent, text-sage, bg-sage-muted и т.д.)

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Refrigerator, Search, Plus, X, Check, Sparkles, Trash2, Users, Send,
} from 'lucide-react'

import { api } from '../api'
import { useStore } from '../store'
import { UNITS } from '../constants'
import { PageHeader, GuestBlock, useToast } from '../components/ui'

// ─── Категории ─────────────────────────────────────────────────────
const CAT_META = {
  dairy:     { label: 'Молочное',  emoji: '🥛' },
  protein:   { label: 'Белки',     emoji: '🥚' },
  vegetable: { label: 'Овощи',     emoji: '🥕' },
  fruit:     { label: 'Фрукты',    emoji: '🍎' },
  grain:     { label: 'Злаки',     emoji: '🌾' },
  meat:      { label: 'Мясо',      emoji: '🥩' },
  fish:      { label: 'Рыба',      emoji: '🐟' },
  egg:       { label: 'Яйца',      emoji: '🥚' },
  bread:     { label: 'Хлеб',      emoji: '🍞' },
  spice:     { label: 'Специи',    emoji: '🌶' },
  herb:      { label: 'Зелень',    emoji: '🌿' },
  oil:       { label: 'Масла',     emoji: '🫒' },
  sauce:     { label: 'Соусы',     emoji: '🫙' },
  nut:       { label: 'Орехи',     emoji: '🥜' },
  sweetener: { label: 'Сладкое',   emoji: '🍯' },
  canned:    { label: 'Консервы',  emoji: '🥫' },
  pantry:    { label: 'Кладовая',  emoji: '🥫' },
  legume:    { label: 'Бобовые',   emoji: '🫘' },
  other:     { label: 'Остальное', emoji: '📦' },
}

const CAT_ORDER = [
  'meat', 'fish', 'dairy', 'protein', 'egg', 'vegetable', 'herb',
  'fruit', 'grain', 'bread', 'legume', 'pantry', 'canned', 'oil',
  'sauce', 'spice', 'nut', 'sweetener', 'other',
]

// ─── Helpers ───────────────────────────────────────────────────────
function pluralProduct(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'продукт'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'продукта'
  return 'продуктов'
}

function groupByCat(list) {
  const out = {}
  for (const it of list) {
    const cat = it.category || 'other'
    ;(out[cat] ||= []).push(it)
  }
  return out
}

// ═══ Telegram banner ════════════════════════════════════════════════
function TelegramBanner({ onLinked, onError, onClose }) {
  const [status, setStatus] = useState('idle') // idle | loading | polling
  const pollRef    = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => () => {
    if (pollRef.current)    clearInterval(pollRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  async function connect() {
    setStatus('loading')
    try {
      const { url } = await api.generateTelegramLink()
      window.open(url, '_blank')
      setStatus('polling')

      pollRef.current = setInterval(async () => {
        try {
          const d = await api.getTelegramLinkStatus()
          if (d.linked) { clearInterval(pollRef.current); onLinked() }
        } catch {}
      }, 3000)

      timeoutRef.current = setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current); pollRef.current = null; setStatus('idle')
        }
      }, 180_000)
    } catch (err) {
      setStatus('idle')
      onError?.(err.message || 'Не удалось получить ссылку')
    }
  }

  const label = status === 'loading' ? '...' : status === 'polling' ? 'Ожидание…' : 'Подключить'

  return (
    <div className="mx-4 mt-3 rounded-2xl flex items-center gap-3 relative
      bg-bg-2 border border-accent-border px-3.5 py-3">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[#E6F3FB]">
        <Send size={16} strokeWidth={2} className="text-[#2AABEE]" />
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <div className="text-[13.5px] font-bold leading-snug text-text">
          Управляй холодильником в Telegram
        </div>
        <div className="text-[11.5px] text-text-3 mt-0.5">
          Голосом или текстом, быстрее чем в приложении
        </div>
      </div>
      <button
        onClick={connect}
        disabled={status !== 'idle'}
        className="px-3 py-1.5 rounded-full text-[12px] font-bold shrink-0
          bg-accent-muted text-accent border border-accent-border disabled:opacity-60"
      >
        {label}
      </button>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-text-3"
        aria-label="Закрыть"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  )
}

// ═══ Family banner ═══════════════════════════════════════════════════
function FamilyBanner({ count }) {
  return (
    <div className="mx-4 mt-3 rounded-xl flex items-center gap-2
      bg-sage-muted border border-sage-border px-3.5 py-2.5">
      <Users size={15} strokeWidth={2.2} className="text-sage" />
      <div className="text-[13px] font-semibold flex-1 text-sage">
        Общий холодильник с семьёй
      </div>
      {count != null && (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full
          bg-bg-2 text-sage border border-sage-border">
          {count} {count === 1 ? 'участник' : count < 5 ? 'участника' : 'участников'}
        </span>
      )}
    </div>
  )
}

// ═══ Meta strip (всего / базовых) ══════════════════════════════════
function FridgeMetaStrip({ total, basic }) {
  const items = [
    { value: total, label: 'всего' },
    { value: basic, label: 'базовых' },
  ]
  return (
    <div className="mx-4 mt-4 rounded-2xl flex items-stretch justify-between
      bg-bg-2 border border-border px-1.5 py-3">
      {items.map((it, i) => (
        <div key={i} className="flex-1 flex items-stretch">
          <div className="flex-1 flex flex-col items-center gap-0.5 px-1">
            <div className="text-[17px] font-extrabold tabular-nums tracking-tight text-text">
              {it.value}
            </div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-text-3">
              {it.label}
            </div>
          </div>
          {i < items.length - 1 && <div className="w-px my-1 bg-border" />}
        </div>
      ))}
    </div>
  )
}

// ═══ AI cook CTA ═══════════════════════════════════════════════════
function AICookCTA({ onClick }) {
  return (
    <div className="px-4 mt-4">
      <button
        type="button"
        onClick={onClick}
        className="w-full h-12 rounded-full flex items-center justify-center gap-2
          bg-sage text-white text-[14px] font-bold"
        style={{ boxShadow: '0 6px 18px rgba(92,122,89,0.35)' }}
      >
        <Sparkles size={16} strokeWidth={2.2} />
        Что можно приготовить?
      </button>
      <div className="text-[11.5px] text-center mt-1.5 text-text-3">
        ИИ подберёт блюдо по твоему холодильнику
      </div>
    </div>
  )
}

// ═══ Product card ══════════════════════════════════════════════════
function ProductCard({ item, editing, onEdit, onDelete, onSave, onCancel }) {
  const [qty, setQty]   = useState(item.quantityValue != null ? String(item.quantityValue) : '')
  const [unit, setUnit] = useState(item.quantityUnit || UNITS[0])

  useEffect(() => {
    setQty(item.quantityValue != null ? String(item.quantityValue) : '')
    setUnit(item.quantityUnit || UNITS[0])
  }, [item.quantityValue, item.quantityUnit, editing])

  return (
    <div className={[
      'rounded-xl flex flex-col bg-bg-2 p-2.5 border',
      item.isBasic ? 'border-accent-border' : 'border-border',
    ].join(' ')}>
      <div className="flex items-start gap-2">
        <div className="text-[20px] leading-none select-none shrink-0 mt-0.5">
          {item.emoji || '📦'}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-[13px] font-semibold flex-1 min-w-0 text-left truncate text-text"
          title={item.name}
        >
          {item.name}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-text-3"
          aria-label="Удалить"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        {item.isBasic && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md
            bg-sage-muted text-sage border border-sage-border">
            базовый
          </span>
        )}
        {item.quantityValue != null && !editing && (
          <span className="text-[11px] tabular-nums text-text-3">
            {item.quantityValue} {item.quantityUnit}
          </span>
        )}
      </div>

      {editing && (
        <div className="flex gap-1.5 mt-2">
          <input
            type="number"
            min="0"
            value={qty}
            onChange={e => setQty(e.target.value)}
            autoFocus
            placeholder="Кол-во"
            className="flex-1 min-w-0 h-8 px-2 rounded-lg text-[12.5px] outline-none tabular-nums
              bg-bg-3 border border-border text-text focus:border-accent"
          />
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="h-8 px-1.5 rounded-lg text-[12px] outline-none
              bg-bg-3 border border-border text-text focus:border-accent"
            style={{ maxWidth: 62 }}
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button
            type="button"
            onClick={() => onSave(qty, unit)}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-sage text-white"
            aria-label="Сохранить"
          >
            <Check size={14} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
              bg-bg-3 border border-border text-text-2"
            aria-label="Отмена"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>
      )}
    </div>
  )
}

// ═══ Category block ═════════════════════════════════════════════════
function CategoryBlock({ cat, items, editingId, setEditingId, onDelete, onSave }) {
  const meta = CAT_META[cat] || CAT_META.other
  return (
    <section className="mt-6 px-4">
      <div className="text-[11px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-text-2">
        <span className="text-[13px] leading-none">{meta.emoji}</span>
        <span>{meta.label}</span>
        <span className="text-text-3">· {items.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(it => (
          <ProductCard
            key={it.ingredientId}
            item={it}
            editing={editingId === it.ingredientId}
            onEdit={() => setEditingId(editingId === it.ingredientId ? null : it.ingredientId)}
            onDelete={() => onDelete(it.ingredientId, it.name)}
            onSave={(qty, unit) => onSave(it.ingredientId, qty, unit)}
            onCancel={() => setEditingId(null)}
          />
        ))}
      </div>
    </section>
  )
}

// ═══ Picker modal ═══════════════════════════════════════════════════
function PickerSheet({ open, onClose, allIngredients, fridgeIds, onAdd, loading }) {
  const [selected, setSelected] = useState(() => new Set())
  const [query, setQuery]       = useState('')

  useEffect(() => {
    if (!open) {
      setSelected(new Set())
      setQuery('')
    }
  }, [open])

  const available = useMemo(
    () => allIngredients.filter(ing => !fridgeIds.has(ing.id)),
    [allIngredients, fridgeIds]
  )

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return available.filter(ing => ing.nameRu.toLowerCase().includes(q))
  }, [available, query])

  const groupedAdd = useMemo(() => {
    const g = {}
    for (const ing of available) {
      const cat = ing.category || 'other'
      ;(g[cat] ||= []).push(ing)
    }
    return g
  }, [available])

  const orderedCats = useMemo(
    () => CAT_ORDER.filter(c => groupedAdd[c]?.length),
    [groupedAdd]
  )

  function toggle(id) {
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (!open) return null
  const count = selected.size

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(28,25,23,0.45)' }}>
      {/* tap-to-close backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="flex-1"
        aria-label="Закрыть"
      />

      {/* sheet */}
      <div
        className="relative flex flex-col bg-bg-2 overflow-hidden"
        style={{ maxHeight: '85dvh', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        {/* handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <h2 className="text-[17px] font-bold text-text">Что у вас есть?</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-3 text-text-2"
            aria-label="Закрыть"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* search */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex items-center gap-2 rounded-full h-10 px-3.5 bg-bg-3 border border-border">
            <Search size={15} strokeWidth={2} className="text-text-3" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Найти продукт…"
              className="flex-1 bg-transparent outline-none text-[13.5px] text-text"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="w-5 h-5 rounded-full flex items-center justify-center bg-border text-text-2"
              >
                <X size={11} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0">
          {searchResults ? (
            <div className="flex flex-col gap-1">
              <div className="text-[11px] font-bold uppercase tracking-wider mb-1 text-text-3">
                Результаты по «{query}»
              </div>
              {searchResults.length === 0 && (
                <div className="text-[13px] text-center py-8 text-text-3">
                  Ничего не найдено
                </div>
              )}
              {searchResults.map(it => {
                const on = selected.has(it.id)
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggle(it.id)}
                    className={[
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left border',
                      on ? 'bg-accent-muted border-accent-border' : 'bg-bg-2 border-border',
                    ].join(' ')}
                  >
                    <span className="text-[20px] leading-none">{it.emoji || '📦'}</span>
                    <span className="flex-1 text-[13.5px] font-semibold text-text">{it.nameRu}</span>
                    <span className="text-[11px] text-text-3">
                      {CAT_META[it.category]?.label || ''}
                    </span>
                    <div className={[
                      'w-7 h-7 rounded-full flex items-center justify-center',
                      on ? 'bg-accent text-white' : 'bg-transparent border border-border text-accent',
                    ].join(' ')}>
                      {on ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.4} />}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orderedCats.length === 0 && (
                <div className="text-[13px] text-center py-8 text-text-3">
                  Все продукты уже в холодильнике 🎉
                </div>
              )}
              {orderedCats.map(cat => {
                const meta = CAT_META[cat] || CAT_META.other
                return (
                  <div key={cat}>
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-text-2">
                      <span className="text-[13px] leading-none">{meta.emoji}</span>
                      {meta.label}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {groupedAdd[cat].map(it => {
                        const on = selected.has(it.id)
                        return (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => toggle(it.id)}
                            className={[
                              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition',
                              on
                                ? 'bg-accent-muted border-accent text-accent'
                                : 'bg-bg-3 border-border text-text-2',
                            ].join(' ')}
                          >
                            <span className="text-[13px] leading-none">{it.emoji || '📦'}</span>
                            {it.nameRu}
                            {on && <Check size={11} strokeWidth={3} className="text-accent" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-5 pb-5 pt-2 border-t border-border bg-bg-2 shrink-0">
          <button
            type="button"
            disabled={count === 0 || loading}
            onClick={() => onAdd(Array.from(selected))}
            className={[
              'w-full h-12 rounded-full text-[14px] font-bold flex items-center justify-center gap-2 transition',
              count > 0
                ? 'bg-accent text-white'
                : 'bg-bg-3 text-text-3 border border-border',
            ].join(' ')}
            style={count > 0 ? { boxShadow: '0 6px 18px rgba(196,112,74,0.35)' } : undefined}
          >
            {count > 0 ? (
              <>
                <Plus size={16} strokeWidth={2.4} />
                {loading ? 'Добавляем…' : `Добавить ${count} ${pluralProduct(count)}`}
              </>
            ) : 'Готово'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══ Empty state ════════════════════════════════════════════════════
function FridgeEmpty({ onAdd }) {
  return (
    <div className="px-5 mt-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center
        bg-bg-3 border border-border">
        <Refrigerator size={28} strokeWidth={1.8} className="text-accent" />
      </div>
      <h2 className="mt-4 text-[17px] font-bold text-text">Холодильник пустой</h2>
      <p className="mt-2 text-[13px] max-w-[280px] leading-relaxed text-text-2">
        Добавь продукты — MealBot подберёт что приготовить из того, что есть
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 h-11 px-5 rounded-full flex items-center gap-2
          bg-accent text-white text-[13.5px] font-bold"
        style={{ boxShadow: '0 6px 18px rgba(196,112,74,0.35)' }}
      >
        <Plus size={16} strokeWidth={2.4} />
        Добавить продукты
      </button>
    </div>
  )
}

// ═══ Guest block ═══════════════════════════════════════════════════
function GuestFridgeBlock() {
  return (
    <div className="pt-5 pb-24 px-4">
      <PageHeader title="Холодильник" />
      <div className="mt-4">
        <GuestBlock
          icon={<Refrigerator size={26} strokeWidth={1.8} />}
          title="Готовь из того, что есть дома"
          description="Добавь продукты из холодильника — MealBot подберёт блюда, которые можно приготовить прямо сейчас."
          registerText="Создать свою кухню"
          loginText="Уже есть аккаунт? Войти"
        />
      </div>
    </div>
  )
}

// ═══ Main page ══════════════════════════════════════════════════════
export default function FridgePageV2() {
  const { token } = useStore()
  if (!token) return <GuestFridgeBlock />

  const { fridge, setFridge, addToFridge, removeFromFridge, updateFridgeItem } = useStore()
  const { show, Toast } = useToast()
  const navigate = useNavigate()

  const [allIngredients, setAllIngredients] = useState([])
  const [familyGroupId,  setFamilyGroupId]  = useState(null)
  const [familyCount,    setFamilyCount]    = useState(null)
  const [telegramLinked, setTelegramLinked] = useState(null)
  const [tgBannerOpen,   setTgBannerOpen]   = useState(true)
  const [showPicker,     setShowPicker]     = useState(false)
  const [editingId,      setEditingId]      = useState(null)
  const [loadingBulk,    setLoadingBulk]    = useState(false)

  useEffect(() => {
    api.getFridge().then(data => {
      setFridge(data.items)
      setFamilyGroupId(data.familyGroupId || null)
      if (data.familyMemberCount != null) setFamilyCount(data.familyMemberCount)
    }).catch(() => {})
    api.getIngredients().then(setAllIngredients).catch(() => {})
    api.getTelegramLinkStatus().then(d => setTelegramLinked(d.linked)).catch(() => setTelegramLinked(false))
  }, [])

  // ── Derived ──────────────────────────────────────────────────────
  const fridgeIds = useMemo(() => new Set(fridge.map(f => f.ingredientId)), [fridge])

  const grouped = useMemo(() => groupByCat(fridge), [fridge])

  const orderedCats = useMemo(
    () => CAT_ORDER.filter(c => grouped[c]?.length),
    [grouped]
  )

  const total = fridge.length
  const basic = fridge.filter(i => i.isBasic).length

  // ── Handlers ─────────────────────────────────────────────────────
  async function handleBulkAdd(ids) {
    if (!ids.length) return
    setLoadingBulk(true)
    try {
      await api.bulkAddFridge(ids)
      const added = allIngredients.filter(i => ids.includes(i.id))
      added.forEach(ing => addToFridge({
        ingredientId: ing.id,
        name:         ing.nameRu,
        emoji:        ing.emoji,
        category:     ing.category,
        isBasic:      ing.isBasic || false,
      }))
      show(`Добавлено: ${added.map(i => i.nameRu).join(', ')}`, 'success')
      setShowPicker(false)
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setLoadingBulk(false)
    }
  }

  async function removeItem(ingredientId, name) {
    try {
      await api.removeFromFridge(ingredientId)
      removeFromFridge(ingredientId)
      show(`${name} убран`, 'success')
    } catch (e) { show(e.message, 'error') }
  }

  async function saveQuantity(ingredientId, qty, unit) {
    try {
      const quantityValue = qty !== '' ? Number(qty) : null
      const quantityUnit  = quantityValue != null ? unit : null
      await api.updateFridgeItem(ingredientId, { quantityValue, quantityUnit })
      updateFridgeItem(ingredientId, { quantityValue, quantityUnit })
      setEditingId(null)
    } catch (e) { show(e.message, 'error') }
  }

  async function clearAll() {
    if (!confirm('Очистить холодильник?')) return
    try {
      await api.clearFridge()
      setFridge([])
      show('Холодильник очищен', 'success')
    } catch (e) { show(e.message, 'error') }
  }

  function goAICook() {
    navigate('/chat?prompt=' + encodeURIComponent('Что можно приготовить из продуктов в моём холодильнике?'))
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="pb-28">
      <PageHeader title="Холодильник" />

      {telegramLinked === false && tgBannerOpen && (
        <TelegramBanner
          onLinked={() => { setTelegramLinked(true); show('Telegram подключён!', 'success') }}
          onError={(msg) => show(msg, 'error')}
          onClose={() => setTgBannerOpen(false)}
        />
      )}

      {familyGroupId && <FamilyBanner count={familyCount} />}

      {total === 0 ? (
        <FridgeEmpty onAdd={() => setShowPicker(true)} />
      ) : (
        <>
          <FridgeMetaStrip total={total} basic={basic} />
          <AICookCTA onClick={goAICook} />

          {orderedCats.map(cat => (
            <CategoryBlock
              key={cat}
              cat={cat}
              items={grouped[cat]}
              editingId={editingId}
              setEditingId={setEditingId}
              onDelete={removeItem}
              onSave={saveQuantity}
            />
          ))}

          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 text-[12.5px] text-text-3"
            >
              <Trash2 size={13} strokeWidth={1.8} />
              Очистить всё
            </button>
          </div>
        </>
      )}

      {/* FAB */}
      {total > 0 && !showPicker && (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="fixed bottom-[76px] right-4 h-12 px-4 rounded-full flex items-center gap-2
            bg-accent text-white text-[13.5px] font-bold z-40 active:scale-95 transition-transform"
          style={{ boxShadow: '0 8px 24px rgba(196,112,74,0.45)' }}
          aria-label="Добавить продукты"
        >
          <Plus size={16} strokeWidth={2.4} />
          Добавить
        </button>
      )}

      <PickerSheet
        open={showPicker}
        onClose={() => setShowPicker(false)}
        allIngredients={allIngredients}
        fridgeIds={fridgeIds}
        onAdd={handleBulkAdd}
        loading={loadingBulk}
      />

      {Toast}
    </div>
  )
}
