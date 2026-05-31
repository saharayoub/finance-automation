import { Layout } from '../components/Common/Layout';
import { ThinLine } from '../components/Common/ThinLine';

export const ReportsPage: React.FC = () => {
  return (
    <Layout>
      <div style={{
        minHeight: 'calc(100vh - 88px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 8%',
        maxWidth: '48rem',
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: '0.72rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          RAPPORTS
        </p>

        <ThinLine />

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          color: 'var(--earth-dark)',
        }}>
          Historique des rapports.
        </h1>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '1.05rem',
          lineHeight: 1.85,
          color: 'var(--text-secondary)',
          marginTop: '0.75rem',
        }}>
          Consultez et téléchargez vos rapports générés.
        </p>

        <div style={{ height: '3rem' }} />

        <div style={{
          background: 'white',
          border: '1px solid var(--earth-pale)',
          borderRadius: '16px',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '3rem',
            color: 'var(--earth-pale)',
            margin: 0,
          }}>
            &mdash;
          </p>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            fontSize: '1.2rem',
            color: 'var(--earth-dark)',
            marginTop: '1rem',
          }}>
            Aucun rapport pour l'instant
          </h3>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginTop: '0.5rem',
          }}>
            Les rapports apparaîtront ici après validation des données
          </p>
        </div>
      </div>
    </Layout>
  );
};
