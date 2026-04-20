import { useState } from 'react'
import { api } from '../../api'
import { Modal, Button, useToast } from '../ui'
import { CAT_EMOJI } from './dishCategories'

const SUPABASE_IMG = 'https://nwtqeytmmqmkwqafkgin.supabase.co/storage/v1/object/public/media/images'

function getDishImg(dish) {
  const cat = dish.categories?.[0] ?? dish.category
  const uploaded = dish.images?.[0] || dish.imageUrl
  return uploaded || (cat ? `${SUPABASE_IMG}/${cat.toLowerCase()}.jpg` : null)
}

function getDishEmoji(dish) {
  const cat = dish.categories?.[0] ?? dish.category
  return CAT_EMOJI[cat] || '🍽️'
}

export default function AddToPlanModal({ dish, hasFamilyGroup, onClose, onAdded }) {
  const { show, Toast } = useToast()
  const [date, setDate]         = useState('')
  const [note, setNote]         = useState('')
  const [shared, setShared]     = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const dateIso = date ? new Date(date + 'T00:00:00').toISOString() : null
      await api.addMealPlan({ dishId: dish.id, mealType: 'ANYTIME', date: dateIso, note: note || null, shared })
      onAdded?.()
      onClose()
    } catch (err) {
      show(err.message, 'error')
      setLoading(false)
    }
  }

  const img   = getDishImg(dish)
  const emoji = getDishEmoji(dish)

  return (
    <Modal onClose={onClose} title="Буду готовить">
      <div className="flex items-center gap-3 bg-bg-3 rounded-sm px-3 py-2.5 mb-5">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-bg-2 flex items-center justify-center text-xl">
          {img
            ? <img src={img} alt="" className="w-full h-full object-cover" />
            : <span>{emoji}</span>
          }
        </div>
        <strong className="text-[15px]">{dish.name}</strong>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold text-text-2 uppercase tracking-widest mb-2">Дата (необязательно)</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-bg-3 border border-border rounded-sm text-text text-[15px]
              px-3.5 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <p className="text-xs font-bold text-text-2 uppercase tracking-widest mb-2">Заметка</p>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Например: без соли"
            className="w-full bg-bg-3 border border-border rounded-sm text-text text-[15px]
              px-3.5 py-2.5 outline-none placeholder:text-text-3
              focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {hasFamilyGroup && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shared}
              onChange={e => setShared(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm">🏠 Поделиться с семьёй</span>
          </label>
        )}

        <Button type="submit" loading={loading} className="w-full">Добавить</Button>
      </form>

      {Toast}
    </Modal>
  )
}
