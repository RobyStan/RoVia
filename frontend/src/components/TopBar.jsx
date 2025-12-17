import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function TopBar({ onMenuToggle, sidebarWidth = 72 }) {
	const navigate = useNavigate();
	const auth = useAuth();
	const username = useMemo(() => auth.username || 'Explorer', [auth.username]);
	const roleLabel = useMemo(() => auth.role || 'Vizitator', [auth.role]);

	const [dark, setDark] = useState(() => {
		try {
			const stored = localStorage.getItem('theme');
			if (stored) return stored === 'dark';
			return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		} catch { return false; }
	});

	useEffect(() => {
		const root = document.documentElement;
		if (dark) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	}, [dark]);

	const toggleDarkMode = () => {
		setDark(prevDark => !prevDark);
	};

	return (
		<div style={{
			position: 'fixed',
			top: 0,
			left: sidebarWidth,
			right: 0,
			height: '56px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			padding: '0 24px',
			borderBottom: '1px solid var(--border)',
			background: 'var(--topbar-bg)',
			zIndex: 60,
			backdropFilter: 'blur(12px)',
			transition: 'all 400ms ease'
		}}>
			{/* Left: Title */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
				<button
					onClick={onMenuToggle}
					aria-label="toggle sidebar"
					style={{
						width: 36,
						height: 36,
						borderRadius: 10,
						border: '1px solid var(--border)',
						background: 'var(--card-bg)',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
						<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
					</svg>
				</button>
				<h1 style={{
					fontSize: '16px',
					fontWeight: '600',
					color: 'var(--text)',
					margin: 0,
					transition: 'color 400ms ease'
				}}>
					🌍 RoVia - Descoperă România
				</h1>
			</div>

			{/* Right: Dark mode toggle + User */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
				{/* Dark mode toggle switch - Modern iOS Style */}
				<button
					onClick={toggleDarkMode}
					aria-label="Toggle dark mode"
					title={dark ? 'Treceți la modul luminat' : 'Treceți la modul întunecat'}
					style={{
						width: '72px',
						height: '40px',
						borderRadius: '20px',
						background: dark 
							? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
							: 'linear-gradient(135deg, #d1d5db 0%, #e5e7eb 100%)',
						border: 'none',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						padding: '3px',
						transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
						position: 'relative',
						boxShadow: dark 
							? 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
							: 'inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08)',
						overflow: 'hidden'
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.boxShadow = dark 
							? 'inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 6px 16px rgba(0, 0, 0, 0.25)'
							: 'inset 0 1px 3px rgba(0, 0, 0, 0.12), 0 6px 16px rgba(0, 0, 0, 0.15)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.boxShadow = dark 
							? 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
							: 'inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08)';
					}}
				>
					{/* Background track - sun icon left */}
					<div style={{
						position: 'absolute',
						left: '8px',
						fontSize: '16px',
						opacity: dark ? 0.4 : 1,
						transition: 'opacity 300ms ease',
						pointerEvents: 'none',
						display: 'flex',
						alignItems: 'center'
					}}>
						☀️
					</div>

					{/* Background track - moon icon right */}
					<div style={{
						position: 'absolute',
						right: '8px',
						fontSize: '16px',
						opacity: dark ? 1 : 0.4,
						transition: 'opacity 300ms ease',
						pointerEvents: 'none',
						display: 'flex',
						alignItems: 'center'
					}}>
						🌙
					</div>

					{/* Draggable circle */}
					<div style={{
						width: '34px',
						height: '34px',
						borderRadius: '50%',
						background: 'white',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
						transform: dark ? 'translateX(32px)' : 'translateX(0)',
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25), 0 0 2px rgba(0, 0, 0, 0.1)',
						fontSize: '18px',
						zIndex: 10,
						fontWeight: 'bold'
					}}>
						{dark ? '🌙' : '☀️'}
					</div>
				</button>

				{/* User info - click pentru profil */}
				{auth.isAuthenticated ? (
					<div 
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							cursor: 'pointer',
							padding: '6px 12px',
							borderRadius: '10px',
							background: 'var(--card-bg)',
							transition: 'all 200ms ease'
						}}
						onClick={() => navigate('/profile')}
						onMouseEnter={(e) => { 
							e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
							e.currentTarget.style.transform = 'translateY(-2px)';
						}}
						onMouseLeave={(e) => { 
							e.currentTarget.style.background = 'var(--card-bg)';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						<div style={{ textAlign: 'right' }}>
							<p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', margin: 0, transition: 'color 400ms ease' }}>
								{username}
							</p>
							<p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0, transition: 'color 400ms ease' }}>
								{roleLabel}
							</p>
						</div>
						<div style={{
							width: '36px',
							height: '36px',
							backgroundColor: 'var(--accent)',
							borderRadius: '50%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: 'white',
							fontWeight: 'bold',
							fontSize: '14px',
							transition: 'transform 200ms ease'
						}}>
							{(username && username[0])?.toUpperCase() ?? 'U'}
						</div>
					</div>
				) : (
					<button
						onClick={() => navigate('/login')}
						style={{
							padding: '10px 18px',
							borderRadius: 12,
							border: '1px solid var(--accent)',
							background: 'transparent',
							color: 'var(--accent)',
							fontWeight: 600,
							cursor: 'pointer'
						}}
					>
						Autentificare
					</button>
				)}
			</div>
		</div>
	);
}

export default TopBar;
