import { useEffect, Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import { api } from './api'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import DishesPage from './pages/DishesPage'
import DishDetailPage from './pages/DishDetailPage'
import FridgePage from './pages/FridgePage'
import ChatPage from './pages/ChatPage'
import MyRecipesPage from './pages/MyRecipesPage'
import RecipeFormPage from './pages/RecipeFormPage'
import GroupsPage from './pages/GroupsPage'
import GroupDetailPage from './pages/GroupDetailPage'
import GroupFormPage from './pages/GroupFormPage'
import MealPlanPage from './pages/MealPlanPage'
import TelegramAuthPage from './pages/TelegramAuthPage'
import ProfilePage from './pages/ProfilePage'
import InvitePage from './pages/InvitePage'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
          <p className="text-[18px] font-bold">Что-то пошло не так</p>
          <p className="text-text-2 text-[14px]">Перезагрузите страницу — данные в порядке</p>
          <button
            className="mt-2 px-5 py-2 bg-accent text-white rounded-lg text-[14px] font-semibold"
            onClick={() => window.location.reload()}
          >
            Перезагрузить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function RequireAuth({ children }) {
  const token = useStore(s => s.token)
  return token ? children : <Navigate to="/auth" replace />
}

export default function App() {
  const token = useStore(s => s.token)
  const setAuth = useStore(s => s.setAuth)
  const logout = useStore(s => s.logout)

  useEffect(() => {
    if (!token) return
    // 401 обрабатывается глобальным обработчиком в api/index.js (forceLogout + редирект).
    // Для сбоев сети / 5xx — оставляем пользователя залогиненным, не выходим.
    api.me().then(user => setAuth(user, token)).catch(() => {})
  }, [token])

  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/tg" element={<TelegramAuthPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dishes" element={<DishesPage />} />
          <Route path="dishes/:id" element={<DishDetailPage />} />
          <Route path="fridge" element={<RequireAuth><FridgePage /></RequireAuth>} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="my-recipes" element={<RequireAuth><MyRecipesPage /></RequireAuth>} />
          <Route path="my-recipes/new" element={<RequireAuth><RecipeFormPage /></RequireAuth>} />
          <Route path="my-recipes/:id/edit" element={<RequireAuth><RecipeFormPage /></RequireAuth>} />
          <Route path="groups" element={<RequireAuth><GroupsPage /></RequireAuth>} />
          <Route path="groups/new" element={<RequireAuth><GroupFormPage /></RequireAuth>} />
          <Route path="groups/:id" element={<RequireAuth><GroupDetailPage /></RequireAuth>} />
          <Route path="groups/:id/edit" element={<RequireAuth><GroupFormPage /></RequireAuth>} />
          <Route path="plan" element={<RequireAuth><MealPlanPage /></RequireAuth>} />
          <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
