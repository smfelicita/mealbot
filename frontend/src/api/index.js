const BASE = '/api'

function getToken() {
  return localStorage.getItem('mealbot_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса')
  return data
}

export const api = {
  // Auth
  register: (email, password, name) =>
    request('/auth/register', { method: 'POST', body: { email, password, name } }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),
  verifyEmail: (email, code) =>
    request('/auth/verify-email', { method: 'POST', body: { email, code } }),
  resendEmailCode: (email) =>
    request('/auth/resend-email-code', { method: 'POST', body: { email } }),
  sendPhoneCode: (phone) =>
    request('/auth/send-phone-code', { method: 'POST', body: { phone } }),
  verifyPhone: (phone, code, name) =>
    request('/auth/verify-phone', { method: 'POST', body: { phone, code, name } }),
  googleAuth: (token) =>
    request('/auth/google', { method: 'POST', body: { token } }),

  // Dishes
  getDishes: (params = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, v))
    return request(`/dishes?${q}`)
  },
  getDish: (id) => request(`/dishes/${id}`),
  getRecommendations: (id) => request(`/dishes/${id}/recommendations`),

  // Ingredients
  getIngredients: (q = '') =>
    request(`/ingredients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createIngredient: (data) => request('/ingredients', { method: 'POST', body: data }),

  // Fridge
  getFridge: () => request('/fridge'),
  addToFridge: (ingredientId) =>
    request('/fridge', { method: 'POST', body: { ingredientId } }),
  bulkAddFridge: (ingredientIds) =>
    request('/fridge/bulk', { method: 'POST', body: { ingredientIds } }),
  removeFromFridge: (ingredientId) =>
    request(`/fridge/${ingredientId}`, { method: 'DELETE' }),
  clearFridge: () => request('/fridge', { method: 'DELETE' }),

  // My Dishes
  getMyDishes: () => request('/dishes/my'),
  createDish: (data) => request('/dishes', { method: 'POST', body: data }),
  updateDish: (id, data) => request(`/dishes/${id}`, { method: 'PUT', body: data }),
  deleteDish: (id) => request(`/dishes/${id}`, { method: 'DELETE' }),

  // Upload
  uploadFile: (type, file) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE}/upload/${type}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async r => {
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Ошибка загрузки')
      return d
    })
  },

  // Groups
  getGroups: () => request('/groups'),
  getGroup: (id) => request(`/groups/${id}`),
  createGroup: (data) => request('/groups', { method: 'POST', body: data }),
  updateGroup: (id, data) => request(`/groups/${id}`, { method: 'PUT', body: data }),
  deleteGroup: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
  joinGroup: (code) => request('/groups/join', { method: 'POST', body: { code } }),
  leaveGroup: (id) => request(`/groups/${id}/leave`, { method: 'DELETE' }),
  kickMember: (groupId, userId) => request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),

  // Chat
  sendMessage: (message, platform = 'web') =>
    request('/chat', { method: 'POST', body: { message, platform } }),
  clearChat: () => request('/chat', { method: 'DELETE' }),

  // Meal plans
  getMealPlans: () => request('/meal-plans'),
  addMealPlan: (data) => request('/meal-plans', { method: 'POST', body: data }),
  deleteMealPlan: (id) => request(`/meal-plans/${id}`, { method: 'DELETE' }),

  // Telegram linking
  getTelegramLinkToken: () => request('/telegram/link-token', { method: 'POST' }),
  getTelegramLinkStatus: () => request('/telegram/link-status'),
}
