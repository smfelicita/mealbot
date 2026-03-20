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

  // Dishes
  getDishes: (params = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, v))
    return request(`/dishes?${q}`)
  },
  getDish: (id) => request(`/dishes/${id}`),

  // Ingredients
  getIngredients: (q = '') =>
    request(`/ingredients${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  // Fridge
  getFridge: () => request('/fridge'),
  addToFridge: (ingredientId) =>
    request('/fridge', { method: 'POST', body: { ingredientId } }),
  bulkAddFridge: (ingredientIds) =>
    request('/fridge/bulk', { method: 'POST', body: { ingredientIds } }),
  removeFromFridge: (ingredientId) =>
    request(`/fridge/${ingredientId}`, { method: 'DELETE' }),
  clearFridge: () => request('/fridge', { method: 'DELETE' }),

  // Chat
  sendMessage: (message, platform = 'web') =>
    request('/chat', { method: 'POST', body: { message, platform } }),
  clearChat: () => request('/chat', { method: 'DELETE' }),
}
