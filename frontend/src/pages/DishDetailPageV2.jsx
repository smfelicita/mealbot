// DishDetailPageV2 — детальная страница блюда, редизайн.
// Портировано из context/design/dish-detail-v2.jsx.
// Маршрут: /v2/dishes/:id

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Heart, Share2, MoreVertical,
  Clock, ChefHat, Utensils, Globe,
  CalendarPlus, Refrigerator, Pin, ArrowUp,
  Check, Edit3, Trash2, Copy,
} from 'lucide-react'

import { api } from '../api'
import { useStore } from '../store'
import { Loader, Avatar, useToast } from '../components/ui'
import AddToPlanModal from '../components/domain/AddToPlanModal'
import { CAT_RU } from '../components/domain/dishCategories'

const MEAL_LABEL = {
  BREAKFAST: 'Завтрак',
  LUNCH:     'Обед',
  DINNER:    'Ужин',
  SNACK:     'Перекус',
  ANYTIME:   'Любое',
}
const DIFF_LABEL = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' }

const SUPABASE_IMG = 'https://nwtqeytmmqmkwqafkgin.supabase.co/storage/v1/object/public/media/images'

// Парсит recipe-строку на список шагов.
// Если есть "1. ..." — берём эти пункты, иначе режем по \n\n.
function parseSteps(recipe) {
  if (!recipe) return []
  const lines = recipe.split('\n').map(l => l.trim()).filter(Boolean)
  const numbered = lines
    .map(l => l.match(/^\d+[.)]\s+(.+)/))
    .filter(Boolean)
    .map(m => m[1])
  if (numbered.length >= 2) return numbered
  return recipe.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
}

// ═══ Hero (слайдер фото) ══════════════════════════════════════════
function Hero({ images, photoIdx, setPhotoIdx, children }) {
  const scrollRef = useRef(null)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const w = el.offsetWidth
    const idx = Math.round(el.scrollLeft / w)
    if (idx !== photoIdx) setPhotoIdx(idx)
  }

  function goTo(i) {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' })
  }

  return (
    <div className="relative w-full h-[320px] overflow-hidden bg-bg-3">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full flex overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="w-full h-full shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
          </div>
        ))}
      </div>

      {/* градиенты */}
      <div
        className="absolute top-0 inset-x-0 h-28 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(28,25,23,0.5) 0%, rgba(28,25,23,0) 100%)' }}
      />
      <div
        className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, var(--color-bg) 0%, rgba(246,244,239,0) 100%)' }}
      />

      {/* верхние контролы */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
        {children}
      </div>

      {/* индикаторы */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === photoIdx ? 20 : 6,
                background: i === photoIdx ? 'var(--color-text)' : 'rgba(28,25,23,0.28)',
              }}
              aria-label={`Фото ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ Круглая кнопка в hero ═════════════════════════════════════════
function HeroButton({ icon, onClick, active, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        'w-10 h-10 rounded-full flex items-center justify-center',
        'shadow-sm active:scale-95 transition',
        active ? 'bg-accent text-white' : 'bg-white/95 text-text',
      ].join(' ')}
    >
      {icon}
    </button>
  )
}

// ═══ MetaStripInline (4 метрики с разделителями) ═══════════════════
function DishMetaStrip({ cookTime, difficulty, cuisine, mealTime }) {
  const firstMeal = Array.isArray(mealTime) ? mealTime[0] : mealTime
  const mealLabel = MEAL_LABEL[firstMeal] || MEAL_LABEL.ANYTIME
  const items = [
    { Icon: Clock,    value: cookTime || '—',                 unit: cookTime ? 'мин' : null,    label: 'время' },
    { Icon: Utensils, value: mealLabel,                        unit: null,                       label: 'приём' },
    { Icon: ChefHat,  value: DIFF_LABEL[difficulty] || '—',    unit: null,                       label: 'сложность' },
    { Icon: Globe,    value: cuisine || '—',                   unit: null,                       label: 'кухня' },
  ]
  return (
    <div className="mx-5 mt-5 rounded-2xl bg-bg-2 border border-border flex justify-between items-stretch px-2.5 py-3.5">
      {items.map((it, i, arr) => (
        <div key={i} className="flex-1 min-w-0 flex items-stretch">
          <div className="flex-1 flex flex-col items-center gap-1 px-0.5">
            <it.Icon size={17} strokeWidth={1.8} className="text-accent" />
            <div
              className="text-[13px] font-bold leading-tight text-center text-text"
              style={{ overflowWrap: 'anywhere' }}
            >
              {it.value}
              {it.unit && (
                <span className="ml-0.5 text-[10.5px] font-semibold text-text-2">{it.unit}</span>
              )}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-text-3">
              {it.label}
            </div>
          </div>
          {i < arr.length - 1 && <div className="w-px bg-border my-1" />}
        </div>
      ))}
    </div>
  )
}

// ═══ Ingredients (Вариант В — карточки строкой с фоном) ════════════
function IngredientsSection({ ingredients, fridgeIds, token }) {
  const [fridgeMode, setFridgeMode] = useState(false)

  if (!ingredients?.length) return null

  const items = ingredients.map(i => {
    const inFridge = fridgeIds.has(i.ingredientId ?? i.id)
    const basic = i.toTaste || i.isBasic
    const amountStr = i.toTaste
      ? 'по вкусу'
      : (i.amountValue && i.unit ? `${i.amountValue} ${i.unit}` : i.amount || '')
    return {
      id: i.id,
      name: i.name,
      amount: amountStr,
      inFridge,
      basic,
      optional: i.optional,
    }
  })

  const missingCount = items.filter(i => !i.inFridge && !i.basic).length
  const haveCount    = items.filter(i =>  i.inFridge && !i.basic).length
  const totalCount   = items.filter(i => !i.basic).length
  const canToggleFridge = token && fridgeIds.size > 0

  return (
    <section className="mt-7">
      <div className="px-5 flex items-center justify-between mb-3">
        <h2 className="text-[17px] font-bold tracking-tight text-text">Ингредиенты</h2>
        {canToggleFridge && (
          <button
            type="button"
            onClick={() => setFridgeMode(m => !m)}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-bold transition-colors border',
              fridgeMode
                ? 'bg-sage-muted border-sage-border text-sage'
                : 'bg-accent-muted border-accent-border text-accent',
            ].join(' ')}
          >
            <Refrigerator size={14} strokeWidth={2.2} />
            {fridgeMode ? 'из моего' : `не хватает ${missingCount}`}
          </button>
        )}
      </div>

      <div className="px-5 flex flex-col gap-[7px]">
        {items.map(ing => {
          const checked = ing.inFridge
          const dim = fridgeMode && !checked && !ing.basic
          return (
            <div
              key={ing.id}
              className={[
                'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-colors',
                checked
                  ? 'bg-sage-muted border-sage-border'
                  : 'bg-bg-2 border-border',
              ].join(' ')}
              style={{ opacity: dim ? 0.35 : 1 }}
            >
              {checked ? (
                <div className="w-[22px] h-[22px] rounded-full bg-sage flex items-center justify-center flex-shrink-0 text-white">
                  <Check size={12} strokeWidth={3} />
                </div>
              ) : (
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 border-[1.5px] border-dashed border-accent"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
              )}
              <div
                className={[
                  'flex-1 min-w-0 text-[14.5px] font-semibold',
                  ing.basic ? 'text-text-3' : 'text-text',
                ].join(' ')}
                style={{ textWrap: 'pretty' }}
              >
                {ing.name}
                {ing.optional && (
                  <span className="text-text-3 text-xs ml-1.5 font-normal">· необязательно</span>
                )}
              </div>
              {ing.amount && (
                <div
                  className={[
                    'text-[13px] tabular-nums flex-shrink-0',
                    checked ? 'text-sage font-bold' : 'text-text-3 font-medium',
                  ].join(' ')}
                >
                  {ing.amount}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {canToggleFridge && totalCount > 0 && (
        <div className="mx-5 mt-3.5 rounded-xl bg-sage-muted text-sage text-[12.5px] font-semibold flex items-center gap-2.5 px-3.5 py-2.5">
          <Refrigerator size={16} strokeWidth={2} />
          В холодильнике есть {haveCount} из {totalCount}
        </div>
      )}
    </section>
  )
}

// ═══ Steps ═════════════════════════════════════════════════════════
function StepsSection({ steps }) {
  if (!steps.length) return null
  return (
    <section className="mt-8">
      <div className="px-5 mb-3">
        <h2 className="text-[17px] font-bold tracking-tight text-text">Приготовление</h2>
        <div className="text-[12px] mt-0.5 text-text-3">{steps.length} шагов</div>
      </div>
      <div className="px-5 flex flex-col gap-3.5">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3.5 items-start">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[20px] font-extrabold tabular-nums bg-accent-muted text-accent">
              {i + 1}
            </div>
            <div
              className="flex-1 pt-1 text-[14.5px] leading-relaxed text-text"
              style={{ textWrap: 'pretty' }}
            >
              {s}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ═══ Nutrition ═════════════════════════════════════════════════════
function NutritionSection({ nutrition }) {
  if (!nutrition || !nutrition.calories) return null
  const items = [
    { value: nutrition.calories, unit: 'ккал', label: 'калории',  color: 'var(--color-accent)'          },
    { value: nutrition.protein,  unit: 'г',    label: 'белки',    color: 'var(--color-sage)'            },
    { value: nutrition.fat,      unit: 'г',    label: 'жиры',     color: 'var(--color-nutrition-fat)'   },
    { value: nutrition.carbs,    unit: 'г',    label: 'углеводы', color: 'var(--color-nutrition-carbs)' },
  ]
  return (
    <section className="mt-7">
      <div className="px-5 mb-3">
        <h2 className="text-[17px] font-bold tracking-tight text-text">Пищевая ценность</h2>
        <div className="text-[12px] mt-0.5 text-text-3">на 100 г</div>
      </div>
      <div className="mx-5 rounded-2xl bg-bg-2 border border-border flex justify-between items-stretch px-2.5 py-3.5">
        {items.map((t, i, arr) => (
          <div key={i} className="flex-1 min-w-0 flex items-stretch">
            <div className="flex-1 flex flex-col items-center gap-1 px-0.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: t.color }}
              />
              <div className="text-[13px] font-bold leading-tight text-center text-text">
                {t.value ?? '—'}
                {t.unit && (
                  <span className="ml-0.5 text-[10.5px] font-semibold text-text-2">{t.unit}</span>
                )}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text-3">
                {t.label}
              </div>
            </div>
            {i < arr.length - 1 && <div className="w-px bg-border my-1" />}
          </div>
        ))}
      </div>
    </section>
  )
}

// ═══ Categories + tags ═════════════════════════════════════════════
function TagsSection({ categories, tags, onCategoryClick, onTagClick }) {
  if (!categories?.length && !tags?.length) return null
  return (
    <section className="mt-8">
      <div className="px-5 mb-3">
        <h2 className="text-[17px] font-bold tracking-tight text-text">Категории и теги</h2>
      </div>
      <div className="px-5 flex flex-wrap gap-1.5">
        {categories?.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onCategoryClick?.(c)}
            className="px-3 py-1.5 rounded-full text-[12.5px] font-bold bg-accent-muted text-accent border border-accent-border"
          >
            {CAT_RU[c] || MEAL_LABEL[c] || c}
          </button>
        ))}
        {tags?.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => onTagClick?.(t)}
            className="px-3 py-1.5 rounded-full text-[12.5px] font-semibold bg-bg-2 text-text-2 border border-border"
          >
            #{t}
          </button>
        ))}
      </div>
    </section>
  )
}

// ═══ Similar (похожие блюда) ═══════════════════════════════════════
function SimilarSection({ dishes, onOpen }) {
  if (!dishes?.length) return null
  return (
    <section className="mt-8">
      <div className="px-5 mb-3">
        <h2 className="text-[17px] font-bold tracking-tight text-text">Попробуй также</h2>
      </div>
      <div
        className="flex gap-3 overflow-x-auto px-5 pb-1.5"
        style={{ scrollbarWidth: 'none' }}
      >
        {dishes.map(d => {
          const img = d.images?.[0] || d.imageUrl
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onOpen(d.id)}
              className="w-[168px] flex-shrink-0 text-left"
            >
              <div className="w-full h-[120px] rounded-[14px] overflow-hidden relative bg-bg-3 border border-border">
                {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                {d.cookTime && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-0.5 text-text">
                    <Clock size={10} strokeWidth={2.5} />
                    {d.cookTime}м
                  </div>
                )}
              </div>
              <div
                className="mt-2 text-[13.5px] font-bold leading-tight text-text"
                style={{ textWrap: 'pretty' }}
              >
                {d.name}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ═══ Comments ══════════════════════════════════════════════════════
function CommentsSection({ dishId, comments, setComments, token, currentUserId, dishAuthorId }) {
  const [draft, setDraft] = useState('')
  const { show } = useToast()
  const canPin = currentUserId && currentUserId === dishAuthorId

  async function send() {
    const text = draft.trim()
    if (!text) return
    try {
      const c = await api.addComment(dishId, text)
      setComments(prev => [c, ...(prev || [])])
      setDraft('')
    } catch (e) {
      show(e.message || 'Не удалось отправить', 'error')
    }
  }

  async function handlePin(id) {
    try {
      const updated = await api.pinComment(id)
      setComments(prev => (prev || []).map(c => c.id === id ? updated : c))
    } catch (e) { show(e.message, 'error') }
  }
  async function handleDelete(id) {
    try {
      await api.deleteComment(id)
      setComments(prev => (prev || []).filter(c => c.id !== id))
    } catch (e) { show(e.message, 'error') }
  }

  const list = comments || []

  return (
    <section className="mt-8">
      <div className="px-5 mb-3 flex items-baseline gap-2">
        <h2 className="text-[17px] font-bold tracking-tight text-text">Комментарии</h2>
        <div className="text-[12px] text-text-3">{list.length}</div>
      </div>

      <div className="px-5 flex flex-col gap-3.5">
        {list.map(c => (
          <div
            key={c.id}
            className={[
              'flex gap-2.5',
              c.pinned ? 'p-3 rounded-xl bg-accent-muted border border-accent-border' : '',
            ].join(' ')}
          >
            <Avatar name={c.author?.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13.5px] font-bold text-text">{c.author?.name || 'Пользователь'}</span>
                {c.pinned && (
                  <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold uppercase tracking-wide rounded-full bg-accent-muted text-accent border border-accent-border px-1.5 py-0.5">
                    <Pin size={9} strokeWidth={2.5} />
                    закреплено
                  </span>
                )}
                {c.createdAt && (
                  <span className="text-[11.5px] text-text-3">
                    · {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
              <div
                className="text-[13.5px] leading-relaxed mt-1 text-text"
                style={{ textWrap: 'pretty' }}
              >
                {c.content}
              </div>
              {(canPin || currentUserId === c.authorId) && (
                <div className="mt-1.5 flex gap-3">
                  {canPin && (
                    <button
                      type="button"
                      onClick={() => handlePin(c.id)}
                      className="text-[11.5px] text-text-3 hover:text-accent"
                    >
                      {c.pinned ? 'Открепить' : 'Закрепить'}
                    </button>
                  )}
                  {currentUserId === c.authorId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="text-[11.5px] text-text-3 hover:text-red-500"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {token && (
        <div className="px-5 mt-4">
          <div className="flex items-center gap-2 bg-bg-2 rounded-full border border-border pl-4 pr-1.5 py-1.5">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Написать комментарий…"
              className="flex-1 bg-transparent outline-none text-[13.5px] text-text placeholder:text-text-3 min-w-0"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim()}
              aria-label="Отправить"
              className={[
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                draft.trim() ? 'bg-accent text-white' : 'bg-border text-text-3',
              ].join(' ')}
            >
              <ArrowUp size={16} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

// ═══ Actions bottom sheet ══════════════════════════════════════════
function ActionsSheet({ onClose, isOwner, hasUser, onCopy, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-[430px] mx-auto bg-bg-2 rounded-t-3xl px-4 pt-5 pb-8 flex flex-col gap-1 shadow-top"
        onClick={e => e.stopPropagation()}
      >
        {hasUser && (
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-3 px-3 py-3.5 rounded-2xl text-[15px] font-medium text-text hover:bg-bg-3 text-left"
          >
            <Copy size={18} className="text-text-2" />
            Копировать рецепт
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-3 px-3 py-3.5 rounded-2xl text-[15px] font-medium text-text hover:bg-bg-3 text-left"
          >
            <Edit3 size={18} className="text-text-2" />
            Редактировать
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-3 px-3 py-3.5 rounded-2xl text-[15px] font-medium text-red-500 hover:bg-red-50 text-left"
          >
            <Trash2 size={18} />
            Удалить
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

// ═══ DishDetailPageV2 ══════════════════════════════════════════════
export default function DishDetailPageV2() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user   = useStore(s => s.user)
  const token  = useStore(s => s.token)
  const fridge = useStore(s => s.fridge)
  const { show, Toast } = useToast()

  const [dish, setDish]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState(null)
  const [photoIdx, setPhotoIdx]     = useState(0)
  const [recs, setRecs]             = useState(null)
  const [isFav, setIsFav]           = useState(false)
  const [comments, setComments]     = useState(null)
  const [showMenu, setShowMenu]     = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [hasFamilyGroup, setHasFamilyGroup] = useState(false)

  useEffect(() => {
    setLoading(true)
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
    if (!token) return
    try {
      if (isFav) { await api.removeFavorite(id); setIsFav(false) }
      else       { await api.addFavorite(id);    setIsFav(true)  }
    } catch (e) { show(e.message, 'error') }
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: dish.name, url }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url)
        show('Ссылка скопирована', 'success')
      } catch {}
    }
  }

  async function handleDelete() {
    setShowMenu(false)
    if (!confirm(`Удалить "${dish.name}"?`)) return
    try {
      await api.deleteDish(id)
      navigate('/v2', { replace: true })
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

  const isOwner = user && dish.authorId === user.id
  const cat = dish.categories?.[0]
  const fallbackImg = cat ? `${SUPABASE_IMG}/${cat.toLowerCase()}.jpg` : null
  const images = dish.images?.length
    ? dish.images
    : dish.imageUrl ? [dish.imageUrl]
    : fallbackImg ? [fallbackImg]
    : []

  const fridgeIds = new Set(fridge.map(f => f.ingredientId))
  const steps = parseSteps(dish.recipe)
  const author = dish.author || {}
  const similar = recs?.similar || recs?.fromFridge || []

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-bg overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="relative mx-auto max-w-app pb-32">
          {/* ── Hero ─────────────────────────────────────────── */}
          {images.length > 0 ? (
            <Hero images={images} photoIdx={photoIdx} setPhotoIdx={setPhotoIdx}>
              <HeroButton
                icon={<ChevronLeft size={20} strokeWidth={2} />}
                onClick={() => navigate(-1)}
                ariaLabel="Назад"
              />
              <div className="flex gap-2">
                <HeroButton
                  icon={<Share2 size={18} strokeWidth={2} />}
                  onClick={handleShare}
                  ariaLabel="Поделиться"
                />
                {user && (
                  <HeroButton
                    icon={<Heart size={18} strokeWidth={2.2} fill={isFav ? '#fff' : 'none'} />}
                    onClick={toggleFav}
                    active={isFav}
                    ariaLabel={isFav ? 'Убрать из избранного' : 'В избранное'}
                  />
                )}
                <HeroButton
                  icon={<MoreVertical size={18} strokeWidth={2} />}
                  onClick={() => setShowMenu(true)}
                  ariaLabel="Ещё"
                />
              </div>
            </Hero>
          ) : (
            /* без фото: компактный top-bar */
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center text-text"
                aria-label="Назад"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center text-text"
                  aria-label="Поделиться"
                >
                  <Share2 size={18} strokeWidth={2} />
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={toggleFav}
                    className={[
                      'w-10 h-10 rounded-full border flex items-center justify-center',
                      isFav ? 'bg-accent text-white border-accent' : 'bg-bg-2 border-border text-text',
                    ].join(' ')}
                  >
                    <Heart size={18} strokeWidth={2.2} fill={isFav ? '#fff' : 'none'} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMenu(true)}
                  className="w-10 h-10 rounded-full bg-bg-2 border border-border flex items-center justify-center text-text"
                  aria-label="Ещё"
                >
                  <MoreVertical size={18} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* ── Title + description ──────────────────────────── */}
          <div className={['px-5 relative', images.length > 0 ? '-mt-4' : 'mt-3'].join(' ')}>
            <h1
              className="text-[26px] font-extrabold leading-[1.2] tracking-tight text-text"
              style={{ textWrap: 'pretty' }}
            >
              {dish.name}
            </h1>
            {dish.description && (
              <p className="mt-2.5 text-[15px] leading-relaxed text-text-2">
                {dish.description}
              </p>
            )}

            {(author.name || isOwner) && (
              <div className="mt-3.5 flex items-center gap-2">
                <Avatar name={author.name || user?.name} size="sm" />
                <div className="text-[13px] text-text-2">
                  Рецепт от{' '}
                  <span className="font-semibold text-text">
                    {author.name || (isOwner ? user?.name : '—')}
                  </span>
                  {isOwner && (
                    <span className="ml-2 font-semibold text-accent">· Ваш рецепт</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Meta strip ───────────────────────────────────── */}
          <DishMetaStrip
            cookTime={dish.cookTime}
            difficulty={dish.difficulty}
            cuisine={dish.cuisine}
            mealTime={dish.mealTime}
          />

          {/* ── Ingredients ──────────────────────────────────── */}
          <IngredientsSection
            ingredients={dish.ingredients}
            fridgeIds={fridgeIds}
            token={token}
          />

          {/* ── Steps ────────────────────────────────────────── */}
          <StepsSection steps={steps} />

          {/* ── Nutrition ────────────────────────────────────── */}
          <NutritionSection nutrition={dish.nutrition} />

          {/* ── Categories + tags ────────────────────────────── */}
          <TagsSection
            categories={dish.categories}
            tags={dish.tags}
            onCategoryClick={c => navigate(`/dishes?category=${c}`)}
            onTagClick={t => navigate(`/dishes?tag=${encodeURIComponent(t)}`)}
          />

          {/* ── Similar ──────────────────────────────────────── */}
          <SimilarSection
            dishes={similar}
            onOpen={dishId => navigate(`/v2/dishes/${dishId}`)}
          />

          {/* ── Comments ─────────────────────────────────────── */}
          {comments !== null && (
            <CommentsSection
              dishId={id}
              comments={comments}
              setComments={setComments}
              token={token}
              currentUserId={user?.id}
              dishAuthorId={dish.authorId}
            />
          )}
        </div>
      </div>

      {/* ── FAB «В план» ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => token ? setShowPlanModal(true) : navigate('/auth?mode=register')}
        className="fixed bottom-6 right-6 h-[52px] rounded-full flex items-center gap-2 text-[14.5px] font-bold text-white active:scale-95 transition bg-accent px-5 pl-4 z-[200]"
        style={{ boxShadow: '0 8px 24px rgba(196,112,74,0.45), 0 2px 6px rgba(196,112,74,0.3)' }}
      >
        <CalendarPlus size={18} strokeWidth={2.2} />
        В план готовки
      </button>

      {/* ── Modals ────────────────────────────────────────────── */}
      {showMenu && (
        <ActionsSheet
          onClose={() => setShowMenu(false)}
          isOwner={isOwner}
          hasUser={Boolean(user)}
          onCopy={() => { setShowMenu(false); navigate(`/dishes/new?copyFrom=${id}`) }}
          onEdit={() => { setShowMenu(false); navigate(`/dishes/${id}/edit`) }}
          onDelete={handleDelete}
        />
      )}
      {showPlanModal && (
        <AddToPlanModal
          dish={dish}
          hasFamilyGroup={hasFamilyGroup}
          onClose={() => setShowPlanModal(false)}
          onAdded={() => show('Добавлено в план', 'success')}
        />
      )}

      {Toast}
    </div>
  )
}
