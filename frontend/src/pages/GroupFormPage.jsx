import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { Button, Loader, TextInput, Textarea, useToast } from '../components/ui'

export default function GroupFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const { show, Toast } = useToast()

  const [form, setForm]         = useState({ name: '', description: '', avatarUrl: '', type: 'FAMILY' })
  const [loading, setLoading]   = useState(isEdit)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    api.getGroup(id)
      .then(g => setForm({ name: g.name, description: g.description || '', avatarUrl: g.avatarUrl || '', type: g.type || 'FAMILY' }))
      .catch(() => navigate('/groups'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await api.uploadFile('image', file)
      setForm(f => ({ ...f, avatarUrl: res.url }))
    } catch (e) { show(e.message, 'error') }
    finally { setUploading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setNameError('Укажите название'); return }
    setNameError('')
    setSaving(true)
    try {
      if (isEdit) {
        await api.updateGroup(id, form)
        navigate(`/groups/${id}`)
      } else {
        const group = await api.createGroup(form)
        navigate(`/groups/${group.id}`)
      }
    } catch (e) { show(e.message, 'error') }
    finally { setSaving(false) }
  }

  if (loading) return <Loader fullPage />

  return (
    <div>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-bg/95 backdrop-blur-md border-b border-border flex items-center px-3 gap-2 max-w-app mx-auto">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>←</Button>
        <span className="font-serif text-[17px] font-bold flex-1 text-center">
          {isEdit ? 'Редактировать группу' : 'Новая группа'}
        </span>
        <div className="w-9" />
      </div>

      <div className="pt-[68px] pb-10 px-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-[72px] h-[72px] rounded-xl bg-bg-3 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
              {form.avatarUrl
                ? <img src={form.avatarUrl} alt="" className="w-full h-full object-cover" />
                : '👥'}
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <Button variant="secondary" size="sm" className="pointer-events-none" loading={uploading}>
                  {!uploading && 'Загрузить фото'}
                </Button>
                <input type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
              </label>
              {form.avatarUrl && (
                <Button variant="ghost" size="sm" className="text-red-400"
                  onClick={() => setForm(f => ({ ...f, avatarUrl: '' }))}>Удалить</Button>
              )}
            </div>
          </div>


          {/* Тип группы — только при создании */}
          {!isEdit && (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-bold text-text-2">Тип группы</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'FAMILY', emoji: '👨‍👩‍👧', label: 'Семейная', hint: 'Общий холодильник и рецепты' },
                  { value: 'REGULAR', emoji: '👥', label: 'Группа', hint: 'Делиться рецептами' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                    className={[
                      'flex flex-col items-center gap-1 rounded-xl border-2 py-3 px-2 transition-all text-center',
                      form.type === opt.value
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-bg-2',
                    ].join(' ')}
                  >
                    <span className="text-[24px]">{opt.emoji}</span>
                    <span className={['text-[13px] font-bold', form.type === opt.value ? 'text-accent' : 'text-text'].join(' ')}>{opt.label}</span>
                    <span className="text-[11px] text-text-3 leading-snug">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <TextInput
            label="Название"
            required
            placeholder={form.type === 'FAMILY' ? 'Например: Наша семья' : 'Например: Друзья, Команда...'}
            value={form.name}
            error={nameError}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (nameError) setNameError('') }}
          />

          <Textarea
            label="Описание"
            rows={3}
            placeholder="Расскажите о группе..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />

          <Button type="submit" className="w-full" loading={saving}>
            {!saving && (isEdit ? 'Сохранить' : 'Создать группу')}
          </Button>
        </form>
      </div>
      {Toast}
    </div>
  )
}
