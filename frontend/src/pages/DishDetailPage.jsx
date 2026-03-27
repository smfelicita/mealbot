import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { useToast } from '../hooks/useToast.jsx'

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

  useEffect(() => {
    api.getDish(id).then(setDish).catch(() => navigate('/dishes')).finally(() => setLoading(false))
  }, [id])

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

  return (
    <div className="fade-in">
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        {dish.imageUrl ? (
          <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
            <img src={dish.imageUrl} alt={dish.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(22,22,42,.9) 0%, transparent 55%)',
            }} />
            <div style={{ position: 'absolute', top: 14, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="btn btn-icon" style={{ background: 'rgba(0,0,0,.5)', borderColor: 'transparent' }}
                onClick={() => navigate(-1)}>←</button>
              <div style={{ flex: 1 }} />
              {isOwner && (
                <>
                  <button className="btn btn-secondary btn-sm"
                    style={{ background: 'rgba(0,0,0,.5)', borderColor: 'rgba(255,255,255,.2)' }}
                    onClick={() => navigate(`/my-recipes/${id}/edit`)}>Редактировать</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}
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
              {isOwner && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/my-recipes/${id}/edit`)}>Редактировать</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}
                    onClick={handleDelete}>Удалить</button>
                </div>
              )}
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
              {dish.ingredients.map(ing => (
                <div key={ing.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', background: 'var(--bg3)',
                  border: '1px solid var(--border)', borderRadius: 20,
                  fontSize: 13, fontWeight: 600,
                }}>
                  {ing.emoji && <span>{ing.emoji}</span>}
                  {ing.name}
                  {ing.amount && <span style={{ color: 'var(--text2)', fontWeight: 400 }}> — {ing.amount}</span>}
                  {ing.optional && <span style={{ color: 'var(--text3)', fontSize: 11 }}> (опц.)</span>}
                </div>
              ))}
            </div>
          </>
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
      {Toast}
    </div>
  )
}
