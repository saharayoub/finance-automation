import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { LoginButton } from '../components/Auth/LoginButton';
import { BlobMain } from '../components/Common/BlobMain';
import { BlobSecond } from '../components/Common/BlobSecond';
import { DotsGrid } from '../components/Common/DotsGrid';
import { ThinLine } from '../components/Common/ThinLine';
import { FinanceIllustration } from '../components/Common/FinanceIllustration';
import { loginWithTestAccount, getTestUser } from '../services/authService';

const IS_DEV = import.meta.env.VITE_ENVIRONMENT === 'development';

export const LoginPage: React.FC = () => {
  const { accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;
  const navigate = useNavigate();

  const testUser = getTestUser();
  if (testUser || isAuthenticated) {
    const user = testUser;
    if (user?.role === 'SuperieurHierarchique') return <Navigate to="/superieur" replace />;
    if (user?.role === 'Superviseur') return <Navigate to="/superviseur" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginWithTestAccount(email, password);
      const role = data.user.role;
      if (role === 'SuperieurHierarchique') navigate('/superieur');
      else if (role === 'Superviseur') navigate('/superviseur');
      else navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

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
          Groupe Kilani
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

        {IS_DEV && (
          <>
            <form onSubmit={handleTestLogin} style={{ width: '100%' }}>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 400,
                fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem',
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>MODE TEST</p>
              <input
                type="text"
                placeholder="user@test.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '0.7rem 0.9rem', marginBottom: '0.5rem',
                  border: '1px solid var(--earth-pale)', borderRadius: '6px',
                  fontFamily: "'Inter', sans-serif", fontWeight: 300,
                  fontSize: '0.85rem', color: 'var(--text-primary)',
                  background: 'white', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '0.7rem 0.9rem', marginBottom: '0.5rem',
                  border: '1px solid var(--earth-pale)', borderRadius: '6px',
                  fontFamily: "'Inter', sans-serif", fontWeight: 300,
                  fontSize: '0.85rem', color: 'var(--text-primary)',
                  background: 'white', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {error && (
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '0.78rem',
                  color: '#C4826A', marginBottom: '0.5rem',
                }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '0.7rem',
                  background: 'transparent', border: '1px solid var(--earth-mid)',
                  borderRadius: '6px',
                  fontFamily: "'Inter', sans-serif", fontWeight: 500,
                  fontSize: '0.85rem', color: 'var(--earth-mid)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--bg-secondary)'; }}}
                onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = 'transparent'; }}}
              >
                {loading ? 'Connexion...' : 'Se connecter (test)'}
              </button>

              <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif", fontWeight: 300, lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>Comptes disponibles:</p>
                <p style={{ margin: '0.1rem 0' }}>user@test.com / user123</p>
                <p style={{ margin: '0.1rem 0' }}>superieur@test.com / sup123</p>
                <p style={{ margin: '0.1rem 0' }}>superviseur@test.com / admin123</p>
              </div>
            </form>

            <div style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginTop: '1.5rem',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--earth-pale)' }} />
              <span style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 300,
                fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap',
              }}>
                ou
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--earth-pale)' }} />
            </div>
          </>
        )}

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
