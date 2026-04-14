import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { UNITS } from '../constants'
import { Button, EmptyState, Modal, SearchInput, useToast } from '../components/ui'

// ─── Constants ───────────────────────────────────────────────────────────────
const CAT_RU = {
  dairy:     '🥛 Молочное',
  protein:   '🥚 Белки',
  vegetable: '🥕 Овощи',
  fruit:     '🍎 Фрукты',
  grain:     '🌾 Злаки',
  meat:      '🥩 Мясо',
  spice:     '🌶 Специи',
  herb:      '🌿 Зелень',
  oil:       '🫒 Масла',
  pantry:    '🥫 Кладовая',
  legume:    '🫘 Бобовые',
  other:     '📦 Остальное',
}

const CAT_ORDER = [
  'meat', 'dairy', 'protein', 'vegetable', 'fruit',
  'grain', 'legume', 'pantry', 'oil', 'herb', 'spice', 'other',
]

// ─── Telegram banner ─────────────────────────────────────────────────────────
function TelegramBanner({ onLinked, onError }) {
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
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; setStatus('idle') }
      }, 180_000)
    } catch (err) {
      setStatus('idle')
      onError?.(err.message || 'Не удалось получить ссылку')
    }
  }

  const label = status === 'loading' ? '...' : status === 'polling' ? 'Ожидание...' : 'Подключить'

  return (
    <div className="flex items-center gap-3 bg-bg-2 border border-border rounded-sm px-3.5 py-3 mb-4">
      <span className="text-[22px] shrink-0">🤖</span>
      <span className="text-[13px] text-text-2 flex-1 leading-snug">
        Подключите бота — управляйте холодильником в Telegram
      </span>
      <Button size="sm" onClick={connect} disabled={status !== 'idle'} className="shrink-0 text-xs">
        {label}
      </Button>
    </div>
  )
}

// ─── Guest block ─────────────────────────────────────────────────────────────
function GuestFridgeBlock() {
  const navigate = useNavigate()
  return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-bg/95 backdrop-blur-md border-b border-border flex items-center px-4 max-w-app mx-auto">
        <span className="font-serif text-[17px] font-bold">🧊 Холодильник</span>
      </div>
      <div className="pt-[52px]">
        <EmptyState
          icon="🧊"
          title="Готовь из того, что есть дома"
          description="Добавь продукты из холодильника — MealBot подберёт блюда, которые можно приготовить прямо сейчас."
          action={
            <div className="flex flex-col gap-2 w-full px-4">
              <Button className="w-full" onClick={() => navigate('/auth?mode=register')}>
                Создать свою кухню
              </Button>
              <Button variant="ghost" size="sm" className="text-text-2"
                onClick={() => navigate('/auth')}>
                Уже есть аккаунт? Войти
              </Button>
            </div>
          }
        />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FridgePage() {
  const { token } = useStore()
  if (!token) return <GuestFridgeBlock />

  const { fridge, setFridge, addToFridge, removeFromFridge, updateFridgeItem } = useStore()
  const { show, Toast } = useToast()
  const navigate = useNavigate()

  const [allIngredients, setAllIngredients] = useState([])
  const [familyGroupId, setFamilyGroupId]   = useState(null)
  const [telegramLinked, setTelegramLinked] = useState(null)
  const [showPicker, setShowPicker]         = useState(false)
  const [search, setSearch]                 = useState('')
  const [pendingIds, setPendingIds]         = useState(new Set())
  const [loadingBulk, setLoadingBulk]       = useState(false)
  const [editingId, setEditingId]           = useState(null)
  const [editQty, setEditQty]               = useState('')
  const [editUnit, setEditUnit]             = useState(UNITS[0])

  useEffect(() => {
    api.getFridge().then(data => {
      setFridge(data.items)
      setFamilyGroupId(data.familyGroupId || null)
    }).catch(() => {})
    api.getIngredients().then(setAllIngredients).catch(() => {})
    api.getTelegramLinkStatus().then(d => setTelegramLinked(d.linked)).catch(() => setTelegramLinked(false))
  }, [])

  // ── Derived ─────────────────────────────────────────────────────────────
  const fridgeIds = useMemo(() => new Set(fridge.map(f => f.ingredientId)), [fridge])

  const available = useMemo(
    () => allIngredients.filter(ing => !fridgeIds.has(ing.id)),
    [allIngredients, fridgeIds]
  )

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return available.filter(ing => ing.nameRu.toLowerCase().includes(q))
  }, [available, search])

  const groupedAvailable = useMemo(() => {
    const groups = {}
    for (const ing of available) {
      const cat = ing.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(ing)
    }
    return CAT_ORDER
      .filter(cat => groups[cat]?.length > 0)
      .map(cat => ({ cat, items: groups[cat] }))
  }, [available])

  const grouped = useMemo(() => fridge.reduce((acc, item) => {
    const cat = item.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {}), [fridge])

  // ── Handlers ────────────────────────────────────────────────────────────
  function togglePending(id) {
    setPendingIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function closePicker() {
    setShowPicker(false)
    setSearch('')
    setPendingIds(new Set())
  }

  async function addPending() {
    if (pendingIds.size === 0) return
    setLoadingBulk(true)
    try {
      const ids = [...pendingIds]
      await api.bulkAddFridge(ids)
      const added = allIngredients.filter(i => ids.includes(i.id))
      added.forEach(ing => addToFridge({
        ingredientId: ing.id, name: ing.nameRu, emoji: ing.emoji, category: ing.category,
      }))
      show(`Добавлено: ${added.map(i => i.nameRu).join(', ')}`, 'success')
      closePicker()
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

  function startEdit(item) {
    setEditingId(item.ingredientId)
    setEditQty(item.quantityValue != null ? String(item.quantityValue) : '')
    setEditUnit(item.quantityUnit || UNITS[0])
  }

  async function saveEdit(ingredientId) {
    try {
      const quantityValue = editQty !== '' ? Number(editQty) : null
      const quantityUnit  = quantityValue != null ? editUnit : null
      await api.updateFridgeItem(ingredientId, { quantityValue, quantityUnit })
      updateFridgeItem(ingredientId, { quantityValue, quantityUnit })
      setEditingId(null)
    } catch (e) { show(e.message, 'error') }
  }

  async function clearAll() {
    if (!confirm('Очистить холодильник?')) return
    await api.clearFridge()
    setFridge([])
    show('Холодильник очищен', 'success')
  }

  function plural(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'продукт'
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'продукта'
    return 'продуктов'
  }

  const pendingCount = pendingIds.size

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-bg/95 backdrop-blur-md border-b border-border flex items-center px-3 gap-2 max-w-app mx-auto">
        <span className="font-serif text-[17px] font-bold flex-1">
          🧊 {familyGroupId ? 'Семейный холодильник' : 'Холодильник'}
        </span>
        {fridge.length > 0 && (
          <Button variant="ghost" size="sm" className="text-text-3" onClick={clearAll}>Очистить</Button>
        )}
        <Button size="sm" onClick={() => setShowPicker(true)}>+ Добавить</Button>
      </div>

      <div className="pt-[68px] pb-8 px-4">
        {/* Telegram banner */}
        {telegramLinked === false && (
          <TelegramBanner
            onLinked={() => { setTelegramLinked(true); show('Telegram подключён!', 'success') }}
            onError={(msg) => show(msg, 'error')}
          />
        )}

        {fridge.length === 0 ? (
          <EmptyState
            icon="🧊"
            title="Холодильник пустой"
            description="Добавь продукты которые есть дома — и мы покажем что можно приготовить прямо сейчас"
            action={
              <Button onClick={() => setShowPicker(true)}>+ Добавить продукты</Button>
            }
          />
        ) : (
          <>
            {/* Summary row */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <p className="text-[13px] text-text-2">
                {fridge.length} {plural(fridge.length)}
                {familyGroupId && (
                  <span className="ml-2 text-accent font-semibold">· Общий с семьёй</span>
                )}
              </p>
              <Button
                variant="secondary" size="sm" className="ml-auto"
                onClick={() => navigate('/chat?prompt=' + encodeURIComponent('Что можно приготовить из продуктов в моём холодильнике?'))}
              >
                ✨ Что приготовить?
              </Button>
            </div>

            {/* Basic ingredients hint */}
            {fridge.some(i => i.isBasic) && (
              <div className="bg-bg-2 border border-border rounded-sm px-3 py-2 mb-4 text-xs text-text-3 leading-relaxed">
                🧂 Продукты с меткой <strong>базовый</strong> всегда считаются доступными при подборе блюд.
              </div>
            )}

            {/* Fridge items grouped by category */}
            {CAT_ORDER.filter(cat => grouped[cat]).map(cat => (
              <div key={cat} className="mb-5">
                <p className="text-2xs font-bold text-text-2 uppercase tracking-widest mb-2.5">
                  {CAT_RU[cat] || cat}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {grouped[cat].map(item => (
                    <div
                      key={item.ingredientId}
                      className={[
                        'flex flex-col bg-bg-2 border rounded-sm px-3 py-2.5',
                        item.isBasic ? 'border-accent/40 bg-accent/4' : 'border-border',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.emoji && <span className="shrink-0">{item.emoji}</span>}
                        <button
                          type="button"
                          className="flex-1 text-left text-[13px] font-semibold truncate"
                          onClick={() => editingId === item.ingredientId ? setEditingId(null) : startEdit(item)}
                        >
                          {item.name}
                        </button>
                        <button
                          type="button"
                          className="text-text-3 hover:text-red-400 text-base leading-none shrink-0"
                          onClick={() => removeItem(item.ingredientId, item.name)}
                        >×</button>
                      </div>

                      {/* Badges row */}
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {item.isBasic && (
                          <span className="text-2xs text-text-3 bg-bg-3 rounded px-1.5 py-0.5">базовый</span>
                        )}
                        {item.quantityValue != null && (
                          <span className="text-2xs text-text-3">
                            {item.quantityValue} {item.quantityUnit}
                          </span>
                        )}
                      </div>

                      {/* Inline quantity editor */}
                      {editingId === item.ingredientId && (
                        <div className="flex gap-1.5 mt-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Кол-во"
                            value={editQty}
                            onChange={e => setEditQty(e.target.value)}
                            autoFocus
                            className="flex-1 min-w-0 text-xs bg-bg-3 border border-border rounded-sm px-2 py-1 outline-none focus:border-accent"
                          />
                          <select
                            value={editUnit}
                            onChange={e => setEditUnit(e.target.value)}
                            className="w-16 text-xs bg-bg-3 border border-border rounded-sm px-1 py-1 outline-none focus:border-accent"
                          >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <button
                            type="button"
                            className="px-2 py-1 bg-accent text-white text-xs rounded-sm font-bold"
                            onClick={() => saveEdit(item.ingredientId)}
                          >✓</button>
                          <button
                            type="button"
                            className="px-2 py-1 text-text-3 text-xs rounded-sm"
                            onClick={() => setEditingId(null)}
                          >✕</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ─── Picker modal ─── */}
      {showPicker && (
        <Modal title="Что у вас есть?" onClose={closePicker}>
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Найти продукт..."
            className="mb-3"
          />

          {search.trim() ? (
            /* Search results */
            <div className="max-h-72 overflow-y-auto flex flex-col divide-y divide-border">
              {searchResults.length === 0 ? (
                <p className="py-5 text-center text-[13px] text-text-2">Ничего не найдено</p>
              ) : searchResults.map(ing => {
                const sel = pendingIds.has(ing.id)
                return (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => togglePending(ing.id)}
                    className={[
                      'flex items-center gap-2.5 px-2 py-2.5 text-left transition-colors',
                      sel ? 'bg-accent/8' : 'hover:bg-bg-3',
                    ].join(' ')}
                  >
                    {ing.emoji && <span className="text-lg shrink-0">{ing.emoji}</span>}
                    <span className="flex-1 text-sm">{ing.nameRu}</span>
                    <span className={['text-lg font-bold', sel ? 'text-accent' : 'text-text-3'].join(' ')}>
                      {sel ? '✓' : '+'}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            /* Grouped chips */
            <div className="max-h-[60dvh] overflow-y-auto">
              {groupedAvailable.length === 0 ? (
                <p className="py-5 text-center text-[13px] text-text-2">
                  Все продукты уже в холодильнике 🎉
                </p>
              ) : groupedAvailable.map(({ cat, items }) => (
                <div key={cat} className="mb-3">
                  <p className="text-2xs font-bold text-text-2 uppercase tracking-widest mb-2">
                    {CAT_RU[cat] || cat}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map(ing => {
                      const sel = pendingIds.has(ing.id)
                      return (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => togglePending(ing.id)}
                          className={[
                            'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all',
                            sel
                              ? 'bg-accent/15 border-accent text-accent'
                              : 'bg-bg-3 border-border text-text-2 hover:border-accent',
                          ].join(' ')}
                        >
                          {ing.emoji && <span>{ing.emoji}</span>}
                          {ing.nameRu}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action button */}
          <div className="mt-4 pt-3 border-t border-border">
            {pendingCount > 0 ? (
              <Button className="w-full" loading={loadingBulk} onClick={addPending}>
                {!loadingBulk && `Добавить ${pendingCount} ${plural(pendingCount)}`}
              </Button>
            ) : (
              <Button variant="secondary" className="w-full" onClick={closePicker}>
                Готово
              </Button>
            )}
          </div>
        </Modal>
      )}

      {Toast}
    </div>
  )
}
