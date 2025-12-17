import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import profileService from '../services/profileService';
import useAuth from '../hooks/useAuth';
import { getWalletKey, getActiveRedemptions, calculateSpentPoints } from '../utils/voucherWallet';

function UserProfile() {
    const navigate = useNavigate();
    const auth = useAuth();
    const walletKey = getWalletKey(auth);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [voucherRedemptions, setVoucherRedemptions] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await profileService.getMyProfile();
                if (!data) {
                    setError('Profilul nu a putut fi încărcat.');
                    return;
                }

                const rawNextBadge = data.nextBadge ?? data.NextBadge ?? null;

                const normalized = {
                    name: data.username ?? data.Username ?? 'Explorator',
                    email: data.email ?? data.Email ?? 'utilizator@rovia.app',
                    totalPoints: data.totalPoints ?? data.TotalPoints ?? 0,
                    level: data.level ?? data.Level ?? 1,
                    levelName: data.levelName ?? data.LevelName ?? 'Explorer',
                    levelProgress: data.levelProgress ?? data.LevelProgress ?? 0,
                    pointsToNextLevel: data.pointsToNextLevel ?? data.PointsToNextLevel ?? 0,
                    quizzesCompleted: data.quizzesCompleted ?? data.QuizzesCompleted ?? 0,
                    badges: (data.badges ?? data.Badges ?? []).map(b => ({
                        id: b.id ?? b.Id,
                        name: b.name ?? b.Name,
                        description: b.description ?? b.Description,
                        icon: b.iconUrl ?? b.IconUrl ?? '🏅',
                        unlockedAt: b.unlockedAt ?? b.UnlockedAt
                    })),
                    recentProgress: (data.recentProgress ?? data.RecentProgress ?? []).map(item => ({
                        title: item.title ?? item.Title,
                        attraction: item.name ?? item.Name,
                        points: item.pointsEarned ?? item.PointsEarned ?? 0,
                        correctAnswers: item.correctAnswers ?? item.CorrectAnswers ?? 0,
                        totalQuestions: item.totalQuestions ?? item.TotalQuestions ?? 0,
                        completedAt: item.completedAt ?? item.CompletedAt
                    })),
                    nextBadge: rawNextBadge
                        ? {
                                name: rawNextBadge.name ?? rawNextBadge.Name,
                                description: rawNextBadge.description ?? rawNextBadge.Description,
                                icon: rawNextBadge.iconUrl ?? rawNextBadge.IconUrl ?? '🏅',
                                pointsRemaining: rawNextBadge.pointsRemaining ?? rawNextBadge.PointsRemaining ?? 0
                            }
                        : null
                };

                setProfile(normalized);
            } catch (err) {
                console.error('Eroare profil:', err);
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }
                setError('Nu am putut obține detaliile contului.');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [navigate]);

    useEffect(() => {
        const syncWallet = () => setVoucherRedemptions(getActiveRedemptions(walletKey));
        syncWallet();
        window.addEventListener('storage', syncWallet);
        return () => window.removeEventListener('storage', syncWallet);
    }, [walletKey]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                Se încarcă profilul...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                {error}
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    const voucherSpentPoints = calculateSpentPoints(voucherRedemptions);
    const availablePoints = Math.max(0, (profile.totalPoints ?? 0) - voucherSpentPoints);
    const initials = profile.name?.charAt(0)?.toUpperCase() ?? '?';
    const progressPercent = Math.round((profile.levelProgress || 0) * 100);
    const badgesUnlocked = profile.badges.length;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '20px' }}>
            {/* Header */}
            <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 10px 30px rgba(15,23,42,0.06)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <button onClick={() => navigate('/map')} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '999px', cursor: 'pointer', fontWeight: 600 }}>
                        ← Înapoi la hartă
                    </button>
                    <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '999px', cursor: 'pointer', fontWeight: 600 }}>
                        Log out
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ width: '96px', height: '96px', borderRadius: '24px', background: 'linear-gradient(135deg, #3b82f6, #9333ea)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 700 }}>
                        {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px', letterSpacing: '0.08em' }}>PROFIL UTILIZATOR</p>
                        <h1 style={{ margin: '8px 0', color: 'var(--text)', fontSize: '32px' }}>{profile.name}</h1>
                        <p style={{ margin: 0, color: 'var(--muted)' }}>📧 {profile.email}</p>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '200px' }}>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>PUNCTE DISPONIBILE</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '36px', fontWeight: 'bold', color: '#16a34a' }}>{availablePoints}</p>
                        {voucherSpentPoints > 0 && (
                            <p style={{ margin: '4px 0 0 0', color: '#ca8a04', fontSize: '12px' }}>+{voucherSpentPoints}p rezervate în vouchere</p>
                        )}
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>Nivel: {profile.levelName} #{profile.level}</p>
                    </div>
                </div>
            </div>

            {/* Statistici */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[{
                    label: 'Puncte disponibile',
                    value: availablePoints,
                    icon: '🏆',
                    accent: '#fef3c7'
                }, {
                    label: 'Puncte rezervate',
                    value: voucherSpentPoints,
                    icon: '🎁',
                    accent: '#fef9c3'
                }, {
                    label: 'Quiz-uri completate',
                    value: profile.quizzesCompleted,
                    icon: '🎯',
                    accent: '#e0f2fe'
                }, {
                    label: 'Insigne deblocate',
                    value: badgesUnlocked,
                    icon: '🎖️',
                    accent: '#ede9fe'
                }, {
                    label: 'Puncte până la următorul nivel',
                    value: profile.pointsToNextLevel,
                    icon: '🚀',
                    accent: '#dcfce7'
                }].map((card, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: card.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', fontSize: '20px' }}>
                            {card.icon}
                        </div>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>{card.label}</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '28px', fontWeight: '700', color: 'var(--text)' }}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Progres nivel + următoarea insignă */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: 'var(--text)' }}>Progres nivel</h3>
                    <p style={{ margin: '0 0 16px 0', color: 'var(--muted)' }}>Ești la nivelul <strong>{profile.levelName}</strong>. Continuă să strângi puncte pentru nivelul următor.</p>
                    <div style={{ height: '14px', borderRadius: '999px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', height: '100%' }}></div>
                    </div>
                    <p style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '13px' }}>{progressPercent}% complet • {profile.pointsToNextLevel}p până la nivelul următor</p>
                </div>
                <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: 'var(--text)' }}>Următoarea insignă</h3>
                    {profile.nextBadge ? (
                        <div>
                            <p style={{ margin: 0, fontSize: '28px' }}>{profile.nextBadge.icon}</p>
                            <p style={{ margin: '8px 0 4px 0', fontWeight: 600 }}>{profile.nextBadge.name}</p>
                            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>{profile.nextBadge.description}</p>
                            <p style={{ marginTop: '8px', color: '#10b981', fontWeight: 600 }}>Îți lipsesc {Math.max(0, profile.nextBadge.pointsRemaining)} puncte</p>
                        </div>
                    ) : (
                        <p style={{ margin: 0, color: 'var(--muted)' }}>Ai obținut toate insignele disponibile. Super!</p>
                    )}
                </div>
            </div>

            {/* Progres recent și insigne */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: 'var(--text)' }}>Progres recent</h3>
                    {profile.recentProgress.length === 0 ? (
                        <p style={{ color: 'var(--muted)' }}>Încă nu ai completat niciun quiz.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {profile.recentProgress.map((item, idx) => (
                                <div
                                    key={`${item.title}-${idx}`}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '12px'
                                    }}
                                >
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{item.title}</p>
                                        <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '13px' }}>
                                            📍 {item.attraction || 'Atracție'} • {item.completedAt ? new Date(item.completedAt).toLocaleDateString('ro-RO') : 'În curs'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontWeight: 700, color: '#10b981' }}>+{item.points}p</p>
                                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px' }}>
                                            {item.correctAnswers}/{item.totalQuestions} corecte
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: 'var(--text)' }}>Insigne</h3>
                    {profile.badges.length === 0 ? (
                        <p style={{ color: 'var(--muted)' }}>Obține primele puncte pentru a debloca o insignă.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {profile.badges.map(badge => (
                                <div
                                    key={badge.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        border: '1px dashed var(--border)',
                                        borderRadius: '12px',
                                        padding: '10px 14px'
                                    }}
                                >
                                    <div style={{ fontSize: '28px' }}>{badge.icon}</div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{badge.name}</p>
                                        <p style={{ margin: '2px 0 0 0', color: 'var(--muted)', fontSize: '13px' }}>{badge.description}</p>
                                        {badge.unlockedAt && (
                                            <p style={{ margin: '4px 0 0 0', color: '#10b981', fontSize: '12px' }}>
                                                Deblocată pe {new Date(badge.unlockedAt).toLocaleDateString('ro-RO')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Acțiuni */}
            <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: 'var(--text)' }}>Acțiuni rapide</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/map')}
                        style={{
                            flex: '1 1 220px',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        🗺️ Explorează harta
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            flex: '1 1 220px',
                            padding: '14px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'transparent',
                            color: 'var(--text)',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        📊 Vezi progresul detaliat
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
