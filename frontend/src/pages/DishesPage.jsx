import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'

const CATEGORIES = ['BREAKFAST','LUNCH','DINNER','SOUP','SALAD','SNACK','DESSERT']
const CAT_RU = { BREAKFAST:'Завтрак',LUNCH:'Обед',DINNER:'Ужин',SOUP:'Суп',SALAD:'Салат',SNACK:'Перекус',DESSERT:'Десерт' }
const MEAL_TIMES = ['breakfast','lunch','dinner','snack']
const MT_RU = { breakfast:'Завтрак',lunch:'Обед',dinner:'Ужин',snack:'Перекус' }
const TAGS = ['быстро','вегетарианское','здоровое','сытное','без глютена','традиционное']
const DIFF = { easy:'Просто',medium:'Средне',hard:'Сложно' }
const DIFF_CLS = { easy:'diff-easy',medium:'diff-medium',hard:'diff-hard' }

export default function DishesPage() {
  const [dishes, setDishes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [category, setCategory] = useState('')
  const [mealTime, setMealTime] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const { fridgeMode, toggleFridgeMode } = useStore()
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getDishes({
        q: q || undefined,
        category: category || undefined,
        mealTime: mealTime || undefined,
        tags: activeTags.length ? activeTags.join(',') : undefined,
        fridgeMode: fridgeMode ? 'true' : undefined,
      })
      setDishes(data)
    } catch { setDishes([]) }
    finally { setLoading(false) }
  }, [q, category, mealTime, activeTags, fridgeMode])

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
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить фильтры или поисковый запрос</p>
          </div>
        ) : (
          <div className="dishes-grid">
            {dishes.map((d,i) => (
              <div key={d.id} className="card card-hover fade-up"
                style={{animationDelay:`${i*0.04}s`}}
                onClick={() => navigate(`/dishes/${d.id}`)}>
                <div className="dish-card">
                  <div className="dish-card-header">
                    <div className="dish-emoji">🍳</div>
                    <div>
                      <div className="dish-name">{d.name}</div>
                      <div className="dish-desc" style={{WebkitLineClamp:2,display:'-webkit-box',WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                        {d.description}
                      </div>
                    </div>
                  </div>
                  <div className="dish-meta">
                    {d.cookTime && <span>⏱ {d.cookTime} мин</span>}
                    {d.calories && <span>🔥 {d.calories} ккал</span>}
                    {d.difficulty && <span className={DIFF_CLS[d.difficulty]}>{DIFF[d.difficulty]}</span>}
                  </div>
                  <div className="dish-tags">
                    {d.tags.slice(0,3).map(t => (
                      <span key={t} className="tag" style={{cursor:'default'}}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
