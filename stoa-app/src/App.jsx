import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import SplashScreen   from './pages/SplashScreen'
import AuthScreen     from './pages/AuthScreen'
import CreateAccount  from './pages/CreateAccount'
import LoginScreen    from './pages/LoginScreen'
import HomeMap        from './pages/HomeMap'
import ShopDetail     from './pages/ShopDetail'
import CheckIn        from './pages/CheckIn'
import RewardsScreen  from './pages/RewardsScreen'

// Redirect unauthenticated users away from protected routes
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"               element={<SplashScreen />} />
          <Route path="/auth"           element={<AuthScreen />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/login"          element={<LoginScreen />} />

          {/* Core app — guest access allowed on map */}
          <Route path="/home"           element={<HomeMap />} />
          <Route path="/shop/:id"       element={<ShopDetail />} />
          <Route path="/checkin/:id"    element={<CheckIn />} />
          <Route path="/rewards"        element={<RewardsScreen />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
