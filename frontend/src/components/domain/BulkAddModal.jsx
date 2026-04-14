import { useState, useEffect, useRef } from 'react'
import { api } from '../../api'
import Modal from '../ui/Modal'

export default function BulkAddModal({ onClose, onDone }) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const taRef = useRef(null)

  useEffect(() => { taRef.current?.focus() }, [])

  async function handleSubmit() {
    const names = value.split(',').map(s => s.trim()).filter(Boolean)
    if (!names.length) { setError('Введите хотя бы одно название'); return }
    setSaving(true)
    setError('')
    try {
      await api.bulkCreateDishes(names)
      onDone()
    } catch (e) {
      setError(e.message || 'Ошибка при создании')
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} title="Добавить несколько блюд">
      <p className="text-[13px] text-text-2 -mt-2 mb-4">
        Введите названия через запятую
      </p>

      <textarea
        ref={taRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Блины, борщ, паста, омлет…"
        rows={4}
        className="w-full rounded-2xl border border-border px-4 py-3 text-[15px] resize-none
          focus:outline-none focus:border-accent transition-colors"
      />

      {error && <p className="text-red-500 text-[13px] mt-1">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="mt-4 w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white
          transition-opacity disabled:opacity-50 bg-accent"
      >
        {saving ? 'Добавляю…' : 'Добавить'}
      </button>
    </Modal>
  )
}
