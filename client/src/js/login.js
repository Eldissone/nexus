import { API_URL } from '../utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Salvar token e redirecionar
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirecionar baseado no role
                if (data.user.role === 'provider') {
                    window.location.href = '/src/pages/dashboardprovider.html';
                } else {
                    window.location.href = '/src/pages/dashboard.html';
                }
            } else {
                alert(data.message || 'Erro no login');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro de conexão');
        }
    });
});
