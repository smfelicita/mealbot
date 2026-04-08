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

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcoBack   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
const IcoHeart  = ({ filled }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const IcoPlan   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16M8 15h2M12 15h4"/></svg>
const IcoDots   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
const IcoEdit   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoCopy   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const IcoDelete = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const IcoChevron = ({ open }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}/></svg>

// ─── NutritionBlock ───────────────────────────────────────────────────────────
function NutritionBlock({ nutrition }) {
  const [open, setOpen] = useState(true)
  if (!nutrition) return null

  const items = [
    { label: 'Калории',  value: nutrition.calories, unit: 'ккал' },
    { label: 'Белки',    value: nutrition.protein,  unit: 'г'    },
    { label: 'Жиры',     value: nutrition.fat,      unit: 'г'    },
    { label: 'Углеводы', value: nutrition.carbs,    unit: 'г'    },
  ]

  return (
    <div className="mb-8">
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left mb-3 focus:outline-none"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-[17px] font-semibold text-text flex-1">Пищевая ценность</span>
        <span className="text-text-3"><IcoChevron open={open} /></span>
      </button>

      {open && (
        <div className="grid grid-cols-4 gap-2">
          {items.map(item => (
            <div key={item.label}
              className="rounded-xl px-2 py-2.5 text-center bg-white border border-border/50">
              <div className="text-[14px] font-semibold text-text tabular-nums">{item.value}</div>
              <div className="text-[11px] text-text-3 leading-tight mt-0.5">{item.unit}</div>
              <div className="text-[11px] text-text-2 leading-tight mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ActionsMenu (bottom sheet) ───────────────────────────────────────────────
function ActionsMenu({ onClose, onEdit, onCopy, onDelete, isOwner, hasUser }) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-3xl px-4 pt-5 pb-8 flex flex-col gap-1"
        style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        {hasUser && (
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-3 px-3 py-3.5 rounded-2xl text-[15px] font-medium text-text hover:bg-bg-3 transition-colors text-left"
          >
            <span className="text-text-2"><IcoCopy /></span>Копировать рецепт
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-3 px-3 py-3.5 rounded-2xl text-[15px] font-medium text-text hover:bg-bg-3 transition-colors text-left"
          >
            <span className="text-text-2"><IcoEdit /></span>Редактировать
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-3 px-3 py-3.5 rounded-2xl text-[15px] font-medium text-red-400 hover:bg-red-50 transition-colors text-left"
          >
            <span><IcoDelete /></span>Удалить
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-2 py-3 text-[15px] text-text-2 font-medium text-center rounded-2xl bg-bg-3"
        >
          Отмена
        </button>
      </div>
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
  const [showMenu, setShowMenu]       = useState(false)

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
    setShowMenu(false)
    if (!confirm(`Удалить "${dish.name}"?`)) return
    try {
      await api.deleteDish(id)
      navigate('/dishes', { replace: true })
    } catch (e) { show(e.message, 'error') }
  }

  if (loading) return (
    <div className="fixed inset-0 z-[150] bg-bg flex items-center justify-center">
      <Loader />
    </div>
  )
  if (!dish) return null

  const isOwner    = user && dish.authorId === user.id
  const dishImages = dish.images?.length ? dish.images : (dish.imageUrl ? [dish.imageUrl] : [])
  const displayImage = activeImage || dishImages[0] || null

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-bg">

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto pb-[72px]">

        {/* ── Hero image or plain header ── */}
        {displayImage ? (
          <div className="relative">
            <div className="relative h-64 overflow-hidden">
              <img src={displayImage} alt={dish.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Top action row over image */}
              <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-4 pt-12 pb-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white shrink-0"
                >
                  <IcoBack />
                </button>
                <div className="flex-1" />
                {user && (
                  <button
                    type="button"
                    onClick={toggleFav}
                    className={['w-9 h-9 flex items-center justify-center rounded-full transition-colors',
                      isFav ? 'bg-accent text-white' : 'bg-black/40 text-white',
                    ].join(' ')}
                  >
                    <IcoHeart filled={isFav} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMenu(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white"
                >
                  <IcoDots />
                </button>
              </div>

              {/* Title over image */}
              <div className="absolute bottom-4 left-4 right-4">
                <h1 className="text-[22px] font-bold text-white leading-tight">{dish.name}</h1>
              </div>
            </div>

            {/* Thumbnail strip */}
            {dishImages.length > 1 && (
              <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-border">
                {dishImages.map(url => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(url)}
                    className={[
                      'shrink-0 w-14 h-14 rounded-xl overflow-hidden',
                      (activeImage || dishImages[0]) === url ? 'ring-2 ring-accent' : 'ring-1 ring-border',
                    ].join(' ')}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* No image — own top bar */
          <div className="bg-bg pt-12 px-4 pb-5">
            <div className="flex items-center gap-2 mb-5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-text-2 shrink-0"
                style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
              >
                <IcoBack />
              </button>
              <div className="flex-1" />
              {user && (
                <button
                  type="button"
                  onClick={toggleFav}
                  className={['w-9 h-9 flex items-center justify-center rounded-full transition-colors',
                    isFav ? 'bg-accent text-white' : 'bg-white text-text-2',
                  ].join(' ')}
                  style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
                >
                  <IcoHeart filled={isFav} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowMenu(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-text-2"
                style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
              >
                <IcoDots />
              </button>
            </div>

            <h1 className="text-[24px] font-bold text-text leading-tight">{dish.name}</h1>
            {dish.description && (
              <p className="text-[14px] text-text-2 mt-2 leading-relaxed">{dish.description}</p>
            )}
          </div>
        )}

        {/* ── Description (if had hero image) ── */}
        {displayImage && dish.description && (
          <div className="px-4 pt-4">
            <p className="text-[14px] text-text-2 leading-relaxed">{dish.description}</p>
          </div>
        )}

        {/* ── RecipeMeta ── */}
        <RecipeMeta dish={dish} />

        {/* ── Tags ── */}
        {dish.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {dish.tags.map(t => (
              <span key={t}
                className="text-[12px] text-text-2 bg-white rounded-full px-3 py-1"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        <div className="px-4 pt-5 flex flex-col divide-y divide-border/60">
          <div className="pb-2"><IngredientList ingredients={dish.ingredients} /></div>
          <div className="pt-6 pb-2"><RecipeSteps recipe={dish.recipe} /></div>
          <div className="pt-6 pb-2"><NutritionBlock nutrition={dish.nutrition} /></div>

          {comments !== null && (
            <div className="pt-6">
              <CommentsSection
                comments={comments}
                setComments={setComments}
                dishId={id}
                currentUser={user}
                dishAuthorId={dish.authorId}
              />
            </div>
          )}
        </div>

        {/* ── Recommendations ── */}
        {recs && (
          <div className="pb-4">
            {user && recs.fromFridge?.length > 0 && (
              <RecsRow title="Из холодильника" dishes={recs.fromFridge} navigate={navigate} />
            )}
            {user && recs.nearMatch?.length > 0 && (
              <div className="pt-6">
                <p className="text-[17px] font-semibold text-text px-4 mb-3">Осталось докупить</p>
                <div className="flex overflow-x-auto px-4 gap-3 pb-1" style={{ scrollSnapType: 'x mandatory', scrollPaddingLeft: '1rem' }}>
                  {recs.nearMatch.map(({ dish: d, missing }) => (
                    <div key={d.id} className="shrink-0 w-full" style={{ scrollSnapAlign: 'start' }}>
                      <RecipeCard
                        variant="row"
                        dish={d}
                        onClick={() => navigate(`/dishes/${d.id}`)}
                        hint={`Докупить: ${missing.map(m => m.name).join(', ')}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Похожие блюда временно отключены */}
          </div>
        )}
      </div>

      {/* ── Bottom action bar (fixed inside overlay) ── */}
      <div className="shrink-0 bg-white border-t border-border px-4 py-4 pb-safe">
        <button
          type="button"
          onClick={() => setShowPlanModal(true)}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-[16px] font-semibold tracking-[-0.1px] text-white bg-accent active:opacity-90 transition-opacity"
        >
          <IcoPlan />
          <span>Буду готовить</span>
        </button>
      </div>

      {/* ── Modals ── */}
      {showMenu && (
        <ActionsMenu
          onClose={() => setShowMenu(false)}
          onEdit={() => { setShowMenu(false); navigate(`/my-recipes/${id}/edit`) }}
          onCopy={() => { setShowMenu(false); navigate(`/my-recipes/new?copyFrom=${id}`) }}
          onDelete={handleDelete}
          isOwner={isOwner}
          hasUser={Boolean(user)}
        />
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
