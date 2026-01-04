const API_URL = import.meta.env.VITE_API_URL;

// Configuração base para requisições
const api = {
    async get(endpoint, requiresAuth = true) {
        const headers = {};
        
        if (requiresAuth) {
            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        const response = await fetch(`${API_URL}${endpoint}`, { headers });
        
        if (response.status === 401) {
            // Token expirado, redirecionar para login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
            throw new Error('Sessão expirada');
        }

        return response.json();
    },

    async post(endpoint, data, requiresAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (requiresAuth) {
            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });

        if (response.status === 401 && requiresAuth) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
            throw new Error('Sessão expirada');
        }

        return response.json();
    },

    async put(endpoint, data) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data)
        });

        return response.json();
    },

    async delete(endpoint) {
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers
        });

        return response.json();
    }
};

export default api;