import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../hooks/useToast.jsx'

const CATEGORIES = [
  { value: 'BREAKFAST', label: '🍳 Завтрак' },
  { value: 'LUNCH', label: '🍱 Обед' },
  { value: 'DINNER', label: '🌙 Ужин' },
  { value: 'SNACK', label: '🥨 Перекус' },
  { value: 'SOUP', label: '🍲 Суп' },
  { value: 'SALAD', label: '🥗 Салат' },
  { value: 'DESSERT', label: '🍰 Десерт' },
  { value: 'DRINK', label: '🥤 Напиток' },
]

const MEAL_TIMES = [
  { value: 'breakfast', label: 'Утро' },
  { value: 'lunch', label: 'Обед' },
  { value: 'dinner', label: 'Вечер' },
  { value: 'snack', label: 'Перекус' },
]

const DIFFICULTIES = [
  { value: 'easy', label: 'Легко' },
  { value: 'medium', label: 'Средне' },
  { value: 'hard', label: 'Сложно' },
]

const UNITS = ['г', 'мл', 'шт', 'зубчик', 'пучок', 'щепотка']

const CUISINES = ['Русская', 'Итальянская', 'Азиатская', 'Средиземноморская', 'Греческая', 'Французская', 'Мексиканская', 'Японская', 'Индийская', 'Европейская', 'Американская']

const ING_CATEGORIES = [
  { value: 'dairy', label: 'Молочное' },
  { value: 'meat', label: 'Мясо' },
  { value: 'fish', label: 'Рыба' },
  { value: 'vegetable', label: 'Овощи' },
  { value: 'fruit', label: 'Фрукты' },
  { value: 'grain', label: 'Злаки' },
  { value: 'legume', label: 'Бобовые' },
  { value: 'egg', label: 'Яйца' },
  { value: 'bread', label: 'Хлеб' },
  { value: 'oil', label: 'Масла' },
  { value: 'sauce', label: 'Соусы' },
  { value: 'spice', label: 'Специи' },
  { value: 'herb', label: 'Зелень' },
  { value: 'nut', label: 'Орехи' },
  { value: 'sweetener', label: 'Сладкое' },
  { value: 'canned', label: 'Консервы' },
  { value: 'other', label: 'Другое' },
]

export default function RecipeFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { show, Toast } = useToast()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(location.state?.groupId || '')
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [showIngPicker, setShowIngPicker] = useState(false)
  const [showAddIng, setShowAddIng] = useState(false)
  const [ingSearch, setIngSearch] = useState('')
  const [allIngredients, setAllIngredients] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [errors, setErrors] = useState({})
  const [newIng, setNewIng] = useState({ nameRu: '', category: '' })
  const [addingIng, setAddingIng] = useState(false)
  const [cuisineInput, setCuisineInput] = useState('')
  const [showCuisineSuggest, setShowCuisineSuggest] = useState(false)

  const [form, setForm] = useState({
    nameRu: '', description: '', categories: [],
    mealTime: [], difficulty: '', cookTime: '',
    calories: '', recipe: '', imageUrl: '', videoUrl: '',
    tags: '', visibility: 'PRIVATE',
  })

  useEffect(() => {
    api.getIngredients().then(setAllIngredients).catch(() => {})
    api.getGroups().then(setGroups).catch(() => {})
    if (isEdit) {
      api.getDish(id)
        .then(dish => {
          setForm({
            nameRu: dish.name,
            description: dish.description || '',
            categories: dish.categories || [],
            mealTime: dish.mealTime || [],
            difficulty: dish.difficulty || '',
            cookTime: dish.cookTime || '',
            calories: dish.calories || '',
            recipe: dish.recipe || '',
            imageUrl: dish.imageUrl || '',
            videoUrl: dish.videoUrl || '',
            tags: (dish.tags || []).join(', '),
            visibility: dish.visibility || 'PRIVATE',
          })
          const existingImages = dish.images?.length
            ? dish.images
            : (dish.imageUrl ? [dish.imageUrl] : [])
          setImages(existingImages)
          setCuisineInput(dish.cuisine || '')
          setSelectedGroupId(dish.groupId || '')
          setIngredients(dish.ingredients.map(ing => ({
            id: ing.id, name: ing.name, emoji: ing.emoji,
            amountValue: ing.amountValue || '',
            unit: ing.unit || 'г',
            toTaste: ing.toTaste || false,
            optional: ing.optional || false,
            amount: ing.amount || '',
          })))
        })
        .catch(() => navigate('/my-recipes'))
        .finally(() => setLoading(false))
    }
  }, [id])

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
      // Пересобираем строковый amount для совместимости
      if (key === 'amountValue' || key === 'unit' || key === 'toTaste') {
        if (updated.toTaste) {
          updated.amount = 'по вкусу'
        } else {
          const q = updated.amountValue
          const u = updated.unit
          updated.amount = q ? `${q} ${u}`.trim() : ''
        }
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
      show(`✏️ Ингредиент "${created.nameRu}" добавлен`, 'success')
    } catch (e) {
      // Если уже существует — предлагаем добавить существующий
      if (e.message.includes('уже существует')) {
        show(e.message, 'error')
      } else {
        show(e.message, 'error')
      }
    } finally {
      setAddingIng(false)
    }
  }

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

  async function handleSubmit() {
    const errs = {}
    if (!form.nameRu.trim()) errs.nameRu = 'Укажите название'
    if (!form.categories.length) errs.categories = 'Выберите хотя бы одну категорию'
    if (Object.keys(errs).length) {
      setErrors(errs)
      setTimeout(() => {
        document.querySelector('.form-error')?.closest('.form-group')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }

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
        groupId: selectedGroupId || null,
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

  const availableIngredients = allIngredients.filter(ing =>
    !ingredients.find(i => i.id === ing.id) &&
    ing.nameRu.toLowerCase().includes(ingSearch.toLowerCase())
  )

  const cuisineSuggestions = CUISINES.filter(c =>
    c.toLowerCase().includes(cuisineInput.toLowerCase()) && c !== cuisineInput
  )

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60dvh' }}>
      <div className="loader" />
    </div>
  )

  return (
    <div>
      <div className="top-bar">
        <button className="btn btn-icon" onClick={() => navigate(-1)}>←</button>
        <span className="top-bar-logo">{isEdit ? 'Редактировать' : 'Новый рецепт'}</span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={saving}>
          {saving ? <span className="loader" style={{ width: 14, height: 14 }} /> : 'Сохранить'}
        </button>
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        {/* Название */}
        <div className="form-group">
          <label>Название *</label>
          <input className="input" placeholder="Введите название блюда"
            style={errors.nameRu ? { borderColor: '#f87171' } : {}}
            value={form.nameRu} onChange={e => setField('nameRu', e.target.value)} />
          {errors.nameRu && <span className="form-error">{errors.nameRu}</span>}
        </div>

        {/* Описание */}
        <div className="form-group">
          <label>Описание</label>
          <textarea className="input" rows={2} placeholder="Краткое описание..."
            value={form.description} onChange={e => setField('description', e.target.value)}
            style={{ resize: 'vertical' }} />
        </div>

        {/* Категории (мульти-выбор) */}
        <div className="form-group">
          <label>Категории *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(c => (
              <button key={c.value} type="button"
                className={`tag ${form.categories.includes(c.value) ? 'active' : ''}`}
                onClick={() => toggleCategory(c.value)}>
                {c.label}
              </button>
            ))}
          </div>
          {errors.categories && <span className="form-error" style={{ marginTop: 4, display: 'block' }}>{errors.categories}</span>}
        </div>

        {/* Кухня */}
        <div className="form-group" style={{ position: 'relative' }}>
          <label>Кухня</label>
          <input className="input" placeholder="Итальянская, Русская..."
            value={cuisineInput}
            onChange={e => { setCuisineInput(e.target.value); setShowCuisineSuggest(true) }}
            onFocus={() => setShowCuisineSuggest(true)}
            onBlur={() => setTimeout(() => setShowCuisineSuggest(false), 150)} />
          {showCuisineSuggest && cuisineSuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', overflow: 'hidden',
            }}>
              {cuisineSuggestions.map(c => (
                <div key={c} style={{
                  padding: '10px 14px', cursor: 'pointer', fontSize: 14,
                  borderBottom: '1px solid var(--border)',
                }}
                  onMouseDown={() => { setCuisineInput(c); setShowCuisineSuggest(false) }}>
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Время приёма пищи */}
        <div className="form-group">
          <label>Время приёма пищи</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MEAL_TIMES.map(mt => (
              <button key={mt.value} type="button"
                className={`tag ${form.mealTime.includes(mt.value) ? 'active' : ''}`}
                onClick={() => toggleMealTime(mt.value)}>
                {mt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Сложность + Время */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>Сложность</label>
            <select className="input" value={form.difficulty}
              onChange={e => setField('difficulty', e.target.value)}
              style={{ appearance: 'auto' }}>
              <option value="">—</option>
              {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Время (мин)</label>
            <input type="number" className="input" placeholder="30" min="1"
              value={form.cookTime} onChange={e => setField('cookTime', e.target.value)} />
          </div>
        </div>

        {/* Теги */}
        <div className="form-group">
          <label>Теги (через запятую)</label>
          <input className="input" placeholder="вегетарианское, быстро, постное..."
            value={form.tags} onChange={e => setField('tags', e.target.value)} />
        </div>

        {/* Фото */}
        <div className="form-group">
          <label>Фото блюда <span style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 400 }}>до 10 штук</span></label>
          {images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {images.map((url, idx) => (
                <div key={url} style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                  <img src={url} alt="" style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    borderRadius: 8,
                    border: idx === 0 ? '2.5px solid var(--accent)' : '2px solid var(--border)',
                  }} />
                  {idx === 0 ? (
                    <div style={{
                      position: 'absolute', top: 4, left: 4,
                      background: 'var(--accent)', color: '#fff',
                      borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700,
                    }}>★</div>
                  ) : (
                    <button type="button" onClick={() => setMainImage(idx)} title="Сделать главным" style={{
                      position: 'absolute', top: 4, left: 4,
                      background: 'rgba(0,0,0,.55)', color: '#fff',
                      border: 'none', borderRadius: 4, padding: '1px 5px', fontSize: 10, cursor: 'pointer',
                    }}>★</button>
                  )}
                  <button type="button" onClick={() => removeImage(idx)} style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(0,0,0,.65)', color: '#fff',
                    border: 'none', borderRadius: '50%', width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, cursor: 'pointer', padding: 0,
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
          {images.length < 10 && (
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <div className="btn btn-secondary" style={{ width: '100%', pointerEvents: 'none' }}>
                {uploadingImage
                  ? <span className="loader" style={{ width: 14, height: 14 }} />
                  : images.length === 0 ? '📷 Загрузить фото' : '📷 Добавить ещё'}
              </div>
              <input type="file" accept="image/*" multiple hidden
                onChange={e => e.target.files?.length && uploadImages(e.target.files)} />
            </label>
          )}
        </div>

        {/* Видео */}
        <div className="form-group">
          <label>Видео (необязательно)</label>
          {form.videoUrl ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--teal)' }}>✅ Видео загружено</span>
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => setField('videoUrl', '')}>Удалить</button>
            </div>
          ) : (
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <div className="btn btn-secondary" style={{ width: '100%', pointerEvents: 'none' }}>
                {uploadingVideo ? <span className="loader" style={{ width: 14, height: 14 }} /> : '🎥 Загрузить видео'}
              </div>
              <input type="file" accept="video/*" hidden
                onChange={e => e.target.files[0] && uploadVideo(e.target.files[0])} />
            </label>
          )}
        </div>

        {/* Ингредиенты */}
        <div className="form-group">
          <label>Ингредиенты</label>
          {ingredients.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {ingredients.map(ing => (
                <div key={ing.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                }}>
                  {ing.emoji && <span style={{ fontSize: 16 }}>{ing.emoji}</span>}
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ing.name}
                  </span>
                  {/* По вкусу */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div className={`toggle ${ing.toTaste ? 'on' : ''}`}
                      style={{ width: 28, height: 16, cursor: 'pointer', flexShrink: 0 }}
                      onClick={() => updateIngredient(ing.id, 'toTaste', !ing.toTaste)} />
                    <span style={{ fontSize: 10, color: 'var(--text2)', whiteSpace: 'nowrap' }}>вкус</span>
                  </div>
                  {/* Количество + единица (скрываем если toTaste) */}
                  {!ing.toTaste && (<>
                    <input type="number" className="input" placeholder="0"
                      style={{ width: 54, padding: '4px 6px', fontSize: 12 }}
                      value={ing.amountValue}
                      onChange={e => updateIngredient(ing.id, 'amountValue', e.target.value)} />
                    <select className="input" style={{ width: 80, padding: '4px 6px', fontSize: 12, appearance: 'auto' }}
                      value={ing.unit}
                      onChange={e => updateIngredient(ing.id, 'unit', e.target.value)}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </>)}
                  <button type="button" className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 6px', color: 'var(--text3)', flexShrink: 0 }}
                    onClick={() => removeIngredient(ing.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="btn btn-secondary btn-sm"
            onClick={() => setShowIngPicker(true)}>
            + Добавить ингредиент
          </button>
        </div>

        {/* Рецепт */}
        <div className="form-group">
          <label>Рецепт (шаги приготовления)</label>
          <textarea className="input" rows={8} placeholder="Опишите шаги приготовления..."
            value={form.recipe} onChange={e => setField('recipe', e.target.value)}
            style={{ resize: 'vertical', lineHeight: 1.6 }} />
        </div>

        {/* Группа */}
        {groups.length > 0 && (
          <div className="form-group">
            <label>Группа</label>
            <select className="input" value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}>
              <option value="">Личный рецепт</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>
              Рецепт в группе виден всем участникам группы
            </p>
          </div>
        )}

        {/* Видимость */}
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label>Видимость</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { value: 'PRIVATE', label: '🔒 Личный', desc: 'Только вы' },
              { value: 'PUBLIC', label: '🌍 Публичный', desc: 'Все пользователи' },
              { value: 'FAMILY', label: '👨‍👩‍👧 Семья', desc: 'Только участники семейной группы' },
              { value: 'ALL_GROUPS', label: '👥 Все мои группы', desc: 'Участники всех ваших групп' },
            ].map(opt => (
              <label key={opt.value} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${form.visibility === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                background: form.visibility === opt.value ? 'var(--accent-muted, rgba(99,102,241,.08))' : 'var(--bg2)',
                cursor: 'pointer',
              }}>
                <input type="radio" name="visibility" value={opt.value}
                  checked={form.visibility === opt.value}
                  onChange={() => setField('visibility', opt.value)}
                  style={{ accentColor: 'var(--accent)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 24 }}
          onClick={handleSubmit} disabled={saving}>
          {saving ? <span className="loader" style={{ width: 16, height: 16 }} />
            : isEdit ? '💾 Сохранить изменения' : '✨ Создать рецепт'}
        </button>
      </div>

      {/* Пикер ингредиентов */}
      {showIngPicker && (
        <div className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowIngPicker(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Добавить ингредиент</h3>
            <div className="input-group" style={{ marginBottom: 12 }}>
              <span className="input-icon">🔍</span>
              <input className="input" placeholder="Найти ингредиент..." value={ingSearch}
                onChange={e => setIngSearch(e.target.value)} autoFocus />
            </div>
            <div className="ing-picker-list">
              {availableIngredients.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                  Ничего не найдено
                </div>
              ) : availableIngredients.map(ing => (
                <div key={ing.id} className={`ing-picker-item ${!ing.isPublic ? 'selected' : ''}`}
                  onClick={() => { addIngredient(ing); setIngSearch('') }}>
                  {ing.emoji && <span style={{ fontSize: 18 }}>{ing.emoji}</span>}
                  <span style={{ flex: 1 }}>{ing.nameRu}</span>
                  {!ing.isPublic && <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>✏️ Мой</span>}
                  <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>+</span>
                </div>
              ))}
            </div>

            {/* Добавить свой ингредиент */}
            {!showAddIng ? (
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 10, color: 'var(--accent)' }}
                onClick={() => setShowAddIng(true)}>
                + Не нашли ингредиент? Добавить свой
              </button>
            ) : (
              <div style={{
                marginTop: 12, padding: 12, background: 'var(--bg3)',
                border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)',
              }}>
                <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
                  Ваш ингредиент будет виден только вам. После проверки администратором он может стать публичным.
                </p>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <input className="input" placeholder="Название ингредиента"
                    value={newIng.nameRu}
                    onChange={e => setNewIng(n => ({ ...n, nameRu: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <select className="input" value={newIng.category}
                    onChange={e => setNewIng(n => ({ ...n, category: e.target.value }))}
                    style={{ appearance: 'auto' }}>
                    <option value="">Категория</option>
                    {ING_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                    onClick={handleAddCustomIngredient} disabled={addingIng}>
                    {addingIng ? <span className="loader" style={{ width: 12, height: 12 }} /> : 'Добавить'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddIng(false); setNewIng({ nameRu: '', category: '' }) }}>
                    Отмена
                  </button>
                </div>
              </div>
            )}

            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }}
              onClick={() => { setShowIngPicker(false); setShowAddIng(false); setIngSearch('') }}>
              Готово
            </button>
          </div>
        </div>
      )}
      {Toast}
    </div>
  )
}
