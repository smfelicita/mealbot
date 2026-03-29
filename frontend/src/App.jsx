import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
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

function RequireAuth({ children }) {
  const token = useStore(s => s.token)
  return token ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
