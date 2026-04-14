import { useState } from 'react'

/**
 * Однократный hint — показывается пока не закрыт, состояние хранится в localStorage.
 * @param {string} key  ключ в localStorage, напр. 'mealbot_hint_fridgeMode_seen'
 * @returns {[boolean, () => void]}  [dismissed, dismiss]
 */
export function useHintDismiss(key) {
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(key))

  function dismiss() {
    localStorage.setItem(key, '1')
    setDismissed(true)
  }

  return [dismissed, dismiss]
}
