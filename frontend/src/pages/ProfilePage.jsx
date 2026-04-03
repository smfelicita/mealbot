import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'

export default function ProfilePage() {
  const logout = useStore(s => s.logout)
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tgLink, setTgLink] = useState(null)
  const [tgLoading, setTgLoading] = useState(false)

  useEffect(() => {
    api.me()
      .then(data => { setProfile(data) })
      .catch(() => navigate('/auth'))
      .finally(() => setLoading(false))
  }, [])

  async function connectTelegram() {
    setTgLoading(true)
    try {
      const { url } = await api.generateTelegramLink()
      setTgLink(url)
    } catch {}
    setTgLoading(false)
  }

  if (loading) return (
    <div className="page fade-in" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <span className="loader" style={{ width: 32, height: 32 }} />
    </div>
  )

  const avatar = profile?.name?.[0]?.toUpperCase() || '?'

  return (
    <div className="page fade-in" style={{ maxWidth: 480 }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 24 }}>Профиль</h2>

      {/* Аватар + имя */}
      <div className="card fade-up" style={{ marginBottom: 16, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {avatar}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{profile?.name || 'Без имени'}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
              {profile?.role === 'ADMIN' ? '🛡 Администратор' : profile?.role === 'PRO' ? '⭐ Pro' : 'Пользователь'}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profile?.email && <InfoRow label="📧 Email" value={profile.email} note={profile.emailVerified ? '✓ подтверждён' : '⚠ не подтверждён'} />}
          {profile?.phone && <InfoRow label="📱 Телефон" value={profile.phone} />}
          <InfoRow
            label="✈️ Telegram"
            value={profile?.telegramUsername ? `@${profile.telegramUsername}` : '—'}
            note={profile?.telegramId ? '✓ подключён' : 'не подключён'}
          />
        </div>
      </div>

      {/* Подключить Telegram */}
      {!profile?.telegramId && (
        <div className="card fade-up" style={{ marginBottom: 16, padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>✈️ Подключить Telegram-бот</div>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>
            После подключения холодильник, план питания и рецепты будут доступны прямо в боте.
          </p>
          {!tgLink ? (
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={connectTelegram} disabled={tgLoading}>
              {tgLoading ? <span className="loader" style={{ width: 16, height: 16 }} /> : 'Получить ссылку для подключения'}
            </button>
          ) : (
            <a href={tgLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', display: 'flex' }}>
              Открыть бота →
            </a>
          )}
        </div>
      )}

      {/* Выйти */}
      <button
        className="btn btn-secondary fade-up"
        style={{ width: '100%', color: '#e74c3c', borderColor: 'rgba(231,76,60,.3)' }}
        onClick={() => { logout(); navigate('/auth') }}
      >
        🚪 Выйти из аккаунта
      </button>
    </div>
  )
}

function InfoRow({ label, value, note }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{value}
        {note && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>{note}</span>}
      </div>
    </div>
  )
}
