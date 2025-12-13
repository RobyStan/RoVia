import axios from 'axios';

// Creăm o instanță Axios cu URL-ul de bază al backend-ului tău
const api = axios.create({
    baseURL: 'https://localhost:7017/api', // Verifică portul din Swagger-ul tău (cred că era 7017)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Adaugă automat token-ul la fiecare cerere, dacă există
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;