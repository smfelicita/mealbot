import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../hooks/useToast.jsx'

export default function GroupsPage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const { show, Toast } = useToast()

  useEffect(() => {
    api.getGroups().then(setGroups).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleJoin() {
    if (!joinCode.trim()) return
    setJoining(true)
    try {
      const res = await api.joinGroup(joinCode.trim())
      show('Вы вступили в группу!', 'success')
      navigate(`/groups/${res.groupId}`)
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div>
      <div className="top-bar">
        <span className="top-bar-logo">👥 Группы</span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/groups/new')}>
          + Создать
        </button>
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        {/* Вступить по коду */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text2)' }}>
            Вступить в группу по коду
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="Введите код группы..."
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary" onClick={handleJoin} disabled={joining}>
              {joining ? '...' : 'Вступить'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div className="loader" />
          </div>
        ) : (() => {
          const familyGroups = groups.filter(g => g.type === 'FAMILY')
          const regularGroups = groups.filter(g => g.type !== 'FAMILY')

          const renderCard = (group, i) => (
            <div key={group.id} className="card card-hover fade-up"
              style={{ padding: 16, animationDelay: `${i * 0.04}s`, cursor: 'pointer' }}
              onClick={() => navigate(`/groups/${group.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {group.avatarUrl ? (
                  <img src={group.avatarUrl} alt={group.name}
                    style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: 'var(--bg3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, flexShrink: 0,
                  }}>{group.type === 'FAMILY' ? '👨‍👩‍👧' : '👥'}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{group.name}</span>
                    {group.type === 'FAMILY' && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--bg3)', padding: '1px 6px', borderRadius: 4 }}>СЕМЬЯ</span>
                    )}
                  </div>
                  {group.description && (
                    <div style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {group.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text3)' }}>
                    <span>👤 {group.membersCount} участн.</span>
                    <span>🍽️ {group.dishesCount} рецептов</span>
                    {group.type === 'FAMILY' && <span>🧊 Общий холодильник</span>}
                  </div>
                </div>
                <span style={{ color: 'var(--text3)', fontSize: 18 }}>›</span>
              </div>
            </div>
          )

          if (groups.length === 0) return (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>Нет групп</h3>
              <p>Создайте группу или вступите по коду</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }}
                onClick={() => navigate('/groups/new')}>
                + Создать группу
              </button>
            </div>
          )

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {familyGroups.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                    Семейная группа
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {familyGroups.map((g, i) => renderCard(g, i))}
                  </div>
                </div>
              )}
              {regularGroups.length > 0 && (
                <div>
                  {familyGroups.length > 0 && (
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                      Обычные группы
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {regularGroups.map((g, i) => renderCard(g, i))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>
      {Toast}
    </div>
  )
}
