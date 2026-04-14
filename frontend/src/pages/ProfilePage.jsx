import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Button, Loader, Avatar } from '../components/ui'

function InfoRow({ label, value, note }) {
  return (
    <div>
      <p className="text-2xs text-text-3 mb-0.5">{label}</p>
      <p className="text-sm font-semibold">
        {value}
        {note && <span className="ml-2 text-2xs text-text-3 font-normal">{note}</span>}
      </p>
    </div>
  )
}

export default function ProfilePage() {
  const logout   = useStore(s => s.logout)
  const navigate = useNavigate()

  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tgLink, setTgLink]     = useState(null)
  const [tgLoading, setTgLoading] = useState(false)
  const [tgError, setTgError]   = useState('')

  useEffect(() => {
    api.me()
      .then(setProfile)
      .catch(() => navigate('/auth'))
      .finally(() => setLoading(false))
  }, [])

  async function connectTelegram() {
    setTgLoading(true)
    setTgError('')
    try {
      const { url } = await api.generateTelegramLink()
      setTgLink(url)
    } catch (err) {
      setTgError(err.message || 'Не удалось получить ссылку')
    }
    setTgLoading(false)
  }

  if (loading) return <Loader fullPage />

  const roleLabel =
    profile?.role === 'ADMIN' ? '🛡 Администратор' :
    profile?.role === 'PRO'   ? '⭐ Pro' :
    'Пользователь'

  return (
    <div className="px-4 pt-5 pb-10 max-w-[480px] fade-in">
      <h2 className="font-serif text-[22px] font-extrabold mb-5">Профиль</h2>

      {/* Avatar + name card */}
      <div className="bg-bg-2 border border-border rounded-DEFAULT p-5 mb-3 fade-up">
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={profile?.name} size="lg" />
          <div>
            <p className="font-extrabold text-[17px]">{profile?.name || 'Без имени'}</p>
            <p className="text-[13px] text-text-2 mt-0.5">{roleLabel}</p>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex flex-col gap-3">
          {profile?.email && (
            <InfoRow
              label="📧 Email"
              value={profile.email}
              note={profile.emailVerified ? '✓ подтверждён' : '⚠ не подтверждён'}
            />
          )}
          {profile?.phone && <InfoRow label="📱 Телефон" value={profile.phone} />}
          <InfoRow
            label="✈️ Telegram"
            value={profile?.telegramUsername ? `@${profile.telegramUsername}` : '—'}
            note={profile?.telegramId ? '✓ подключён' : 'не подключён'}
          />
        </div>
      </div>

      {/* Telegram connect */}
      {!profile?.telegramId && (
        <div className="bg-bg-2 border border-border rounded-DEFAULT p-5 mb-3 fade-up">
          <p className="font-bold mb-2">✈️ Подключить Telegram-бот</p>
          <p className="text-sm text-text-2 leading-relaxed mb-4">
            После подключения холодильник, план питания и рецепты будут доступны прямо в боте.
          </p>
          {!tgLink ? (
            <Button variant="secondary" className="w-full" loading={tgLoading} onClick={connectTelegram}>
              {!tgLoading && 'Получить ссылку для подключения'}
            </Button>
          ) : (
            <a
              href={tgLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full bg-accent text-white font-bold rounded-sm py-2.5 text-[15px]"
            >
              Открыть бота →
            </a>
          )}
          {tgError && <p className="text-red-400 text-[13px] mt-2">{tgError}</p>}
        </div>
      )}

      {/* Logout */}
      <Button
        variant="secondary"
        className="w-full text-red-400 border-red-400/30 hover:bg-red-400/5 fade-up"
        onClick={async () => {
          try { await api.logout() } catch {}
          logout()
          navigate('/auth')
        }}
      >
        🚪 Выйти из аккаунта
      </Button>
    </div>
  )
}
