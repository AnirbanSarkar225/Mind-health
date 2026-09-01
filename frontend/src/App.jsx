import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import HardwareAnalysis from './pages/HardwareAnalysis';
import SelfAssessment from './pages/SelfAssessment';
import SessionHistory from './pages/SessionHistory';
import Account from './pages/Account';
import Sidebar from './components/Sidebar';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="loading-spinner"></div>
        <p>Verifying secure session...</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Gita-NeuroSync...</p>
      </div>
    );
  }

  // Unauthenticated → Full-width responsive Landing page
  if (!isAuthenticated) {
    return (
      <div className="landing-layout">
        <Routes>
          <Route path="*" element={<Landing />} />
        </Routes>
      </div>
    );
  }

  // Authenticated → Modern SaaS layout with pinned Left Sidebar & Fluid Main Content
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="content-container">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/hardware" element={<ProtectedRoute><HardwareAnalysis /></ProtectedRoute>} />
            <Route path="/assessment" element={<ProtectedRoute><SelfAssessment /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><SessionHistory /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
