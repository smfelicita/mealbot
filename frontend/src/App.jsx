import { useEffect, useState, Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useStore } from './store'
import { api } from './api'
import Layout from './components/Layout'
import OnboardingModal from './components/domain/OnboardingModal'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import DishesPage from './pages/DishesPage'
import DishDetailPage from './pages/DishDetailPage'
import FridgePage from './pages/FridgePage'
import ChatPage from './pages/ChatPage'
import DishFormPage from './pages/DishFormPage'
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
          <p className="text-lg font-bold">Что-то пошло не так</p>
          <p className="text-text-2 text-sm">Перезагрузите страницу — данные в порядке</p>
          <button
            className="mt-2 px-5 py-2 bg-accent text-white rounded-lg text-sm font-semibold"
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

// Редирект /v2/dishes/:id → /dishes/:id (для старых закладок)
function RedirectV2Dish() {
  const { id } = useParams()
  return <Navigate to={`/dishes/${id}`} replace />
}

export default function App() {
  const token          = useStore(s => s.token)
  const setAuth        = useStore(s => s.setAuth)
  const setPlanDishIds = useStore(s => s.setPlanDishIds)
  const setFridge      = useStore(s => s.setFridge)

  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('mealbot_show_onboarding') === '1'
  )

  useEffect(() => {
    if (!token) return
    api.me().then(user => setAuth(user, token)).catch(() => {})
    api.getMealPlans().then(plans => setPlanDishIds(plans.map(p => p.dishId))).catch(() => {})
    api.getFridge().then(({ items }) => setFridge(items)).catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token) {
      setShowOnboarding(false)
    } else if (localStorage.getItem('mealbot_show_onboarding') === '1') {
      setShowOnboarding(true)
    }
  }, [token])

  return (
    <BrowserRouter>
      <ErrorBoundary>
      {showOnboarding && token && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/tg" element={<TelegramAuthPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dishes" element={<DishesPage />} />
          <Route path="dishes/:id" element={<DishDetailPage />} />
          <Route path="fridge" element={<FridgePage />} />
          {/* Backward compat: /v2/* → / (для старых закладок, можно убрать через 1-2 недели) */}
          <Route path="v2" element={<Navigate to="/" replace />} />
          <Route path="v2/dishes" element={<Navigate to="/dishes" replace />} />
          <Route path="v2/dishes/:id" element={<RedirectV2Dish />} />
          <Route path="v2/fridge" element={<Navigate to="/fridge" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="my-recipes" element={<Navigate to="/dishes" replace />} />
          <Route path="dishes/new" element={<RequireAuth><DishFormPage /></RequireAuth>} />
          <Route path="dishes/:id/edit" element={<RequireAuth><DishFormPage /></RequireAuth>} />
          <Route path="groups" element={<RequireAuth><GroupsPage /></RequireAuth>} />
          <Route path="groups/new" element={<RequireAuth><GroupFormPage /></RequireAuth>} />
          <Route path="groups/:id" element={<RequireAuth><GroupDetailPage /></RequireAuth>} />
          <Route path="groups/:id/edit" element={<RequireAuth><GroupFormPage /></RequireAuth>} />
          <Route path="plan" element={<MealPlanPage />} />
          <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
