import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { useToast } from '../hooks/useToast.jsx'

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
  const [search, setSearch] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [loadingAdd, setLoadingAdd] = useState(null)
  const [familyGroupId, setFamilyGroupId] = useState(null)
  const { fridge, setFridge, addToFridge, removeFromFridge } = useStore()
  const { show, Toast } = useToast()

  useEffect(() => {
    api.getFridge().then(data => {
      setFridge(data.items)
      setFamilyGroupId(data.familyGroupId || null)
    }).catch(()=>{})
    api.getIngredients().then(setAllIngredients).catch(()=>{})
  }, [])

  const filtered = allIngredients.filter(ing =>
    ing.nameRu.toLowerCase().includes(search.toLowerCase()) &&
    !fridge.find(f => f.ingredientId === ing.id)
  )

  const grouped = fridge.reduce((acc, item) => {
    const cat = item.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const CAT_RU = { dairy:'🥛 Молочное', protein:'🥚 Белки', vegetable:'🥕 Овощи', fruit:'🍎 Фрукты', grain:'🌾 Злаки', meat:'🥩 Мясо', spice:'🌶 Специи', herb:'🌿 Зелень', oil:'🫒 Масла', pantry:'🥫 Кладовая', legume:'🫘 Бобовые', other:'📦 Остальное' }

  async function addItem(ing) {
    setLoadingAdd(ing.id)
    try {
      const item = await api.addToFridge(ing.id)
      addToFridge({ ...item, category: ing.category })
      show(`${ing.emoji || ''} ${ing.nameRu} добавлен`, 'success')
    } catch (e) { show(e.message, 'error') }
    finally { setLoadingAdd(null) }
  }

  async function removeItem(ingredientId, name) {
    try {
      await api.removeFromFridge(ingredientId)
      removeFromFridge(ingredientId)
      show(`${name} убран`, 'success')
    } catch (e) { show(e.message, 'error') }
  }

  async function clearAll() {
    if (!confirm('Очистить холодильник?')) return
    await api.clearFridge()
    setFridge([])
    show('Холодильник очищен', 'success')
  }

  return (
    <div>
      <div className="top-bar">
        <span className="top-bar-logo">🧊 {familyGroupId ? 'Семейный холодильник' : 'Холодильник'}</span>
        <div style={{flex:1}}/>
        {fridge.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{color:'var(--text3)'}}>Очистить</button>
        )}
        <button className="btn btn-primary btn-sm" onClick={() => setShowPicker(true)}>+ Добавить</button>
      </div>

      <div className="page" style={{paddingTop:16}}>
        {fridge.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧊</div>
            <h3>Холодильник пустой</h3>
            <p>Добавьте продукты чтобы находить блюда из того, что есть дома</p>
            <button className="btn btn-primary" style={{marginTop:16}} onClick={() => setShowPicker(true)}>
              + Добавить продукты
            </button>
          </div>
        ) : (
          <>
            <p style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>
              {fridge.length} {fridge.length===1?'продукт':fridge.length<5?'продукта':'продуктов'} в холодильнике
              {familyGroupId && <span style={{marginLeft:8,color:'var(--accent)',fontWeight:600}}>· Общий с семьёй</span>}
            </p>
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{marginBottom:20}}>
                <p style={{fontSize:12,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>
                  {CAT_RU[cat] || cat}
                </p>
                <div className="fridge-grid">
                  {items.map(item => (
                    <div key={item.ingredientId} className="fridge-item">
                      {item.emoji && <span>{item.emoji}</span>}
                      <span>{item.name}</span>
                      <button className="remove-btn" onClick={() => removeItem(item.ingredientId, item.name)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {showPicker && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowPicker(false)}>
          <div className="modal-sheet">
            <div className="modal-handle"/>
            <h3 style={{fontSize:18,fontWeight:800,marginBottom:14}}>Добавить продукты</h3>
            <div className="input-group" style={{marginBottom:12}}>
              <span className="input-icon">🔍</span>
              <input className="input" placeholder="Найти продукт..." value={search}
                onChange={e => setSearch(e.target.value)} autoFocus/>
            </div>
            <div className="ing-picker-list">
              {filtered.length === 0 ? (
                <div style={{padding:20,textAlign:'center',color:'var(--text2)',fontSize:13}}>Ничего не найдено</div>
              ) : filtered.map(ing => (
                <div key={ing.id} className="ing-picker-item"
                  onClick={() => addItem(ing)}>
                  {ing.emoji && <span style={{fontSize:18}}>{ing.emoji}</span>}
                  <span style={{flex:1}}>{ing.nameRu}</span>
                  {loadingAdd === ing.id
                    ? <span className="loader" style={{width:14,height:14}}/>
                    : <span style={{color:'var(--accent)',fontWeight:700,fontSize:18}}>+</span>
                  }
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{width:'100%',marginTop:12}}
              onClick={() => setShowPicker(false)}>
              Готово
            </button>
          </div>
        </div>
      )}
      {Toast}
    </div>
  )
}
