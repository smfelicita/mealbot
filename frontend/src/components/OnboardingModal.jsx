import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function OnboardingModal({ onClose }) {
  const navigate = useNavigate()
  const [step, setStep]       = useState(1)
  const [value, setValue]     = useState('')
  const [saving, setSaving]   = useState(false)

  function finish() {
    localStorage.removeItem('mealbot_show_onboarding')
    localStorage.setItem('mealbot_onboarding_done', '1')
    onClose()
    navigate('/', { replace: true })
  }

  async function handleAdd() {
    const names = value.split(',').map(s => s.trim()).filter(Boolean)
    if (!names.length) { finish(); return }
    setSaving(true)
    try {
      await api.bulkCreateDishes(names)
      localStorage.setItem('mealbot_hint_firstDish_seen', '1')
    } catch {}
    setSaving(false)
    finish()
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-10 flex flex-col gap-4"
        style={{ boxShadow: '0 -4px 32px rgba(0,0,0,0.12)' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto -mt-1" />

        {step === 1 ? (
          <>
            <h2 className="text-[22px] font-bold" style={{ color: '#1a1a1a' }}>
              Добро пожаловать!
            </h2>
            <p className="text-[15px] -mt-2" style={{ color: '#666' }}>
              Добавь блюда которые готовишь — и мы каждый день будем подсказывать что приготовить.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-2xl text-[15px] font-semibold text-white transition-opacity active:opacity-80"
                style={{ background: '#C4704A' }}
              >
                Добавить блюда →
              </button>
              <button
                type="button"
                onClick={finish}
                className="w-full py-2.5 rounded-2xl text-[14px]"
                style={{ color: '#9e9e9e' }}
              >
                Посмотреть что уже есть
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-[20px] font-bold" style={{ color: '#1a1a1a' }}>
              Какие блюда ты готовишь?
            </h2>
            <p className="text-[13px] -mt-2" style={{ color: '#9e9e9e' }}>
              Перечисли через запятую — хоть 20 сразу
            </p>
            <textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Борщ, паста, омлет, блины, греческий салат..."
              rows={4}
              autoFocus
              className="w-full rounded-2xl border px-4 py-3 text-[15px] resize-none focus:outline-none transition-colors"
              style={{ borderColor: '#e0e0e0' }}
              onFocus={e => { e.target.style.borderColor = '#C4704A' }}
              onBlur={e => { e.target.style.borderColor = '#e0e0e0' }}
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving}
                className="w-full py-3 rounded-2xl text-[15px] font-semibold text-white transition-opacity disabled:opacity-50 active:opacity-80"
                style={{ background: '#C4704A' }}
              >
                {saving ? 'Добавляю...' : 'Добавить'}
              </button>
              <button
                type="button"
                onClick={finish}
                className="w-full py-2.5 rounded-2xl text-[14px]"
                style={{ color: '#9e9e9e' }}
              >
                Пропустить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
