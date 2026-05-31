import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import msalInstance from './services/authService';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        <Routes>
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
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}><div style={{ textAlign: 'center' }}><p style={{ fontFamily: "'Playfair Display', serif", fontSize: '6rem', fontWeight: 700, color: 'var(--earth-pale)', marginBottom: '1rem' }}>404</p><h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 600, color: 'var(--earth-dark)', marginBottom: '0.5rem' }}>Page non trouvée</h1><p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cette page n'existe pas</p></div></div>} />
        </Routes>
      </BrowserRouter>
    </MsalProvider>
  );
}

export default App;
