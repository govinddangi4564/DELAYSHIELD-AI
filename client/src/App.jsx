import React, { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import Sidebar from "./components/Sidebar";
import SLAGuardianPage from "./pages/SLAGuardianPage";
import WarehouseIntelligencePage from "./pages/WarehouseIntelligencePage";
import CommunicationCenterPage from "./pages/CommunicationCenterPage";
import TrackingCenterPage from "./pages/TrackingCenterPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import LossImpactPage from "./pages/LossImpactPage";
import LandingPage from "./pages/LandingPage";
import SharedRoutePage from "./pages/SharedRoutePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { NavigationLoadingProvider } from "./components/NavigationLoadingContext";
import { useAuth } from "./auth/AuthContext";
import { ShipmentProvider } from "./context/ShipmentContext";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

// Prevent back button navigation
function BackButtonHandler() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Push a new history state to prevent back navigation
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (event) => {
      // If user tries to go back and is not authenticated, stay on login
      if (!isAuthenticated) {
        window.history.pushState(null, "", "/login");
        navigate("/login", { replace: true });
      } else {
        // If authenticated, allow back within app but prevent going to login
        if (location.pathname === "/login") {
          window.history.pushState(null, "", "/dashboard");
          navigate("/dashboard", { replace: true });
        }
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isAuthenticated, navigate, location.pathname]);

  return null;
}

function AppShell() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const showSidebar =
    isAuthenticated && !["/", "/login"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-blue-50 font-sans text-blue-950 flex">
      {showSidebar ? <Sidebar /> : null}

      <main
        className={`flex-1 pb-20 md:pb-0 relative ${showSidebar ? "ml-0 md:ml-64" : ""}`}
      >
        <div
          className="absolute inset-0 z-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#bfdbfe 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 w-full h-full">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipments"
              element={
                <ProtectedRoute>
                  <ShipmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sla-guardian"
              element={
                <ProtectedRoute>
                  <SLAGuardianPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/warehouse"
              element={
                <ProtectedRoute>
                  <WarehouseIntelligencePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/communication"
              element={
                <ProtectedRoute>
                  <CommunicationCenterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedRoute>
                  <TrackingCenterPage />
                </ProtectedRoute>
              }
            />
            <Route path="/share/:id" element={<SharedRoutePage />} />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/loss-engine"
              element={
                <ProtectedRoute>
                  <LossImpactPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavigationLoadingProvider>
        <ShipmentProvider>
          <BackButtonHandler />
          <ScrollToTop />
          <AppShell />
        </ShipmentProvider>
      </NavigationLoadingProvider>
    </BrowserRouter>
  );
}

export default App;
