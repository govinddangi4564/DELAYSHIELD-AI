import React, { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import ShipmentsPage from './pages/ShipmentsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import Sidebar from './components/Sidebar'
import SimulationPage from './pages/SimulationPage'
import PriorityMapPage from './pages/PriorityMapPage'
import ShipmentDetailsPage from './pages/ShipmentDetailsPage'
import LoginPage from './pages/LoginPage'
import LossImpactPage from './pages/LossImpactPage'
import LandingPage from './pages/LandingPage'
import ProtectedRoute from './components/ProtectedRoute'
import { NavigationLoadingProvider } from './components/NavigationLoadingContext'
import { useAuth } from './auth/AuthContext'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function AppShell() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const showSidebar = isAuthenticated && !['/', '/login'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-blue-50 font-sans text-blue-950 flex">
      {showSidebar ? <Sidebar /> : null}

      <main className={`flex-1 pb-20 md:pb-0 relative ${showSidebar ? 'ml-0 md:ml-64' : ''}`}>
        <div
          className="absolute inset-0 z-0 opacity-30 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#bfdbfe 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        <div className="relative z-10 w-full h-full">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/shipments" element={<ProtectedRoute><ShipmentsPage /></ProtectedRoute>} />
            <Route path="/shipment/:id" element={<ProtectedRoute><ShipmentDetailsPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/priority-map" element={<ProtectedRoute><PriorityMapPage /></ProtectedRoute>} />
            <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
            <Route path="/loss-engine" element={<ProtectedRoute><LossImpactPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <NavigationLoadingProvider>
        <ScrollToTop />
        <AppShell />
      </NavigationLoadingProvider>
    </BrowserRouter>
  )
}

export default App
