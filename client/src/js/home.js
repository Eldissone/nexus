import { API_URL } from '../utils/config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Carregar serviços
    const servicesContainer = document.getElementById('services-container');
    const providersContainer = document.getElementById('providers-container');

    try {
        // Buscar serviços
        const servicesRes = await fetch(`${API_URL}/api/services/featured`);
        const servicesData = await servicesRes.json();
        const services = Array.isArray(servicesData) ? servicesData : [];

        // Renderizar serviços
        servicesContainer.innerHTML = services.map(service => `
            <div class="service-card" data-id="${service._id}">
                <div class="service-icon">🏥</div>
                <h3>${service.title}</h3>
                <p>${service.description}</p>
                <div class="service-footer">
                    <span class="price">${service.price ? `$${service.price}` : 'Preço sob consulta'}</span>
                    <button class="btn-book" onclick="viewService('${service._id}')">
                        Agendar
                    </button>
                </div>
            </div>
        `).join('');

        // Buscar prestadores
        const providersRes = await fetch(`${API_URL}/api/providers/featured`);
        const providersData = await providersRes.json();
        const providers = Array.isArray(providersData) ? providersData : [];

        // Renderizar prestadores
        providersContainer.innerHTML = providers.map(provider => `
            <div class="provider-card">
                <img src="${provider.avatar || '/default-avatar.png'}" alt="${provider.name}">
                <h3>Dr. ${provider.name}</h3>
                <p class="specialty">${provider.profile.specialty}</p>
                <div class="rating">
                    ${'★'.repeat(Math.floor(provider.rating))}${'☆'.repeat(5-Math.floor(provider.rating))}
                    <span>(${provider.reviewsCount})</span>
                </div>
                <button class="btn-view-profile" onclick="viewProvider('${provider._id}')">
                    Ver Perfil
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        servicesContainer.innerHTML = '<p>Não foi possível carregar os serviços.</p>';
        providersContainer.innerHTML = '';
    }
});

// Funções globais
window.viewService = (serviceId) => {
    localStorage.setItem('selectedService', serviceId);
    window.location.href = '/src/pages/appointments.html';
};

window.viewProvider = (providerId) => {
    window.location.href = `/src/pages/provider.html?id=${providerId}`;
};
