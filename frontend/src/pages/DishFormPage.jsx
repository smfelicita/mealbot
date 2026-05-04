// DishFormPage — создание / редактирование блюда.
// Портировано из context/design/dish-form-v2.jsx.
// Свой sticky FormHeader (back + Сохранить) — Layout даёт mode='none' для /dishes/new и /dishes/:id/edit.
// Логика как была: state, validation, upload, copyFrom, fromGroup, ingredient picker, visibility.

import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft, Check, X, Plus, Camera, Video, Upload, Star,
  AlertCircle, Eye, Lock, Users, Globe, Sparkles,
} from 'lucide-react'

import { api } from '../api'
import { UNITS, DISH_CATEGORIES as CATEGORIES, MEAL_TIMES, CUISINES, VISIBILITY_OPTIONS } from '../constants'
import { Loader, useToast } from '../components/ui'
import { DishIngredientPicker } from '../components/domain'

// ─── Visibility options с иконками ────────────────────────────────
const VIS_ICON = { PRIVATE: Lock, FAMILY: Users, ALL_GROUPS: Globe }

// ─── Field primitives ─────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <div
      className="text-[10.5px] font-bold uppercase mb-2 px-1 text-text-3"
      style={{ letterSpacing: 0.6 }}
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </div>
  )
}

function PillInput({ value, onChange, placeholder, type = 'text', tabular = false, autoFocus = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={[
        'w-full h-11 px-4 rounded-full bg-bg-2 border border-border outline-none',
        'text-[14.5px] text-text placeholder:text-text-3',
        'focus:border-accent',
        tabular ? 'tabular-nums' : '',
      ].join(' ')}
    />
  )
}

function PillTextarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-2xl bg-bg-2 border border-border outline-none
        text-[14.5px] text-text placeholder:text-text-3 focus:border-accent resize-none"
    />
  )
}

function ErrorLine({ children }) {
  if (!children) return null
  return (
    <div className="flex items-center gap-1 mt-1.5 px-1 text-[12px] text-red-500">
      <AlertCircle size={12} strokeWidth={2.4} />
      {children}
    </div>
  )
}

function Section({ label, required, hint, children }) {
  return (
    <div className="mt-7">
      <div className="flex items-baseline justify-between">
        <Label required={required}>{label}</Label>
        {hint && <div className="text-[10.5px] mb-2 px-1 text-text-3">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

// ─── Sticky form header ───────────────────────────────────────────
function FormHeader({ title, canSave, saving, onBack, onSave }) {
  return (
    <header
      className="h-[52px] px-2 flex items-center justify-between sticky top-0 z-30 border-b border-border"
      style={{
        background: 'rgba(246,244,239,0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        className="w-10 h-10 rounded-full flex items-center justify-center text-text-2 hover:bg-bg-3 transition-colors"
        aria-label="Назад"
      >
        <ChevronLeft size={20} strokeWidth={2} />
      </button>
      <div className="text-[15px] font-bold truncate max-w-[220px] text-text">{title}</div>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave || saving}
        className={[
          'h-9 px-4 rounded-full text-[13px] font-bold transition-opacity',
          canSave && !saving ? 'bg-accent text-white' : 'bg-accent text-white opacity-50',
        ].join(' ')}
        style={canSave && !saving ? { boxShadow: '0 4px 12px rgba(196,112,74,0.30)' } : undefined}
      >
        {saving ? '...' : 'Сохранить'}
      </button>
    </header>
  )
}

// ─── Banners ──────────────────────────────────────────────────────
function GroupBanner({ name }) {
  return (
    <div className="rounded-xl bg-accent-muted border border-accent-border px-3 py-2.5
      flex items-center gap-2 text-[13px] text-accent">
      <Sparkles size={14} strokeWidth={2.2} />
      <span style={{ textWrap: 'pretty' }}>Блюдо будет добавлено в группу «{name}»</span>
    </div>
  )
}

function CopyBanner({ from }) {
  return (
    <div className="rounded-xl bg-sage-muted border border-sage-border px-3 py-2.5
      flex items-center gap-2 text-[13px] text-sage">
      <Eye size={14} strokeWidth={2.2} />
      <span style={{ textWrap: 'pretty' }}>Это копия рецепта «{from}». Адаптируйте под себя.</span>
    </div>
  )
}

// ─── Mode switcher ───────────────────────────────────────────────
function ModeSwitcher({ mode, onChange }) {
  return (
    <div className="flex p-1 rounded-full bg-bg-3 border border-border">
      {[{ id: 'quick', label: 'Быстро' }, { id: 'extended', label: 'Расширенно' }].map(o => {
        const on = o.id === mode
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={[
              'flex-1 h-9 rounded-full text-[13px] font-bold transition-colors',
              on ? 'bg-accent text-white' : 'bg-transparent text-text-2',
            ].join(' ')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Chips (multi-select) ────────────────────────────────────────
function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'h-9 px-3.5 rounded-full text-[13px] font-bold whitespace-nowrap border',
        active
          ? 'bg-accent-muted border-accent-border text-accent'
          : 'bg-bg-2 border-border text-text-2',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function ChipsField({ items, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(it => (
        <Chip key={it.value} active={selected.includes(it.value)} onClick={() => onToggle(it.value)}>
          {it.label}
        </Chip>
      ))}
    </div>
  )
}

// ─── Photo grid ──────────────────────────────────────────────────
function PhotoGrid({ images, onSetMain, onRemove, onAdd, uploading }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => {
          const isMain = i === 0
          return (
            <div
              key={src + i}
              className="relative rounded-xl overflow-hidden bg-bg-2"
              style={{
                aspectRatio: '1',
                boxShadow: isMain
                  ? '0 0 0 2px var(--color-accent)'
                  : '0 0 0 1px var(--color-border)',
              }}
            >
              <img src={src} alt="" className="w-full h-full object-cover block" />
              <button
                type="button"
                onClick={() => onSetMain(i)}
                className="absolute top-[6px] left-[6px] w-[22px] h-[22px] rounded-full flex items-center justify-center"
                style={{ background: isMain ? 'var(--color-accent)' : 'rgba(0,0,0,0.55)' }}
                aria-label={isMain ? 'Главное фото' : 'Сделать главным'}
              >
                <Star size={12} strokeWidth={2.4} color="#fff" fill={isMain ? '#fff' : 'none'} />
              </button>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-[6px] right-[6px] w-[22px] h-[22px] rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)' }}
                aria-label="Удалить фото"
              >
                <X size={12} strokeWidth={2.6} color="#fff" />
              </button>
            </div>
          )
        })}
      </div>
      {images.length < 10 && (
        <label className="block w-full mt-2 cursor-pointer">
          <div
            className="w-full h-11 rounded-full bg-bg-2 border border-border
              flex items-center justify-center gap-2 text-[13.5px] font-bold text-text-2"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-text-3 border-t-transparent animate-spin" />
                Загружаем…
              </>
            ) : (
              <>
                <Camera size={15} strokeWidth={2.2} />
                {images.length === 0 ? 'Загрузить фото' : 'Добавить ещё'}
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={e => { if (e.target.files?.length) onAdd(e.target.files) }}
          />
        </label>
      )}
    </>
  )
}

// ─── Video field ─────────────────────────────────────────────────
function VideoField({ url, uploading, onUpload, onRemove }) {
  if (url) {
    return (
      <div className="rounded-xl bg-sage-muted border border-sage-border px-4 py-3 flex items-center gap-2">
        <Check size={15} strokeWidth={2.4} className="text-sage" />
        <span className="text-[13.5px] font-bold flex-1 text-sage">Видео загружено</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-[12.5px] font-bold text-red-500"
        >
          Удалить
        </button>
      </div>
    )
  }
  return (
    <label className="block w-full cursor-pointer">
      <div
        className="w-full h-11 rounded-full bg-bg-2 border border-border
          flex items-center justify-center gap-2 text-[13.5px] font-bold text-text-2"
      >
        {uploading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-text-3 border-t-transparent animate-spin" />
            Загружаем…
          </>
        ) : (
          <>
            <Video size={15} strokeWidth={2.2} />
            Загрузить видео
          </>
        )}
      </div>
      <input
        type="file"
        accept="video/*"
        hidden
        onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]) }}
      />
    </label>
  )
}

// ─── Mini switch (toTaste) ───────────────────────────────────────
function MiniSwitch({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="rounded-full relative shrink-0"
      style={{
        width: 32, height: 18,
        background: on ? 'var(--color-accent)' : 'var(--color-border)',
        transition: 'background 0.15s',
      }}
      aria-label="По вкусу"
    >
      <span
        className="absolute rounded-full bg-bg-2"
        style={{
          top: 2, left: on ? 16 : 2,
          width: 14, height: 14,
          transition: 'left 0.15s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        }}
      />
    </button>
  )
}

// ─── Ingredient row ──────────────────────────────────────────────
function IngredientRow({ ing, onRemove, onChange }) {
  return (
    <div className="rounded-xl bg-bg-2 border border-border px-3 py-2.5 flex items-center gap-2">
      {ing.emoji && <span className="text-[16px] shrink-0">{ing.emoji}</span>}
      <span className="text-[13px] font-semibold flex-1 truncate text-text">{ing.name}</span>

      <div className="flex items-center gap-1 shrink-0">
        <MiniSwitch on={ing.toTaste} onChange={v => onChange({ ...ing, toTaste: v })} />
        <span className="text-[10px] text-text-2">вкус</span>
      </div>

      {ing.toTaste ? (
        <span
          className="text-[11px] font-bold uppercase text-text-3 shrink-0"
          style={{ letterSpacing: 0.4, padding: '0 4px' }}
        >
          по вкусу
        </span>
      ) : (
        <>
          <input
            type="number"
            value={ing.amountValue}
            onChange={e => onChange({ ...ing, amountValue: e.target.value })}
            placeholder="0"
            className="text-center w-14 h-[30px] rounded-full bg-bg-3 border border-border
              text-[13px] text-text outline-none tabular-nums shrink-0
              focus:border-accent"
          />
          <select
            value={ing.unit}
            onChange={e => onChange({ ...ing, unit: e.target.value })}
            className="w-[70px] h-[30px] rounded-full bg-bg-3 border border-border
              text-[12px] text-text-2 outline-none px-2 shrink-0 focus:border-accent"
            style={{ appearance: 'none', WebkitAppearance: 'none' }}
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-text-3"
        aria-label="Удалить"
      >
        <X size={14} strokeWidth={2.2} />
      </button>
    </div>
  )
}

// ─── Visibility radio cards ──────────────────────────────────────
function VisibilityCards({ value, onChange, options }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(o => {
        const on = value === o.value
        const Ic = VIS_ICON[o.value] || Lock
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              'rounded-2xl border p-4 flex items-center gap-3 text-left transition-colors',
              on ? 'bg-accent-muted border-accent-border' : 'bg-bg-2 border-border',
            ].join(' ')}
          >
            <span
              className={[
                'rounded-full flex items-center justify-center shrink-0',
                on ? 'bg-accent border-accent' : 'border-border',
              ].join(' ')}
              style={{ width: 20, height: 20, borderWidth: 2, borderStyle: 'solid', borderColor: on ? 'var(--color-accent)' : 'var(--color-border)' }}
            >
              {on && <span className="rounded-full bg-bg-2" style={{ width: 6, height: 6 }} />}
            </span>
            <Ic size={18} strokeWidth={2} className={on ? 'text-accent' : 'text-text-2'} />
            <div className="flex-1 min-w-0">
              <div className={['text-[13.5px] font-bold', on ? 'text-accent' : 'text-text'].join(' ')}>
                {o.label}
              </div>
              <div className="text-[11.5px] text-text-2" style={{ textWrap: 'pretty' }}>
                {o.desc}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ═══ Main page ═════════════════════════════════════════════════════
export default function DishFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { show, Toast } = useToast()

  const isEdit     = Boolean(id)
  const copyFromId = searchParams.get('copyFrom')
  const fromGroup  = location.state?.groupId ? location.state : null

  const [mode, setMode]                       = useState(isEdit ? 'extended' : 'quick')
  const [loading, setLoading]                 = useState(isEdit)
  const [saving, setSaving]                   = useState(false)
  const [images, setImages]                   = useState([])
  const [uploadingImage, setUploadingImage]   = useState(false)
  const [uploadingVideo, setUploadingVideo]   = useState(false)
  const [showIngPicker, setShowIngPicker]     = useState(false)
  const [allIngredients, setAllIngredients]   = useState([])
  const [ingredients, setIngredients]         = useState([])
  const [errors, setErrors]                   = useState({})
  const [cuisineInput, setCuisineInput]       = useState('')
  const [sourceDishName, setSourceDishName]   = useState('')
  const [hasFamilyGroup, setHasFamilyGroup]   = useState(false)

  const defaultVisibility = fromGroup?.groupType === 'FAMILY' ? 'FAMILY'
    : fromGroup?.groupType === 'REGULAR' ? 'ALL_GROUPS'
    : 'PRIVATE'

  const [form, setForm] = useState({
    name: '', description: '', categories: [],
    mealTime: [], cookTime: '',
    calories: '', recipe: '', imageUrl: '', videoUrl: '',
    tags: '', visibility: defaultVisibility,
  })

  // ── Load data ───────────────────────────────────────────────────
  useEffect(() => {
    api.getIngredients().then(setAllIngredients).catch(() => {})
    api.getGroups().then(groups => {
      setHasFamilyGroup(groups.some(g => g.type === 'FAMILY'))
    }).catch(() => {})

    function applyDish(dish, resetImages = true) {
      setForm({
        name:       dish.name,
        description: dish.description || '',
        categories:  dish.categories || [],
        mealTime:    dish.mealTime || [],
        cookTime:    dish.cookTime || '',
        calories:    dish.calories || '',
        recipe:      dish.recipe || '',
        imageUrl:    dish.imageUrl || '',
        videoUrl:    dish.videoUrl || '',
        tags:        (dish.tags || []).join(', '),
        visibility:  dish.visibility || 'PRIVATE',
      })
      if (resetImages) {
        const imgs = dish.images?.length ? dish.images : (dish.imageUrl ? [dish.imageUrl] : [])
        setImages(imgs)
      }
      setCuisineInput(dish.cuisine || '')
      setIngredients(dish.ingredients.map(ing => ({
        id: ing.id, name: ing.name, emoji: ing.emoji,
        amountValue: ing.amountValue || '',
        unit: ing.unit || 'г',
        toTaste: ing.toTaste || false,
        optional: ing.optional || false,
        amount: ing.amount || '',
      })))
    }

    if (isEdit) {
      api.getDish(id)
        .then(dish => applyDish(dish))
        .catch(() => navigate('/dishes'))
        .finally(() => setLoading(false))
    } else if (copyFromId) {
      api.getDish(copyFromId)
        .then(dish => {
          setSourceDishName(dish.name)
          applyDish({ ...dish, imageUrl: '', videoUrl: '', visibility: 'PRIVATE' })
        })
        .catch(() => {})
    }
  }, [id, copyFromId])

  // ── Helpers ─────────────────────────────────────────────────────
  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  function toggleArray(key, val) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  // ── Ingredient helpers ──────────────────────────────────────────
  function addIngredient(ing) {
    if (ingredients.find(i => i.id === ing.id)) return
    setIngredients(prev => [...prev, {
      id: ing.id,
      name: ing.nameRu || ing.name,
      emoji: ing.emoji,
      amountValue: '', unit: 'г', toTaste: false, optional: false, amount: '',
    }])
  }
  function removeIngredient(ingId) {
    setIngredients(prev => prev.filter(i => i.id !== ingId))
  }
  function updateIngredient(updated) {
    setIngredients(prev => prev.map(i => {
      if (i.id !== updated.id) return i
      const next = { ...i, ...updated }
      next.amount = next.toTaste
        ? 'по вкусу'
        : next.amountValue ? `${next.amountValue} ${next.unit}`.trim() : ''
      return next
    }))
  }

  // ── Image upload ─────────────────────────────────────────────────
  async function uploadImages(files) {
    const fileArr = Array.from(files).slice(0, 10 - images.length)
    if (!fileArr.length) return
    setUploadingImage(true)
    try {
      const urls = await Promise.all(fileArr.map(f => api.uploadFile('image', f).then(r => r.url)))
      setImages(prev => {
        const next = [...prev, ...urls]
        setField('imageUrl', next[0] || '')
        return next
      })
      show(urls.length > 1 ? `Загружено ${urls.length} фото` : 'Фото загружено', 'success')
    } catch (e) { show(e.message, 'error') }
    finally { setUploadingImage(false) }
  }

  function setMainImage(idx) {
    if (idx === 0) return
    setImages(prev => {
      const next = [...prev]
      const [img] = next.splice(idx, 1)
      next.unshift(img)
      setField('imageUrl', next[0] || '')
      return next
    })
  }

  function removeImage(idx) {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== idx)
      setField('imageUrl', next[0] || '')
      return next
    })
  }

  async function uploadVideo(file) {
    setUploadingVideo(true)
    try {
      const { url } = await api.uploadFile('video', file)
      setField('videoUrl', url)
      show('Видео загружено', 'success')
    } catch (e) { show(e.message, 'error') }
    finally { setUploadingVideo(false) }
  }

  // ── Submit ──────────────────────────────────────────────────────
  async function handleSubmit() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Укажите название'
    if (!form.mealTime.length) errs.mealTime = 'Выберите время приёма пищи'
    if (mode === 'extended' && !form.categories.length) errs.categories = 'Выберите хотя бы одну категорию'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const data = {
        ...form,
        imageUrl: images[0] || null,
        images,
        cuisine: cuisineInput.trim() || null,
        cookTime: form.cookTime ? Number(form.cookTime) : null,
        calories: form.calories ? Number(form.calories) : null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        ingredients: ingredients.map(i => ({
          id: i.id,
          amount: i.amount || null,
          amountValue: i.amountValue ? Number(i.amountValue) : null,
          unit: i.toTaste ? null : (i.unit || null),
          toTaste: i.toTaste || false,
          optional: i.optional || false,
        })),
        visibility: form.visibility,
        groupId: fromGroup?.groupId || undefined,
      }
      if (isEdit) {
        await api.updateDish(id, data)
        show('Рецепт сохранён', 'success')
        setTimeout(() => navigate(`/dishes/${id}`), 600)
      } else {
        const created = await api.createDish(data)
        navigate(`/dishes/${created.id}`, { replace: true })
      }
    } catch (e) { show(e.message, 'error') }
    finally { setSaving(false) }
  }

  // ── Derived ─────────────────────────────────────────────────────
  const canSave = !saving && form.name.trim() && form.mealTime.length > 0 &&
    (mode === 'quick' || form.categories.length > 0)

  const isExt = mode === 'extended' || isEdit
  const visibilityOptions = VISIBILITY_OPTIONS.filter(o => o.value !== 'FAMILY' || hasFamilyGroup)

  if (loading) return <Loader fullPage />

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div>
      <FormHeader
        title={isEdit ? 'Редактировать рецепт' : 'Новый рецепт'}
        canSave={!!canSave}
        saving={saving}
        onBack={() => navigate(-1)}
        onSave={handleSubmit}
      />

      <div className="px-5 pt-5 pb-24 fade-in">
        {/* Banners */}
        {fromGroup && <GroupBanner name={fromGroup.groupName} />}
        {copyFromId && sourceDishName && (
          <div className={fromGroup ? 'mt-2' : ''}>
            <CopyBanner from={sourceDishName} />
          </div>
        )}

        {/* Mode switcher */}
        {!isEdit && (
          <div className={fromGroup || copyFromId ? 'mt-7' : ''}>
            <ModeSwitcher mode={mode} onChange={setMode} />
          </div>
        )}

        {/* Название */}
        <Section label="Название" required>
          <PillInput
            value={form.name}
            onChange={v => setField('name', v)}
            placeholder="Например, Курица с грибами"
            autoFocus={!isEdit}
          />
          <ErrorLine>{errors.name}</ErrorLine>
        </Section>

        {/* Описание */}
        {isExt && (
          <Section label="Краткое описание">
            <PillTextarea
              value={form.description}
              onChange={v => setField('description', v)}
              rows={2}
              placeholder="В двух словах, чем особенное это блюдо…"
            />
          </Section>
        )}

        {/* Категории */}
        <Section label="Категории" required={isExt}>
          <ChipsField
            items={CATEGORIES}
            selected={form.categories}
            onToggle={v => toggleArray('categories', v)}
          />
          <ErrorLine>{errors.categories}</ErrorLine>
        </Section>

        {/* Время приёма */}
        <Section label="Когда есть" required>
          <ChipsField
            items={MEAL_TIMES}
            selected={form.mealTime}
            onToggle={v => toggleArray('mealTime', v)}
          />
          <ErrorLine>{errors.mealTime}</ErrorLine>
        </Section>

        {/* Время готовки */}
        {isExt && (
          <Section label="Время готовки (минут)">
            <PillInput
              value={form.cookTime}
              onChange={v => setField('cookTime', v)}
              placeholder="30"
              type="number"
              tabular
            />
          </Section>
        )}

        {/* Теги */}
        {isExt && (
          <Section label="Теги (через запятую)">
            <PillInput
              value={form.tags}
              onChange={v => setField('tags', v)}
              placeholder="быстро, сытно, мясо"
            />
          </Section>
        )}

        {/* Фото */}
        {isExt && (
          <Section label="Фото блюда" hint="до 10 штук">
            <PhotoGrid
              images={images}
              onSetMain={setMainImage}
              onRemove={removeImage}
              onAdd={uploadImages}
              uploading={uploadingImage}
            />
          </Section>
        )}

        {/* Видео */}
        {isExt && (
          <Section label="Видео (необязательно)">
            <VideoField
              url={form.videoUrl}
              uploading={uploadingVideo}
              onUpload={uploadVideo}
              onRemove={() => setField('videoUrl', '')}
            />
          </Section>
        )}

        {/* Ингредиенты */}
        <Section label="Ингредиенты" required={isExt}>
          {ingredients.length === 0 ? (
            <div className="text-[13px] mb-2 px-1 text-text-3">Пока не выбрано</div>
          ) : (
            <div className="flex flex-col gap-2">
              {ingredients.map(it => (
                <IngredientRow
                  key={it.id}
                  ing={it}
                  onRemove={() => removeIngredient(it.id)}
                  onChange={updateIngredient}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowIngPicker(true)}
            className="w-full mt-2 h-10 rounded-full bg-bg-2 border border-border
              flex items-center justify-center gap-2 text-[13px] font-bold text-accent"
          >
            <Plus size={14} strokeWidth={2.4} />
            Добавить ингредиент
          </button>
        </Section>

        {/* Рецепт */}
        {isExt && (
          <Section label="Рецепт (шаги приготовления)">
            <PillTextarea
              value={form.recipe}
              onChange={v => setField('recipe', v)}
              rows={8}
              placeholder="Опишите шаги приготовления…"
            />
          </Section>
        )}

        {/* Доступ */}
        <Section label="Доступ">
          <VisibilityCards
            value={form.visibility}
            onChange={v => setField('visibility', v)}
            options={visibilityOptions}
          />
        </Section>

        {/* Submit (дублирующая внизу — чтобы не скроллить вверх к header'у) */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSave}
          className={[
            'w-full h-12 rounded-full mt-7 text-[15px] font-bold text-white transition-opacity',
            canSave ? 'bg-accent' : 'bg-accent opacity-50',
          ].join(' ')}
          style={canSave ? { boxShadow: '0 8px 22px rgba(196,112,74,0.35)' } : undefined}
        >
          {saving
            ? '...'
            : (isEdit ? 'Сохранить изменения' : 'Создать блюдо')}
        </button>
      </div>

      {/* Ingredient picker (modal) */}
      {showIngPicker && (
        <DishIngredientPicker
          allIngredients={allIngredients}
          selected={ingredients}
          onAdd={addIngredient}
          onIngredientCreated={ing => setAllIngredients(prev => [...prev, ing])}
          onClose={() => setShowIngPicker(false)}
          show={show}
        />
      )}

      {Toast}
    </div>
  )
}
