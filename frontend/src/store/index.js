import { create } from 'zustand'

// Вызывается из api/index.js при 401 — без доступа к React-хукам
export function forceLogout() {
  localStorage.removeItem('mealbot_token')
  useStore.setState({ user: null, token: null })
  window.location.href = '/auth'
}

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: localStorage.getItem('mealbot_token'),
  setAuth: (user, token) => {
    if (token) {
      localStorage.setItem('mealbot_token', token)
    } else {
      localStorage.removeItem('mealbot_token')
    }
    set({ user, token: token || null })
  },
  logout: () => {
    localStorage.removeItem('mealbot_token')
    set({ user: null, token: null })
  },

  // Fridge
  fridge: [],
  fridgeMode: false,
  setFridge: (fridge) => set({ fridge }),
  toggleFridgeMode: () => set(s => ({ fridgeMode: !s.fridgeMode })),
  addToFridge: (item) => set(s => {
    if (s.fridge.find(f => f.ingredientId === item.ingredientId)) return s
    return { fridge: [...s.fridge, item] }
  }),
  removeFromFridge: (ingredientId) =>
    set(s => ({ fridge: s.fridge.filter(f => f.ingredientId !== ingredientId) })),
  updateFridgeItem: (ingredientId, data) =>
    set(s => ({ fridge: s.fridge.map(f => f.ingredientId === ingredientId ? { ...f, ...data } : f) })),

  // Plan
  planDishIds: new Set(),
  setPlanDishIds: (ids) => set({ planDishIds: new Set(ids) }),
  addPlanDishId: (dishId) => set(s => { const next = new Set(s.planDishIds); next.add(dishId); return { planDishIds: next } }),
  removePlanDishId: (dishId) => set(s => { const next = new Set(s.planDishIds); next.delete(dishId); return { planDishIds: next } }),

  // Chat
  chatMessages: [],
  addChatMessage: (msg) => set(s => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChatMessages: () => set({ chatMessages: [] }),
}))
