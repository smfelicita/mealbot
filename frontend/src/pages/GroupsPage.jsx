import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Button, Loader, EmptyState, TextInput, useToast } from '../components/ui'
import { GroupCard } from '../components/domain'

export default function GroupsPage() {
  const navigate = useNavigate()
  const { show, Toast } = useToast()
  const [groups, setGroups]   = useState([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining]   = useState(false)

  useEffect(() => {
    api.getGroups().then(setGroups).catch(e => show(e.message || 'Не удалось загрузить группы', 'error')).finally(() => setLoading(false))
  }, [])

  async function handleJoin() {
    if (!joinCode.trim()) return
    setJoining(true)
    try {
      const group = await api.joinGroup(joinCode.trim())
      setGroups(prev => [...prev, group])
      setJoinCode('')
      show(`Вы вступили в «${group.name}»`, 'success')
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setJoining(false)
    }
  }

  const familyGroups  = groups.filter(g => g.type === 'FAMILY')
  const regularGroups = groups.filter(g => g.type !== 'FAMILY')

  return (
    <div>
      <div className="px-4 pt-5 pb-8 flex flex-col gap-5">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-[22px] text-text">Мои группы</h1>
          <Button size="sm" onClick={() => navigate('/groups/new')}>+ Создать</Button>
        </div>
        {/* Вступить по коду */}
        <div className="bg-bg-2 border border-border rounded-sm p-3.5">
          <p className="text-xs font-bold text-text-2 uppercase tracking-wider mb-2">Вступить по коду</p>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-bg-3 border border-border rounded-sm text-text text-sm px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-text-3 uppercase tracking-widest"
              placeholder="A3F7D2E9"
              value={joinCode}
              maxLength={8}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <Button size="sm" loading={joining} onClick={handleJoin}>
              {!joining && 'Войти'}
            </Button>
          </div>
        </div>
        {/* Groups list */}
        {loading ? (
          <Loader />
        ) : groups.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Нет групп"
            description="Создайте группу или вступите по коду"
            action={<Button onClick={() => navigate('/groups/new')}>+ Создать группу</Button>}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {familyGroups.length > 0 && (
              <div>
                <p className="text-2xs font-bold text-text-2 uppercase tracking-widest mb-2.5">Семейная группа</p>
                <div className="flex flex-col gap-2">
                  {familyGroups.map((g, i) => (
                    <GroupCard key={g.id} group={g} delay={i * 0.04} onClick={() => navigate(`/groups/${g.id}`)} />
                  ))}
                </div>
              </div>
            )}
            {regularGroups.length > 0 && (
              <div>
                {familyGroups.length > 0 && (
                  <p className="text-2xs font-bold text-text-2 uppercase tracking-widest mb-2.5">Обычные группы</p>
                )}
                <div className="flex flex-col gap-2">
                  {regularGroups.map((g, i) => (
                    <GroupCard key={g.id} group={g} delay={i * 0.04} onClick={() => navigate(`/groups/${g.id}`)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {Toast}
    </div>
  )
}
