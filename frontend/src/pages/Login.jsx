import { useState } from 'react';
import api from '../services/api'; // Importăm configurarea de mai sus
import { useNavigate, Link } from 'react-router-dom';
function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
                const response = await api.post('/auth/login', {
                    email: email,
                    password: password
                });

                localStorage.setItem('token', response.data.token);
                setSuccess('Autentificare reușită!');
                
                // --> LINIA NOUĂ: Așteptăm 1 secundă să vadă mesajul, apoi redirecționăm
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1000);
        } catch (err) {
            // Dacă apare o eroare (ex: parola greșită)
            console.error(err);
            setError('Email sau parolă incorectă!');
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
            <h2>Autentificare RoVia</h2>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <label>Email:</label><br />
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div>
                    <label>Parolă:</label><br />
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Intră în cont
                </button>
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
            Nu ai cont? <Link to="/register">Înregistrează-te acum</Link>
            </p>
        </div>
    );
}

export default Login;