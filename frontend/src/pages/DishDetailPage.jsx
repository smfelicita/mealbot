import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { useToast } from '../hooks/useToast.jsx'
import DishCard from '../components/DishCard'
import AddToPlanModal from '../components/AddToPlanModal'

function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '')
}

const DIFF = { easy: 'Просто', medium: 'Средне', hard: 'Сложно' }
const DIFF_CLS = { easy: 'diff-easy', medium: 'diff-medium', hard: 'diff-hard' }
const CAT_EMOJI = {
  BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙',
  SOUP: '🍲', SALAD: '🥗', SNACK: '🍎',
  DESSERT: '🍰', DRINK: '🥤',
}
const CAT_RU = {
  BREAKFAST: 'Завтрак', LUNCH: 'Обед', DINNER: 'Ужин',
  SOUP: 'Суп', SALAD: 'Салат', SNACK: 'Перекус',
  DESSERT: 'Десерт', DRINK: 'Напиток',
}

export default function DishDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const { show, Toast } = useToast()
  const [dish, setDish] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNutrition, setShowNutrition] = useState(false)
  const [activeImage, setActiveImage] = useState(null)
  const [recs, setRecs] = useState(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [hasFamilyGroup, setHasFamilyGroup] = useState(false)
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    api.getDish(id).then(setDish).catch(() => navigate('/dishes')).finally(() => setLoading(false))
    api.getRecommendations(id).then(setRecs).catch(() => {})
    if (user) {
      api.getGroups().then(groups => {
        setHasFamilyGroup(groups.some(g => g.type === 'FAMILY'))
      }).catch(() => {})
      api.getFavoriteIds().then(({ dishIds }) => setIsFav(dishIds.includes(id))).catch(() => {})
    }
  }, [id])

  async function toggleFav() {
    try {
      if (isFav) { await api.removeFavorite(id); setIsFav(false) }
      else        { await api.addFavorite(id);    setIsFav(true)  }
    } catch (e) { show(e.message, 'error') }
  }

  async function handleDelete() {
    if (!confirm(`Удалить "${dish.name}"?`)) return
    try {
      await api.deleteDish(id)
      navigate('/my-recipes', { replace: true })
    } catch (e) { show(e.message, 'error') }
  }

  const isOwner = user && dish?.authorId === user.id
  const primaryCategory = dish?.categories?.[0] ?? dish?.category

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60dvh' }}>
      <div className="loader" />
    </div>
  )
  if (!dish) return null

  const dishImages = dish.images?.length ? dish.images : (dish.imageUrl ? [dish.imageUrl] : [])
  const displayImage = activeImage || dishImages[0] || null

  return (
    <div className="fade-in">
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        {displayImage ? (
          <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
            <img src={displayImage} alt={dish.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 55%)',
            }} />
            <div style={{ position: 'absolute', top: 14, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="btn btn-icon" style={{ background: 'rgba(0,0,0,.5)', borderColor: 'transparent', color: '#fff' }}
                onClick={() => navigate(-1)}>←</button>
              <div style={{ flex: 1 }} />
              {user && (
                <>
                  <button className="btn btn-secondary btn-sm"
                    style={{ background: 'rgba(0,0,0,.5)', borderColor: 'rgba(255,255,255,.2)', color: 'rgba(255,255,255,.9)' }}
                    onClick={toggleFav}>{isFav ? '❤️' : '🤍'}</button>
                  <button className="btn btn-secondary btn-sm"
                    style={{ background: 'rgba(0,0,0,.5)', borderColor: 'rgba(255,255,255,.2)', color: 'rgba(255,255,255,.9)' }}
                    onClick={() => setShowPlanModal(true)}>📅 Буду готовить</button>
                  <button className="btn btn-secondary btn-sm"
                    style={{ background: 'rgba(0,0,0,.5)', borderColor: 'rgba(255,255,255,.2)', color: 'rgba(255,255,255,.9)' }}
                    onClick={() => navigate(`/my-recipes/new?copyFrom=${id}`)}>📋 Скопировать</button>
                </>
              )}
              {isOwner && (
                <>
                  <button className="btn btn-secondary btn-sm"
                    style={{ background: 'rgba(0,0,0,.5)', borderColor: 'rgba(255,255,255,.2)', color: 'rgba(255,255,255,.9)' }}
                    onClick={() => navigate(`/my-recipes/${id}/edit`)}>Редактировать</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: '#f87171', background: 'rgba(0,0,0,.4)' }}
                    onClick={handleDelete}>Удалить</button>
                </>
              )}
            </div>
            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-serif)', lineHeight: 1.2, marginBottom: 4 }}>
                {dish.name}
              </h1>
              {dish.description && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.4 }}>{dish.description}</p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <button className="btn btn-icon" onClick={() => navigate(-1)}>←</button>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Назад</span>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                {user && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={toggleFav}>{isFav ? '❤️' : '🤍'}</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowPlanModal(true)}>📅 Буду готовить</button>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/my-recipes/new?copyFrom=${id}`)}>📋 Скопировать</button>
                  </>
                )}
                {isOwner && (
                  <>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/my-recipes/${id}/edit`)}>Редактировать</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}
                      onClick={handleDelete}>Удалить</button>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{
                width: 60, height: 60, background: 'var(--bg3)', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0,
              }}>
                {CAT_EMOJI[primaryCategory] || '🍳'}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-serif)', lineHeight: 1.2, marginBottom: 6 }}>
                  {dish.name}
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>{dish.description}</p>
              </div>
            </div>
          </div>
        )}

        {dishImages.length > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto' }}>
            {dishImages.map((url, idx) => (
              <div key={url} onClick={() => setActiveImage(url)} style={{
                flexShrink: 0, width: 64, height: 64, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                border: (activeImage || dishImages[0]) === url ? '2.5px solid var(--accent)' : '2px solid var(--border)',
              }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px 16px' }}>
          {dish.categories?.map(cat => (
            <div key={cat} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '4px 10px',
              fontSize: 12, color: 'var(--text2)', fontWeight: 700,
            }}>
              {CAT_EMOJI[cat]} {CAT_RU[cat] || cat}
            </div>
          ))}
          {dish.cuisine && (
            <div style={{
              background: 'rgba(45,212,191,.1)', border: '1px solid var(--teal)',
              borderRadius: 20, padding: '4px 10px',
              fontSize: 12, color: 'var(--teal)', fontWeight: 700,
            }}>
              🌍 {dish.cuisine}
            </div>
          )}
          {dish.cookTime && (
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '6px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 16 }}>⏱</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{dish.cookTime} мин</div>
            </div>
          )}
          {dish.calories && (
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '6px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 16 }}>🔥</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{dish.calories} ккал</div>
            </div>
          )}
          {dish.difficulty && (
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '6px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 16 }}>👨‍🍳</div>
              <div className={DIFF_CLS[dish.difficulty]} style={{ fontSize: 11, marginTop: 2, fontWeight: 700 }}>
                {DIFF[dish.difficulty]}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="page" style={{ paddingTop: 20 }}>
        {dish.tags?.length > 0 && (
          <div className="dish-tags" style={{ marginBottom: 20 }}>
            {dish.tags.map(t => <span key={t} className="tag" style={{ cursor: 'default' }}>{t}</span>)}
          </div>
        )}

        {dish.ingredients?.length > 0 && (
          <>
            <h2 className="section-title" style={{ fontSize: 18 }}>🛒 Ингредиенты</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {dish.ingredients.map(ing => {
                const amountStr = ing.toTaste ? 'по вкусу'
                  : ing.amountValue && ing.unit ? `${ing.amountValue} ${ing.unit}`
                  : ing.amount || null
                return (
                  <div key={ing.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', background: 'var(--bg3)',
                    border: '1px solid var(--border)', borderRadius: 20,
                    fontSize: 13, fontWeight: 600,
                  }}>
                    {ing.emoji && <span>{ing.emoji}</span>}
                    {ing.name}
                    {amountStr && <span style={{ color: 'var(--text2)', fontWeight: 400 }}> — {amountStr}</span>}
                    {ing.optional && <span style={{ color: 'var(--text3)', fontSize: 11 }}> (опц.)</span>}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* КБЖУ */}
        {dish.nutrition && (
          <div style={{ marginBottom: 24 }}>
            <button type="button" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, color: 'var(--text1)', padding: 0, marginBottom: 12,
            }} onClick={() => setShowNutrition(v => !v)}>
              🔥 КБЖУ <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 400 }}>(на блюдо)</span>
              <span style={{ marginLeft: 4, fontSize: 12 }}>{showNutrition ? '▲' : '▼'}</span>
            </button>
            {showNutrition && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Калории', value: `${dish.nutrition.calories} ккал`, icon: '🔥' },
                  { label: 'Белки', value: `${dish.nutrition.protein} г`, icon: '💪' },
                  { label: 'Жиры', value: `${dish.nutrition.fat} г`, icon: '🫒' },
                  { label: 'Углеводы', value: `${dish.nutrition.carbs} г`, icon: '🌾' },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 8px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{item.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {dish.recipe && (
          <>
            <h2 className="section-title" style={{ fontSize: 18 }}>📋 Рецепт</h2>
            <div className="card" style={{ padding: 16 }}>
              <div className="recipe-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(dish.recipe) }} />
            </div>
          </>
        )}
      </div>

      {/* Рекомендации */}
      {recs && (
        <div style={{ paddingBottom: 32 }}>
          {/* Из холодильника */}
          {user && recs.fromFridge?.length > 0 && (
            <RecSection title="🧊 Из холодильника" dishes={recs.fromFridge} navigate={navigate} />
          )}

          {/* Купите ещё */}
          {user && recs.nearMatch?.length > 0 && (
            <div style={{ padding: '20px 16px 0' }}>
              <h2 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>🛒 Купите ещё немного</h2>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                {recs.nearMatch.map(({ dish: d, missing }) => (
                  <div key={d.id} style={{ flexShrink: 0, width: 200 }}>
                    <DishCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
                    <div style={{
                      marginTop: 6, padding: '5px 8px',
                      background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                      fontSize: 11, color: 'var(--text2)',
                    }}>
                      Нет: {missing.map(m => `${m.emoji || ''} ${m.name}`.trim()).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Похожие */}
          {recs.similar?.length > 0 && (
            <RecSection title="🍽 Похожие рецепты" dishes={recs.similar} navigate={navigate} />
          )}
        </div>
      )}

      {showPlanModal && dish && (
        <AddToPlanModal
          dish={dish}
          hasFamilyGroup={hasFamilyGroup}
          onClose={() => setShowPlanModal(false)}
          onAdded={() => show('Добавлено в список!')}
        />
      )}

      {Toast}
    </div>
  )
}

function RecSection({ title, dishes, navigate }) {
  return (
    <div style={{ padding: '20px 16px 0' }}>
      <h2 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>{title}</h2>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {dishes.map(d => (
          <div key={d.id} style={{ flexShrink: 0, width: 200 }}>
            <DishCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
          </div>
        ))}
      </div>
    </div>
  )
}
