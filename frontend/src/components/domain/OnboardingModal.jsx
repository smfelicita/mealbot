import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import Modal from '../ui/Modal'

export default function OnboardingModal({ onClose }) {
  const navigate = useNavigate()
  const [step, setStep]     = useState(1)
  const [value, setValue]   = useState('')
  const [saving, setSaving] = useState(false)

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
    <Modal onClose={finish}>
      {step === 1 ? (
        <>
          <h2 className="text-[22px] font-bold text-text">Добро пожаловать!</h2>
          <p className="text-[15px] text-text-2 mt-1 mb-6">
            Добавь блюда которые готовишь — и мы каждый день будем подсказывать что приготовить.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-2xl text-[15px] font-semibold text-white bg-accent
                transition-opacity active:opacity-80"
            >
              Добавить блюда →
            </button>
            <button
              type="button"
              onClick={finish}
              className="w-full py-2.5 rounded-2xl text-[14px] text-text-3"
            >
              Посмотреть что уже есть
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-[20px] font-bold text-text">Какие блюда ты готовишь?</h2>
          <p className="text-[13px] text-text-3 mt-1 mb-4">
            Перечисли через запятую — хоть 20 сразу
          </p>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Борщ, паста, омлет, блины, греческий салат..."
            rows={4}
            autoFocus
            className="w-full rounded-2xl border border-border px-4 py-3 text-[15px] resize-none
              focus:outline-none focus:border-accent transition-colors mb-4"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="w-full py-3 rounded-2xl text-[15px] font-semibold text-white bg-accent
                transition-opacity disabled:opacity-50 active:opacity-80"
            >
              {saving ? 'Добавляю...' : 'Добавить'}
            </button>
            <button
              type="button"
              onClick={finish}
              className="w-full py-2.5 rounded-2xl text-[14px] text-text-3"
            >
              Пропустить
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
