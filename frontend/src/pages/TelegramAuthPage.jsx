import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'

export default function TelegramAuthPage() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const { setAuth, user } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Токен не передан. Вернитесь в Telegram и запросите новую ссылку.')
      return
    }

    // Если пользователь уже авторизован — не перезаписываем сессию
    if (user) {
      navigate('/', { replace: true })
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
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 fade-in">
      <p className="text-2xl font-bold text-text mb-6">🍽️ MealBot</p>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card px-6 py-8 text-center fade-up">
        {error ? (
          <>
            <p className="text-[32px] mb-3">❌</p>
            <h2 className="font-bold text-lg text-text mb-2">Ошибка входа</h2>
            <p className="text-sm text-text-2 mb-5">{error}</p>
            <a
              href={`https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'MealBotRu'}`}
              className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm"
            >
              Открыть бота в Telegram
            </a>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-4" />
            <h2 className="font-bold text-lg text-text mb-1">Вход через Telegram...</h2>
            <p className="text-sm text-text-2">Подождите, выполняется авторизация</p>
          </>
        )}
      </div>
    </div>
  )
}
