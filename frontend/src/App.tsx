import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { ReportsPage } from './pages/ReportsPage';
import { SuperviseurPage } from './pages/SuperviseurPage';
import { SuperieurPage } from './pages/SuperieurPage';
import { getTestUser } from './services/authService';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  role: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, role }) => {
  const user = getTestUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    if (user.role === 'SuperieurHierarchique') return <Navigate to="/superieur" replace />;
    if (user.role === 'Superviseur') return <Navigate to="/superviseur" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<RoleProtectedRoute role="UserSimple"><DashboardPage /></RoleProtectedRoute>} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/superviseur" element={<RoleProtectedRoute role="Superviseur"><SuperviseurPage /></RoleProtectedRoute>} />
        <Route path="/superieur" element={<RoleProtectedRoute role="SuperieurHierarchique"><SuperieurPage /></RoleProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><div style={{ textAlign: 'center' }}><p style={{ fontFamily: "'Playfair Display', serif", fontSize: '6rem', fontWeight: 700, color: 'var(--earth-pale)', marginBottom: '1rem' }}>404</p><h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 600, color: 'var(--earth-dark)', marginBottom: '0.5rem' }}>Page non trouvée</h1><p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cette page n'existe pas</p></div></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
