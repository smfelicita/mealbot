import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Button, Loader } from '../components/ui'

export default function InvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const user = useStore(s => s.user)

  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    api.getInvite(token)
      .then(setInvite)
      .catch(err => setError(err.message || 'Приглашение не найдено'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleAccept() {
    if (!user) {
      navigate(`/auth?redirect=/invite/${token}`)
      return
    }
    setAccepting(true)
    try {
      const res = await api.acceptInvite(token)
      navigate(`/groups/${res.groupId}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setAccepting(false)
    }
  }

  if (loading) return <Loader fullPage />

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 bg-bg fade-in">
      <div className="text-[40px] mb-1">🍽️</div>
      <h1 className="font-serif text-[26px] font-extrabold mb-8">MealBot</h1>

      <div className="w-full max-w-[360px] bg-bg-2 border border-border rounded-DEFAULT p-6 fade-up">
        {error ? (
          <>
            <p className="text-[32px] text-center mb-3">❌</p>
            <h2 className="font-serif text-[20px] font-extrabold mb-2 text-center">Ссылка недействительна</h2>
            <p className="text-[13px] text-text-2 text-center mb-5">{error}</p>
            <Button className="w-full" onClick={() => navigate('/')}>На главную</Button>
          </>
        ) : (
          <>
            <div className="text-[48px] text-center mb-3">
              {invite.groupType === 'FAMILY' ? '👨‍👩‍👧' : '👥'}
            </div>
            <h2 className="font-serif text-[20px] font-extrabold mb-1 text-center">
              {invite.groupName}
            </h2>
            {invite.groupType === 'FAMILY' && (
              <p className="text-[12px] text-accent text-center mb-1">Семейная группа · Общий холодильник</p>
            )}
            <p className="text-[13px] text-text-2 text-center mb-1">
              {invite.membersCount} {invite.membersCount === 1 ? 'участник' : 'участников'}
            </p>
            <p className="text-[13px] text-text-2 text-center mb-5">
              Вас пригласил <strong>{invite.invitedBy}</strong>
            </p>

            {!user && (
              <p className="text-[12px] text-text-3 text-center mb-4">
                Для вступления нужно войти или зарегистрироваться
              </p>
            )}

            <Button className="w-full" loading={accepting} onClick={handleAccept}>
              {!accepting && (user ? 'Вступить в группу' : 'Войти и вступить')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
