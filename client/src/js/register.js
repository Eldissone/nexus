import { API_URL } from '../utils/config.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const roleButtons = document.querySelectorAll('.role-btn');
    const providerFields = document.getElementById('providerFields');
    const clientFields = document.getElementById('clientFields');
    let selectedRole = 'client';

    // Seletor de tipo de usuário
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            roleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRole = btn.dataset.role;

            // Mostrar/esconder campos específicos
            if (selectedRole === 'provider') {
                providerFields.style.display = 'block';
                clientFields.style.display = 'none';
            } else {
                providerFields.style.display = 'none';
                clientFields.style.display = 'block';
            }
        });
    });

    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('password').value,
            role: selectedRole
        };

        // Adicionar campos específicos
        if (selectedRole === 'provider') {
            formData.profile = {
                specialty: document.getElementById('specialty').value,
                licenseNumber: document.getElementById('license').value
            };
        } else {
            formData.healthProfile = {
                bloodType: document.getElementById('bloodType').value
            };
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Salvar token e redirecionar
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                alert('Cadastro realizado com sucesso!');
                window.location.href = selectedRole === 'provider' ? '/dashboard-provider.html' : '/dashboard-client.html';
            } else {
                alert(data.message || 'Erro no cadastro');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro de conexão');
        }
    });
});