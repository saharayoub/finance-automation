import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../config/msalConfig';

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21">
    <rect x="0" y="0" width="9" height="9" fill="#f25022"/>
    <rect x="12" y="0" width="9" height="9" fill="#7fba00"/>
    <rect x="0" y="12" width="9" height="9" fill="#00a4ef"/>
    <rect x="12" y="12" width="9" height="9" fill="#ffb900"/>
  </svg>
);

export const LoginButton: React.FC = () => {
  const { instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await instance.loginPopup(loginRequest);
    } catch {
      setError('La connexion a échoué. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {error && (
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.8rem',
          color: '#c0392b',
          marginBottom: '0.75rem',
          textAlign: 'center',
        }}>
          {error}
        </p>
      )}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '1rem 2rem',
          background: isLoading ? 'var(--earth-mid)' : 'var(--earth-dark)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: '0.95rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          letterSpacing: '0.02em',
          transition: 'background 0.3s ease, transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isLoading ? 'var(--earth-mid)' : 'var(--earth-dark)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <MicrosoftIcon />
        {isLoading ? 'Connexion en cours...' : 'Se connecter avec Microsoft'}
      </button>
    </div>
  );
};
