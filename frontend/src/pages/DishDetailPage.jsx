import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Loader, useToast } from '../components/ui'
import {
  RecipeMeta,
  IngredientList,
  RecipeSteps,
  CommentsSection,
  RecipeCard,
} from '../components/domain'
import AddToPlanModal from '../components/AddToPlanModal'

// ─── SVG action icons ─────────────────────────────────────────────────────────
const IcoBack    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
const IcoHeart   = ({ filled }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const IcoPlan    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/><path d="M8 15h2M12 15h4"/></svg>
const IcoCopy    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const IcoEdit    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoDelete  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const IcoNutr    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20"/><path d="M12 6v6l4 2"/></svg>
const IcoChevron = ({ open }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}/></svg>

const CAT_LABELS = {
  BREAKFAST: 'Завтрак', LUNCH: 'Обед', DINNER: 'Ужин',
  SOUP: 'Суп', SALAD: 'Салат', SNACK: 'Перекус',
  DESSERT: 'Десерт', DRINK: 'Напиток',
}

// ─── BottomActionBar ──────────────────────────────────────────────────────────
function BottomActionBar({ isFav, onToggleFav, onPlan, onCopy, onEdit, onDelete, isOwner, user }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-app mx-auto z-40 bg-white border-t border-border pb-safe">
      <div className="flex items-center px-4 py-2 gap-2">
        {/* Plan — primary */}
        <button
          type="button"
          onClick={onPlan}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[14px] font-semibold text-white"
          style={{ background: '#C4704A' }}
        >
          <IcoPlan /><span>Буду готовить</span>
        </button>

        {/* Fav */}
        {user && (
          <button
            type="button"
            onClick={onToggleFav}
            className={['w-11 h-11 flex items-center justify-center rounded-2xl transition-all',
              isFav ? 'text-white' : 'bg-white text-text-2',
            ].join(' ')}
            style={isFav
              ? { background: '#C4704A', boxShadow: '0 1px 8px rgba(196,112,74,0.3)' }
              : { boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
          >
            <IcoHeart filled={isFav} />
          </button>
        )}

        {/* Copy */}
        {user && (
          <button
            type="button"
            onClick={onCopy}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-text-2"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
          >
            <IcoCopy />
          </button>
        )}

        {/* Edit */}
        {isOwner && (
          <button
            type="button"
            onClick={onEdit}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-text-2"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
          >
            <IcoEdit />
          </button>
        )}

        {/* Delete */}
        {isOwner && (
          <button
            type="button"
            onClick={onDelete}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-red-400"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
          >
            <IcoDelete />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── NutritionBlock ───────────────────────────────────────────────────────────
function NutritionBlock({ nutrition }) {
  const [open, setOpen] = useState(false)
  if (!nutrition) return null

  const items = [
    { label: 'Калории', value: `${nutrition.calories}`, unit: 'ккал' },
    { label: 'Белки',   value: `${nutrition.protein}`,  unit: 'г'    },
    { label: 'Жиры',    value: `${nutrition.fat}`,      unit: 'г'    },
    { label: 'Углеводы', value: `${nutrition.carbs}`,   unit: 'г'    },
  ]

  return (
    <div className="mb-6">
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left mb-3"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-text-2"><IcoNutr /></span>
        <span className="text-[14px] font-semibold text-text flex-1">Пищевая ценность</span>
        <span className="text-text-3"><IcoChevron open={open} /></span>
      </button>

      {open && (
        <div className="grid grid-cols-4 gap-2">
          {items.map(item => (
            <div key={item.label}
              className="rounded-2xl px-2 py-3 text-center bg-white"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <div className="text-[15px] font-bold text-text">{item.value}</div>
              <div className="text-[10px] text-text-3 mt-0.5">{item.unit}</div>
              <div className="text-[10px] text-text-2 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DishDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const { show, Toast } = useToast()

  const [dish, setDish]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [activeImage, setActiveImage] = useState(null)
  const [recs, setRecs]               = useState(null)
  const [showPlanModal, setShowPlanModal]   = useState(false)
  const [hasFamilyGroup, setHasFamilyGroup] = useState(false)
  const [isFav, setIsFav]             = useState(false)
  const [comments, setComments]       = useState(null)

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

  const isOwner      = user && dish.authorId === user.id
  const dishImages   = dish.images?.length ? dish.images : (dish.imageUrl ? [dish.imageUrl] : [])
  const displayImage = activeImage || dishImages[0] || null
  const primaryCat   = dish.categories?.[0] ?? dish.category

  return (
    <div className="fade-in pb-[72px]" style={{ background: '#F5F3EF', minHeight: '100%' }}>

      {/* ── RecipeHeader ── */}
      {displayImage ? (
        <div className="relative h-56 overflow-hidden">
          <img src={displayImage} alt={dish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white"
          >
            <IcoBack />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-[22px] font-bold text-white leading-tight">{dish.name}</h1>
            {primaryCat && (
              <span className="text-[12px] text-white/70 mt-0.5 block">{CAT_LABELS[primaryCat] || primaryCat}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white px-4 pt-4 pb-5" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-3 text-text-2"
            >
              <IcoBack />
            </button>
          </div>
          <h1 className="text-[22px] font-bold text-text leading-tight">{dish.name}</h1>
          {dish.description && (
            <p className="text-[14px] text-text-2 mt-1.5 leading-relaxed">{dish.description}</p>
          )}
        </div>
      )}

      {/* Thumbnail strip */}
      {dishImages.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-border">
          {dishImages.map(url => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveImage(url)}
              className={[
                'shrink-0 w-16 h-16 rounded-xl overflow-hidden',
                (activeImage || dishImages[0]) === url ? 'ring-2 ring-accent' : 'ring-1 ring-border',
              ].join(' ')}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* ── RecipeMeta ── */}
      <RecipeMeta dish={dish} />

      {/* ── Content ── */}
      <div className="px-4 pt-2">

        {/* Description (shown if there was a hero image) */}
        {displayImage && dish.description && (
          <p className="text-[14px] text-text-2 leading-relaxed mb-5">{dish.description}</p>
        )}

        {/* Tags */}
        {dish.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {dish.tags.map(t => (
              <span key={t} className="text-[12px] font-medium bg-white rounded-full px-3 py-1 text-text-2"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* ── IngredientList ── */}
        <IngredientList ingredients={dish.ingredients} />

        {/* ── RecipeSteps ── */}
        <RecipeSteps recipe={dish.recipe} />

        {/* ── NutritionBlock (Пищевая ценность) ── */}
        <NutritionBlock nutrition={dish.nutrition} />

        {/* ── CommentsSection ── */}
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

      {/* ── Recommendations ── */}
      {recs && (
        <div className="mt-2">
          {user && recs.fromFridge?.length > 0 && (
            <RecsRow title="Из холодильника" dishes={recs.fromFridge} navigate={navigate} />
          )}
          {user && recs.nearMatch?.length > 0 && (
            <div className="px-4 pt-5">
              <p className="font-semibold text-[15px] mb-3 text-text">Купите ещё немного</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {recs.nearMatch.map(({ dish: d, missing }) => (
                  <div key={d.id} className="shrink-0 w-48">
                    <RecipeCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
                    <div className="mt-1.5 px-2 py-1.5 bg-white rounded-xl text-[11px] text-text-2"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      Нет: {missing.map(m => m.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {recs.similar?.length > 0 && (
            <RecsRow title="Похожие блюда" dishes={recs.similar} navigate={navigate} />
          )}
        </div>
      )}

      {/* ── BottomActionBar ── */}
      <BottomActionBar
        isFav={isFav}
        user={user}
        isOwner={isOwner}
        onToggleFav={toggleFav}
        onPlan={() => setShowPlanModal(true)}
        onCopy={() => navigate(`/my-recipes/new?copyFrom=${id}`)}
        onEdit={() => navigate(`/my-recipes/${id}/edit`)}
        onDelete={handleDelete}
      />

      {/* ── Modals ── */}
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
      <p className="font-semibold text-[15px] mb-3 text-text">{title}</p>
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
