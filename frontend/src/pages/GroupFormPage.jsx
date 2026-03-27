import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../hooks/useToast.jsx'

export default function GroupFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const { show, Toast } = useToast()

  const [form, setForm] = useState({ name: '', description: '', avatarUrl: '', type: 'REGULAR' })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    api.getGroup(id).then(g => {
      setForm({ name: g.name, description: g.description || '', avatarUrl: g.avatarUrl || '', type: g.type || 'REGULAR' })
    }).catch(() => navigate('/groups')).finally(() => setLoading(false))
  }, [id])

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await api.uploadFile('image', file)
      setForm(f => ({ ...f, avatarUrl: res.url }))
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { show('Укажите название', 'error'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await api.updateGroup(id, form)
        show('Группа обновлена', 'success')
        navigate(`/groups/${id}`)
      } else {
        const group = await api.createGroup(form)
        show('Группа создана!', 'success')
        navigate(`/groups/${group.id}`)
      }
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60dvh' }}>
      <div className="loader" />
    </div>
  )

  return (
    <div>
      <div className="top-bar">
        <button className="btn btn-icon" onClick={() => navigate(-1)}>←</button>
        <span style={{ fontWeight: 700, marginLeft: 8 }}>
          {isEdit ? 'Редактировать группу' : 'Новая группа'}
        </span>
      </div>

      <div className="page" style={{ paddingTop: 20 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Аватар */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16, background: 'var(--bg3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, flexShrink: 0, overflow: 'hidden',
            }}>
              {form.avatarUrl
                ? <img src={form.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '👥'}
            </div>
            <div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                {uploading ? 'Загрузка...' : 'Загрузить фото'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </label>
              {form.avatarUrl && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 8, color: '#f87171' }}
                  onClick={() => setForm(f => ({ ...f, avatarUrl: '' }))}>Удалить</button>
              )}
            </div>
          </div>

          {/* Тип группы (только при создании) */}
          {!isEdit && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                Тип группы
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { value: 'FAMILY', label: '👨‍👩‍👧 Семейная', desc: 'Общий холодильник, общие рецепты. Одна на пользователя.' },
                  { value: 'REGULAR', label: '👥 Обычная', desc: 'Только общие рецепты. До 2 групп.' },
                ].map(opt => (
                  <label key={opt.value} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${form.type === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.type === opt.value ? 'var(--bg3)' : 'var(--bg2)',
                    cursor: 'pointer',
                  }}>
                    <input type="radio" name="groupType" value={opt.value}
                      checked={form.type === opt.value}
                      onChange={() => setForm(f => ({ ...f, type: opt.value }))}
                      style={{ marginTop: 2, accentColor: 'var(--accent)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Название */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Название *
            </label>
            <input className="input" placeholder="Например: Семья, Друзья, Команда..."
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          {/* Описание */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Описание
            </label>
            <textarea className="input" placeholder="Расскажите о группе..."
              rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ resize: 'vertical' }} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 8 }}>
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать группу'}
          </button>
        </form>
      </div>
      {Toast}
    </div>
  )
}
