import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Loader, useToast } from '../components/ui'
import {
  DishMeta,
  IngredientList,
  DishSteps,
  CommentsSection,
  DishCard,
} from '../components/domain'
import AddToPlanModal from '../components/domain/AddToPlanModal'
import { CAT_RU } from '../components/domain/dishCategories'

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcoBack   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
const IcoHeart  = ({ filled }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const IcoPlan   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16M8 15h2M12 15h4"/></svg>
const IcoDots   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
const IcoEdit   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoCopy   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const IcoDelete = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const IcoShare   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>

// ─── ImageSlider ─────────────────────────────────────────────────────────────
function ImageSlider({ images, onImageClick }) {
  const scrollRef = useRef(null)
  const timerRef  = useRef(null)
  const items = images.length > 1 ? [images[images.length - 1], ...images, images[0]] : images

  useEffect(() => {
    const el = scrollRef.current
    if (el && images.length > 1) el.scrollLeft = el.offsetWidth
  }, [])

  function handleScroll() {
    if (images.length <= 1) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const el = scrollRef.current
      if (!el) return
      const w = el.offsetWidth
      const pos = Math.round(el.scrollLeft / w)
      if (pos === 0) el.scrollTo({ left: images.length * w, behavior: 'instant' })
      if (pos === images.length + 1) el.scrollTo({ left: w, behavior: 'instant' })
    }, 50)
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onClick={onImageClick}
      className="w-full h-full flex overflow-x-auto scrollbar-hide cursor-pointer"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {items.map((url, i) => (
        <div key={i} className="w-full h-full shrink-0" style={{ scrollSnapAlign: 'start' }}>
          <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
        </div>
      ))}
    </div>
  )
}

// ─── ImageGallery (fullscreen lightbox) ───────────────────────────────────────
function ImageGallery({ images, onClose }) {
  const scrollRef = useRef(null)
  const timerRef  = useRef(null)
  const items = images.length > 1 ? [images[images.length - 1], ...images, images[0]] : images

  useEffect(() => {
    const el = scrollRef.current
    if (el && images.length > 1) el.scrollLeft = el.offsetWidth
  }, [])

  function handleScroll() {
    if (images.length <= 1) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const el = scrollRef.current
      if (!el) return
      const w = el.offsetWidth
      const pos = Math.round(el.scrollLeft / w)
      if (pos === 0) el.scrollTo({ left: images.length * w, behavior: 'instant' })
      if (pos === images.length + 1) el.scrollTo({ left: w, behavior: 'instant' })
    }, 50)
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-12 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onClick={e => e.stopPropagation()}
        className="flex-1 flex overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((url, i) => (
          <div key={i} className="w-full h-full shrink-0 flex items-center justify-center" style={{ scrollSnapAlign: 'start' }}>
            <img src={url} alt="" className="max-w-full max-h-full object-contain" draggable={false} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── NutritionBlock ───────────────────────────────────────────────────────────
function NutritionBlock({ nutrition }) {
  const [visible, setVisible] = useState(true)
  if (!nutrition) return null

  const items = [
    { label: 'Калории',  value: nutrition.calories, unit: 'ккал' },
    { label: 'Белки',    value: nutrition.protein,  unit: 'г'    },
    { label: 'Жиры',     value: nutrition.fat,      unit: 'г'    },
    { label: 'Углеводы', value: nutrition.carbs,    unit: 'г'    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-semibold text-text">Пищевая ценность</h2>
          <div className="text-[12px] mt-0.5 text-text-3">на 100 г</div>
        </div>
        <button type="button" onClick={() => setVisible(v => !v)} className="text-[13px] text-text-3 focus:outline-none">
          {visible ? 'Скрыть' : 'Показать'}
        </button>
      </div>
      {visible && (
        <div className="grid grid-cols-4 gap-2">
          {items.map(item => (
            <div key={item.label}
              className="rounded-xl px-2 py-2.5 text-center bg-white border border-border/50">
              <div className="text-sm font-semibold text-text tabular-nums">{item.value}</div>
              <div className="text-2xs text-text-3 leading-tight mt-0.5">{item.unit}</div>
              <div className="text-2xs text-text-2 leading-tight mt-0.5">{item.label}</div>
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
        className="w-full bg-white rounded-t-3xl px-4 pt-5 pb-8 flex flex-col gap-1 shadow-top"
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
  const user  = useStore(s => s.user)
  const token = useStore(s => s.token)
  const { show, Toast } = useToast()

  const [dish, setDish]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [loadError, setLoadError]     = useState(null)
  const [showGallery, setShowGallery] = useState(false)
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
        if (token && d.visibility !== 'PUBLIC') {
          api.getComments(id).then(setComments).catch(() => {})
        }
      })
      .catch(e => setLoadError(e.message || 'Не удалось загрузить блюдо'))
      .finally(() => setLoading(false))

    api.getRecommendations(id).then(setRecs).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!token) return
    api.getGroups()
      .then(groups => setHasFamilyGroup(groups.some(g => g.type === 'FAMILY')))
      .catch(() => {})
    api.getFavoriteIds()
      .then(({ dishIds }) => setIsFav(dishIds.includes(id)))
      .catch(() => {})
  }, [id, token])

  async function toggleFav() {
    try {
      if (isFav) { await api.removeFavorite(id); setIsFav(false) }
      else        { await api.addFavorite(id);    setIsFav(true)  }
    } catch (e) { show(e.message, 'error') }
  }

  async function handleShare() {
    const url = window.location.href
    const title = dish.name
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      show('Ссылка скопирована', 'success')
    }
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
  if (loadError) return (
    <div className="fixed inset-0 z-[150] bg-bg flex flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-text-2">{loadError}</p>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="px-5 py-2.5 rounded-2xl bg-bg-2 border border-border text-sm font-medium text-text"
      >Назад</button>
    </div>
  )
  if (!dish) return null

  const isOwner    = user && dish.authorId === user.id
  const SUPABASE_IMG = 'https://nwtqeytmmqmkwqafkgin.supabase.co/storage/v1/object/public/media/images'
  const cat = dish.categories?.[0]
  const fallbackImg = cat ? `${SUPABASE_IMG}/${cat.toLowerCase()}.jpg` : null
  const dishImages = dish.images?.length ? dish.images
    : dish.imageUrl ? [dish.imageUrl]
    : fallbackImg ? [fallbackImg]
    : []

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-bg">

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* ── Hero image or plain header ── */}
        {dishImages.length > 0 ? (
          <div className="relative">
            <div className="relative h-[250px] overflow-hidden">
              <ImageSlider images={dishImages} onImageClick={() => setShowGallery(true)} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              {/* Top action row over image */}
              <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-4 pt-12 pb-3" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white shrink-0"
                >
                  <IcoBack />
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white"
                >
                  <IcoShare />
                </button>
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
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <h1 className="text-[22px] font-bold text-white leading-tight">{dish.name}</h1>
              </div>
            </div>
          </div>
        ) : (
          /* No image — own top bar */
          <div className="bg-bg pt-12 px-4 pb-5">
            <div className="flex items-center gap-2 mb-5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-text-2 shrink-0 shadow-sm"
              >
                <IcoBack />
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={handleShare}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-text-2 shadow-sm"
              >
                <IcoShare />
              </button>
              {user && (
                <button
                  type="button"
                  onClick={toggleFav}
                  className={['w-9 h-9 flex items-center justify-center rounded-full transition-colors shadow-sm',
                    isFav ? 'bg-accent text-white' : 'bg-white text-text-2',
                  ].join(' ')}
                >
                  <IcoHeart filled={isFav} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowMenu(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-text-2 shadow-sm"
              >
                <IcoDots />
              </button>
            </div>

            <h1 className="text-[24px] font-bold text-text leading-tight">{dish.name}</h1>
            {dish.description && (
              <p className="text-sm text-text-2 mt-2 leading-relaxed">{dish.description}</p>
            )}
          </div>
        )}

        {/* ── Description (if had hero image) ── */}
        {dishImages.length > 0 && dish.description && (
          <div className="px-4 pt-4">
            <p className="text-sm text-text-2 leading-relaxed">{dish.description}</p>
          </div>
        )}

        {/* ── DishMeta (cook time) ── */}
        <DishMeta dish={dish} />

        {/* ── Content ── */}
        <div className="px-4 flex flex-col divide-y divide-border/60 border-t border-border/60 mt-4">
          <div className="py-6"><IngredientList ingredients={dish.ingredients} /></div>
          <div className="py-6"><DishSteps recipe={dish.recipe} /></div>
          <div className="py-6"><NutritionBlock nutrition={dish.nutrition} /></div>

          {/* ── Clickable meta: categories, cuisine, tags ── */}
          {(dish.categories?.length > 0 || dish.tags?.length > 0) && (
            <div className="py-5 flex flex-wrap gap-2">
              {dish.categories?.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => navigate(`/dishes?category=${cat}`)}
                  className="text-xs text-text-2 bg-white rounded-full px-3 py-1.5 border border-border/60 active:bg-bg-2"
                >
                  {CAT_RU[cat] || cat}
                </button>
              ))}
              {dish.tags?.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => navigate(`/dishes?tag=${encodeURIComponent(t)}`)}
                  className="text-xs text-text-2 bg-white rounded-full px-3 py-1.5 border border-border/60 active:bg-bg-2"
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          {/* ── Owner actions ── */}
          {isOwner && (
            <div className="py-5 flex gap-3">
              <button
                type="button"
                onClick={() => navigate(`/dishes/${id}/edit`)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-sm font-medium text-text-2 bg-white active:bg-bg-2"
              >
                <IcoEdit /> Редактировать
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 text-sm font-medium text-red-400 bg-white active:bg-red-50"
              >
                <IcoDelete /> Удалить
              </button>
            </div>
          )}

          {comments !== null && (
            <div className="py-6">
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
                      <DishCard
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

      {/* ── FAB: Буду готовить ── */}
      <button
        type="button"
        onClick={() => setShowPlanModal(true)}
        className="fixed bottom-6 right-4 z-[140] w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-lg active:opacity-90 transition-opacity"
      >
        <IcoPlan />
      </button>

      {/* ── Modals ── */}
      {showGallery && dishImages.length > 0 && (
        <ImageGallery images={dishImages} onClose={() => setShowGallery(false)} />
      )}

      {showMenu && (
        <ActionsMenu
          onClose={() => setShowMenu(false)}
          onEdit={() => { setShowMenu(false); navigate(`/dishes/${id}/edit`) }}
          onCopy={() => { setShowMenu(false); navigate(`/dishes/new?copyFrom=${id}`) }}
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
            <DishCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
          </div>
        ))}
      </div>
    </div>
  )
}
