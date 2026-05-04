// DishIngredientPicker — bottom-sheet выбора ингредиентов для DishFormPage.
// Визуал из context/design/dish-form-v2.jsx: handle, поиск pill, chips категорий, grid карточек.
// Логика: реальный API getIngredients (из props), createIngredient, поиск по nameRu.

import { useMemo, useState } from 'react'
import { Search, X, Check, Plus } from 'lucide-react'
import { api } from '../../api'
import { ING_CATEGORIES } from '../../constants'

// Категории для chips (с пунктом «Все»)
const CHIP_CATEGORIES = [{ value: 'all', label: 'Все' }, ...ING_CATEGORIES]

export default function DishIngredientPicker({
  allIngredients,
  selected,
  onAdd,
  onIngredientCreated,
  onClose,
  show,
}) {
  const [query, setQuery]             = useState('')
  const [cat, setCat]                 = useState('all')
  const [showCustom, setShowCustom]   = useState(false)
  const [newIng, setNewIng]           = useState({ nameRu: '', category: '' })
  const [adding, setAdding]           = useState(false)

  const selectedIds = useMemo(() => new Set(selected.map(s => s.id)), [selected])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allIngredients.filter(ing => {
      if (cat !== 'all' && ing.category !== cat) return false
      if (selectedIds.has(ing.id)) return false  // уже добавленные не показываем
      if (q && !ing.nameRu.toLowerCase().includes(q)) return false
      return true
    })
  }, [allIngredients, query, cat, selectedIds])

  function handlePick(ing) {
    onAdd(ing)
    setQuery('')
  }

  async function handleCreateCustom() {
    const name = newIng.nameRu.trim()
    if (!name || !newIng.category) {
      show?.('Укажите название и категорию', 'error')
      return
    }
    setAdding(true)
    try {
      const created = await api.createIngredient({ nameRu: name, category: newIng.category })
      onIngredientCreated(created)
      onAdd(created)
      setNewIng({ nameRu: '', category: '' })
      setShowCustom(false)
      setQuery('')
      show?.(`«${created.nameRu}» добавлен`, 'success')
    } catch (e) {
      show?.(e.message, 'error')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(28,25,23,0.45)' }}>
      {/* tap-to-close */}
      <button
        type="button"
        onClick={onClose}
        className="flex-1"
        aria-label="Закрыть"
      />

      {/* sheet */}
      <div
        className="bg-bg-2 px-5 pt-3 pb-6 flex flex-col"
        style={{
          maxHeight: '85dvh',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* handle */}
        <div className="flex justify-center mb-3 shrink-0">
          <div className="rounded-full bg-border" style={{ width: 40, height: 4 }} />
        </div>

        {/* header */}
        <div className="flex items-center justify-between shrink-0 mb-4">
          <h2 className="text-[17px] font-bold text-text">Добавить ингредиент</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-3 text-text-2"
            aria-label="Закрыть"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* search */}
        <div className="shrink-0 mb-3">
          <div className="flex items-center gap-2 h-11 px-4 rounded-full bg-bg-2 border border-border">
            <Search size={16} strokeWidth={2} className="text-text-3" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск ингредиента…"
              className="flex-1 bg-transparent outline-none text-[14px] text-text"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="w-5 h-5 rounded-full flex items-center justify-center bg-border text-text-2"
                aria-label="Очистить"
              >
                <X size={11} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>

        {/* category chips */}
        <div className="shrink-0 -mx-5 px-5 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-2" style={{ width: 'max-content' }}>
            {CHIP_CATEGORIES.map(c => {
              const on = cat === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCat(c.value)}
                  className={[
                    'h-9 px-3.5 rounded-full text-[13px] font-bold whitespace-nowrap shrink-0 border',
                    on
                      ? 'bg-accent-muted border-accent-border text-accent'
                      : 'bg-bg-2 border-border text-text-2',
                  ].join(' ')}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {showCustom ? (
            <CustomIngredientForm
              value={newIng}
              onChange={setNewIng}
              adding={adding}
              onSubmit={handleCreateCustom}
              onCancel={() => { setShowCustom(false); setNewIng({ nameRu: '', category: '' }) }}
            />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="text-[13px] mb-3 text-text-3">
                {query ? `Не найдено «${query}»` : 'Ничего не найдено'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCustom(true)
                  setNewIng({ nameRu: query, category: '' })
                }}
                className="h-10 px-4 rounded-full bg-accent-muted text-accent border border-accent-border
                  text-[13px] font-bold flex items-center gap-1.5"
              >
                <Plus size={14} strokeWidth={2.4} />
                Создать «{query || 'свой ингредиент'}»
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {filtered.map(ing => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => handlePick(ing)}
                    className="rounded-xl bg-bg-2 border border-border p-2.5 flex items-center gap-2 text-left
                      active:bg-accent-muted active:border-accent-border transition-colors"
                  >
                    {ing.emoji && <span className="text-[16px] shrink-0">{ing.emoji}</span>}
                    <span className="text-[13px] font-semibold flex-1 truncate text-text">
                      {ing.nameRu}
                    </span>
                    {!ing.isPublic && (
                      <span className="text-[10.5px] font-bold text-accent shrink-0">мой</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { setShowCustom(true); setNewIng({ nameRu: '', category: '' }) }}
                className="w-full mt-3 h-10 rounded-full bg-bg-2 border border-border
                  flex items-center justify-center gap-1.5 text-[13px] font-bold text-accent"
              >
                <Plus size={14} strokeWidth={2.4} />
                Нет нужного? Добавить свой
              </button>
            </>
          )}
        </div>

        {/* footer */}
        <div className="pt-3 mt-3 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-full bg-accent text-white text-[14px] font-bold"
            style={{ boxShadow: '0 6px 18px rgba(196,112,74,0.35)' }}
          >
            Готово
            {selected.length > 0 && (
              <span className="ml-1 tabular-nums opacity-85">· {selected.length} выбрано</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Custom ingredient form ───────────────────────────────────────
function CustomIngredientForm({ value, onChange, adding, onSubmit, onCancel }) {
  return (
    <div className="rounded-2xl bg-bg-3 border border-accent p-4 flex flex-col gap-3">
      <div className="text-[12px] text-text-2 leading-relaxed" style={{ textWrap: 'pretty' }}>
        Ваш ингредиент будет виден только вам. После проверки может стать публичным.
      </div>

      <input
        autoFocus
        value={value.nameRu}
        onChange={e => onChange({ ...value, nameRu: e.target.value })}
        placeholder="Название ингредиента"
        className="w-full h-11 px-4 rounded-full bg-bg-2 border border-border
          text-[14.5px] text-text placeholder:text-text-3 outline-none focus:border-accent"
      />

      <select
        value={value.category}
        onChange={e => onChange({ ...value, category: e.target.value })}
        className="w-full h-11 px-4 rounded-full bg-bg-2 border border-border
          text-[14.5px] text-text outline-none focus:border-accent"
        style={{ appearance: 'none', WebkitAppearance: 'none' }}
      >
        <option value="">Категория…</option>
        {ING_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={adding}
          className="flex-1 h-11 rounded-full bg-accent text-white text-[14px] font-bold
            flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {adding ? '...' : (
            <>
              <Check size={14} strokeWidth={2.4} />
              Добавить
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-4 rounded-full bg-bg-2 border border-border text-text-2 text-[13px] font-bold"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
