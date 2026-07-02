import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { RegisterPage } from './features/auth/RegisterPage'
import { DataPage } from './features/data/DataPage'
import { GardenDetailPage } from './features/gardens/GardenDetailPage'
import { GardensListPage } from './features/gardens/GardensListPage'
import { BedDetailPage } from './features/plantings/BedDetailPage'
import { SpeciesLibraryPage } from './features/species/SpeciesLibraryPage'

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
      <Route
        path="/gardens/:gardenId/beds/:bedId"
        element={
          <ProtectedRoute>
            <BedDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/species"
        element={
          <ProtectedRoute>
            <SpeciesLibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dane"
        element={
          <ProtectedRoute>
            <DataPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/gardens" replace />} />
    </Routes>
  )
}

export default App
