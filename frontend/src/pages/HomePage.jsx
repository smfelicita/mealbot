import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'

const MEAL_TIMES = [
  { id: 'breakfast', label: 'Завтрак', icon: '🌅' },
  { id: 'lunch',     label: 'Обед',    icon: '☀️' },
  { id: 'dinner',    label: 'Ужин',    icon: '🌙' },
  { id: 'snack',     label: 'Перекус', icon: '🍎' },
]

const DIFFICULTY = { easy: 'Просто', medium: 'Средне', hard: 'Сложно' }
const DIFF_CLASS  = { easy: 'diff-easy', medium: 'diff-medium', hard: 'diff-hard' }

export default function HomePage() {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [mealTime, setMealTime] = useState(getDefaultMeal())
  const { fridgeMode, toggleFridgeMode, token } = useStore()
  const navigate = useNavigate()

  useEffect(() => { load() }, [mealTime, fridgeMode])

  async function load() {
    setLoading(true)
    try {
      const data = await api.getDishes({ mealTime, fridgeMode: fridgeMode ? 'true' : undefined })
      setDishes(data.slice(0, 6))
    } catch { setDishes([]) }
    finally { setLoading(false) }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер'

  return (
    <div>
      <div className="top-bar">
        <span className="top-bar-logo">🍽️ MealBot</span>
        <div style={{flex:1}}/>
        {token && (
          <div className="toggle-wrap" onClick={toggleFridgeMode}>
            <div className={`toggle ${fridgeMode?'on':''}`}/>
            <span className="toggle-label" style={{color:fridgeMode?'var(--accent)':'var(--text2)'}}>
              {fridgeMode ? '🧊 Из холодильника' : '🧊 Холодильник'}
            </span>
          </div>
        )}
      </div>

      <div className="page">
        <div style={{marginBottom:20}}>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:26,fontWeight:700,marginBottom:4}}>
            {greeting}! 👋
          </h1>
          <p style={{color:'var(--text2)',fontSize:14}}>Что будем готовить?</p>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {MEAL_TIMES.map(m => (
            <button key={m.id}
              className={`tag ${mealTime===m.id?'active':''}`}
              onClick={() => setMealTime(m.id)}
              style={{fontSize:13,padding:'6px 14px'}}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {fridgeMode && (
          <div style={{background:'rgba(45,212,191,.08)',border:'1px solid rgba(45,212,191,.2)',borderRadius:'var(--radius-sm)',padding:'10px 14px',marginBottom:16,fontSize:13,color:'var(--teal)'}}>
            🧊 Показываю только блюда из продуктов в вашем холодильнике
          </div>
        )}

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:40}}>
            <div className="loader"/>
          </div>
        ) : dishes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🥺</div>
            <h3>Ничего не найдено</h3>
            <p>{fridgeMode ? 'Пополните холодильник или отключите режим холодильника' : 'Попробуйте другое время дня'}</p>
          </div>
        ) : (
          <div className="dishes-grid">
            {dishes.map((d,i) => (
              <div key={d.id} className="card card-hover fade-up"
                style={{animationDelay:`${i*0.05}s`}}
                onClick={() => navigate(`/dishes/${d.id}`)}>
                <div className="dish-card">
                  <div className="dish-card-header">
                    <div className="dish-emoji">🍳</div>
                    <div>
                      <div className="dish-name">{d.name}</div>
                      <div className="dish-desc">{d.description}</div>
                    </div>
                  </div>
                  <div className="dish-meta">
                    {d.cookTime && <span>⏱ {d.cookTime} мин</span>}
                    {d.calories && <span>🔥 {d.calories} ккал</span>}
                    {d.difficulty && <span className={DIFF_CLASS[d.difficulty]}>{DIFFICULTY[d.difficulty]}</span>}
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

        <div style={{marginTop:20,textAlign:'center'}}>
          <button className="btn btn-secondary" onClick={() => navigate('/dishes')}>
            Все блюда →
          </button>
        </div>
      </div>
    </div>
  )
}

function getDefaultMeal() {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 22) return 'dinner'
  return 'snack'
}
