import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import DishCard from '../components/DishCard'

const CATEGORIES = ['BREAKFAST','LUNCH','DINNER','SOUP','SALAD','SNACK','DESSERT','DRINK']
const CAT_RU = { BREAKFAST:'Завтрак',LUNCH:'Обед',DINNER:'Ужин',SOUP:'Суп',SALAD:'Салат',SNACK:'Перекус',DESSERT:'Десерт',DRINK:'Напиток' }
const MEAL_TIMES = ['breakfast','lunch','dinner','snack']
const MT_RU = { breakfast:'Завтрак',lunch:'Обед',dinner:'Ужин',snack:'Перекус' }
const TAGS = ['быстро','вегетарианское','здоровое','сытное','без глютена','традиционное']

export default function DishesPage() {
  const [dishes, setDishes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [category, setCategory] = useState('')
  const [mealTime, setMealTime] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const { fridgeMode, toggleFridgeMode, token } = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Вкладка: 'my' — моя кухня, 'catalog' — шаблоны/все
  const [view, setView] = useState(() => {
    if (searchParams.get('view') === 'catalog') return 'catalog'
    return token ? 'my' : 'catalog'
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getDishes({
        q: q || undefined,
        category: category || undefined,
        mealTime: mealTime || undefined,
        tags: activeTags.length ? activeTags.join(',') : undefined,
        fridgeMode: fridgeMode ? 'true' : undefined,
        myKitchen: (view === 'my' && token) ? 'true' : undefined,
      })
      setDishes(data)
    } catch { setDishes([]) }
    finally { setLoading(false) }
  }, [q, category, mealTime, activeTags, fridgeMode, view, token])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  function toggleTag(t) {
    setActiveTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])
  }

  const hasFilters = category || mealTime || activeTags.length > 0

  return (
    <div>
      <div className="top-bar">
        <span className="top-bar-logo">Блюда</span>
        <div style={{flex:1}}/>
        <button className={`btn btn-icon btn-sm ${showFilters?'active':''}`}
          style={showFilters?{borderColor:'var(--accent)',color:'var(--accent)'}:{}}
          onClick={() => setShowFilters(s=>!s)}>
          🎛 {hasFilters ? `(${(category?1:0)+(mealTime?1:0)+activeTags.length})` : ''}
        </button>
        <div className="toggle-wrap" onClick={toggleFridgeMode} style={{marginLeft:8}}>
          <div className={`toggle ${fridgeMode?'on':''}`} style={{width:32,height:18}}/>
          <span style={{fontSize:12,fontWeight:700,color:fridgeMode?'var(--accent)':'var(--text3)'}}>🧊</span>
        </div>
      </div>

      <div className="page" style={{paddingTop:12}}>
        {token && (
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <button className={`tag ${view==='my'?'active':''}`}
              style={{fontSize:13,padding:'6px 14px'}}
              onClick={() => setView('my')}>
              🏠 Моя кухня
            </button>
            <button className={`tag ${view==='catalog'?'active':''}`}
              style={{fontSize:13,padding:'6px 14px'}}
              onClick={() => setView('catalog')}>
              📚 Шаблоны
            </button>
          </div>
        )}

        <div className="input-group" style={{marginBottom:12}}>
          <span className="input-icon">🔍</span>
          <input className="input" placeholder="Поиск блюд..." value={q} onChange={e=>setQ(e.target.value)}/>
        </div>

        {showFilters && (
          <div className="card fade-up" style={{padding:16,marginBottom:14}}>
            <div style={{marginBottom:12}}>
              <p style={{fontSize:12,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Категория</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {CATEGORIES.map(c => (
                  <button key={c} className={`tag ${category===c?'active':''}`}
                    onClick={() => setCategory(p=>p===c?'':c)}>{CAT_RU[c]}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <p style={{fontSize:12,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Приём пищи</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {MEAL_TIMES.map(m => (
                  <button key={m} className={`tag ${mealTime===m?'active':''}`}
                    onClick={() => setMealTime(p=>p===m?'':m)}>{MT_RU[m]}</button>
                ))}
              </div>
            </div>
            <div>
              <p style={{fontSize:12,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Теги</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {TAGS.map(t => (
                  <button key={t} className={`tag ${activeTags.includes(t)?'active':''}`}
                    onClick={() => toggleTag(t)}>{t}</button>
                ))}
              </div>
            </div>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" style={{marginTop:12,padding:'6px 0'}}
                onClick={() => { setCategory(''); setMealTime(''); setActiveTags([]) }}>
                Сбросить фильтры ✕
              </button>
            )}
          </div>
        )}

        {fridgeMode && (
          <div style={{background:'rgba(45,212,191,.08)',border:'1px solid rgba(45,212,191,.2)',borderRadius:'var(--radius-sm)',padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--teal)'}}>
            🧊 Режим холодильника — только блюда из ваших продуктов
          </div>
        )}

        <p style={{fontSize:13,color:'var(--text2)',marginBottom:12}}>
          {loading ? 'Ищем...' : `Найдено: ${dishes.length}`}
        </p>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:40}}>
            <div className="loader"/>
          </div>
        ) : dishes.length === 0 ? (
          view === 'my' && !q && !hasFilters ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>Ваша кухня пока пуста</h3>
              <p>Добавьте свои блюда или скопируйте из шаблонов</p>
              <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:16,flexWrap:'wrap'}}>
                <button className="btn btn-primary" onClick={() => navigate('/my-recipes/new')}>+ Добавить рецепт</button>
                <button className="btn btn-secondary" onClick={() => setView('catalog')}>Шаблоны →</button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>Ничего не найдено</h3>
              <p>Попробуйте изменить фильтры или поисковый запрос</p>
            </div>
          )
        ) : (
          <div className="dishes-grid">
            {dishes.map((d, i) => (
              <div key={d.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <DishCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} searchQuery={q || undefined} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
