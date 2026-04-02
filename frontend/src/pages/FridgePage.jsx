import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { useToast } from '../hooks/useToast.jsx'
import { UNITS } from '../constants'

function TelegramBanner({ onLinked }) {
  const [status, setStatus] = useState('idle') // idle | loading | polling
  const pollRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  async function connect() {
    setStatus('loading')
    try {
      const { token, botUsername, already_linked } = await api.getTelegramLinkToken()
      if (already_linked) { onLinked(); return }
      if (!botUsername) {
        alert('Имя бота не настроено на сервере (TELEGRAM_BOT_USERNAME). Спросите администратора.')
        setStatus('idle')
        return
      }
      window.open(`https://t.me/${botUsername}?start=link_${token}`, '_blank')
      setStatus('polling')

      pollRef.current = setInterval(async () => {
        try {
          const d = await api.getTelegramLinkStatus()
          if (d.linked) {
            clearInterval(pollRef.current)
            onLinked()
          }
        } catch {}
      }, 3000)

      // Остановить поллинг через 3 минуты
      timeoutRef.current = setTimeout(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; setStatus('idle') }
      }, 180_000)
    } catch {
      setStatus('idle')
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '12px 14px', marginBottom: 16,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>🤖</span>
      <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1, lineHeight: 1.4 }}>
        Подключите бота — управляйте холодильником в Telegram
      </span>
      <button
        className="btn btn-primary btn-sm"
        style={{ flexShrink: 0, fontSize: 12 }}
        onClick={connect}
        disabled={status !== 'idle'}
      >
        {status === 'loading' ? '...' : status === 'polling' ? 'Ожидание...' : 'Подключить'}
      </button>
    </div>
  )
}

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

// Порядок категорий в пикере (самые нужные вверху)
const CAT_ORDER = ['meat', 'dairy', 'protein', 'vegetable', 'fruit', 'grain', 'legume', 'pantry', 'oil', 'herb', 'spice', 'other']

function GuestFridgeBlock() {
  const navigate = useNavigate()
  return (
    <div>
      <div className="top-bar">
        <span className="top-bar-logo">🧊 Холодильник</span>
      </div>
      <div className="page" style={{ paddingTop: 40 }}>
        <div className="empty-state">
          <div className="empty-icon">🧊</div>
          <h3>Холодильник для участников</h3>
          <p style={{ lineHeight: 1.6 }}>
            Сохраняйте продукты в холодильнике — ИИ-помощник будет предлагать блюда именно из того, что у вас есть дома.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 20, width: '100%' }}
            onClick={() => navigate('/auth?mode=register')}>
            Зарегистрироваться бесплатно
          </button>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: 'var(--text2)' }}
            onClick={() => navigate('/auth')}>
            Уже есть аккаунт? Войти
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FridgePage() {
  const { token } = useStore()
  if (!token) return <GuestFridgeBlock />

  const [allIngredients, setAllIngredients] = useState([])
  const [search, setSearch]                 = useState('')
  const [showPicker, setShowPicker]         = useState(false)
  const [pendingIds, setPendingIds]         = useState(new Set())
  const [loadingBulk, setLoadingBulk]       = useState(false)
  const [familyGroupId, setFamilyGroupId]   = useState(null)
  const [telegramLinked, setTelegramLinked] = useState(null) // null = ещё не проверено (баннер скрыт)
  const [editingId, setEditingId]           = useState(null) // ingredientId редактируемого item
  const [editQty, setEditQty]               = useState('')
  const [editUnit, setEditUnit]             = useState(UNITS[0])
  const { fridge, setFridge, addToFridge, removeFromFridge, updateFridgeItem } = useStore()
  const { show, Toast } = useToast()

  useEffect(() => {
    api.getFridge().then(data => {
      setFridge(data.items)
      setFamilyGroupId(data.familyGroupId || null)
    }).catch(() => {})
    api.getIngredients().then(setAllIngredients).catch(() => {})
    api.getTelegramLinkStatus().then(d => setTelegramLinked(d.linked)).catch(() => setTelegramLinked(false))
  }, [])

  // ID продуктов которые уже в холодильнике
  const fridgeIds = useMemo(() => new Set(fridge.map(f => f.ingredientId)), [fridge])

  // Ингредиенты не в холодильнике
  const available = useMemo(
    () => allIngredients.filter(ing => !fridgeIds.has(ing.id)),
    [allIngredients, fridgeIds]
  )

  // Поиск (только когда есть текст)
  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return available.filter(ing => ing.nameRu.toLowerCase().includes(q))
  }, [available, search])

  // Группировка для пикера (без поиска)
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

  // Группировка холодильника для отображения
  const grouped = useMemo(() => {
    return fridge.reduce((acc, item) => {
      const cat = item.category || 'other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})
  }, [fridge])

  function togglePending(id) {
    setPendingIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
        ingredientId: ing.id,
        name:         ing.nameRu,
        emoji:        ing.emoji,
        category:     ing.category,
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

  const pendingCount = pendingIds.size

  return (
    <div>
      <div className="top-bar">
        <span className="top-bar-logo">🧊 {familyGroupId ? 'Семейный холодильник' : 'Холодильник'}</span>
        <div style={{ flex: 1 }} />
        {fridge.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ color: 'var(--text3)' }}>Очистить</button>
        )}
        <button className="btn btn-primary btn-sm" onClick={() => setShowPicker(true)}>+ Добавить</button>
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        {telegramLinked === false && (
          <TelegramBanner onLinked={() => { setTelegramLinked(true); show('Telegram подключён! 🎉', 'success') }} />
        )}
        {fridge.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧊</div>
            <h3>Холодильник пустой</h3>
            <p>Добавьте продукты — ИИ найдёт блюда из того, что есть дома</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowPicker(true)}>
              + Добавить продукты
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              {fridge.length} {fridge.length === 1 ? 'продукт' : fridge.length < 5 ? 'продукта' : 'продуктов'}
              {familyGroupId && <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 600 }}>· Общий с семьёй</span>}
            </p>
            {CAT_ORDER.filter(cat => grouped[cat]).map(cat => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                  {CAT_RU[cat] || cat}
                </p>
                <div className="fridge-grid">
                  {grouped[cat].map(item => (
                    <div key={item.ingredientId} className="fridge-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.emoji && <span>{item.emoji}</span>}
                        <span
                          style={{ flex: 1, cursor: 'pointer' }}
                          onClick={() => editingId === item.ingredientId ? setEditingId(null) : startEdit(item)}
                        >
                          {item.name}
                          {item.quantityValue != null && (
                            <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 4 }}>
                              · {item.quantityValue} {item.quantityUnit}
                            </span>
                          )}
                        </span>
                        <button className="remove-btn" onClick={() => removeItem(item.ingredientId, item.name)}>×</button>
                      </div>
                      {editingId === item.ingredientId && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <input
                            type="number"
                            min="0"
                            className="input"
                            style={{ flex: 1, padding: '4px 8px', fontSize: 13 }}
                            placeholder="Кол-во"
                            value={editQty}
                            onChange={e => setEditQty(e.target.value)}
                            autoFocus
                          />
                          <select
                            className="input"
                            style={{ width: 80, padding: '4px 6px', fontSize: 12, appearance: 'auto' }}
                            value={editUnit}
                            onChange={e => setEditUnit(e.target.value)}
                          >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px' }} onClick={() => saveEdit(item.ingredientId)}>✓</button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }} onClick={() => setEditingId(null)}>✕</button>
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

      {showPicker && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closePicker()}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Что у вас есть?</h3>

            {/* Поиск */}
            <div className="input-group" style={{ marginBottom: 4 }}>
              <span className="input-icon">🔍</span>
              <input
                className="input"
                placeholder="Найти продукт..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {search.trim() ? (
              /* Результаты поиска */
              <div style={{ marginTop: 12 }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>Ничего не найдено</div>
                ) : (
                  <div className="ing-picker-list">
                    {searchResults.map(ing => {
                      const sel = pendingIds.has(ing.id)
                      return (
                        <div
                          key={ing.id}
                          className={`ing-picker-item${sel ? ' selected' : ''}`}
                          onClick={() => togglePending(ing.id)}
                        >
                          {ing.emoji && <span style={{ fontSize: 18 }}>{ing.emoji}</span>}
                          <span style={{ flex: 1 }}>{ing.nameRu}</span>
                          <span style={{ fontSize: 18, color: sel ? 'var(--accent)' : 'var(--text3)', fontWeight: 700 }}>
                            {sel ? '✓' : '+'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Чипы по категориям */
              <div style={{ marginTop: 8 }}>
                {groupedAvailable.length === 0 ? (
                  <p style={{ color: 'var(--text2)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                    Все продукты уже в холодильнике 🎉
                  </p>
                ) : groupedAvailable.map(({ cat, items }) => (
                  <div key={cat}>
                    <div className="picker-cat-label">{CAT_RU[cat] || cat}</div>
                    <div className="picker-chips">
                      {items.map(ing => {
                        const sel = pendingIds.has(ing.id)
                        return (
                          <button
                            key={ing.id}
                            className={`picker-chip${sel ? ' selected' : ''}`}
                            onClick={() => togglePending(ing.id)}
                          >
                            {ing.emoji && <span className="picker-chip-emoji">{ing.emoji}</span>}
                            {ing.nameRu}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Кнопка добавить */}
            <div className="picker-add-bar">
              {pendingCount > 0 ? (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={addPending}
                  disabled={loadingBulk}
                >
                  {loadingBulk
                    ? <span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    : `Добавить ${pendingCount} ${pendingCount === 1 ? 'продукт' : pendingCount < 5 ? 'продукта' : 'продуктов'}`
                  }
                </button>
              ) : (
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={closePicker}>
                  Готово
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {Toast}
    </div>
  )
}
