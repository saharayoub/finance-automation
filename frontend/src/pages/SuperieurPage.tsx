import { useState, useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { ThinLine } from '../components/Common/ThinLine';
import { BlobMain } from '../components/Common/BlobMain';
import { BlobSecond } from '../components/Common/BlobSecond';
import { DotsGrid } from '../components/Common/DotsGrid';
import { FinanceIllustration } from '../components/Common/FinanceIllustration';
import { logout } from '../services/authService';
import api from '../services/api';

/* ─── MOCK DATA ─── */

const FILIALES = [
  "Adwiya", "Argania"
];

const TYPES = ['ca', 'engagement', 'versement'] as const;
const TYPE_LABELS: Record<string, string> = {
  ca: "Chiffre d'Affaire", engagement: 'Engagement', versement: 'Versement',
};

const PERIODS = [
  'Janvier 2026', 'Février 2026', 'Mars 2026', 'Avril 2026',
  'Mai 2026', 'Juin 2026',
];

interface FilialeRow {
  id: number;
  societe: string;
  type: string;
  periode: string;
  etat: 'valide' | 'en_attente' | 'non_soumis' | 'rejete';
  dateUpload: string;
}

const ETAT_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  valide: { label: '✓ Validé', bg: '#F0F4F0', color: '#5A7A5C' },
  en_attente: { label: '◌ En attente', bg: '#F5EDE4', color: '#7A6152' },
  non_soumis: { label: '✕ Non soumis', bg: '#FAF0EE', color: '#8B5A52' },
  rejete: { label: '✕ Rejeté', bg: '#FAF0EE', color: '#B05A4A' },
};

const MOCK_ROWS: FilialeRow[] = [
  { id: 1,  societe: 'Adwiya',  type: 'ca',          periode: 'Juin 2026', etat: 'en_attente', dateUpload: '05/06/2026' },
  { id: 2,  societe: 'Adwiya',  type: 'engagement',  periode: 'Juin 2026', etat: 'valide',     dateUpload: '04/06/2026' },
  { id: 3,  societe: 'Adwiya',  type: 'versement',   periode: 'Juin 2026', etat: 'non_soumis', dateUpload: '—' },
  { id: 4,  societe: 'Argania', type: 'ca',          periode: 'Juin 2026', etat: 'en_attente', dateUpload: '05/06/2026' },
  { id: 5,  societe: 'Argania', type: 'engagement',  periode: 'Juin 2026', etat: 'en_attente', dateUpload: '03/06/2026' },
  { id: 6,  societe: 'Argania', type: 'versement',   periode: 'Juin 2026', etat: 'valide',     dateUpload: '02/06/2026' },
];

const ROWS_PER_PAGE = 15;

const navSuperieurItems = [
  { key: 'home', label: 'Accueil' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reports', label: 'Rapports' },
];

/* ─── COMPONENT ─── */

export const SuperieurPage: React.FC = () => {
  const [view, setView] = useState<'login' | 'home' | 'dashboard' | 'reports'>('home');
  const { accounts } = useMsal();
  const account = accounts[0];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get('/api/submissions/pending');
        setPendingSubmissions(res.data?.submissions || []);
      } catch { /* ignore */ }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    return `il y a ${Math.floor(hrs / 24)}j`;
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const handleNavClick = (key: string) => {
    setView(key as 'home' | 'dashboard' | 'reports');
  };

  const navbar = (
    <nav
      style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        padding: '1.5rem 8%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: scrolled ? 'rgba(250,247,242,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--earth-pale)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <span style={{
        fontFamily: "'Playfair Display', serif", fontWeight: 500,
        fontSize: '1.3rem', color: 'var(--earth-dark)', letterSpacing: '0.02em',
      }}>
        Groupe Kilani
      </span>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {navSuperieurItems.map((item) => {
          const isActive = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontWeight: 400,
                fontSize: '0.9rem',
                color: isActive ? 'var(--earth-dark)' : 'var(--text-secondary)',
                borderBottom: isActive ? '1px solid var(--earth-dark)' : '1px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.3s ease',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={notifRef}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          title="Notifications"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.3rem', lineHeight: 1, padding: '0.3rem',
            position: 'relative', transition: 'opacity 0.2s',
            opacity: notifOpen ? 1 : 0.7,
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = notifOpen ? '1' : '0.7'}
        >
          🔔
          {pendingSubmissions.length > 0 && (
            <span style={{
              position: 'absolute', top: '-2px', right: '-6px',
              minWidth: '16px', height: '16px', borderRadius: '50%',
              background: '#C4826A', color: 'white',
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              fontSize: '0.6rem', lineHeight: '16px', textAlign: 'center',
              padding: '0 4px',
            }}>
              {pendingSubmissions.length > 9 ? '9+' : pendingSubmissions.length}
            </span>
          )}
        </button>

        {notifOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: '380px', background: 'white', borderRadius: '12px',
            border: '1px solid var(--earth-pale)',
            boxShadow: '0 8px 30px rgba(92,74,58,0.12)',
            zIndex: 200, maxHeight: '420px', overflowY: 'auto',
          }}>
            <div style={{
              padding: '1rem 1.2rem', borderBottom: '1px solid var(--earth-pale)',
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              fontSize: '0.8rem', color: 'var(--earth-dark)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              🔔 notifications ({pendingSubmissions.length})
            </div>
            {pendingSubmissions.length === 0 ? (
              <div style={{
                padding: '2rem 1.2rem', textAlign: 'center',
                fontFamily: "'Inter', sans-serif", fontWeight: 300,
                fontSize: '0.85rem', color: 'var(--text-muted)',
              }}>
                Aucune soumission en attente.
              </div>
            ) : (
              pendingSubmissions.map((s: any) => (
                <div key={s.id} style={{
                  padding: '0.9rem 1.2rem', borderBottom: '1px solid var(--earth-pale)',
                  transition: 'background 0.2s', cursor: 'default',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 500,
                    fontSize: '0.85rem', color: 'var(--earth-dark)', margin: 0,
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                    <span style={{ color: '#7A6152', fontSize: '0.7rem' }}>●</span>
                    {s.filiale} &middot; {s.type} &middot; {s.periode}
                  </div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 300,
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                    margin: '0.15rem 0 0.4rem',
                  }}>
                    {s.uploaded_by} &middot; {timeAgo(s.uploaded_at)}
                  </p>
                  <button
                    onClick={() => { setNotifOpen(false); setView('dashboard'); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif", fontWeight: 500,
                      fontSize: '0.78rem', color: 'var(--earth-mid)',
                      padding: 0, transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--earth-dark)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--earth-mid)'}
                  >
                    Voir et valider &rarr;
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div
        onClick={handleLogout}
        title="Déconnexion"
        style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'var(--earth-dark)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Inter', sans-serif", fontWeight: 500,
          fontSize: '0.8rem', cursor: 'pointer',
          transition: 'background 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--earth-dark)'}
      >
        {getInitials(account?.name || account?.username || '?')}
      </div>
    </nav>
  );

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const stats = [
    { value: '12', label: 'Total uploads' },
    { value: '9',  label: 'Validés' },
    { value: '3',  label: 'En attente' },
  ];

  /* ─── LOGIN VIEW ─── */
  if (view === 'login') {
    return (
      <div className="split-screen" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        <div className="split-left" style={{
          flex: '0 0 55%', background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden', padding: '4rem',
        }}>
          <BlobMain />
          <BlobSecond />
          <DotsGrid />
          <FinanceIllustration />
        </div>
        <div className="split-right" style={{
          flex: '0 0 45%', background: 'var(--bg-primary)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-start', justifyContent: 'center',
          padding: '4rem 5rem',
        }}>
          <span style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 400,
            fontSize: '1.2rem', color: 'var(--earth-mid)', letterSpacing: '0.02em',
          }}>Groupe Kilani</span>
          <ThinLine />
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 500,
            fontSize: '0.72rem', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.5rem',
          }}>BIENVENUE</p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700,
            lineHeight: 1.1, color: 'var(--earth-dark)', marginTop: '0.5rem',
          }}>Connectez-vous.</h1>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 300,
            fontSize: '1.05rem', lineHeight: 1.85,
            color: 'var(--text-secondary)', marginTop: '1rem', maxWidth: '28rem',
          }}>Accédez à votre espace supérieur hiérarchique.</p>
          <div style={{ height: '2.5rem' }} />
          <button
            onClick={() => setView('home')}
            style={{
              width: '100%', padding: '1rem 2rem',
              background: 'var(--earth-dark)', border: 'none', borderRadius: '6px',
              fontFamily: "'Inter', sans-serif", fontWeight: 500,
              fontSize: '0.95rem', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.75rem', letterSpacing: '0.02em',
              transition: 'background 0.3s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--earth-dark)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 21 21">
              <rect x="0" y="0" width="9" height="9" fill="#f25022"/>
              <rect x="12" y="0" width="9" height="9" fill="#7fba00"/>
              <rect x="0" y="12" width="9" height="9" fill="#00a4ef"/>
              <rect x="12" y="12" width="9" height="9" fill="#ffb900"/>
            </svg>
            Se connecter avec Microsoft
          </button>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 300,
            fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem',
          }}>Plateforme réservée aux supérieurs hiérarchiques du groupe.</p>
        </div>
      </div>
    );
  }

  /* ─── HOME VIEW ─── */
  if (view === 'home') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {navbar}
        <main style={{ paddingTop: '88px' }}>
          <div style={{
            minHeight: 'calc(100vh - 88px)',
            display: 'flex', alignItems: 'center',
            padding: '0 8%', position: 'relative', overflow: 'hidden',
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
                Bonjour.
              </h1>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 300,
                fontSize: '0.9rem', color: 'var(--text-muted)',
                marginTop: '0.5rem', textTransform: 'capitalize',
              }}>
                {today}
              </p>
              <div style={{ margin: '1.5rem 0' }}><ThinLine /></div>
              <div style={{ display: 'flex', gap: '1.5rem', maxWidth: '36rem' }}>
                {stats.map((stat) => (
                  <div key={stat.label} style={{
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
                    }}>{stat.value}</p>
                    <div style={{
                      width: '100%', height: '1px', background: 'var(--earth-pale)',
                      margin: '0.8rem 0',
                    }} />
                    <p style={{
                      fontFamily: "'Inter', sans-serif", fontWeight: 300,
                      fontSize: '0.78rem', color: 'var(--text-muted)',
                      letterSpacing: '0.05em', margin: 0,
                    }}>{stat.label}</p>
                  </div>
                ))}
              </div>
              <div style={{ height: '2.5rem' }} />
              <button
                onClick={() => setView('dashboard')}
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
                Voir statistiques &rarr;
              </button>
            </div>
            <div style={{
              flex: '0 0 40%', position: 'relative', height: '100%', minHeight: '400px',
            }}>
              <BlobMain />
              <DotsGrid />
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ─── REPORTS VIEW ─── */
  if (view === 'reports') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {navbar}
        <main style={{ paddingTop: '88px' }}>
          <div style={{
            minHeight: 'calc(100vh - 88px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '0 8%', maxWidth: '48rem',
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 500,
              fontSize: '0.72rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
            }}>RAPPORTS</p>
            <ThinLine />
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700,
              lineHeight: 1.1, color: 'var(--earth-dark)',
            }}>Historique des rapports.</h1>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 300,
              fontSize: '1.05rem', lineHeight: 1.85,
              color: 'var(--text-secondary)', marginTop: '0.75rem',
            }}>Consultez et téléchargez vos rapports générés.</p>
            <div style={{ height: '3rem' }} />
            <div style={{
              background: 'white', border: '1px solid var(--earth-pale)',
              borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center',
            }}>
              <p style={{
                fontFamily: "'Playfair Display', serif", fontSize: '3rem',
                color: 'var(--earth-pale)', margin: 0,
              }}>&mdash;</p>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 600,
                fontSize: '1.2rem', color: 'var(--earth-dark)', marginTop: '1rem',
              }}>Aucun rapport pour l'instant</h3>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 300,
                fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem',
              }}>Les rapports apparaîtront ici après validation des données</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ─── DASHBOARD VIEW ─── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {navbar}
      <main style={{ paddingTop: 'calc(88px + 2rem)' }}>
        <DashboardContent />
      </main>
    </div>
  );
};

/* ─── DASHBOARD CONTENT ─── */

const DashboardContent: React.FC = () => {
  const [filterSociete, setFilterSociete] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPeriode, setFilterPeriode] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<FilialeRow | null>(null);
  const [actionView, setActionView] = useState<'valider' | 'rejeter_texte' | null>(null);
  const [rejetMotif, setRejetMotif] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rows, setRows] = useState<FilialeRow[]>(MOCK_ROWS);

  const filtered = rows.filter(r =>
    (filterSociete === 'all' || r.societe === filterSociete) &&
    (filterType === 'all' || r.type === filterType) &&
    (filterPeriode === 'all' || r.periode === filterPeriode)
  );

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleRowClick = (row: FilialeRow) => {
    if (row.etat === 'non_soumis') return;
    setSelectedRow(row);
    setActionView(null);
    setRejetMotif('');
    setSuccessMsg('');
  };

  const handleValidate = () => {
    if (!selectedRow) return;
    setRows(prev => prev.map(r => r.id === selectedRow.id ? { ...r, etat: 'valide' } : r));
    setSuccessMsg('✓ Données envoyées vers SharePoint');
    setTimeout(() => { setSelectedRow(null); setSuccessMsg(''); }, 3000);
  };

  const handleRejectClick = () => {
    setActionView('rejeter_texte');
  };

  const handleConfirmReject = () => {
    if (!rejetMotif.trim() || !selectedRow) return;
    setRows(prev => prev.map(r => r.id === selectedRow.id ? { ...r, etat: 'rejete' } : r));
    setSuccessMsg('Fichier retourné à l\'utilisateur pour correction');
    setTimeout(() => { setSelectedRow(null); setSuccessMsg(''); setRejetMotif(''); }, 3000);
  };

  return (
    <div style={{ padding: '0 8% 4rem', maxWidth: '1100px', margin: '0 auto' }}>
      <p style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 500,
        fontSize: '0.72rem', letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem',
      }}>
        SUIVI DES FILIALES
      </p>

      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem' }}>
        <FilterSelect value={filterSociete} onChange={v => { setFilterSociete(v); setPage(1); }}>
          <option value="all">Toutes les sociétés</option>
          {FILIALES.map(s => <option key={s} value={s}>{s}</option>)}
        </FilterSelect>
        <FilterSelect value={filterType} onChange={v => { setFilterType(v); setPage(1); }}>
          <option value="all">Tous les types</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </FilterSelect>
        <FilterSelect value={filterPeriode} onChange={v => { setFilterPeriode(v); setPage(1); }}>
          <option value="all">Toutes les périodes</option>
          {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
        </FilterSelect>
      </div>

      <div style={{
        border: '1px solid var(--earth-pale)', borderRadius: '12px', overflow: 'hidden', background: 'white',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              {['Société', 'Type de fichier', 'Période', 'État', "Date d'upload"].map(h => (
                <th key={h} style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 500,
                  fontSize: '0.75rem', letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--text-secondary)',
                  padding: '0.8rem 1rem', textAlign: 'left', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, idx) => {
              const etat = ETAT_CONFIG[row.etat] || ETAT_CONFIG.valide;
              const isEven = idx % 2 === 0;
              const isSelected = selectedRow?.id === row.id;
              return (
                <tr key={row.id}
                  onClick={() => handleRowClick(row)}
                  style={{
                    background: isSelected ? 'var(--bg-secondary)' : isEven ? 'white' : 'rgba(250,247,242,0.4)',
                    transition: 'background 0.15s', cursor: row.etat === 'non_soumis' ? 'default' : 'pointer',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-primary)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isEven ? 'white' : 'rgba(250,247,242,0.4)'; }}
                >
                  <td style={tdCell}>{row.societe}</td>
                  <td style={tdCell}>{TYPE_LABELS[row.type]}</td>
                  <td style={tdCell}>{row.periode}</td>
                  <td style={tdCell}>
                    <span style={{
                      display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: '5px',
                      background: etat.bg, color: etat.color,
                      fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '0.75rem',
                    }}>{etat.label}</span>
                  </td>
                  <td style={tdCell}>{row.dateUpload}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', marginTop: '1rem' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
            padding: '0.4rem 1.2rem', borderRadius: '5px',
            border: '1px solid var(--earth-pale)', background: 'white',
            fontFamily: "'Inter', sans-serif", fontWeight: 500,
            fontSize: '0.8rem', color: page === 1 ? 'var(--text-muted)' : 'var(--earth-mid)',
            cursor: page === 1 ? 'default' : 'pointer', transition: 'all 0.2s',
          }}>← Précédent</button>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Page {page} sur {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
            padding: '0.4rem 1.2rem', borderRadius: '5px',
            border: '1px solid var(--earth-pale)', background: 'white',
            fontFamily: "'Inter', sans-serif", fontWeight: 500,
            fontSize: '0.8rem', color: page === totalPages ? 'var(--text-muted)' : 'var(--earth-mid)',
            cursor: page === totalPages ? 'default' : 'pointer', transition: 'all 0.2s',
          }}>Suivant →</button>
        </div>
      )}

      {/* ACTIONS SECTION */}
      {selectedRow && (
        <div style={{
          marginTop: '1.5rem', padding: '2rem',
          background: 'white', border: '1px solid var(--earth-pale)',
          borderRadius: '12px', boxShadow: '0 4px 20px rgba(92,74,58,0.08)',
        }}>
          {successMsg ? (
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 500,
              fontSize: '1rem', color: '#5A7A5C', textAlign: 'center',
            }}>{successMsg}</p>
          ) : (
            <>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600,
                fontSize: '0.85rem', color: 'var(--earth-dark)', marginBottom: '1.2rem',
              }}>
                RAPPORT EN ATTENTE DE VALIDATION
              </p>

              <div style={{ display: 'flex', gap: '3rem', marginBottom: '1.5rem' }}>
                <div>
                  <p style={infoLabel}>Société</p>
                  <p style={infoValue}>{selectedRow.societe}</p>
                </div>
                <div>
                  <p style={infoLabel}>Type</p>
                  <p style={infoValue}>{TYPE_LABELS[selectedRow.type]}</p>
                </div>
                <div>
                  <p style={infoLabel}>Période</p>
                  <p style={infoValue}>{selectedRow.periode}</p>
                </div>
                <div>
                  <p style={infoLabel}>Uploadé le</p>
                  <p style={infoValue}>{selectedRow.dateUpload}</p>
                </div>
              </div>

              <div style={{
                background: 'var(--bg-secondary)', borderRadius: '8px',
                padding: '1.2rem 1.5rem', marginBottom: '1.5rem',
                border: '1px solid var(--earth-pale)',
              }}>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 500,
                  fontSize: '0.78rem', color: 'var(--earth-dark)', marginBottom: '0.5rem',
                }}>RÉSUMÉ DU RAPPORT IA</p>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 300,
                  fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8,
                }}>
                  <p style={{ margin: 0 }}>• 1 351 lignes analysées</p>
                  <p style={{ margin: '0.1rem 0' }}>• 2 anomalies détectées</p>
                  <p style={{ margin: '0.1rem 0' }}>• 1 avertissement</p>
                  <p style={{ margin: '0.1rem 0' }}>→ FERTIPRO: écart +316% vs mois précédent</p>
                  <p style={{ margin: '0.1rem 0' }}>→ PROTIS: concentration bancaire élevée</p>
                </div>
              </div>

              {selectedRow.etat === 'en_attente' && (
                <>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 500,
                    fontSize: '0.8rem', color: 'var(--earth-dark)', marginBottom: '0.8rem',
                  }}>
                    Votre décision:
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {actionView !== 'rejeter_texte' ? (
                      <button onClick={handleRejectClick} style={{
                        padding: '0.7rem 1.5rem', background: 'transparent',
                        border: '1px solid #C4826A', borderRadius: '6px',
                        fontFamily: "'Inter', sans-serif", fontWeight: 500,
                        fontSize: '0.85rem', color: '#C4826A',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF0EE'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        ✕ Rejeter et retourner à l'utilisateur
                      </button>
                    ) : null}

                    <button onClick={handleValidate} style={{
                      padding: '0.7rem 1.5rem', background: 'var(--earth-dark)',
                      border: 'none', borderRadius: '6px',
                      fontFamily: "'Inter', sans-serif", fontWeight: 500,
                      fontSize: '0.85rem', color: 'white', cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--earth-dark)'}
                    >
                      ✓ Valider et envoyer vers SharePoint
                    </button>
                  </div>

                  {actionView === 'rejeter_texte' && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{
                        fontFamily: "'Inter', sans-serif", fontWeight: 500,
                        fontSize: '0.78rem', color: '#8B5A52', marginBottom: '0.4rem',
                      }}>Motif du rejet (obligatoire)</p>
                      <textarea
                        value={rejetMotif}
                        onChange={e => setRejetMotif(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%', padding: '0.6rem', borderRadius: '6px',
                          border: '1px solid var(--earth-pale)',
                          fontFamily: "'Inter', sans-serif", fontWeight: 300,
                          fontSize: '0.85rem', color: 'var(--text-primary)',
                          outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                        }}
                      />
                      <button onClick={handleConfirmReject} disabled={!rejetMotif.trim()} style={{
                        marginTop: '0.5rem', padding: '0.6rem 1.5rem',
                        background: rejetMotif.trim() ? '#C4826A' : 'var(--earth-pale)',
                        border: 'none', borderRadius: '6px',
                        fontFamily: "'Inter', sans-serif", fontWeight: 500,
                        fontSize: '0.85rem', color: 'white', cursor: rejetMotif.trim() ? 'pointer' : 'default',
                        transition: 'background 0.2s',
                      }}>
                        Confirmer le rejet
                      </button>
                    </div>
                  )}

                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 300,
                    fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem',
                  }}>
                    ⚠️ Cette action est irréversible.
                  </p>
                </>
              )}

              {selectedRow.etat === 'valide' && (
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 300,
                  fontSize: '0.85rem', color: '#5A7A5C',
                }}>
                  ✓ Ce rapport a été validé et envoyé vers SharePoint.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Helpers ─── */

const tdCell: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif", fontWeight: 400,
  fontSize: '0.85rem', color: 'var(--text-primary)',
  padding: '0.7rem 1rem', borderBottom: '1px solid var(--earth-pale)',
};

const infoLabel: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif", fontWeight: 300,
  fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 0.2rem',
};

const infoValue: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif", fontWeight: 500,
  fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0,
};

const FilterSelect: React.FC<{ value: string; onChange: (v: string) => void; children: React.ReactNode }> = ({ value, onChange, children }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    padding: '0.45rem 1rem', borderRadius: '6px',
    border: '1px solid var(--earth-pale)', background: 'white',
    fontFamily: "'Inter', sans-serif", fontWeight: 400,
    fontSize: '0.8rem', color: 'var(--text-primary)',
    cursor: 'pointer', outline: 'none', flex: 1, minWidth: 0,
  }}>{children}</select>
);
