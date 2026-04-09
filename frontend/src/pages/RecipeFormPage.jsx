import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { UNITS } from '../constants'
import {
  Button, Loader, TextInput, Textarea, Chip, Toggle,
  Modal, SearchInput, useToast,
} from '../components/ui'

const CATEGORIES = [
  { value: 'SOUP',    label: 'Суп'         },
  { value: 'SALAD',   label: 'Салат'       },
  { value: 'MAIN',    label: 'Основное'    },
  { value: 'SIDE',    label: 'Гарнир'      },
  { value: 'DESSERT', label: 'Десерт'      },
  { value: 'DRINK',   label: 'Напиток'     },
  { value: 'BAKERY',  label: 'Выпечка'     },
  { value: 'SAUCE',   label: 'Соус'        },
]

const MEAL_TIMES = [
  { value: 'BREAKFAST', label: 'Утро'     },
  { value: 'LUNCH',     label: 'Обед'     },
  { value: 'DINNER',    label: 'Вечер'    },
  { value: 'SNACK',     label: 'Перекус'  },
  { value: 'ANYTIME',   label: 'Любое'    },
]

const DIFFICULTIES = [
  { value: 'easy',   label: 'Легко'  },
  { value: 'medium', label: 'Средне' },
  { value: 'hard',   label: 'Сложно' },
]

const CUISINES = [
  'Русская', 'Итальянская', 'Азиатская', 'Средиземноморская',
  'Греческая', 'Французская', 'Мексиканская', 'Японская',
  'Индийская', 'Европейская', 'Американская',
]

const ING_CATEGORIES = [
  { value: 'dairy',     label: 'Молочное' },
  { value: 'meat',      label: 'Мясо'     },
  { value: 'fish',      label: 'Рыба'     },
  { value: 'vegetable', label: 'Овощи'    },
  { value: 'fruit',     label: 'Фрукты'   },
  { value: 'grain',     label: 'Злаки'    },
  { value: 'legume',    label: 'Бобовые'  },
  { value: 'egg',       label: 'Яйца'     },
  { value: 'bread',     label: 'Хлеб'     },
  { value: 'oil',       label: 'Масла'    },
  { value: 'sauce',     label: 'Соусы'    },
  { value: 'spice',     label: 'Специи'   },
  { value: 'herb',      label: 'Зелень'   },
  { value: 'nut',       label: 'Орехи'    },
  { value: 'sweetener', label: 'Сладкое'  },
  { value: 'canned',    label: 'Консервы' },
  { value: 'other',     label: 'Другое'   },
]

const VISIBILITY_OPTIONS = [
  { value: 'PRIVATE',    label: 'Личный',        desc: 'Только вы'                        },
  { value: 'PUBLIC',     label: 'Публичный',     desc: 'Все пользователи'                  },
  { value: 'FAMILY',     label: 'Семья',         desc: 'Только участники семейной группы' },
  { value: 'ALL_GROUPS', label: 'Все мои группы', desc: 'Участники всех ваших групп'      },
]

// ─── Field label helper ─────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <p className="text-xs font-bold text-text-2 uppercase tracking-wider mb-2">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </p>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function RecipeFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { show, Toast } = useToast()

  const isEdit    = Boolean(id)
  const copyFromId = searchParams.get('copyFrom')

  const [mode, setMode]                       = useState(isEdit ? 'extended' : 'quick')
  const [loading, setLoading]                 = useState(isEdit)
  const [saving, setSaving]                   = useState(false)
  const [images, setImages]                   = useState([])
  const [uploadingImage, setUploadingImage]   = useState(false)
  const [uploadingVideo, setUploadingVideo]   = useState(false)
  const [showIngPicker, setShowIngPicker]     = useState(false)
  const [showAddIng, setShowAddIng]           = useState(false)
  const [ingSearch, setIngSearch]             = useState('')
  const [allIngredients, setAllIngredients]   = useState([])
  const [ingredients, setIngredients]         = useState([])
  const [errors, setErrors]                   = useState({})
  const [newIng, setNewIng]                   = useState({ nameRu: '', category: '' })
  const [addingIng, setAddingIng]             = useState(false)
  const [cuisineInput, setCuisineInput]       = useState('')
  const [showCuisineSuggest, setShowCuisineSuggest] = useState(false)
  const [sourceDishName, setSourceDishName]   = useState('')

  const [form, setForm] = useState({
    nameRu: '', description: '', categories: [],
    mealTime: [], difficulty: '', cookTime: '',
    calories: '', recipe: '', imageUrl: '', videoUrl: '',
    tags: '', visibility: 'FAMILY',
  })

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.getIngredients().then(setAllIngredients).catch(() => {})

    function applyDish(dish, resetImages = true) {
      setForm({
        nameRu:      dish.name,
        description: dish.description || '',
        categories:  dish.categories || [],
        mealTime:    dish.mealTime || [],
        difficulty:  dish.difficulty || '',
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
        .catch(() => navigate('/my-recipes'))
        .finally(() => setLoading(false))
    } else if (copyFromId) {
      api.getDish(copyFromId)
        .then(dish => {
          setSourceDishName(dish.name)
          applyDish({ ...dish, imageUrl: '', videoUrl: '', visibility: 'FAMILY' })
        })
        .catch(() => {})
    }
  }, [id, copyFromId])

  // ── Field helpers ────────────────────────────────────────────────────────
  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  function toggleCategory(cat) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))
    if (errors.categories) setErrors(e => ({ ...e, categories: null }))
  }

  function toggleMealTime(mt) {
    setForm(f => ({
      ...f,
      mealTime: f.mealTime.includes(mt) ? f.mealTime.filter(x => x !== mt) : [...f.mealTime, mt],
    }))
  }

  // ── Ingredient helpers ───────────────────────────────────────────────────
  function addIngredient(ing) {
    if (ingredients.find(i => i.id === ing.id)) return
    setIngredients(prev => [...prev, {
      id: ing.id, name: ing.nameRu, emoji: ing.emoji,
      amountValue: '', unit: 'г', toTaste: false, optional: false, amount: '',
    }])
  }

  function removeIngredient(ingId) {
    setIngredients(prev => prev.filter(i => i.id !== ingId))
  }

  function updateIngredient(ingId, key, value) {
    setIngredients(prev => prev.map(i => {
      if (i.id !== ingId) return i
      const updated = { ...i, [key]: value }
      if (key === 'amountValue' || key === 'unit' || key === 'toTaste') {
        updated.amount = updated.toTaste
          ? 'по вкусу'
          : updated.amountValue ? `${updated.amountValue} ${updated.unit}`.trim() : ''
      }
      return updated
    }))
  }

  async function handleAddCustomIngredient() {
    if (!newIng.nameRu.trim() || !newIng.category) {
      show('Укажите название и категорию', 'error')
      return
    }
    setAddingIng(true)
    try {
      const created = await api.createIngredient(newIng)
      setAllIngredients(prev => [...prev, created])
      addIngredient(created)
      setNewIng({ nameRu: '', category: '' })
      setShowAddIng(false)
      show(`"${created.nameRu}" добавлен`, 'success')
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setAddingIng(false)
    }
  }

  // ── Image / video upload ─────────────────────────────────────────────────
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

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const errs = {}
    if (!form.nameRu.trim()) errs.nameRu = 'Укажите название'
    if (!form.mealTime.length) errs.mealTime = 'Выберите время приёма пищи'
    if (mode === 'extended' && !form.categories.length) errs.categories = 'Выберите хотя бы одну категорию'
    if (Object.keys(errs).length) { setErrors(errs); return }

    const resolvedCategories = form.categories

    setSaving(true)
    try {
      const data = {
        ...form,
        categories: resolvedCategories,
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
      }
      if (isEdit) {
        await api.updateDish(id, data)
        show('Рецепт сохранён', 'success')
        setTimeout(() => navigate('/my-recipes'), 800)
      } else {
        const created = await api.createDish(data)
        navigate(`/dishes/${created.id}`, { replace: true })
      }
    } catch (e) { show(e.message, 'error') }
    finally { setSaving(false) }
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const availableIngredients = allIngredients.filter(ing =>
    !ingredients.find(i => i.id === ing.id) &&
    ing.nameRu.toLowerCase().includes(ingSearch.toLowerCase())
  )

  const cuisineSuggestions = CUISINES.filter(c =>
    c.toLowerCase().includes(cuisineInput.toLowerCase()) && c !== cuisineInput
  )

  if (loading) return <Loader fullPage />

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-bg/95 backdrop-blur-md border-b border-border flex items-center px-3 gap-2 max-w-app mx-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>←</Button>
        <span className="font-serif text-[17px] font-bold flex-1 text-center">
          {isEdit ? 'Редактировать рецепт' : 'Новый рецепт'}
        </span>
        <Button size="sm" loading={saving} onClick={handleSubmit}>Сохранить</Button>
      </div>

      <div className="pt-[68px] pb-10 px-4 flex flex-col gap-5">

        {/* Copy notice */}
        {copyFromId && sourceDishName && (
          <div className="bg-teal/8 border border-teal/30 rounded-sm px-3.5 py-2.5 text-sm text-teal">
            Это копия рецепта «{sourceDishName}». Адаптируйте под себя.
          </div>
        )}

        {/* Mode switcher */}
        {!isEdit && (
          <div className="flex bg-bg-3 rounded-sm p-1 gap-1">
            {[
              { val: 'quick',    label: 'Быстро'     },
              { val: 'extended', label: 'Расширенно' },
            ].map(m => (
              <button
                key={m.val}
                type="button"
                onClick={() => setMode(m.val)}
                className={[
                  'flex-1 rounded-[6px] py-1.5 text-[13px] font-bold border-none cursor-pointer transition-all',
                  mode === m.val
                    ? 'bg-accent text-white'
                    : 'bg-transparent text-text-2 hover:text-text',
                ].join(' ')}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Название */}
        <TextInput
          label="Название"
          required
          placeholder="Введите название блюда"
          value={form.nameRu}
          error={errors.nameRu}
          onChange={e => setField('nameRu', e.target.value)}
        />

        {/* Описание — extended only */}
        {mode === 'extended' && (
          <Textarea
            label="Описание"
            rows={2}
            placeholder="Краткое описание..."
            value={form.description}
            onChange={e => setField('description', e.target.value)}
          />
        )}

        {/* Категории */}
        <div>
          <Label required={mode === 'extended'}>Категории</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <Chip
                key={c.value}
                active={form.categories.includes(c.value)}
                onClick={() => toggleCategory(c.value)}
              >
                {c.label}
              </Chip>
            ))}
          </div>
          {errors.categories && (
            <p className="text-red-400 text-xs mt-1.5">{errors.categories}</p>
          )}
        </div>

        {/* Кухня — extended only */}
        {mode === 'extended' && (
          <div className="relative">
            <TextInput
              label="Кухня"
              placeholder="Итальянская, Русская..."
              value={cuisineInput}
              onChange={e => { setCuisineInput(e.target.value); setShowCuisineSuggest(true) }}
              onFocus={() => setShowCuisineSuggest(true)}
              onBlur={() => setTimeout(() => setShowCuisineSuggest(false), 150)}
            />
            {showCuisineSuggest && cuisineSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-bg-2 border border-border rounded-sm overflow-hidden mt-0.5">
                {cuisineSuggestions.map(c => (
                  <div
                    key={c}
                    className="px-3.5 py-2.5 text-[14px] border-b border-border last:border-0 cursor-pointer hover:bg-bg-3"
                    onMouseDown={() => { setCuisineInput(c); setShowCuisineSuggest(false) }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Время приёма пищи */}
        <div>
          <Label>Время приёма пищи</Label>
          <div className="flex flex-wrap gap-2">
            {MEAL_TIMES.map(mt => (
              <Chip
                key={mt.value}
                active={form.mealTime.includes(mt.value)}
                onClick={() => toggleMealTime(mt.value)}
              >
                {mt.label}
              </Chip>
            ))}
          </div>
          {errors.mealTime && <p className="text-red-400 text-xs mt-1.5">{errors.mealTime}</p>}
        </div>

        {/* Сложность + Время — extended only */}
        {mode === 'extended' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Сложность</Label>
              <select
                className="w-full bg-bg-3 border border-border rounded-sm text-text text-[15px] px-3.5 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                value={form.difficulty}
                onChange={e => setField('difficulty', e.target.value)}
              >
                <option value="">—</option>
                {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <TextInput
              label="Время (мин)"
              type="number"
              placeholder="30"
              min="1"
              value={form.cookTime}
              onChange={e => setField('cookTime', e.target.value)}
            />
          </div>
        )}

        {/* Теги — extended only */}
        {mode === 'extended' && (
          <TextInput
            label="Теги (через запятую)"
            placeholder="вегетарианское, быстро, постное..."
            value={form.tags}
            onChange={e => setField('tags', e.target.value)}
          />
        )}

        {/* Фото — extended only */}
        {mode === 'extended' && (
          <div>
            <Label>Фото блюда <span className="normal-case text-[11px] text-text-3 font-normal">до 10 штук</span></Label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {images.map((url, idx) => (
                  <div key={url} className="relative w-[90px] h-[90px] shrink-0">
                    <img
                      src={url} alt=""
                      className={[
                        'w-full h-full object-cover rounded-sm',
                        idx === 0 ? 'ring-2 ring-accent' : 'ring-1 ring-border',
                      ].join(' ')}
                    />
                    {idx === 0 ? (
                      <span className="absolute top-1 left-1 bg-accent text-white text-[10px] font-bold px-1 py-0.5 rounded">★</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMainImage(idx)}
                        className="absolute top-1 left-1 bg-black/55 text-white text-[10px] font-bold px-1 py-0.5 rounded border-none cursor-pointer"
                      >★</button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/65 text-white rounded-full flex items-center justify-center text-[11px] border-none cursor-pointer"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 10 && (
              <label className="cursor-pointer block">
                <Button variant="secondary" className="w-full pointer-events-none" loading={uploadingImage}>
                  {!uploadingImage && (images.length === 0 ? 'Загрузить фото' : 'Добавить ещё')}
                </Button>
                <input type="file" accept="image/*" multiple hidden
                  onChange={e => e.target.files?.length && uploadImages(e.target.files)} />
              </label>
            )}
          </div>
        )}

        {/* Видео — extended only */}
        {mode === 'extended' && (
          <div>
            <Label>Видео (необязательно)</Label>
            {form.videoUrl ? (
              <div className="flex items-center gap-3 bg-bg-3 border border-border rounded-sm px-3.5 py-2.5">
                <span className="flex-1 text-[13px] text-teal">✅ Видео загружено</span>
                <Button variant="ghost" size="sm" onClick={() => setField('videoUrl', '')}>Удалить</Button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <Button variant="secondary" className="w-full pointer-events-none" loading={uploadingVideo}>
                  {!uploadingVideo && 'Загрузить видео'}
                </Button>
                <input type="file" accept="video/*" hidden
                  onChange={e => e.target.files[0] && uploadVideo(e.target.files[0])} />
              </label>
            )}
          </div>
        )}

        {/* Ингредиенты */}
        <div>
          <Label>Ингредиенты</Label>
          {ingredients.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {ingredients.map(ing => (
                <div
                  key={ing.id}
                  className="flex items-center gap-2 bg-bg-3 border border-border rounded-sm px-2.5 py-2"
                >
                  {ing.emoji && <span className="text-base shrink-0">{ing.emoji}</span>}
                  <span className="flex-1 text-[13px] font-semibold truncate">{ing.name}</span>

                  {/* По вкусу toggle */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={ing.toTaste}
                      onClick={() => updateIngredient(ing.id, 'toTaste', !ing.toTaste)}
                      className={[
                        'relative w-8 h-[18px] rounded-full border transition-all shrink-0 focus:outline-none',
                        ing.toTaste ? 'bg-accent border-accent' : 'bg-bg-2 border-border',
                      ].join(' ')}
                    >
                      <span className={[
                        'absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm',
                        ing.toTaste ? 'translate-x-[14px]' : 'translate-x-0',
                      ].join(' ')} />
                    </button>
                    <span className="text-[10px] text-text-2 whitespace-nowrap">вкус</span>
                  </div>

                  {/* Amount + unit */}
                  {!ing.toTaste && (
                    <>
                      <input
                        type="number"
                        placeholder="0"
                        value={ing.amountValue}
                        onChange={e => updateIngredient(ing.id, 'amountValue', e.target.value)}
                        className="w-14 text-[12px] bg-bg-2 border border-border rounded-sm px-1.5 py-1 outline-none focus:border-accent text-center"
                      />
                      <select
                        value={ing.unit}
                        onChange={e => updateIngredient(ing.id, 'unit', e.target.value)}
                        className="w-16 text-[12px] bg-bg-2 border border-border rounded-sm px-1.5 py-1 outline-none focus:border-accent"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => removeIngredient(ing.id)}
                    className="text-text-3 hover:text-red-400 text-[13px] px-1 shrink-0"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowIngPicker(true)}>
            + Добавить ингредиент
          </Button>
        </div>

        {/* Рецепт — extended only */}
        {mode === 'extended' && (
          <Textarea
            label="Рецепт (шаги приготовления)"
            rows={8}
            placeholder="Опишите шаги приготовления..."
            value={form.recipe}
            onChange={e => setField('recipe', e.target.value)}
          />
        )}

        {/* Доступ */}
        <div>
          <Label>Доступ</Label>
          <div className="flex flex-col gap-2">
            {VISIBILITY_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-sm border-[1.5px] cursor-pointer transition-all',
                  form.visibility === opt.value
                    ? 'border-accent bg-accent/6'
                    : 'border-border bg-bg-2 hover:border-accent/50',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={form.visibility === opt.value}
                  onChange={() => setField('visibility', opt.value)}
                  className="accent-accent"
                />
                <div>
                  <div className="text-[13px] font-semibold">{opt.label}</div>
                  <div className="text-[11px] text-text-2">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button className="w-full" loading={saving} onClick={handleSubmit}>
          {isEdit ? 'Сохранить изменения' : 'Создать блюдо'}
        </Button>
      </div>

      {/* ─── Ingredient picker modal ─── */}
      {showIngPicker && (
        <Modal
          title="Добавить ингредиент"
          onClose={() => { setShowIngPicker(false); setShowAddIng(false); setIngSearch('') }}
        >
          <SearchInput
            value={ingSearch}
            onChange={e => setIngSearch(e.target.value)}
            placeholder="Найти ингредиент..."
            className="mb-3"
          />

          <div className="max-h-60 overflow-y-auto flex flex-col divide-y divide-border">
            {availableIngredients.length === 0 ? (
              <p className="py-5 text-center text-[13px] text-text-2">Ничего не найдено</p>
            ) : availableIngredients.map(ing => (
              <button
                key={ing.id}
                type="button"
                onClick={() => { addIngredient(ing); setIngSearch('') }}
                className="flex items-center gap-2.5 px-2 py-2.5 text-left hover:bg-bg-3 transition-colors"
              >
                {ing.emoji && <span className="text-lg shrink-0">{ing.emoji}</span>}
                <span className="flex-1 text-[14px]">{ing.nameRu}</span>
                {!ing.isPublic && (
                  <span className="text-[10px] text-accent font-bold">✏️ Мой</span>
                )}
                <span className="text-accent font-bold text-lg">+</span>
              </button>
            ))}
          </div>

          {/* Добавить свой */}
          {!showAddIng ? (
            <Button variant="ghost" size="sm" className="w-full mt-3 text-accent"
              onClick={() => setShowAddIng(true)}>
              + Нет нужного? Добавить свой
            </Button>
          ) : (
            <div className="mt-3 p-3 bg-bg-3 border border-accent rounded-sm flex flex-col gap-2">
              <p className="text-[12px] text-text-2">
                Ваш ингредиент будет виден только вам. После проверки может стать публичным.
              </p>
              <TextInput
                placeholder="Название ингредиента"
                value={newIng.nameRu}
                onChange={e => setNewIng(n => ({ ...n, nameRu: e.target.value }))}
              />
              <select
                className="w-full bg-bg-2 border border-border rounded-sm text-text text-[14px] px-3 py-2 outline-none focus:border-accent"
                value={newIng.category}
                onChange={e => setNewIng(n => ({ ...n, category: e.target.value }))}
              >
                <option value="">Категория</option>
                {ING_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" loading={addingIng}
                  onClick={handleAddCustomIngredient}>Добавить</Button>
                <Button variant="ghost" size="sm"
                  onClick={() => { setShowAddIng(false); setNewIng({ nameRu: '', category: '' }) }}>
                  Отмена
                </Button>
              </div>
            </div>
          )}

          <Button variant="secondary" className="w-full mt-3"
            onClick={() => { setShowIngPicker(false); setShowAddIng(false); setIngSearch('') }}>
            Готово
          </Button>
        </Modal>
      )}

      {Toast}
    </div>
  )
}
