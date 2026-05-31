export const FinanceIllustration: React.FC = () => (
  <div style={{
    background: 'white',
    borderRadius: '20px',
    padding: '2rem',
    width: '280px',
    boxShadow: '0 8px 40px rgba(92,74,58,0.12)',
    position: 'relative',
    zIndex: 2,
  }}>
    <p style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.7rem',
      color: 'var(--text-muted)',
      marginBottom: '1rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontWeight: 500,
    }}>
      RAPPORT MENSUEL
    </p>
    <svg viewBox="0 0 240 120" width="100%">
      <rect x="20" y="60" width="35" height="55" rx="4" fill="var(--earth-pale)" />
      <rect x="75" y="30" width="35" height="85" rx="4" fill="var(--earth-mid)" />
      <rect x="130" y="45" width="35" height="70" rx="4" fill="var(--earth-dark)" />
      <rect x="185" y="15" width="35" height="100" rx="4" fill="var(--accent)" />
      <polyline
        points="37,55 92,25 147,38 202,10"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="37" cy="55" r="4" fill="var(--accent)" />
      <circle cx="92" cy="25" r="4" fill="var(--accent)" />
      <circle cx="147" cy="38" r="4" fill="var(--accent)" />
      <circle cx="202" cy="10" r="4" fill="var(--accent)" />
    </svg>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 300 }}>Jan</span>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 300 }}>Fév</span>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 300 }}>Mar</span>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 300 }}>Avr</span>
    </div>
  </div>
);
