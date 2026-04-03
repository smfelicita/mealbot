import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import DishCard from '../components/DishCard'

const MEAL_TIMES = [
  { id: 'breakfast', label: 'Завтрак', icon: '🌅' },
  { id: 'lunch',     label: 'Обед',    icon: '☀️' },
  { id: 'dinner',    label: 'Ужин',    icon: '🌙' },
  { id: 'snack',     label: 'Перекус', icon: '🍎' },
]

export default function HomePage() {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  // null = ещё не знаем, true/false — известно
  const [hasPersonalDishes, setHasPersonalDishes] = useState(null)
  const [mealTime, setMealTime] = useState(getDefaultMeal())
  const { fridgeMode, token } = useStore()
  const navigate = useNavigate()

  useEffect(() => { load() }, [mealTime, fridgeMode, token])

  async function load() {
    setLoading(true)
    try {
      let result = []

      if (token) {
        // Проверяем наличие личных блюд БЕЗ фильтра mealTime
        const allMy = await api.getDishes({ myKitchen: 'true' })
        const hasPersonal = allMy.length > 0
        setHasPersonalDishes(hasPersonal)

        if (!hasPersonal) {
          setDishes([])
          return
        }

        // Загружаем с фильтром mealTime
        result = await api.getDishes({ mealTime, fridgeMode: fridgeMode ? 'true' : undefined, myKitchen: 'true' })

        // Добиваем публичными если меньше 6 и не fridgeMode
        if (result.length < 6 && !fridgeMode) {
          const existingIds = new Set(result.map(d => d.id))
          const publicDishes = await api.getDishes({ mealTime })
          const extra = publicDishes.filter(d => !existingIds.has(d.id))
          result = [...result, ...extra].slice(0, 6)
        }
      } else {
        setHasPersonalDishes(false)
        // Гость: публичные блюда
        result = await api.getDishes({ mealTime, fridgeMode: fridgeMode ? 'true' : undefined })
        if (result.length === 0 && !fridgeMode) {
          result = await api.getDishes({})
        }
      }

      setDishes(result.slice(0, 6))
    } catch { setDishes([]) }
    finally { setLoading(false) }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер'

  // Пока не определили состояние — просто лоадер
  if (loading || hasPersonalDishes === null) {
    return (
      <div className="page">
        <div style={{marginBottom:20}}>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:26,fontWeight:700,marginBottom:4}}>
            {greeting}! 👋
          </h1>
        </div>
        <div style={{display:'flex',justifyContent:'center',padding:40}}>
          <div className="loader"/>
        </div>
      </div>
    )
  }

  // Онбординг: пустая личная кухня
  if (token && !hasPersonalDishes) {
    return (
      <div className="page">
        <div style={{marginBottom:20}}>
          <h1 style={{fontFamily:'var(--font-serif)',fontSize:26,fontWeight:700,marginBottom:4}}>
            {greeting}! 👋
          </h1>
          <p style={{color:'var(--text2)',fontSize:14}}>Что будем готовить?</p>
        </div>
        <div className="empty-state" style={{marginTop:40}}>
          <div className="empty-icon">🍽️</div>
          <h3>Ваша кухня пока пуста</h3>
          <p>Добавьте свои блюда или скопируйте из готовых рецептов</p>
          <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:16,flexWrap:'wrap'}}>
            <button className="btn btn-primary" onClick={() => navigate('/my-recipes/new')}>
              + Добавить рецепт
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/dishes?view=catalog')}>
              Готовые рецепты →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
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

      {dishes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🥺</div>
          <h3>Ничего не найдено</h3>
          <p>{fridgeMode ? 'Пополните холодильник или отключите режим холодильника' : 'Попробуйте другое время дня'}</p>
        </div>
      ) : (
        <div className="dishes-grid">
          {dishes.map((d, i) => (
            <div key={d.id} className="fade-up" style={{animationDelay:`${i*0.05}s`}}>
              <DishCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:20,display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
        <button className="btn btn-secondary" onClick={() => navigate('/dishes')}>
          Все блюда →
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/chat?prompt=' + encodeURIComponent('Предложи что приготовить сегодня'))}>
          ✨ Предложи что приготовить
        </button>
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
