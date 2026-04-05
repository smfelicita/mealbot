import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { Button, Loader, TextInput, Textarea, useToast } from '../components/ui'

const GROUP_TYPES = [
  { value: 'FAMILY',  label: '👨‍👩‍👧 Семейная', desc: 'Общий холодильник, общие рецепты. Одна на пользователя.' },
  { value: 'REGULAR', label: '👥 Обычная',   desc: 'Только общие рецепты. До 2 групп.' },
]

export default function GroupFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const { show, Toast } = useToast()

  const [form, setForm]         = useState({ name: '', description: '', avatarUrl: '', type: 'REGULAR' })
  const [loading, setLoading]   = useState(isEdit)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    api.getGroup(id)
      .then(g => setForm({ name: g.name, description: g.description || '', avatarUrl: g.avatarUrl || '', type: g.type || 'REGULAR' }))
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
    if (!form.name.trim()) { show('Укажите название', 'error'); return }
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

          {/* Type (create only) */}
          {!isEdit && (
            <div>
              <p className="text-xs font-bold text-text-2 uppercase tracking-wider mb-2">Тип группы</p>
              <div className="flex flex-col gap-2">
                {GROUP_TYPES.map(opt => (
                  <label
                    key={opt.value}
                    className={[
                      'flex items-start gap-3 px-3 py-2.5 rounded-sm border-[1.5px] cursor-pointer transition-all',
                      form.type === opt.value
                        ? 'border-accent bg-accent/6'
                        : 'border-border bg-bg-2 hover:border-accent/50',
                    ].join(' ')}
                  >
                    <input type="radio" name="groupType" value={opt.value}
                      checked={form.type === opt.value}
                      onChange={() => setForm(f => ({ ...f, type: opt.value }))}
                      className="mt-0.5 accent-accent" />
                    <div>
                      <p className="text-[13px] font-semibold">{opt.label}</p>
                      <p className="text-[11px] text-text-2 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <TextInput
            label="Название"
            required
            placeholder="Например: Семья, Друзья, Команда..."
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
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
