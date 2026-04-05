import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Button, Loader, EmptyState, useToast } from '../components/ui'

const CAT_EMOJI = {
  BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙',
  SOUP: '🍲', SALAD: '🥗', SNACK: '🍎',
  DESSERT: '🍰', DRINK: '🥤',
}

const VIS_LABEL = {
  PUBLIC: { label: '🌐 Публичный', cls: 'text-teal' },
  FAMILY: { label: '👨‍👩‍👧 Семья',    cls: 'text-accent' },
  ALL_GROUPS: { label: '👥 Группы', cls: 'text-accent' },
  PRIVATE: { label: '🔒 Личный',   cls: 'text-text-3' },
}

export default function MyRecipesPage() {
  const navigate = useNavigate()
  const { show, Toast } = useToast()
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMyDishes().then(setDishes).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleDelete(dish) {
    if (!confirm(`Удалить "${dish.name}"?`)) return
    try {
      await api.deleteDish(dish.id)
      setDishes(prev => prev.filter(d => d.id !== dish.id))
      show('Рецепт удалён', 'success')
    } catch (e) {
      show(e.message, 'error')
    }
  }

  return (
    <div>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-bg/95 backdrop-blur-md border-b border-border flex items-center px-3 gap-2 max-w-app mx-auto">
        <span className="font-serif text-[17px] font-bold flex-1">📖 Мои рецепты</span>
        <Button size="sm" onClick={() => navigate('/my-recipes/new')}>+ Создать</Button>
      </div>

      <div className="pt-[68px] pb-8 px-4">
        {loading ? (
          <Loader />
        ) : dishes.length === 0 ? (
          <EmptyState
            icon="📖"
            title="Нет своих рецептов"
            description="Создайте первый рецепт и поделитесь с группой"
            action={<Button onClick={() => navigate('/my-recipes/new')}>+ Создать рецепт</Button>}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {dishes.map((dish, i) => {
              const vis = VIS_LABEL[dish.visibility] || VIS_LABEL.PRIVATE
              return (
                <div
                  key={dish.id}
                  className="bg-bg-2 border border-border rounded-DEFAULT p-4 fade-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="flex gap-3 items-start mb-3">
                    <div className="w-10 h-10 rounded-sm bg-bg-3 flex items-center justify-center text-xl shrink-0">
                      {CAT_EMOJI[dish.categories?.[0]] || '🍳'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[15px] leading-tight">{dish.name}</p>
                      {dish.description && (
                        <p className="text-[13px] text-text-2 mt-1 line-clamp-2 leading-snug">
                          {dish.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[12px] text-text-3 mb-3">
                    {dish.cookTime && <span>⏱ {dish.cookTime} мин</span>}
                    {dish.calories && <span>🔥 {dish.calories} ккал</span>}
                    <span className={`ml-auto font-semibold ${vis.cls}`}>{vis.label}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1"
                      onClick={() => navigate(`/dishes/${dish.id}`)}>Просмотр</Button>
                    <Button variant="secondary" size="sm" className="flex-1"
                      onClick={() => navigate(`/my-recipes/${dish.id}/edit`)}>Редактировать</Button>
                    <Button variant="ghost" size="sm" className="text-red-400"
                      onClick={() => handleDelete(dish)}>Удалить</Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {Toast}
    </div>
  )
}
