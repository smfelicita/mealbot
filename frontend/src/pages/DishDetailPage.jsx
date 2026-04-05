import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Button, Loader, useToast } from '../components/ui'
import {
  RecipeMeta,
  IngredientList,
  RecipeSteps,
  CommentsSection,
  RecipeCard,
} from '../components/domain'
import AddToPlanModal from '../components/AddToPlanModal'

const CAT_EMOJI = {
  BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙',
  SOUP: '🍲', SALAD: '🥗', SNACK: '🍎',
  DESSERT: '🍰', DRINK: '🥤',
}

export default function DishDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const { show, Toast } = useToast()

  const [dish, setDish]                 = useState(null)
  const [loading, setLoading]           = useState(true)
  const [activeImage, setActiveImage]   = useState(null)
  const [showNutrition, setShowNutrition] = useState(false)
  const [recs, setRecs]                 = useState(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [hasFamilyGroup, setHasFamilyGroup] = useState(false)
  const [isFav, setIsFav]               = useState(false)
  const [comments, setComments]         = useState(null) // null = not loaded / not accessible

  useEffect(() => {
    api.getDish(id)
      .then(d => {
        setDish(d)
        if (user && (d.authorId === user.id || d.visibility === 'FAMILY')) {
          api.getComments(id).then(setComments).catch(() => {})
        }
      })
      .catch(() => navigate('/dishes'))
      .finally(() => setLoading(false))

    api.getRecommendations(id).then(setRecs).catch(() => {})

    if (user) {
      api.getGroups()
        .then(groups => setHasFamilyGroup(groups.some(g => g.type === 'FAMILY')))
        .catch(() => {})
      api.getFavoriteIds()
        .then(({ dishIds }) => setIsFav(dishIds.includes(id)))
        .catch(() => {})
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
      navigate('/dishes', { replace: true })
    } catch (e) { show(e.message, 'error') }
  }

  if (loading) return <Loader fullPage />
  if (!dish) return null

  const isOwner = user && dish.authorId === user.id
  const dishImages = dish.images?.length ? dish.images : (dish.imageUrl ? [dish.imageUrl] : [])
  const displayImage = activeImage || dishImages[0] || null
  const primaryCategory = dish.categories?.[0] ?? dish.category

  return (
    <div className="fade-in pb-8">

      {/* ─── Hero / Header ─── */}
      {displayImage ? (
        <div className="relative h-56 overflow-hidden bg-bg-2">
          <img src={displayImage} alt={dish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          {/* Top controls */}
          <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
            <Button variant="ghost" size="icon"
              className="bg-black/50 text-white border-white/20 hover:bg-black/70"
              onClick={() => navigate(-1)}>←</Button>
            <div className="flex-1" />
            {user && (
              <>
                <Button variant="ghost" size="sm"
                  className="bg-black/50 text-white border-white/20 hover:bg-black/70"
                  onClick={toggleFav}>{isFav ? '❤️' : '🤍'}</Button>
                <Button variant="ghost" size="sm"
                  className="bg-black/50 text-white border-white/20 hover:bg-black/70"
                  onClick={() => setShowPlanModal(true)}>📅 Буду готовить</Button>
                <Button variant="ghost" size="sm"
                  className="bg-black/50 text-white border-white/20 hover:bg-black/70"
                  onClick={() => navigate(`/my-recipes/new?copyFrom=${id}`)}>📋 Скопировать</Button>
              </>
            )}
            {isOwner && (
              <>
                <Button variant="ghost" size="sm"
                  className="bg-black/50 text-white border-white/20 hover:bg-black/70"
                  onClick={() => navigate(`/my-recipes/${id}/edit`)}>Редактировать</Button>
                <Button variant="danger" size="sm"
                  className="bg-black/40"
                  onClick={handleDelete}>Удалить</Button>
              </>
            )}
          </div>

          {/* Bottom title overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="font-serif text-[22px] font-extrabold text-white leading-tight mb-1">
              {dish.name}
            </h1>
            {dish.description && (
              <p className="text-[13px] text-white/75 leading-snug">{dish.description}</p>
            )}
          </div>
        </div>
      ) : (
        /* No image header */
        <div className="bg-bg-2 border-b border-border px-4 pt-3.5 pb-4">
          <div className="flex items-center gap-2.5 mb-3.5">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>←</Button>
            <span className="text-sm text-text-2">Назад</span>
            <div className="flex-1" />
            <div className="flex gap-2">
              {user && (
                <>
                  <Button variant="ghost" size="sm" onClick={toggleFav}>{isFav ? '❤️' : '🤍'}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowPlanModal(true)}>📅 Буду готовить</Button>
                  <Button variant="ghost" size="sm"
                    onClick={() => navigate(`/my-recipes/new?copyFrom=${id}`)}>📋 Скопировать</Button>
                </>
              )}
              {isOwner && (
                <>
                  <Button variant="ghost" size="sm"
                    onClick={() => navigate(`/my-recipes/${id}/edit`)}>Редактировать</Button>
                  <Button variant="danger" size="sm" onClick={handleDelete}>Удалить</Button>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <div className="w-[60px] h-[60px] bg-bg-3 rounded-xl flex items-center justify-center text-3xl shrink-0">
              {CAT_EMOJI[primaryCategory] || '🍳'}
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-[22px] font-extrabold leading-tight mb-1.5">{dish.name}</h1>
              {dish.description && (
                <p className="text-sm text-text-2 leading-relaxed">{dish.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Thumbnail strip (multiple images) ─── */}
      {dishImages.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-bg-2 border-b border-border">
          {dishImages.map(url => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveImage(url)}
              className={[
                'shrink-0 w-16 h-16 rounded-sm overflow-hidden',
                (activeImage || dishImages[0]) === url
                  ? 'ring-2 ring-accent'
                  : 'ring-1 ring-border',
              ].join(' ')}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* ─── Meta chips ─── */}
      <RecipeMeta dish={dish} />

      {/* ─── Content ─── */}
      <div className="px-4 pt-4">

        {/* Tags */}
        {dish.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {dish.tags.map(t => (
              <span key={t}
                className="text-xs font-semibold bg-bg-3 border border-border rounded-full px-3 py-1 text-text-2">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Ingredients */}
        <IngredientList ingredients={dish.ingredients} />

        {/* КБЖУ */}
        {dish.nutrition && (
          <div className="mb-6">
            <button
              type="button"
              className="flex items-center gap-1.5 text-[14px] font-bold text-text mb-3"
              onClick={() => setShowNutrition(v => !v)}
            >
              🔥 КБЖУ
              <span className="text-[12px] text-text-2 font-normal">(на блюдо)</span>
              <span className="text-[12px] ml-1">{showNutrition ? '▲' : '▼'}</span>
            </button>
            {showNutrition && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Калории', value: `${dish.nutrition.calories} ккал`, icon: '🔥' },
                  { label: 'Белки',   value: `${dish.nutrition.protein} г`,    icon: '💪' },
                  { label: 'Жиры',    value: `${dish.nutrition.fat} г`,         icon: '🫒' },
                  { label: 'Углеводы', value: `${dish.nutrition.carbs} г`,      icon: '🌾' },
                ].map(item => (
                  <div key={item.label}
                    className="bg-bg-3 border border-border rounded-sm px-2 py-2.5 text-center">
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="text-[13px] font-bold">{item.value}</div>
                    <div className="text-[10px] text-text-2 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipe steps */}
        <RecipeSteps recipe={dish.recipe} />

        {/* Comments */}
        {comments !== null && (
          <CommentsSection
            comments={comments}
            setComments={setComments}
            dishId={id}
            currentUser={user}
            dishAuthorId={dish.authorId}
          />
        )}
      </div>

      {/* ─── Recommendations ─── */}
      {recs && (
        <div className="mt-4">
          {user && recs.fromFridge?.length > 0 && (
            <RecsRow title="🧊 Из холодильника" dishes={recs.fromFridge} navigate={navigate} />
          )}

          {user && recs.nearMatch?.length > 0 && (
            <div className="px-4 pt-5">
              <p className="font-serif text-base font-bold mb-3">🛒 Купите ещё немного</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {recs.nearMatch.map(({ dish: d, missing }) => (
                  <div key={d.id} className="shrink-0 w-48">
                    <RecipeCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
                    <div className="mt-1.5 px-2 py-1.5 bg-bg-3 rounded-sm text-[11px] text-text-2">
                      Нет: {missing.map(m => `${m.emoji || ''} ${m.name}`.trim()).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recs.similar?.length > 0 && (
            <RecsRow title="🍽 Похожие рецепты" dishes={recs.similar} navigate={navigate} />
          )}
        </div>
      )}

      {/* ─── Modals ─── */}
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

function RecsRow({ title, dishes, navigate }) {
  return (
    <div className="px-4 pt-5">
      <p className="font-serif text-base font-bold mb-3">{title}</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {dishes.map(d => (
          <div key={d.id} className="shrink-0 w-48">
            <RecipeCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
          </div>
        ))}
      </div>
    </div>
  )
}
