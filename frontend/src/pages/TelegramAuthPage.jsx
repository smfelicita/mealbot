import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'

export default function TelegramAuthPage() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const { setAuth } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Токен не передан. Вернитесь в Telegram и запросите новую ссылку.')
      return
    }

    api.telegramAuth(token)
      .then(res => {
        setAuth(res.user, res.token)
        navigate('/', { replace: true })
      })
      .catch(err => {
        setError(err.message || 'Ссылка недействительна или истекла. Запросите новую в боте.')
      })
  }, [])

  return (
    <div className="auth-page fade-in">
      <div className="auth-logo">🍽️ MealBot</div>
      <div className="auth-card fade-up" style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <p style={{ fontSize: 32, marginBottom: 12 }}>❌</p>
            <h2>Ошибка входа</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>{error}</p>
            <a
              href={`https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'MealBotRu'}`}
              className="btn btn-primary"
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              Открыть бота в Telegram
            </a>
          </>
        ) : (
          <>
            <span className="loader" style={{ width: 32, height: 32, display: 'inline-block', marginBottom: 16 }} />
            <h2>Вход через Telegram...</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>Подождите, выполняется авторизация</p>
          </>
        )}
      </div>
    </div>
  )
}
