import { useState } from 'react'
import { api } from '../../api'
import { ING_CATEGORIES } from '../../constants'
import { Button, Modal, SearchInput, TextInput } from '../ui'

export default function DishIngredientPicker({ allIngredients, selected, onAdd, onIngredientCreated, onClose, show }) {
  const [ingSearch, setIngSearch]     = useState('')
  const [showAddIng, setShowAddIng]   = useState(false)
  const [newIng, setNewIng]           = useState({ nameRu: '', category: '' })
  const [addingIng, setAddingIng]     = useState(false)

  const availableIngredients = allIngredients.filter(ing =>
    !selected.find(i => i.id === ing.id) &&
    ing.nameRu.toLowerCase().includes(ingSearch.toLowerCase())
  )

  async function handleAddCustomIngredient() {
    if (!newIng.nameRu.trim() || !newIng.category) {
      show('Укажите название и категорию', 'error')
      return
    }
    setAddingIng(true)
    try {
      const created = await api.createIngredient(newIng)
      onIngredientCreated(created)
      onAdd(created)
      setNewIng({ nameRu: '', category: '' })
      setShowAddIng(false)
      show(`"${created.nameRu}" добавлен`, 'success')
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setAddingIng(false)
    }
  }

  return (
    <Modal title="Добавить ингредиент" onClose={onClose}>
      <SearchInput
        value={ingSearch}
        onChange={e => setIngSearch(e.target.value)}
        placeholder="Найти ингредиент..."
        className="mb-3"
      />

      <div className="max-h-60 overflow-y-auto flex flex-col divide-y divide-border">
        {availableIngredients.length === 0 ? (
          <p className="py-5 text-center text-[13px] text-text-2">Ничего не найдено</p>
        ) : availableIngredients.map(ing => (
          <button
            key={ing.id}
            type="button"
            onClick={() => { onAdd(ing); setIngSearch('') }}
            className="flex items-center gap-2.5 px-2 py-2.5 text-left hover:bg-bg-3 transition-colors"
          >
            {ing.emoji && <span className="text-lg shrink-0">{ing.emoji}</span>}
            <span className="flex-1 text-sm">{ing.nameRu}</span>
            {!ing.isPublic && (
              <span className="text-2xs text-accent font-bold">✏️ Мой</span>
            )}
            <span className="text-accent font-bold text-lg">+</span>
          </button>
        ))}
      </div>

      {!showAddIng ? (
        <Button variant="ghost" size="sm" className="w-full mt-3 text-accent"
          onClick={() => setShowAddIng(true)}>
          + Нет нужного? Добавить свой
        </Button>
      ) : (
        <div className="mt-3 p-3 bg-bg-3 border border-accent rounded-sm flex flex-col gap-2">
          <p className="text-xs text-text-2">
            Ваш ингредиент будет виден только вам. После проверки может стать публичным.
          </p>
          <TextInput
            placeholder="Название ингредиента"
            value={newIng.nameRu}
            onChange={e => setNewIng(n => ({ ...n, nameRu: e.target.value }))}
          />
          <select
            className="w-full bg-bg-2 border border-border rounded-sm text-text text-sm px-3 py-2 outline-none focus:border-accent"
            value={newIng.category}
            onChange={e => setNewIng(n => ({ ...n, category: e.target.value }))}
          >
            <option value="">Категория</option>
            {ING_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" loading={addingIng}
              onClick={handleAddCustomIngredient}>Добавить</Button>
            <Button variant="ghost" size="sm"
              onClick={() => { setShowAddIng(false); setNewIng({ nameRu: '', category: '' }) }}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      <Button variant="secondary" className="w-full mt-3" onClick={onClose}>
        Готово
      </Button>
    </Modal>
  )
}
