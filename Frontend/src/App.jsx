import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "./store/useStore";
import * as api from "./api";

// Lazy load components for performance
const Auth = lazy(() => import("./pages/Auth/Auth").then(m => ({ default: m.AuthScreen })));
const Home = lazy(() => import("./pages/Home/Home").then(m => ({ default: m.Home })));
const Mission = lazy(() => import("./pages/Mission/Mission").then(m => ({ default: m.Mission })));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard").then(m => ({ default: m.Dashboard })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const BadgeHall = lazy(() => import("./pages/BadgeHall/BadgeHall").then(m => ({ default: m.BadgeHall })));

function AppContent() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { 
    token, 
    user, 
    setToken, 
    setUser, 
    logout, 
    currentSubject,
    setCurrentSubject 
  } = useStore();

  const isRTL = i18n.language === "fa";

  // Sync language direction to <html> element globally
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRTL]);

  // -- Auth Handlers --
  const handleLogin = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res.error || res.message || (!res.token)) {
        if (!res.token) {
          throw new Error(res.error || res.message || "Login failed");
        }
      }
      setToken(res.token);
      setUser(res.user);
      navigate("/");
    } catch (err) {
      throw new Error(err.message || "Login failed");
    }
  };

  const handleRegister = async (data) => {
    try {
      const res = await api.register(data);
      if (res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        navigate("/");
      }
    } catch (err) {
      throw new Error(err.message || "Registration failed");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  // -- Navigation Handlers --
  const startMission = (subjectId, lessonId) => {
    setCurrentSubject(subjectId);
    navigate(`/mission?lessonId=${lessonId || ''}`);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-vazir ${isRTL ? "rtl text-right" : "ltr text-left"}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">🚀 Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/auth" 
            element={!token ? <Auth mode="login" setMode={() => {}} onLogin={handleLogin} onRegister={handleRegister} /> : <Navigate to="/" />} 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={token ? <Home onStart={startMission} onHall={(tab) => navigate(`/profile?tab=${tab}`)} onLogout={handleLogout} onDashboard={() => navigate("/curriculum")} onAdmin={() => navigate("/admin")} /> : <Navigate to="/auth" />} 
          />
          
          <Route 
            path="/mission" 
            element={token && currentSubject ? (
              <Mission 
                subjectId={currentSubject} 
                lessonId={new URLSearchParams(window.location.search).get('lessonId')}
                onHome={() => navigate("/")} 
                api={api} 
              />
            ) : <Navigate to="/" />} 
          />

          <Route 
            path="/curriculum" 
            element={token && (user?.role === 'admin' || user?.role === 'teacher') ? <Dashboard /> : <Navigate to="/" />} 
          />

          <Route 
            path="/admin" 
            element={token && user?.role === 'admin' ? <AdminDashboard onBack={() => navigate("/")} /> : <Navigate to="/" />} 
          />
          
          <Route 
            path="/profile" 
            element={token ? <BadgeHall onBack={() => navigate("/")} onLogout={handleLogout} /> : <Navigate to="/auth" />} 
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
