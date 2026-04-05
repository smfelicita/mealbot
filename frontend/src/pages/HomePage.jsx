import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Button, EmptyState } from '../components/ui'
import { MealTypeChips, RecipeList, HomeTitle } from '../components/domain'

function getDefaultMealTime() {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 22) return 'dinner'
  return 'snack'
}

export default function HomePage() {
  const navigate  = useNavigate()
  const { fridgeMode, token } = useStore()

  const [dishes, setDishes]                 = useState([])
  const [loading, setLoading]               = useState(true)
  const [hasPersonalDishes, setHasPersonal] = useState(null)
  const [mealTime, setMealTime]             = useState(getDefaultMealTime())

  useEffect(() => { load() }, [mealTime, fridgeMode, token])

  async function load() {
    setLoading(true)
    try {
      if (token) {
        const allMy = await api.getDishes({ myKitchen: 'true' })
        const hasPersonal = allMy.length > 0
        setHasPersonal(hasPersonal)

        if (!hasPersonal) { setDishes([]); return }

        let result = await api.getDishes({
          mealTime,
          myKitchen: 'true',
          fridgeMode: fridgeMode ? 'true' : undefined,
        })

        // Добиваем публичными если мало и не fridgeMode
        if (result.length < 6 && !fridgeMode) {
          const existingIds = new Set(result.map(d => d.id))
          const pub = await api.getDishes({ mealTime })
          result = [...result, ...pub.filter(d => !existingIds.has(d.id))].slice(0, 6)
        }

        setDishes(result.slice(0, 6))
      } else {
        setHasPersonal(false)
        let result = await api.getDishes({ mealTime, fridgeMode: fridgeMode ? 'true' : undefined })
        if (!result.length && !fridgeMode) result = await api.getDishes({})
        setDishes(result.slice(0, 6))
      }
    } catch {
      setDishes([])
    } finally {
      setLoading(false)
    }
  }

  // Пока не знаем есть ли личные блюда — показываем заглушку
  if (loading && hasPersonalDishes === null) {
    return (
      <div className="max-w-app w-full mx-auto px-4 py-5 pb-24">
        <HomeTitle />
        <RecipeList loading dishes={[]} />
      </div>
    )
  }

  // Онбординг: авторизован, но кухня пуста
  if (token && hasPersonalDishes === false) {
    return (
      <div className="max-w-app w-full mx-auto px-4 py-5 pb-24">
        <HomeTitle subtitle="Добавьте первые блюда, чтобы начать" />
        <EmptyState
          icon="🍽️"
          title="Ваша кухня пока пуста"
          description="Добавьте свои блюда или скопируйте из готовых рецептов"
          action={
            <div className="flex gap-2.5 flex-wrap justify-center">
              <Button onClick={() => navigate('/my-recipes/new')}>
                + Добавить рецепт
              </Button>
              <Button variant="secondary" onClick={() => navigate('/dishes?view=catalog')}>
                Готовые рецепты →
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="max-w-app w-full mx-auto px-4 py-5 pb-24">
      <HomeTitle subtitle="Что будем готовить?" />

      {/* Фильтр по времени дня */}
      <div className="mb-5">
        <MealTypeChips active={mealTime} onChange={setMealTime} />
      </div>

      {/* Баннер режима холодильника */}
      {fridgeMode && (
        <div className="flex items-center gap-2 bg-teal/8 border border-teal/20 rounded-sm px-3.5 py-2.5 mb-4 text-sm text-teal">
          🧊 Показываю только блюда из продуктов в вашем холодильнике
        </div>
      )}

      <RecipeList
        dishes={dishes}
        loading={loading}
        onDishClick={id => navigate(`/dishes/${id}`)}
        emptyIcon="🥺"
        emptyTitle="Ничего не найдено"
        emptyDescription={
          fridgeMode
            ? 'Пополните холодильник или отключите режим холодильника'
            : 'Попробуйте другое время дня'
        }
      />

      {!loading && dishes.length > 0 && (
        <div className="flex gap-2.5 justify-center flex-wrap mt-5">
          <Button variant="secondary" onClick={() => navigate('/dishes')}>
            Все рецепты →
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/chat?prompt=' + encodeURIComponent('Предложи что приготовить сегодня'))}
          >
            ✨ Предложи что приготовить
          </Button>
        </div>
      )}
    </div>
  )
}
