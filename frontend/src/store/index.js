import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: localStorage.getItem('mealbot_token'),
  setAuth: (user, token) => {
    localStorage.setItem('mealbot_token', token)
    set({ user, token })
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

  // Chat
  chatMessages: [],
  addChatMessage: (msg) => set(s => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChatMessages: () => set({ chatMessages: [] }),
}))
