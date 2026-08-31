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
  if (loading) return <div className="app-container"><div className="app-inner" style={{textAlign:'center',paddingTop:'4rem'}}>Loading...</div></div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-container"><div className="app-inner" style={{textAlign:'center',paddingTop:'4rem',fontSize:'1.1rem',color:'var(--text-secondary)'}}>Loading Gita-NeuroSync...</div></div>;
  }

  // Unauthenticated → Landing page
  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="app-inner">
          <Routes>
            <Route path="*" element={<Landing />} />
          </Routes>
        </div>
      </div>
    );
  }

  // Authenticated → Sidebar + Pages
  return (
    <div className="app-container">
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/hardware" element={<ProtectedRoute><HardwareAnalysis /></ProtectedRoute>} />
            <Route path="/assessment" element={<ProtectedRoute><SelfAssessment /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><SessionHistory /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
