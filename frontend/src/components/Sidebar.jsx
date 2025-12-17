import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth, { emitAuthChange } from '../hooks/useAuth';
import api from '../services/api';

const Icon = ({ name }) => {
  const icons = {
    home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 21V11h14v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    map: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 6l4-2 8 3 6-2v12l-4 2-8-3-6 2V6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    trophy: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9h12M6 9c0-1.5 1-3 3-3h6c2 0 3 1.5 3 3M6 9v6c0 1.5 1.5 3 4 3h4c2.5 0 4-1.5 4-3V9M10 17v2M14 17v2M9 19h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    mail: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 8.5v7a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 8.5L12 14 3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 20a7 7 0 0113 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    admin: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 1l3.09 6.26L22 7.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 17l5-5-5-5M21 12H9M3 5v14a2 2 0 002 2h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    gift: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 9h18M12 9v12M5 5.5c0 1.2.8 2.5 2 2.5s2-1.3 2-2.5S8.8 3 7 3 5 4.3 5 5.5zM15 5.5c0 1.2.8 2.5 2 2.5s2-1.3 2-2.5S19.2 3 17 3s-2 1.3-2 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return icons[name] || null;
};

const REGION_ICON_META = {
  Muntenia: { icon: '🏛️', color: '#f97316' },
  Transilvania: { icon: '🏔️', color: '#a855f7' },
  Moldova: { icon: '🌄', color: '#0ea5e9' },
  Banat: { icon: '🌿', color: '#22c55e' },
  Dobrogea: { icon: '🌊', color: '#06b6d4' },
  Maramureș: { icon: '🪵', color: '#ef4444' },
  Neamț: { icon: '⛰️', color: '#3b82f6' },
  Alba: { icon: '🏰', color: '#eab308' }
};

const DEFAULT_REGION_ICON = { icon: '🗺️', color: '#2563eb' };

const TYPE_LABELS = {
  1: 'Naturală',
  2: 'Culturală',
  3: 'Istorică',
  4: 'Distracție',
  5: 'Religioasă'
};

const formatRating = (value) => (value ?? 0).toFixed(1);

const getRegionPalette = (region) => REGION_ICON_META[region] || DEFAULT_REGION_ICON;

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const handleLogout = () => {
    try { localStorage.removeItem('token'); } catch (e) { /* ignore */ }
    emitAuthChange();
    if (onClose) onClose();
    navigate('/login');
  };
  const isAuth = auth.isAuthenticated;
  const normalizedRole = (auth.role || 'Visitor').toString().toLowerCase();
  const isAdmin = normalizedRole === 'administrator';
  const isPromoter = normalizedRole === 'promoter' || isAdmin;

  const isActive = (path) => location.pathname === path ? 'var(--accent)' : 'transparent';
  const isActiveBg = (path) => location.pathname === path ? 'rgba(59, 130, 246, 0.1)' : 'transparent';

  const navItems = [
    { icon: 'home', label: 'Acasă', to: '/map' },
    { icon: 'trophy', label: 'Clasament', to: '/leaderboard' },
    { icon: 'gift', label: 'Vouchere', to: '/rewards' },
    { icon: 'mail', label: 'Contact', to: '/contact' },
  ];

  const [regionData, setRegionData] = useState({});
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRegions = async () => {
      try {
        setRegionsError(null);
        const response = await api.get('/attractions');
        if (!isMounted) return;

        const grouped = response.data.reduce((acc, attraction) => {
          const regionName = attraction.region || 'Fără regiune';
          if (!acc[regionName]) acc[regionName] = [];
          acc[regionName].push(attraction);
          return acc;
        }, {});

        const limited = Object.fromEntries(
          Object.entries(grouped).map(([regionName, items]) => {
            const sorted = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
            return [regionName, sorted.slice(0, 3)];
          })
        );

        setRegionData(limited);
      } catch (error) {
        if (!isMounted) return;
        console.error('Nu am putut încărca atracțiile pentru sidebar:', error);
        setRegionsError('Nu am putut încărca regiunile. Reîncearcă mai târziu.');
      } finally {
        if (isMounted) setRegionsLoading(false);
      }
    };

    fetchRegions();
    return () => { isMounted = false; };
  }, []);

  const regionNames = useMemo(() => (
    Object.keys(regionData).sort((a, b) => a.localeCompare(b, 'ro'))
  ), [regionData]);

  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 70,
    background: 'var(--card-bg)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'RoviaUI, Inter, system-ui',
    width: isOpen ? 280 : 72,
    transition: 'width 300ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 300ms ease',
    boxShadow: isOpen ? 'rgba(0, 0, 0, 0.1) 4px 0 16px' : 'none'
  };

  const navItemStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '10px 12px',
    cursor: 'pointer',
    borderRadius: 10,
    color: 'var(--text)',
    textDecoration: 'none',
    transition: 'all 200ms ease',
    background: isActiveBg(path),
    borderLeft: location.pathname === path ? '3px solid var(--accent)' : '3px solid transparent',
    justifyContent: isOpen ? 'flex-start' : 'center'
  });

  const iconBoxStyle = {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--topbar-bg)',
    borderRadius: 10,
    color: 'var(--text)',
    flexShrink: 0
  };

  return (
    <div style={containerStyle}>
      {/* Header cu logo */}
      <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center' }}>
        <span style={{ fontWeight: 700, fontSize: isOpen ? 18 : 16, color: 'var(--accent)' }}>{isOpen ? 'RoVia' : 'RV'}</span>
      </div>

      {/* Navigare principală */}
      <nav style={{ padding: '16px 8px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {navItems.map((item) => (
          <Link key={item.label} to={item.to} style={navItemStyle(item.to)}>
            <div style={iconBoxStyle}>
              <Icon name={item.icon} />
            </div>
            {isOpen && <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Secțiune Utilizator */}
      <div style={{ padding: '16px 8px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!isAuth ? (
          <Link to="/login" style={navItemStyle('/login')}>
            <div style={iconBoxStyle}>
              <Icon name="user" />
            </div>
            {isOpen && <span style={{ fontSize: 14, fontWeight: 500 }}>Autentificare</span>}
          </Link>
        ) : (
          <Link to="/profile" style={navItemStyle('/profile')}>
            <div style={iconBoxStyle}>
              <Icon name="user" />
            </div>
            {isOpen && (
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                {auth.username || 'Profil'}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Secțiune Admin/Promoter */}
      {(isAuth || isPromoter || isAdmin) && (
        <div style={{ padding: '16px 8px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isOpen && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Management</span>}
          {isAuth && (
            <Link to="/dashboard" style={navItemStyle('/dashboard')}>
              <div style={iconBoxStyle}>
                <Icon name="plus" />
              </div>
              {isOpen && (
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {isPromoter ? 'Promoter Hub' : 'Aplică Promotor'}
                </span>
              )}
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" style={navItemStyle('/admin')}>
              <div style={iconBoxStyle}>
                <Icon name="admin" />
              </div>
              {isOpen && <span style={{ fontSize: 14, fontWeight: 500 }}>Admin Panel</span>}
            </Link>
          )}
        </div>
      )}

      {/* Attractions - doar când sidebar e deschis */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isOpen ? '16px 8px' : 0,
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 260ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {isOpen && (
          <>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Regiuni Turistice</span>
            {regionsLoading && (
              <div style={{
                padding: '12px',
                borderRadius: 10,
                border: '1px dashed var(--border)',
                color: 'var(--muted)',
                fontSize: 13
              }}>
                Se încarcă regiunile...
              </div>
            )}
            {!regionsLoading && regionsError && (
              <div style={{
                padding: '12px',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.08)',
                color: '#b91c1c',
                fontSize: 13
              }}>
                {regionsError}
              </div>
            )}
            {!regionsLoading && !regionsError && !regionNames.length && (
              <div style={{
                padding: '12px',
                borderRadius: 10,
                border: '1px dashed var(--border)',
                color: 'var(--muted)',
                fontSize: 13
              }}>
                Încă nu există atracții aprobate pentru afișare.
              </div>
            )}
            {!regionsLoading && !regionsError && regionNames.map((region, idx) => {
              const attractions = regionData[region] || [];
              const palette = getRegionPalette(region);

              return (
                <details key={region} style={{ cursor: 'pointer' }} defaultOpen={idx === 0}>
                  <summary style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'var(--topbar-bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontWeight: 500,
                    userSelect: 'none',
                    color: 'var(--text)'
                  }}>
                    <span>{palette.icon} {region}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{attractions.length}</span>
                  </summary>
                  <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {attractions.map((attraction) => (
                      <div
                        key={attraction.id}
                        style={{
                          borderRadius: 10,
                          background: 'var(--topbar-bg)',
                          padding: '10px 12px',
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                          border: '1px solid var(--border)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--topbar-bg)';
                        }}
                        onClick={() => navigate(`/attractions/${attraction.id}`)}
                      >
                        <div style={{
                          width: 34,
                          height: 34,
                          background: palette.color,
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: 16
                        }}>
                          {palette.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{attraction.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            ⭐ {formatRating(attraction.rating)} • {TYPE_LABELS[Number(attraction.type)] || 'Atracție'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </>
        )}
      </div>

      {/* Footer cu logout */}
      {isAuth && (
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: 14,
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              background: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14,
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="logout" />
            </div>
            {isOpen && <span>Deconectare</span>}
          </button>
        </div>
      )}

      {isOpen && (
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}>
          © 2025 RoVia
        </div>
      )}
    </div>
  );
}
