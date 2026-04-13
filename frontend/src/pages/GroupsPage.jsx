import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Button, Loader, EmptyState, TextInput, useToast } from '../components/ui'

function GroupCard({ group, onClick, delay }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-bg-2 border border-border rounded-DEFAULT p-4 text-left hover:border-accent/50 transition-colors fade-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-12 h-12 rounded-xl bg-bg-3 flex items-center justify-center text-[24px] shrink-0 overflow-hidden">
        {group.avatarUrl
          ? <img src={group.avatarUrl} alt={group.name} className="w-full h-full object-cover" />
          : (group.type === 'FAMILY' ? '👨‍👩‍👧' : '👥')}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-extrabold text-[15px] truncate">{group.name}</span>
          {group.type === 'FAMILY' && (
            <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">СЕМЬЯ</span>
          )}
        </div>
        {group.description && (
          <p className="text-[13px] text-text-2 truncate">{group.description}</p>
        )}
        <div className="flex gap-3 mt-1.5 text-[12px] text-text-3">
          <span>👤 {group.membersCount} участн.</span>
          <span>🍽️ {group.dishesCount} рецептов</span>
          {group.type === 'FAMILY' && <span>🧊 Общий холодильник</span>}
        </div>
      </div>

      <span className="text-text-3 text-lg shrink-0">›</span>
    </button>
  )
}

export default function GroupsPage() {
  const navigate = useNavigate()
  const { show, Toast } = useToast()
  const [groups, setGroups]   = useState([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining]   = useState(false)

  useEffect(() => {
    api.getGroups().then(setGroups).catch(() => {}).finally(() => setLoading(false))
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
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-bg/95 backdrop-blur-md border-b border-border flex items-center px-3 gap-2 max-w-app mx-auto">
        <span className="font-serif text-[17px] font-bold flex-1">👥 Группы</span>
        <Button size="sm" onClick={() => navigate('/groups/new')}>+ Создать</Button>
      </div>

      <div className="pt-[68px] pb-8 px-4 flex flex-col gap-5">
        {/* Вступить по коду */}
        <div className="bg-bg-2 border border-border rounded-sm p-3.5">
          <p className="text-[12px] font-bold text-text-2 uppercase tracking-wider mb-2">Вступить по коду</p>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-bg-3 border border-border rounded-sm text-text text-[14px] px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-text-3 uppercase tracking-widest"
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
                <p className="text-[11px] font-bold text-text-2 uppercase tracking-widest mb-2.5">Семейная группа</p>
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
                  <p className="text-[11px] font-bold text-text-2 uppercase tracking-widest mb-2.5">Обычные группы</p>
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
