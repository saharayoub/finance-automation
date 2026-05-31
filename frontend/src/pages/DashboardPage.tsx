import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../services/authService';
import { Layout } from '../components/Common/Layout';
import { BlobMain } from '../components/Common/BlobMain';
import { DotsGrid } from '../components/Common/DotsGrid';
import { ThinLine } from '../components/Common/ThinLine';

interface UserInfo {
  name: string;
  email: string;
}

type UploadStatus = 'validated' | 'error' | 'pending';

const mockUploads: Array<{
  id: string; filename: string; company: string; type: string; date: string; status: UploadStatus;
}> = [
  { id: '1', filename: 'CA_Janvier_2025.csv', company: 'CompanyA', type: 'CA', date: '28 mai 2025', status: 'validated' },
  { id: '2', filename: 'Engagement_Jan.csv',  company: 'CompanyA', type: 'Engagement', date: '27 mai 2025', status: 'validated' },
  { id: '3', filename: 'CA_Fevrier_2025.csv', company: 'CompanyB', type: 'CA', date: '26 mai 2025', status: 'error' },
  { id: '4', filename: 'Engagement_Fev.csv',  company: 'CompanyB', type: 'Engagement', date: '25 mai 2025', status: 'pending' },
];

const mockEvents: Array<{
  type: string; title: string; company: string; date: string; detail: string | null;
}> = [
  { type: 'success', title: 'Fichier CA validé', company: 'CompanyA', date: '28 mai 2025 · 14h32', detail: null },
  { type: 'error',   title: 'Erreur détectée dans Engagement', company: 'CompanyB', date: '27 mai 2025 · 09h15', detail: 'LOCAL + Export ≠ MontantCA ligne 7' },
  { type: 'success', title: 'Rapport PPTX généré', company: 'CompanyA', date: '26 mai 2025 · 16h45', detail: null },
  { type: 'success', title: 'Fichier Engagement validé', company: 'CompanyA', date: '25 mai 2025 · 11h20', detail: null },
];

const statusBadge = (status: UploadStatus) => {
  const styles: Record<UploadStatus, { bg: string; color: string; label: string }> = {
    validated: { bg: '#F0F4F0', color: '#5A7A5C', label: 'Validé' },
    error:     { bg: '#FAF0EE', color: '#8B5A52', label: 'Erreur' },
    pending:   { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', label: 'En attente' },
  };
  const s = styles[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.3rem 0.8rem', background: s.bg, color: s.color,
      borderRadius: '20px', fontSize: '0.78rem',
      fontFamily: "'Inter', sans-serif", fontWeight: 500,
    }}>
      {status === 'validated' ? '✓' : status === 'error' ? '✕' : '◌'} {s.label}
    </span>
  );
};

export const DashboardPage: React.FC = () => {
  const { accounts } = useMsal();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const account = accounts[0];

  useEffect(() => {
    const fetchUser = async () => {
      const token = await getAccessToken();
      if (token) {
        try {
          const response = await fetch('http://localhost:8000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setUserInfo({ name: data.name, email: data.email });
          }
        } catch {
          setUserInfo({
            name: account?.name || '',
            email: account?.username || '',
          });
        }
      }
    };
    fetchUser();
  }, [account]);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const stats = [
    { value: '12', label: 'Total uploads' },
    { value: '9',  label: 'Validés' },
    { value: '3',  label: 'En attente' },
  ];

  return (
    <Layout>
      {/* ─── SECTION 1 : HERO ─── */}
      <div style={{
        minHeight: 'calc(100vh - 88px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ flex: '0 0 60%', position: 'relative', zIndex: 2 }}>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 500,
            fontSize: '0.72rem', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            TABLEAU DE BORD
          </p>

          <ThinLine />

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700, lineHeight: 1.1, color: 'var(--earth-dark)',
          }}>
            Bonjour, {userInfo?.name?.split(' ')[0] || 'invité'}.
          </h1>

          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 300,
            fontSize: '0.9rem', color: 'var(--text-muted)',
            marginTop: '0.5rem', textTransform: 'capitalize',
          }}>
            {today}
          </p>

          <div style={{ margin: '1.5rem 0' }}>
            <ThinLine />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', maxWidth: '36rem' }}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  flex: 1, minWidth: 0, background: 'white',
                  border: '1px solid var(--earth-pale)',
                  borderRadius: '12px', padding: '1.5rem 1.8rem',
                  boxShadow: '0 2px 12px rgba(92,74,58,0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(92,74,58,0.1)';
                  e.currentTarget.style.borderColor = 'var(--earth-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(92,74,58,0.05)';
                  e.currentTarget.style.borderColor = 'var(--earth-pale)';
                }}
              >
                <p style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '2.8rem',
                  fontWeight: 700, color: 'var(--earth-dark)', lineHeight: 1, margin: 0,
                }}>
                  {stat.value}
                </p>
                <div style={{
                  width: '100%', height: '1px', background: 'var(--earth-pale)',
                  margin: '0.8rem 0',
                }} />
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 300,
                  fontSize: '0.78rem', color: 'var(--text-muted)',
                  letterSpacing: '0.05em', margin: 0,
                }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div style={{ height: '2.5rem' }} />

          <button
            onClick={() => navigate('/upload')}
            style={{
              padding: '0.9rem 2.2rem', background: 'var(--earth-dark)',
              color: 'white', border: 'none', borderRadius: '6px',
              fontFamily: "'Inter', sans-serif", fontWeight: 500,
              fontSize: '0.95rem', cursor: 'pointer', letterSpacing: '0.03em',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(92,74,58,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--earth-dark)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Nouvel Upload &rarr;
          </button>
        </div>

        <div style={{
          flex: '0 0 40%', position: 'relative', height: '100%', minHeight: '400px',
        }}>
          <BlobMain />
          <DotsGrid style={{ bottom: '15%', left: '10%', right: 'auto', opacity: 0.5 }} />

          <div style={{
            position: 'absolute', bottom: '25%', right: '8%',
            background: 'white', border: '1px solid var(--earth-pale)',
            borderRadius: '14px', padding: '1.2rem 1.5rem',
            width: '220px', boxShadow: '0 8px 30px rgba(92,74,58,0.1)',
            zIndex: 2,
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              fontSize: '0.8rem', color: '#7A9E7E', margin: 0,
            }}>
              ↑ +24% ce mois
            </p>
            <div style={{
              width: '100%', height: '1px', background: 'var(--earth-pale)',
              margin: '0.6rem 0',
            }} />
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 300,
              fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0,
            }}>
              Dernier upload validé
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 300,
              fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0',
            }}>
              CA · CompanyA · 28 mai
            </p>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2 : HISTORIQUE ─── */}
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '5rem 8%',
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 500,
          fontSize: '0.72rem', letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
        }}>
          HISTORIQUE
        </p>

        <ThinLine />

        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
          fontWeight: 600, color: 'var(--earth-dark)',
        }}>
          Vos derniers imports.
        </h2>

        <p style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 300,
          fontSize: '1.05rem', lineHeight: 1.85,
          color: 'var(--text-secondary)', marginTop: '0.5rem',
        }}>
          Retrouvez tous vos fichiers uploadés et leur statut de validation.
        </p>

        <div style={{ height: '2.5rem' }} />

        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid var(--earth-pale)',
          overflow: 'hidden', boxShadow: '0 2px 16px rgba(92,74,58,0.05)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--earth-pale)',
              }}>
                {['Fichier', 'Société', 'Type', 'Date', 'Statut', 'Actions'].map((h) => (
                  <th key={h} style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 500,
                    fontSize: '0.72rem', letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'var(--text-muted)',
                    padding: '1rem 1.5rem', textAlign: 'left',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockUploads.map((row) => (
                <tr key={row.id} style={{
                  borderBottom: '1px solid var(--earth-pale)',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{
                    padding: '1.1rem 1.5rem',
                    fontFamily: "'Inter', sans-serif", fontWeight: 500,
                    fontSize: '0.88rem', color: 'var(--text-primary)',
                    maxWidth: '160px', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {row.filename}
                  </td>
                  <td style={{
                    padding: '1.1rem 1.5rem',
                    fontFamily: "'Inter', sans-serif", fontWeight: 300,
                    fontSize: '0.88rem', color: 'var(--text-secondary)',
                  }}>
                    {row.company}
                  </td>
                  <td style={{
                    padding: '1.1rem 1.5rem',
                    fontFamily: "'Inter', sans-serif", fontWeight: 300,
                    fontSize: '0.88rem', color: 'var(--text-secondary)',
                  }}>
                    {row.type}
                  </td>
                  <td style={{
                    padding: '1.1rem 1.5rem',
                    fontFamily: "'Inter', sans-serif", fontWeight: 300,
                    fontSize: '0.88rem', color: 'var(--text-secondary)',
                  }}>
                    {row.date}
                  </td>
                  <td style={{ padding: '1.1rem 1.5rem' }}>
                    {statusBadge(row.status)}
                  </td>
                  <td style={{ padding: '1.1rem 1.5rem' }}>
                    {row.status === 'validated' ? (
                      <button style={{
                        padding: '0.4rem 0.9rem', background: 'transparent',
                        border: '1px solid var(--earth-pale)', borderRadius: '6px',
                        fontFamily: "'Inter', sans-serif", fontWeight: 500,
                        fontSize: '0.78rem', color: 'var(--earth-mid)',
                        cursor: 'pointer', display: 'inline-flex',
                        alignItems: 'center', gap: '0.35rem',
                        transition: 'all 0.2s',
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--earth-dark)';
                          e.currentTarget.style.color = 'var(--earth-dark)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--earth-pale)';
                          e.currentTarget.style.color = 'var(--earth-mid)';
                        }}
                      >
                        ↓ PPTX
                      </button>
                    ) : (
                      <span style={{
                        fontFamily: "'Inter', sans-serif", fontWeight: 300,
                        fontSize: '0.8rem', color: 'var(--text-muted)',
                      }}>
                        &mdash;
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SECTION 3 : ACTIVITÉ ─── */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: '5rem 8%',
        display: 'flex',
        gap: '5%',
      }}>
        <div style={{ flex: '0 0 55%' }}>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 500,
            fontSize: '0.72rem', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            ACTIVITÉ
          </p>

          <ThinLine />

          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 600, color: 'var(--earth-dark)',
          }}>
            Ce qui s'est passé.
          </h2>

          <div style={{ height: '2rem' }} />

          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            <div style={{
              position: 'absolute', left: '6px', top: '8px', bottom: '8px',
              width: '1px', background: 'var(--earth-pale)',
            }} />

            {mockEvents.map((event, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: '2rem' }}>
                <div style={{
                  position: 'absolute', left: '-2rem', top: '4px',
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: event.type === 'error' ? '#C4826A' : 'var(--earth-dark)',
                  border: '2px solid var(--bg-primary)',
                  boxShadow: '0 0 0 3px var(--earth-pale)',
                }} />
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 500,
                  fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0,
                }}>
                  {event.title}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 300,
                  fontSize: '0.78rem', color: 'var(--text-muted)',
                  marginTop: '0.2rem', margin: '0.2rem 0 0',
                }}>
                  {event.company} · {event.date}
                </p>
                {event.detail && (
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 300,
                    fontSize: '0.78rem', color: 'var(--text-muted)',
                    fontStyle: 'italic', marginTop: '0.2rem', margin: '0.2rem 0 0',
                  }}>
                    &ldquo;{event.detail}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '0 0 40%', marginTop: '4.5rem' }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--earth-pale)',
            borderRadius: '16px', padding: '2rem',
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 500,
              fontSize: '0.72rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem',
            }}>
              À FAIRE
            </p>

            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 300,
              fontSize: '0.95rem', lineHeight: 1.6,
              color: 'var(--text-secondary)',
            }}>
              CompanyB doit encore soumettre son CA de mai.
            </p>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem',
              }}>
                <span style={{
                  fontSize: '0.78rem', color: 'var(--text-muted)',
                  fontFamily: "'Inter', sans-serif", fontWeight: 300,
                }}>
                  2 sociétés sur 3 soumises
                </span>
                <span style={{
                  fontSize: '0.78rem', color: 'var(--earth-dark)',
                  fontFamily: "'Inter', sans-serif", fontWeight: 500,
                }}>
                  67%
                </span>
              </div>
              <div style={{
                height: '4px', background: 'var(--earth-pale)', borderRadius: '2px',
              }}>
                <div style={{
                  height: '100%', width: '67%',
                  background: 'var(--earth-dark)', borderRadius: '2px',
                  transition: 'width 1s ease',
                }} />
              </div>
            </div>

            <button style={{
              marginTop: '1.5rem', width: '100%', padding: '0.8rem',
              background: 'transparent', border: '1px solid var(--earth-dark)',
              borderRadius: '6px', fontFamily: "'Inter', sans-serif",
              fontWeight: 500, fontSize: '0.85rem', color: 'var(--earth-dark)',
              cursor: 'pointer', transition: 'all 0.3s',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--earth-dark)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--earth-dark)';
              }}
            >
              Envoyer un rappel
            </button>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{
        background: 'var(--bg-secondary)',
        padding: '2rem 8%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid var(--earth-pale)',
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 300,
          fontSize: '0.78rem', color: 'var(--text-muted)',
        }}>
          Finance Automation &middot; v1.0
        </span>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 300,
          fontSize: '0.78rem', color: 'var(--text-muted)',
        }}>
          Propulsé par DeepSeek IA
        </span>
      </footer>
    </Layout>
  );
};
