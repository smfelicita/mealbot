// MealPlanPage — план готовки.
// Портировано из context/design/plan-v2.jsx.
// Состояния: guest / empty / normal.
// FilterChips (Все/Мои/Семейные) показываются только если есть family-группа.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, CalendarPlus, Sun, Utensils, Moon, Cookie,
  X, Sparkles, Flame, Clock, Plus,
} from 'lucide-react'

import { api } from '../api'
import { useStore } from '../store'
import { Loader, GuestBlock, PageHeader, useToast } from '../components/ui'

// ─── Константы ────────────────────────────────────────────────────
const SUPABASE_IMG = 'https://nwtqeytmmqmkwqafkgin.supabase.co/storage/v1/object/public/media/images'

const MEAL_META = {
  BREAKFAST: { label: 'Завтрак', icon: Sun },
  LUNCH:     { label: 'Обед',    icon: Utensils },
  DINNER:    { label: 'Ужин',    icon: Moon },
  SNACK:     { label: 'Перекус', icon: Cookie },
  ANYTIME:   { label: null,      icon: null },
}

const MEAL_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'ANYTIME']

// ─── Helpers ──────────────────────────────────────────────────────
function todayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function dateKey(plan) {
  return plan.date ? plan.date.slice(0, 10) : 'no-date'
}

function fmtDate(iso) {
  if (iso === 'no-date') return 'Без даты'
  return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function fmtDateUpper(iso) {
  return fmtDate(iso).toUpperCase()
}

function pluralDish(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'блюдо'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'блюда'
  return 'блюд'
}

function pluralDay(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'день'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'дня'
  return 'дней'
}

function dishImage(dish) {
  if (!dish) return null
  const uploaded = dish.images?.[0] || dish.imageUrl
  if (uploaded) return uploaded
  const cat = dish.categories?.[0]
  return cat ? `${SUPABASE_IMG}/${cat.toLowerCase()}.jpg` : null
}

function groupBy(arr, fn) {
  const map = new Map()
  for (const x of arr) {
    const k = fn(x)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(x)
  }
  return map
}

// ═══ FilterChips ══════════════════════════════════════════════════
function FilterChips({ active, onChange, counts }) {
  const items = [
    { id: 'all',    label: 'Все',      n: counts.all    },
    { id: 'mine',   label: 'Мои',      n: counts.mine   },
    { id: 'family', label: 'Семейные', n: counts.family },
  ]
  return (
    <div className="-mx-5 px-5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-2" style={{ width: 'max-content' }}>
        {items.map(t => {
          const on = t.id === active
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={[
                'h-9 px-3.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 border',
                on
                  ? 'bg-accent-muted border-accent-border text-accent'
                  : 'bg-bg-2 border-border text-text-2',
              ].join(' ')}
            >
              {t.label}
              <span
                className={['tabular-nums font-bold', on ? 'text-accent' : 'text-text-3'].join(' ')}
              >
                · {t.n}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ═══ MetaStrip ════════════════════════════════════════════════════
function MetaStrip({ today, week, total, sageTotal }) {
  const Cell = ({ label, value, sage }) => (
    <div className={[
      'flex-1 rounded-xl px-3 py-2.5 flex flex-col border',
      sage ? 'bg-sage-muted border-sage-border' : 'bg-bg-2 border-border',
    ].join(' ')}>
      <div
        className={[
          'text-[10.5px] font-bold uppercase tracking-wider',
          sage ? 'text-sage' : 'text-text-3',
        ].join(' ')}
        style={{ letterSpacing: 0.6 }}
      >
        {label}
      </div>
      <div
        className={[
          'text-[18px] font-extrabold tabular-nums leading-none mt-1',
          sage ? 'text-sage' : 'text-text',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  )
  return (
    <div className="flex gap-2">
      <Cell label="Сегодня" value={today} />
      <Cell label="Неделя"  value={week} />
      <Cell label="Всего"   value={total} sage={sageTotal} />
    </div>
  )
}

// ═══ AuthorAvatar (для plan-row, показывается только если addedBy ≠ я) ═
function AuthorAvatar({ user, currentUserId, size = 24 }) {
  if (!user || user.id === currentUserId) return null
  const initial = (user.name || '?').trim().charAt(0).toUpperCase()
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0
        bg-bg-3 border border-border text-accent"
      style={{ width: size, height: size, fontSize: size * 0.46 }}
      title={`Добавил(а): ${user.name}`}
    >
      {initial}
    </div>
  )
}

// ═══ MealSubLabel ═════════════════════════════════════════════════
function MealSubLabel({ mealType, accent = false }) {
  const meta = MEAL_META[mealType]
  if (!meta?.label) return null
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} strokeWidth={2.2} className={accent ? 'text-accent' : 'text-text'} />
      <span className={['text-[13px] font-bold', accent ? 'text-accent' : 'text-text'].join(' ')}>
        {meta.label}
      </span>
    </div>
  )
}

// ═══ PlanRow ══════════════════════════════════════════════════════
function PlanRow({ plan, currentUserId, onOpen, onRemove, accent = false }) {
  const dish = plan.dish
  const img = dishImage(dish)
  const isOwn = plan.userId === currentUserId

  return (
    <div
      className={[
        'flex items-center gap-3',
        accent ? 'border-0 rounded-none p-0 bg-transparent' : 'bg-bg-2 border border-border rounded-2xl p-3',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-xl border border-border bg-bg-3 overflow-hidden flex items-center justify-center"
        style={{ width: 60, height: 60 }}
      >
        {img
          ? <img src={img} alt="" className="w-full h-full object-cover" />
          : <Flame size={20} strokeWidth={1.6} className="text-text-3" />}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="flex-1 min-w-0 text-left"
      >
        <div
          className="text-[14.5px] font-semibold leading-snug text-text"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textWrap: 'pretty',
          }}
        >
          {dish?.name || 'Блюдо'}
        </div>
        <div className="flex items-center gap-3 mt-1 text-text-3">
          {dish?.cookTime != null && (
            <span className="inline-flex items-center gap-1 text-[11px] tabular-nums">
              <Clock size={10} strokeWidth={2.2} />
              {dish.cookTime} мин
            </span>
          )}
          {dish?.calories != null && (
            <span className="inline-flex items-center gap-1 text-[11px] tabular-nums">
              <Flame size={10} strokeWidth={2.2} />
              {dish.calories}
            </span>
          )}
          {plan.groupId && (
            <span className="text-[11px] text-sage font-semibold">🏠 Семейный</span>
          )}
        </div>
      </button>

      <AuthorAvatar user={plan.user} currentUserId={currentUserId} />

      {isOwn && (
        <button
          type="button"
          onClick={() => onRemove?.(plan.id)}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-text-3"
          aria-label="Убрать из плана"
        >
          <X size={15} strokeWidth={2.2} />
        </button>
      )}
    </div>
  )
}

// ═══ TodayPinned (group-box, variant A) ═══════════════════════════
function TodayPinned({ items, currentUserId, onOpen, onRemove }) {
  const groups = [...groupBy(items, p => p.mealType).entries()]
    .sort(([a], [b]) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
  const today = todayISO()

  return (
    <section className="rounded-2xl bg-accent-muted border border-accent-border p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} strokeWidth={2.2} className="text-accent" />
        <h2 className="text-[15px] font-bold text-accent">
          Сегодня · {fmtDate(today)}
        </h2>
      </div>
      <div className="text-[12px] mt-0.5 mb-3 text-accent" style={{ opacity: 0.7 }}>
        {items.length} {items.length === 1 ? 'приём пищи запланирован' : 'приёма пищи запланировано'}
      </div>

      <div className="rounded-xl bg-bg-2 border border-accent-border" style={{ padding: '4px 12px' }}>
        {groups.map(([mealType, list], gi) => (
          <div
            key={mealType}
            className={gi === 0 ? '' : 'border-t border-accent-border'}
            style={{ padding: '10px 0' }}
          >
            <MealSubLabel mealType={mealType} accent />
            <div>
              {list.map((p, i) => (
                <div
                  key={p.id}
                  style={i === 0 ? undefined : { borderTop: '1px dashed rgba(196,112,74,0.10)' }}
                >
                  <PlanRow
                    plan={p}
                    currentUserId={currentUserId}
                    onOpen={() => onOpen(p)}
                    onRemove={onRemove}
                    accent
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ═══ DayBlock ═════════════════════════════════════════════════════
function DayBlock({ date, items, currentUserId, onOpen, onRemove }) {
  const groups = [...groupBy(items, p => p.mealType).entries()]
    .sort(([a], [b]) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
  return (
    <section>
      <div
        className="text-[11px] font-bold uppercase tracking-wider pb-2 mb-3 text-text-2 border-b border-border"
        style={{ letterSpacing: 0.8 }}
      >
        {fmtDateUpper(date)}
      </div>
      <div className="flex flex-col gap-4">
        {groups.map(([mealType, list]) => (
          <div key={mealType}>
            <MealSubLabel mealType={mealType} />
            <div className="flex flex-col gap-2">
              {list.map(p => (
                <PlanRow
                  key={p.id}
                  plan={p}
                  currentUserId={currentUserId}
                  onOpen={() => onOpen(p)}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ═══ FAB ══════════════════════════════════════════════════════════
function FAB({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed h-12 px-4 rounded-full flex items-center gap-2 bg-accent text-white text-[13.5px] font-bold z-40
        active:scale-95 transition-transform"
      style={{ right: 16, bottom: 80, boxShadow: '0 8px 24px rgba(196,112,74,0.45)' }}
      aria-label="Добавить в план"
    >
      <Plus size={16} strokeWidth={2.4} />
      В план
    </button>
  )
}

// ═══ EmptyState ═══════════════════════════════════════════════════
function EmptyState({ Icon, title, body, primary, onPrimary, secondary, onSecondary }) {
  return (
    <div className="flex flex-col items-center text-center px-4" style={{ paddingTop: 56 }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-bg-3 border border-border">
        <Icon size={26} strokeWidth={2} className="text-accent" />
      </div>
      <h2 className="mt-4 text-[17px] font-bold text-text" style={{ textWrap: 'balance' }}>
        {title}
      </h2>
      <p className="mt-1 text-[14px] leading-relaxed max-w-[280px] text-text-2" style={{ textWrap: 'pretty' }}>
        {body}
      </p>
      {primary && (
        <button
          type="button"
          onClick={onPrimary}
          className="mt-6 h-12 px-6 rounded-full bg-accent text-white text-[14px] font-bold"
          style={{ boxShadow: '0 6px 18px rgba(196,112,74,0.35)' }}
        >
          {primary}
        </button>
      )}
      {secondary && (
        <button
          type="button"
          onClick={onSecondary}
          className="mt-2 h-10 px-4 rounded-full text-[13px] font-bold text-text-2"
        >
          {secondary}
        </button>
      )}
    </div>
  )
}

// ═══ Guest block ══════════════════════════════════════════════════
function GuestMealPlanBlock() {
  return (
    <div>
      <PageHeader title="План готовки" />
      <div className="px-5 pt-4">
        <GuestBlock
          icon={<Calendar size={26} strokeWidth={1.8} />}
          title="Планируй меню заранее"
          description="Добавляй блюда на неделю вперёд — и больше не думай, что готовить каждый день"
          registerText="Создать свою кухню"
          loginText="Уже есть аккаунт? Войти"
        />
      </div>
    </div>
  )
}

// ═══ Main page ════════════════════════════════════════════════════
export default function MealPlanPage() {
  const navigate = useNavigate()
  const user  = useStore(s => s.user)
  const token = useStore(s => s.token)
  const { show, Toast } = useToast()

  const [plans, setPlans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all') // all | mine | family

  useEffect(() => {
    if (!token) return
    setLoading(true)
    api.getMealPlans()
      .then(setPlans)
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [token])

  async function removePlan(id) {
    try {
      await api.deleteMealPlan(id)
      setPlans(p => p.filter(x => x.id !== id))
    } catch (e) {
      show(e.message, 'error')
    }
  }

  const counts = useMemo(() => ({
    all:    plans.length,
    mine:   plans.filter(p => p.userId === user?.id).length,
    family: plans.filter(p => !!p.groupId).length,
  }), [plans, user?.id])

  const hasFamily = counts.family > 0

  const filtered = useMemo(() => {
    if (filter === 'mine')   return plans.filter(p => p.userId === user?.id)
    if (filter === 'family') return plans.filter(p => !!p.groupId)
    return plans
  }, [plans, filter, user?.id])

  const today = todayISO()
  const todayItems = filtered.filter(p => dateKey(p) === today)
  const futureItems = filtered.filter(p => dateKey(p) !== today)
  const futureByDate = useMemo(() => {
    const m = groupBy(futureItems, dateKey)
    return [...m.entries()].sort(([a], [b]) => {
      if (a === 'no-date') return 1
      if (b === 'no-date') return -1
      return a.localeCompare(b)
    })
  }, [futureItems])

  const days = new Set(filtered.map(dateKey)).size

  // ── Render ────────────────────────────────────────────────────
  if (!token) return <GuestMealPlanBlock />
  if (loading) return <Loader fullPage />

  const isEmpty = plans.length === 0

  return (
    <div>
      <PageHeader
        title="План готовки"
        right={!isEmpty && (
          <span className="text-[12px] tabular-nums text-text-3">
            {filtered.length} {pluralDish(filtered.length)} · {days} {pluralDay(days)}
          </span>
        )}
      />

      <div className="px-5 pb-28">
        {isEmpty ? (
          <div className="mt-7">
            <EmptyState
              Icon={CalendarPlus}
              title="План пока пустой"
              body={'Добавляй блюда в план прямо из карточки рецепта — кнопка «В план готовки»'}
              primary="Посмотреть блюда"
              onPrimary={() => navigate('/dishes')}
            />
          </div>
        ) : (
          <>
            {hasFamily && (
              <div className="mt-3">
                <FilterChips active={filter} onChange={setFilter} counts={counts} />
              </div>
            )}

            <div className="mt-7">
              <MetaStrip
                today={todayItems.length}
                week={filtered.length}
                total={filtered.length}
                sageTotal={filtered.length >= 5}
              />
            </div>

            {todayItems.length > 0 && (
              <div className="mt-7">
                <TodayPinned
                  items={todayItems}
                  currentUserId={user?.id}
                  onOpen={p => navigate(`/dishes/${p.dish?.id}`)}
                  onRemove={removePlan}
                />
              </div>
            )}

            {futureByDate.length > 0 && (
              <div className="mt-7 flex flex-col gap-7">
                {futureByDate.map(([date, items]) => (
                  <DayBlock
                    key={date}
                    date={date}
                    items={items}
                    currentUserId={user?.id}
                    onOpen={p => navigate(`/dishes/${p.dish?.id}`)}
                    onRemove={removePlan}
                  />
                ))}
              </div>
            )}

            {todayItems.length === 0 && futureByDate.length === 0 && (
              <div className="mt-10 text-center text-[13px] text-text-3">
                По выбранному фильтру ничего нет
              </div>
            )}
          </>
        )}
      </div>

      {!isEmpty && <FAB onClick={() => navigate('/dishes')} />}

      {Toast}
    </div>
  )
}
