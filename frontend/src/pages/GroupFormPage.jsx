// GroupFormPage — создание / редактирование группы.
// Без артефакта — переписан по паттернам других редизайн-страниц.
// Layout сам рисует back-header (mode='back', title зависит от роута):
// - /groups/new → «Новая группа»
// - /groups/:id/edit → «Редактирование группы»

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Home, Heart, Camera, AlertCircle } from 'lucide-react'

import { api } from '../api'
import { Button, Loader, useToast } from '../components/ui'

// ─── Field primitives ─────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label
      className="block text-[11px] font-bold uppercase tracking-wider text-text-3 mb-1.5"
      style={{ letterSpacing: 0.6 }}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function PillInput({ error, ...props }) {
  return (
    <input
      className={[
        'w-full h-11 px-4 rounded-full bg-bg-2 border text-text text-[14.5px]',
        'outline-none placeholder:text-text-3',
        error ? 'border-red-300' : 'border-border focus:border-accent',
      ].join(' ')}
      {...props}
    />
  )
}

function PillTextarea({ rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className="w-full px-4 py-3 rounded-2xl bg-bg-2 border border-border text-text text-[14.5px]
        outline-none placeholder:text-text-3 focus:border-accent resize-none"
      {...props}
    />
  )
}

function ErrorMsg({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-start gap-1 text-red-500 text-[12px] mt-1.5">
      <AlertCircle size={12} strokeWidth={2.2} className="mt-0.5 shrink-0" />
      <span>{msg}</span>
    </div>
  )
}

// ─── Type radio-cards ────────────────────────────────────────────
const TYPE_OPTIONS = [
  {
    value: 'FAMILY',
    Icon: Home,
    label: 'Семейная',
    desc: 'Общий холодильник, план и блюда',
  },
  {
    value: 'REGULAR',
    Icon: Heart,
    label: 'Обычная',
    desc: 'Делиться блюдами с друзьями по коду',
  },
]

function TypeCard({ option, active, onClick }) {
  const { Icon, label, desc, value } = option
  const isFamily = value === 'FAMILY'
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-2xl border p-4 flex items-center gap-3 text-left transition-colors',
        active
          ? (isFamily ? 'bg-accent-muted border-accent text-accent' : 'bg-sage-muted border-sage text-sage')
          : 'bg-bg-2 border-border text-text-2',
      ].join(' ')}
    >
      <div className={[
        'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border',
        active
          ? (isFamily ? 'bg-bg-2 border-accent-border' : 'bg-bg-2 border-sage-border')
          : 'bg-bg-3 border-border',
      ].join(' ')}>
        <Icon size={18} strokeWidth={2.2} className={active ? (isFamily ? 'text-accent' : 'text-sage') : 'text-text-2'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={['text-[14.5px] font-bold', active ? '' : 'text-text'].join(' ')}>{label}</div>
        <div className={['text-[12px] mt-0.5', active ? 'opacity-80' : 'text-text-3'].join(' ')}>
          {desc}
        </div>
      </div>
    </button>
  )
}

// ─── Avatar uploader ─────────────────────────────────────────────
function AvatarUploader({ url, uploading, onUpload, onRemove }) {
  const initial = '👥'
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-[72px] h-[72px] rounded-2xl bg-bg-3 border border-border flex items-center justify-center text-3xl shrink-0 overflow-hidden"
      >
        {url
          ? <img src={url} alt="" className="w-full h-full object-cover" />
          : <span>{initial}</span>}
      </div>
      <div className="flex flex-col gap-2">
        <label className="cursor-pointer">
          <Button variant="secondary" size="sm" className="pointer-events-none" loading={uploading}>
            {!uploading && (
              <span className="inline-flex items-center gap-1.5">
                <Camera size={14} strokeWidth={2.2} />
                {url ? 'Заменить фото' : 'Загрузить фото'}
              </span>
            )}
          </Button>
          <input type="file" accept="image/*" hidden onChange={onUpload} />
        </label>
        {url && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[12px] font-semibold text-red-500 self-start"
          >
            Удалить
          </button>
        )}
      </div>
    </div>
  )
}

// ═══ Main ═════════════════════════════════════════════════════════
export default function GroupFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const { show, Toast } = useToast()

  const [form, setForm]           = useState({ name: '', description: '', avatarUrl: '', type: 'FAMILY' })
  const [loading, setLoading]     = useState(isEdit)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    api.getGroup(id)
      .then(g => setForm({
        name: g.name,
        description: g.description || '',
        avatarUrl: g.avatarUrl || '',
        type: g.type || 'FAMILY',
      }))
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
    } catch (err) { show(err.message, 'error') }
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
    } catch (err) { show(err.message, 'error') }
    finally { setSaving(false) }
  }

  if (loading) return <Loader fullPage />

  return (
    <div>
      <form onSubmit={handleSubmit} className="px-5 pt-4 pb-24 fade-in flex flex-col gap-7">
        {/* Avatar */}
        <div>
          <FieldLabel>Фото группы</FieldLabel>
          <AvatarUploader
            url={form.avatarUrl}
            uploading={uploading}
            onUpload={handleAvatarUpload}
            onRemove={() => setForm(f => ({ ...f, avatarUrl: '' }))}
          />
        </div>

        {/* Тип — только при создании */}
        {!isEdit && (
          <div>
            <FieldLabel>Тип группы</FieldLabel>
            <div className="flex flex-col gap-2">
              {TYPE_OPTIONS.map(opt => (
                <TypeCard
                  key={opt.value}
                  option={opt}
                  active={form.type === opt.value}
                  onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Название */}
        <div>
          <FieldLabel required>Название</FieldLabel>
          <PillInput
            placeholder={form.type === 'FAMILY' ? 'Наша семья' : 'Друзья, Команда…'}
            value={form.name}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (nameError) setNameError('') }}
            error={!!nameError}
            autoFocus={!isEdit}
            maxLength={60}
          />
          <ErrorMsg msg={nameError} />
        </div>

        {/* Описание */}
        <div>
          <FieldLabel>Описание</FieldLabel>
          <PillTextarea
            rows={3}
            placeholder="Расскажите о группе…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            maxLength={300}
          />
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" loading={saving}>
          {!saving && (isEdit ? 'Сохранить изменения' : 'Создать группу')}
        </Button>
      </form>

      {Toast}
    </div>
  )
}
