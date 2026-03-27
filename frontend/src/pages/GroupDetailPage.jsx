import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { useToast } from '../hooks/useToast.jsx'
import DishCard from '../components/DishCard'

export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const { show, Toast } = useToast()

  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dishes') // 'dishes' | 'members'

  useEffect(() => {
    api.getGroup(id)
      .then(setGroup)
      .catch(() => navigate('/groups'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm(`Удалить группу "${group.name}"? Все рецепты группы останутся у авторов.`)) return
    try {
      await api.deleteGroup(id)
      navigate('/groups', { replace: true })
    } catch (e) { show(e.message, 'error') }
  }

  async function handleLeave() {
    if (!confirm(`Выйти из группы "${group.name}"?`)) return
    try {
      await api.leaveGroup(id)
      navigate('/groups', { replace: true })
    } catch (e) { show(e.message, 'error') }
  }

  async function handleKick(memberId, memberName) {
    if (!confirm(`Исключить ${memberName} из группы?`)) return
    try {
      await api.kickMember(id, memberId)
      setGroup(g => ({ ...g, members: g.members.filter(m => m.userId !== memberId) }))
      show('Участник исключён', 'success')
    } catch (e) { show(e.message, 'error') }
  }

  function copyCode() {
    navigator.clipboard.writeText(id)
    show('Код скопирован! Поделитесь им с участниками.', 'success')
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60dvh' }}>
      <div className="loader" />
    </div>
  )
  if (!group) return null

  const isOwner = group.ownerId === user?.id

  return (
    <div className="fade-in">
      {/* Шапка */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <button className="btn btn-icon" onClick={() => navigate(-1)}>←</button>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Назад</span>
            <div style={{ flex: 1 }} />
            {isOwner ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/groups/${id}/edit`)}>Редактировать</button>
                <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}
                  onClick={handleDelete}>Удалить</button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}
                onClick={handleLeave}>Выйти</button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 14, background: 'var(--bg3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, flexShrink: 0, overflow: 'hidden',
            }}>
              {group.avatarUrl
                ? <img src={group.avatarUrl} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '👥'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-serif)', lineHeight: 1.2 }}>
                  {group.name}
                </h1>
                {group.type === 'FAMILY' && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--bg3)', padding: '2px 7px', borderRadius: 4 }}>СЕМЬЯ</span>
                )}
              </div>
              {group.description && (
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{group.description}</p>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
                <span>👤 {group.members.length} участников</span>
                <span>🍽️ {group.dishes.length} рецептов</span>
                {group.type === 'FAMILY' && <span>🧊 Общий холодильник</span>}
              </div>
            </div>
          </div>

          {/* Кнопки action */}
          <div style={{ display: 'flex', gap: 8, paddingBottom: 14 }}>
            <button className="btn btn-secondary btn-sm" onClick={copyCode}>
              🔑 Код приглашения
            </button>
            <button className="btn btn-primary btn-sm"
              onClick={() => navigate('/my-recipes/new', { state: { groupId: id, groupName: group.name } })}>
              + Рецепт в группу
            </button>
          </div>
        </div>

        {/* Вкладки */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
          {[['dishes', '🍽️ Рецепты'], ['members', '👥 Участники']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700,
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === key ? 'var(--accent)' : 'var(--text2)',
              borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        {tab === 'dishes' && (
          group.dishes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>Нет рецептов</h3>
              <p>Добавьте первый рецепт в группу</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }}
                onClick={() => navigate('/my-recipes/new', { state: { groupId: id, groupName: group.name } })}>
                + Добавить рецепт
              </button>
            </div>
          ) : (
            <div className="dishes-grid">
              {group.dishes.map((d, i) => (
                <div key={d.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <DishCard dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {group.members.map(member => (
              <div key={member.userId} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 20, background: 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>👤</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{member.name}</div>
                  <div style={{ fontSize: 12, color: member.role === 'OWNER' ? 'var(--accent)' : 'var(--text3)', marginTop: 2 }}>
                    {member.role === 'OWNER' ? '👑 Владелец' : 'Участник'}
                  </div>
                </div>
                {isOwner && member.userId !== user?.id && (
                  <button className="btn btn-ghost btn-sm" style={{ color: '#f87171', flexShrink: 0 }}
                    onClick={() => handleKick(member.userId, member.name)}>
                    Исключить
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {Toast}
    </div>
  )
}
