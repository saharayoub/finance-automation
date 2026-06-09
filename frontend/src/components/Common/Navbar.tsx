import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { NavLink } from 'react-router-dom';
import { logout } from '../../services/authService';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/upload', label: 'Upload' },
  { to: '/reports', label: 'Rapports' },
];

export const Navbar: React.FC = () => {
  const { accounts } = useMsal();
  const account = accounts[0];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 100,
        padding: '1.5rem 8%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: scrolled ? 'rgba(250,247,242,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--earth-pale)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500,
          fontSize: '1.3rem',
          color: 'var(--earth-dark)',
          letterSpacing: '0.02em',
        }}>
          Groupe Kilani
        </span>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: '0.9rem',
                color: isActive ? 'var(--earth-dark)' : 'var(--text-secondary)',
                textDecoration: 'none',
                borderBottom: isActive ? '1px solid var(--earth-dark)' : '1px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.3s ease',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
        }}>
          {account?.name || account?.username || ''}
        </span>
        <div
          onClick={handleLogout}
          title="Déconnexion"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--earth-dark)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'background 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--earth-dark)'}
        >
          {getInitials(account?.name || account?.username || '?')}
        </div>
      </div>
    </nav>
  );
};
