import { API_URL } from '../utils/config.js';

let services = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
    // Initial search
    performSearch();
});

window.performSearch = async () => {
    const query = document.getElementById('searchInput').value;
    const category = document.getElementById('categoryFilter').value;
    const price = document.getElementById('priceFilter').value;
    const rating = document.getElementById('ratingFilter').value;

    try {
        const queryParams = new URLSearchParams({
            q: query,
            category,
            price,
            rating
        });

        const res = await fetch(`${API_URL}/api/services?${queryParams}`);
        services = await res.json();
        
        // Client-side filtering/sorting if backend doesn't support all params yet
        filterAndRenderResults();
        
    } catch (error) {
        console.error('Erro na busca:', error);
    }
};

window.clearFilters = () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('ratingFilter').value = '';
    performSearch();
};

window.sortResults = () => {
    const sortBy = document.getElementById('sortBy').value;
    
    if (sortBy === 'price_low') {
        services.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
        services.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
        // Assume provider rating for now as service rating might not exist
        services.sort((a, b) => (b.providerId?.rating || 0) - (a.providerId?.rating || 0));
    } else if (sortBy === 'name') {
        services.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    renderResults();
};

function filterAndRenderResults() {
    // Apply client-side filters if needed
    // For now, just render
    renderResults();
}

function renderResults() {
    const container = document.getElementById('servicesList');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedServices = services.slice(start, end);
    
    document.getElementById('resultsCount').textContent = `${services.length} resultados encontrados`;
    
    container.innerHTML = paginatedServices.map(service => `
        <div class="service-item">
            <div class="service-info">
                <h3>${service.title}</h3>
                <p>${service.description}</p>
                <div class="service-meta">
                    <span>🏥 ${service.category}</span>
                    <span>💰 $${service.price}</span>
                    <span>⏱ ${service.duration} min</span>
                </div>
                <div class="provider-info">
                    <small>Prestador: ${service.providerId?.name || 'N/A'}</small>
                    <small>★ ${service.providerId?.rating || 0}</small>
                </div>
            </div>
            <button class="btn-book" onclick="bookService('${service._id}')">Agendar</button>
        </div>
    `).join('');
    
    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(services.length / itemsPerPage);
    const container = document.getElementById('pagination');
    
    let html = '';
    if (currentPage > 1) {
        html += `<button onclick="changePage(${currentPage - 1})">Anterior</button>`;
    }
    
    html += `<span>Página ${currentPage} de ${totalPages || 1}</span>`;
    
    if (currentPage < totalPages) {
        html += `<button onclick="changePage(${currentPage + 1})">Próxima</button>`;
    }
    
    container.innerHTML = html;
}

window.changePage = (page) => {
    currentPage = page;
    renderResults();
    window.scrollTo(0, 0);
};

window.bookService = (id) => {
    localStorage.setItem('selectedService', id);
    window.location.href = '/src/pages/scheduling.html';
};
