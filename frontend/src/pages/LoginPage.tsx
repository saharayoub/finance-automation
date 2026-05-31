import { Navigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { LoginButton } from '../components/Auth/LoginButton';
import { BlobMain } from '../components/Common/BlobMain';
import { BlobSecond } from '../components/Common/BlobSecond';
import { DotsGrid } from '../components/Common/DotsGrid';
import { ThinLine } from '../components/Common/ThinLine';
import { FinanceIllustration } from '../components/Common/FinanceIllustration';

export const LoginPage: React.FC = () => {
  const { accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="split-screen" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Left column — decorative */}
      <div className="split-left" style={{
        flex: '0 0 55%',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '4rem',
      }}>
        <BlobMain />
        <BlobSecond />
        <DotsGrid />
        <FinanceIllustration />
      </div>

      {/* Right column — login form */}
      <div className="split-right" style={{
        flex: '0 0 45%',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '4rem 5rem',
      }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 400,
          fontSize: '1.2rem',
          color: 'var(--earth-mid)',
          letterSpacing: '0.02em',
        }}>
          Finance.
        </span>

        <ThinLine />

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: '0.72rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginTop: '0.5rem',
        }}>
          BIENVENUE
        </p>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          color: 'var(--earth-dark)',
          marginTop: '0.5rem',
        }}>
          Connectez-vous.
        </h1>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '1.05rem',
          lineHeight: 1.85,
          color: 'var(--text-secondary)',
          marginTop: '1rem',
          maxWidth: '28rem',
        }}>
          Accédez à votre espace financier sécurisé.
        </p>

        <div style={{ height: '2.5rem' }} />

        <LoginButton />

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginTop: '1rem',
        }}>
          Plateforme réservée aux membres du groupe.
        </p>
      </div>
    </div>
  );
};
