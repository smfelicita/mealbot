import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../hooks/useToast.jsx'

const CAT_EMOJI = {
  BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙',
  SOUP: '🍲', SALAD: '🥗', SNACK: '🍎',
  DESSERT: '🍰', DRINK: '🥤',
}

export default function MyRecipesPage() {
  const navigate = useNavigate()
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const { show, Toast } = useToast()

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
      <div className="top-bar">
        <span className="top-bar-logo">📖 Мои рецепты</span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/my-recipes/new')}>
          + Создать
        </button>
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 48 }}>
            <div className="loader" />
          </div>
        ) : dishes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>Нет своих рецептов</h3>
            <p>Создайте свой первый рецепт и поделитесь с группой</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }}
              onClick={() => navigate('/my-recipes/new')}>
              + Создать рецепт
            </button>
          </div>
        ) : (
          <div className="dishes-grid">
            {dishes.map((dish, i) => (
              <div key={dish.id} className="card dish-card fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="dish-card-header">
                  <div className="dish-emoji">{CAT_EMOJI[dish.categories?.[0]] || '🍳'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="dish-name">{dish.name}</div>
                    {dish.description && (
                      <div className="dish-desc" style={{
                        marginTop: 4, overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {dish.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="dish-meta">
                  {dish.cookTime && <span>⏱ {dish.cookTime} мин</span>}
                  {dish.calories && <span>🔥 {dish.calories} ккал</span>}
                  <span style={{
                    marginLeft: 'auto', fontSize: 11,
                    color: dish.isPublic ? 'var(--teal)' : 'var(--text3)',
                  }}>
                    {dish.isPublic ? '🌐 Публичный' : '🔒 Личный'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                    onClick={() => navigate(`/dishes/${dish.id}`)}>
                    Просмотр
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                    onClick={() => navigate(`/my-recipes/${dish.id}/edit`)}>
                    Редактировать
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}
                    onClick={() => handleDelete(dish)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {Toast}
    </div>
  )
}
