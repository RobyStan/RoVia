import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const REFRESH_INTERVAL = 15000; // 15s polling for near-real-time updates

const tierAccent = ['#fde68a', '#fbbf24', '#f97316'];

const formatDate = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  } catch {
    return 'N/A';
  }
};

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const auth = useAuth();

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data } = await api.get('/profile/leaderboard?take=50');
      setEntries(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      console.error('Leaderboard fetch failed', err);
      setError('Nu am putut actualiza leaderboard-ul. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const intervalId = setInterval(fetchLeaderboard, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchLeaderboard]);

  const topThree = useMemo(() => entries.slice(0, 3), [entries]);
  const rest = useMemo(() => entries.slice(3), [entries]);

  return (
    <div style={{ padding: '32px', minHeight: 'calc(100vh - 56px)', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        <span style={{ textTransform: 'uppercase', fontSize: 13, letterSpacing: '0.3em', color: 'var(--muted)' }}>Clasament live</span>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Eroii RoVia în timp real</h1>
        <p style={{ maxWidth: 520, color: 'var(--muted)', lineHeight: 1.6 }}>
          Evoluția exploratorilor autentificați se sincronizează automat. Reînnoim datele la fiecare {REFRESH_INTERVAL / 1000} secunde pentru a surprinde fiecare punct și nivel câștigat.
        </p>
        {lastUpdated && (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Ultima actualizare: {lastUpdated.toLocaleTimeString('ro-RO')}</span>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, border: '1px solid #f87171', background: 'rgba(248,113,113,0.08)', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', borderRadius: 18, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
          <p style={{ margin: 0, fontSize: 16, color: 'var(--muted)' }}>Încărcăm clasamentul...</p>
        </div>
      ) : (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
            {topThree.map((entry, idx) => (
              <div key={entry.userId} style={{
                borderRadius: 20,
                padding: 20,
                border: '1px solid var(--border)',
                background: 'linear-gradient(145deg, var(--card-bg), var(--topbar-bg))',
                boxShadow: idx === 0 ? '0 25px 65px rgba(59,130,246,0.15)' : '0 12px 32px rgba(15,23,42,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 34, fontWeight: 700, color: tierAccent[idx] || 'var(--accent)' }}>#{entry.rank}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{entry.levelName}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{entry.username}</h3>
                <p style={{ margin: '4px 0 16px 0', fontSize: 14, color: 'var(--muted)' }}>{entry.totalPoints} puncte • {entry.quizzesCompleted} quiz-uri</p>
                <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'rgba(148,163,184,0.3)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((entry.levelProgress || 0) * 100))}%`,
                    height: '100%',
                    background: tierAccent[idx] || 'var(--accent)'
                  }} />
                </div>
              </div>
            ))}
          </section>

          <section style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card-bg)', overflow: 'hidden', boxShadow: '0 25px 65px rgba(15,23,42,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 1fr 1fr 1fr', padding: '18px 24px', background: 'var(--topbar-bg)', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
              <span>Loc</span>
              <span>Explorator</span>
              <span>Puncte</span>
              <span>Nivel</span>
              <span>Ultima activitate</span>
            </div>
            <div>
              {[...topThree, ...rest].map((entry) => {
                const isCurrentUser = entry.userId === auth.userId;
                const progressPercent = Math.min(100, Math.round((entry.levelProgress || 0) * 100));
                return (
                  <div
                    key={entry.userId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 2fr 1fr 1fr 1fr',
                      padding: '18px 24px',
                      borderBottom: '1px solid var(--border)',
                      background: isCurrentUser ? 'rgba(59,130,246,0.12)' : 'transparent',
                      transition: 'background 200ms ease'
                    }}
                  >
                    <strong style={{ fontSize: 18, color: isCurrentUser ? 'var(--accent)' : 'var(--text)' }}>#{entry.rank}</strong>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{entry.username}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{entry.quizzesCompleted} quiz-uri completate</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{entry.totalPoints}</span>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>{entry.levelName}</span>
                      <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(148,163,184,0.3)', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)' }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{progressPercent}% către nivelul următor</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{formatDate(entry.lastCompletedAt)}</span>
                  </div>
                );
              })}
              {entries.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                  Nimeni nu a urcat încă în clasament. Fii primul explorator!
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
