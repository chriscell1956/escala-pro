const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    if (!url.endsWith('/api')) {
        url += '/api';
    }
    return url;
};

export const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle Session Expiry / Invalid Token
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn('Sessão expirada ou inválida. Redirecionando para login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Force reload to clear state and trigger AuthContext check
            window.location.href = '/login';
            return Promise.reject(error);
        }

        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
