import { useEffect, useMemo, useState } from 'react';
import profileService from '../services/profileService';
import useAuth from '../hooks/useAuth';
import {
  FOUR_WEEKS_MS,
  getWalletKey,
  getActiveRedemptions,
  persistRedemptions,
  calculateSpentPoints,
  generateVoucherCode
} from '../utils/voucherWallet';

const VOUCHERS = [
  {
    id: 'voucher-5',
    title: 'Escapadă Urbană',
    discount: 5,
    cost: 400,
    accent: '#a855f7',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(59,130,246,0.18))',
    perks: ['Reducere Booking', 'Flexibil pentru city break', 'Cod unic imediat']
  },
  {
    id: 'voucher-10',
    title: 'Weekend Epic',
    discount: 10,
    cost: 850,
    accent: '#f97316',
    gradient: 'linear-gradient(135deg, rgba(249,115,22,0.22), rgba(234,179,8,0.18))',
    perks: ['Reducere ghid local', 'Valabil zone montane', 'Include alertă expirare']
  },
  {
    id: 'voucher-15',
    title: 'Expediție Premium',
    discount: 15,
    cost: 1450,
    accent: '#0ea5e9',
    gradient: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(56,189,248,0.16))',
    perks: ['Reducere cazare boutique', 'Consultant RoVia dedicat', 'Upgrade ghid privat']
  }
];

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

export default function VoucherStore() {
  const auth = useAuth();
  const walletKey = getWalletKey(auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redemptions, setRedemptions] = useState({});
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const syncWallet = () => setRedemptions(getActiveRedemptions(walletKey));
    syncWallet();
    window.addEventListener('storage', syncWallet);
    return () => window.removeEventListener('storage', syncWallet);
  }, [walletKey]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await profileService.getMyProfile();
        setProfile({
          totalPoints: data.totalPoints ?? data.TotalPoints ?? 0,
          levelName: data.levelName ?? data.LevelName ?? 'Explorator',
          username: data.username ?? data.Username ?? 'Explorator'
        });
      } catch (err) {
        console.error('VoucherStore profile error', err);
        setError('Nu am putut încărca punctele contului. Încearcă mai târziu.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const spentPoints = useMemo(() => calculateSpentPoints(redemptions), [redemptions]);

  const availablePoints = useMemo(() => {
    if (!profile) return 0;
    return Math.max(0, profile.totalPoints - spentPoints);
  }, [profile, spentPoints]);

  const handleRedeem = (voucher) => {
    if (!profile) return;
    const activeVoucher = redemptions[voucher.id];
    if (activeVoucher) {
      setStatus({
        type: 'warning',
        message: 'Ai deja un cod activ pentru acest tip de reducere. Așteaptă expirarea lui pentru a revendica din nou.'
      });
      return;
    }

    if (availablePoints < voucher.cost) {
      setStatus({
        type: 'error',
        message: 'Nu ai suficiente puncte disponibile pentru acest voucher.'
      });
      return;
    }

    const code = generateVoucherCode(voucher.discount);
    const payload = {
      ...redemptions,
      [voucher.id]: {
        code,
        label: voucher.title,
        cost: voucher.cost,
        redeemedAt: Date.now(),
        expiresAt: Date.now() + FOUR_WEEKS_MS
      }
    };

    setRedemptions(payload);
    persistRedemptions(walletKey, payload);
    setStatus({
      type: 'success',
      message: `Felicitări! Ai revendicat ${voucher.discount}% reducere. Codul tău este ${code}.`
    });
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus({ type: 'success', message: 'Codul a fost copiat în clipboard.' });
    } catch {
      setStatus({ type: 'warning', message: 'Nu am reușit să copiez codul automat.' });
    }
  };

  const clearStatus = () => setStatus(null);

  const heroCard = (
    <div style={{
      borderRadius: 28,
      padding: '32px',
      background: 'linear-gradient(125deg, #1d4ed8, #9333ea)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: '0 30px 80px rgba(30,64,175,0.35)'
    }}>
      <span style={{ letterSpacing: '0.3em', fontSize: 12, textTransform: 'uppercase', opacity: 0.85 }}>Portofel explorer</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontSize: 16, opacity: 0.8 }}>Puncte disponibile</p>
          <p style={{ margin: 0, fontSize: 48, fontWeight: 800 }}>{availablePoints}</p>
        </div>
        <div style={{ opacity: 0.85 }}>
          <p style={{ margin: 0, fontSize: 16 }}>Consum recent</p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{spentPoints}</p>
        </div>
      </div>
      {profile && (
        <span style={{ fontSize: 14 }}>Nivel curent: <strong>{profile.levelName}</strong></span>
      )}
      <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
        Codurile se activează instant și rămân valide patru săptămâni. Îți trimitem reminder prin email când expiră.
      </p>
    </div>
  );

  const statusBanner = status && (
    <div
      role="alert"
      style={{
        marginBottom: 24,
        padding: '14px 18px',
        borderRadius: 14,
        border: '1px solid var(--border)',
        background:
          status.type === 'success' ? 'rgba(16,185,129,0.1)' :
          status.type === 'warning' ? 'rgba(249,115,22,0.12)' :
          'rgba(248,113,113,0.12)',
        color:
          status.type === 'success' ? '#047857' :
          status.type === 'warning' ? '#9a3412' :
          '#b91c1c',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12
      }}
    >
      <span>{status.message}</span>
      <button onClick={clearStatus} style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Închide</button>
    </div>
  );

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        Se încarcă magazinul de vouchere...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: 32, borderRadius: 18, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(254,242,242,0.92)', color: '#b91c1c' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', minHeight: 'calc(100vh - 56px)', background: 'radial-gradient(circle at top, rgba(37,99,235,0.08), transparent 55%)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        <span style={{ fontSize: 13, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--muted)' }}>Reward Hub</span>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: 'var(--text)' }}>Transformă punctele în experiențe reale</h1>
        <p style={{ margin: 0, maxWidth: 720, color: 'var(--muted)' }}>
          Fiecare quiz completat și atracție descoperită se adună aici. Alege tipul de reducere potrivit și blochează-ți următoarea evadare în România.
        </p>
      </div>

      {statusBanner}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 380px) 1fr', gap: 32, alignItems: 'stretch', marginBottom: 40, flexWrap: 'wrap' }}>
        {heroCard}
        <div style={{
          borderRadius: 24,
          padding: 24,
          border: '1px solid var(--border)',
          background: 'var(--card-bg)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16
        }}>
          {[{
            label: 'Coduri active',
            value: Object.keys(redemptions).length,
            helper: 'Maxim un cod/voucher activ'
          }, {
            label: 'Valabilitate',
            value: '4 săptămâni',
            helper: 'Expiră automat apoi' }, {
            label: 'Tipuri parteneri',
            value: 'Booking • Cazări • Ghiduri',
            helper: 'Disponibile imediat'
          }].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.1em' }}>{stat.label.toUpperCase()}</span>
              <strong style={{ fontSize: 20 }}>{stat.value}</strong>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{stat.helper}</span>
            </div>
          ))}
        </div>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
        {VOUCHERS.map((voucher) => {
          const active = redemptions[voucher.id];
          const blocked = Boolean(active);
          const affordable = availablePoints >= voucher.cost;

          return (
            <div key={voucher.id} style={{
              borderRadius: 22,
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              padding: 24,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(15,23,42,0.12)'
            }}>
              <div style={{ position: 'absolute', inset: 0, background: voucher.gradient, zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{voucher.title}</p>
                    <h2 style={{ margin: 0, fontSize: 34, color: voucher.accent }}>{voucher.discount}% off</h2>
                  </div>
                  {!active && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{voucher.cost}p</span>
                  )}
                </div>
                <ul style={{ margin: '12px 0', paddingLeft: 18, color: 'var(--text)', fontSize: 13, lineHeight: 1.5 }}>
                  {voucher.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                {active ? (
                  <div style={{
                    padding: 16,
                    borderRadius: 16,
                    background: 'rgba(15,23,42,0.7)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <span style={{ fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.8 }}>Cod activ</span>
                    <strong style={{ fontSize: 24, letterSpacing: '0.1em' }}>{active.code}</strong>
                    <span style={{ fontSize: 13 }}>Expiră pe {formatDate(active.expiresAt)}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(active.code)}
                      style={{
                        alignSelf: 'flex-start',
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,0.4)',
                        background: 'transparent',
                        color: 'white',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      Copiază codul
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRedeem(voucher)}
                    disabled={!affordable}
                    style={{
                      marginTop: 'auto',
                      borderRadius: 16,
                      border: 'none',
                      background: affordable ? voucher.accent : 'var(--border)',
                      color: 'white',
                      padding: '12px 18px',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: affordable ? 'pointer' : 'not-allowed',
                      opacity: affordable ? 1 : 0.5,
                      boxShadow: affordable ? '0 10px 22px rgba(0,0,0,0.16)' : 'none'
                    }}
                  >
                    {affordable ? 'Revendică acum' : 'Puncte insuficiente'}
                  </button>
                )}
              </div>
              {blocked && (
                <div style={{ position: 'absolute', top: 18, right: -30, transform: 'rotate(32deg)', background: 'rgba(15,23,42,0.85)', color: 'white', padding: '4px 40px', fontSize: 12, letterSpacing: '0.3em' }}>
                  ACTIV
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card-bg)', padding: 24 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Istoricul codurilor tale</h3>
        {Object.keys(redemptions).length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)' }}>Nu ai încă vouchere active. Încearcă să revendici unul dintre pachetele de mai sus.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {VOUCHERS.filter(v => redemptions[v.id]).map((voucher) => {
              const entry = redemptions[voucher.id];
              return (
                <div key={voucher.id} style={{
                  borderRadius: 16,
                  padding: 16,
                  border: '1px dashed var(--border)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{voucher.title}</p>
                    <strong style={{ fontSize: 22 }}>{entry.code}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 13 }}>Revendicat pe {formatDate(entry.redeemedAt)}</p>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--accent)' }}>Expiră pe {formatDate(entry.expiresAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
