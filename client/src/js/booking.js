import { API_URL } from '../utils/config.js';

let selectedService = null;

document.addEventListener('DOMContentLoaded', async () => {
    const serviceId = localStorage.getItem('selectedService');
    if (!serviceId) {
        alert('Nenhum serviço selecionado');
        window.location.href = '/src/pages/search.html';
        return;
    }

    // Configurar min date para hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').min = today;

    await loadServiceDetails(serviceId);
    setupEventListeners();
});

async function loadServiceDetails(id) {
    try {
        const res = await fetch(`${API_URL}/api/services/${id}`);
        if (!res.ok) throw new Error('Serviço não encontrado');
        
        selectedService = await res.json();
        
        const container = document.getElementById('serviceDetails');
        container.innerHTML = `
            <h2>${selectedService.title}</h2>
            <p>${selectedService.description}</p>
            <div class="details-grid">
                <div>
                    <strong>Prestador:</strong> ${selectedService.providerId?.name || 'N/A'}
                </div>
                <div>
                    <strong>Duração:</strong> ${selectedService.duration} min
                </div>
                <div>
                    <strong>Preço:</strong> R$ ${selectedService.price.toFixed(2)}
                </div>
            </div>
        `;
        
        document.getElementById('totalPrice').textContent = `R$ ${selectedService.price.toFixed(2)}`;
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar serviço');
        window.location.href = '/search.html';
    }
}

function setupEventListeners() {
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    
    dateInput.addEventListener('change', async (e) => {
        if (!e.target.value) return;
        
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option>Carregando...</option>';
        
        try {
            // Buscar horários disponíveis
            const res = await fetch(`${API_URL}/api/appointments/availability?providerId=${selectedService.providerId._id}&date=${e.target.value}`);
            const slots = await res.json(); // Array de strings "HH:mm"
            
            timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
            // Mock de horários se a API não retornar
            const mockSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
            (slots.length ? slots : mockSlots).forEach(time => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeSelect.appendChild(option);
            });
            
            timeSelect.disabled = false;
        } catch (error) {
            console.error('Erro ao buscar horários:', error);
            timeSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    });
    
    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const address = document.getElementById('address').value;
        const notes = document.getElementById('notes').value;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Você precisa estar logado para agendar');
                window.location.href = '/src/pages/login.html';
                return;
            }

            const res = await fetch(`${API_URL}/api/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    serviceId: selectedService._id,
                    providerId: selectedService.providerId._id,
                    scheduledDate: date,
                    scheduledTime: time,
                    address,
                    notes
                })
            });

            if (!res.ok) throw new Error('Erro ao criar agendamento');
            
            alert('Agendamento realizado com sucesso!');
            window.location.href = '/src/pages/dashboard.html';
        } catch (error) {
            console.error('Erro:', error);
            alert('Falha ao agendar. Tente novamente.');
        }
    });
}
