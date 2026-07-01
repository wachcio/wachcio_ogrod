import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { RegisterPage } from './features/auth/RegisterPage'
import { GardenDetailPage } from './features/gardens/GardenDetailPage'
import { GardensListPage } from './features/gardens/GardensListPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/gardens"
        element={
          <ProtectedRoute>
            <GardensListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gardens/:id"
        element={
          <ProtectedRoute>
            <GardenDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/gardens" replace />} />
    </Routes>
  )
}

export default App
