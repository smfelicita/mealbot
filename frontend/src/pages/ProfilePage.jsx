import React from 'react'
import { useStore } from '../store'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user, logout } = useStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 800, marginBottom: '.2rem' }}>👤 Профиль</h2>
        <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>Настройки аккаунта</p>
      </div>

      {/* User info */}
      <div className="card fade-up" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
              {user?.name || 'Пользователь'}
            </div>
            <div style={{ color: 'var(--text2)', fontSize: '.88rem' }}>
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Telegram connection */}
      <div className="card fade-up" style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>✈️</span> Telegram-бот
        </div>
        {user?.telegramUsername ? (
          <div style={{
            background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)',
            borderRadius: 'var(--radius-sm)', padding: '.7rem',
            color: 'var(--green)', fontSize: '.9rem',
          }}>
            ✅ Подключён: @{user.telegramUsername}
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text2)', fontSize: '.88rem', marginBottom: '.75rem', lineHeight: 1.6 }}>
              Подключите бот чтобы управлять холодильником и получать рекомендации прямо в Telegram.
            </p>
            <div style={{
              background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
              padding: '.85rem', fontSize: '.87rem', lineHeight: 1.7,
              color: 'var(--text2)',
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '.5rem' }}>
                Как подключить:
              </div>
              <ol style={{ paddingLeft: '1.2rem' }}>
                <li>Найдите бот <strong style={{ color: 'var(--accent)' }}>@MealBotApp</strong> в Telegram</li>
                <li>Нажмите <strong>/start</strong></li>
                <li>Отправьте команду <code style={{
                  background: 'var(--bg)', padding: '1px 5px',
                  borderRadius: 4, fontSize: '.85em',
                }}>/connect {user?.id?.slice(0, 8)}</code></li>
              </ol>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="card fade-up" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '.75rem' }}>📊 Статистика</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <StatBox label="Блюд в базе" value="20+" />
          <StatBox label="Продуктов" value="37" />
        </div>
      </div>

      {/* Logout */}
      <button className="btn btn-danger w-full" onClick={handleLogout}
        style={{ padding: '.85rem' }}>
        Выйти из аккаунта
      </button>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div style={{
      background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
      padding: '.75rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: '.8rem', color: 'var(--text2)', marginTop: '2px' }}>{label}</div>
    </div>
  )
}
