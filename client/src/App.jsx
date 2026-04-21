import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ShipmentsPage from './pages/ShipmentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <BrowserRouter>
      {/* Blue-50 base, natural scrolling shell */}
      <div className="min-h-screen bg-blue-50 font-sans text-blue-950 flex">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 ml-64 relative">
          {/* Subtle dot grid overlay */}
          <div
            className="absolute inset-0 z-0 opacity-30 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#bfdbfe 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />

          <div className="relative z-10 w-full h-full">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/shipments" element={<ShipmentsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
