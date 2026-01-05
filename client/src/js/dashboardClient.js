import { API_URL, socket } from '../utils/config.js';

let appointments = [];

async function loadDashboard() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // Carregar agendamentos
        const res = await fetch(`${API_URL}/api/appointments/my-appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        appointments = await res.json();
        updateDashboard();
        
        // Conectar ao WebSocket para atualizações em tempo real
        setupWebSocket();
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function updateDashboard() {
    // Atualizar contadores
    const counts = {
        pending: appointments.filter(a => a.status === 'pending').length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        in_progress: appointments.filter(a => a.status === 'in_progress').length,
        completed: appointments.filter(a => a.status === 'completed').length
    };

    Object.keys(counts).forEach(status => {
        const element = document.getElementById(`count-${status}`);
        if (element) element.textContent = counts[status];
    });

    // Renderizar lista de agendamentos
    const container = document.getElementById('appointments-container');
    if (container) {
        container.innerHTML = appointments.slice(0, 5).map(apt => `
            <div class="appointment-item" data-id="${apt._id}">
                <div class="apt-info">
                    <h4>${apt.serviceId?.title || 'Serviço'}</h4>
                    <p>Com: Dr. ${apt.providerId?.name || 'Prestador'}</p>
                    <p>${new Date(apt.scheduledDate).toLocaleDateString()} - ${apt.scheduledTime}</p>
                </div>
                <div class="apt-status status-${apt.status}">
                    ${getStatusText(apt.status)}
                </div>
                <div class="apt-actions">
                    ${apt.status === 'pending' ? 
                        `<button onclick="cancelAppointment('${apt._id}')">Cancelar</button>` : ''}
                    ${apt.status === 'in_progress' ? 
                        `<button onclick="startChat('${apt._id}')">Chat</button>` : ''}
                </div>
            </div>
        `).join('');
    }
}

function setupWebSocket() {
    // Conectar ao WebSocket
    if (!socket.connected) {
        try { socket.connect(); } catch {}
    }
    socket.on('status-updated', (data) => {
        // Atualizar appointment específico
        const index = appointments.findIndex(a => a._id === data._id);
        if (index !== -1) {
            appointments[index] = data;
            updateDashboard();
            showNotification(`Status atualizado: ${getStatusText(data.status)}`);
        }
    });

    // Entrar nas salas dos agendamentos ativos
    appointments.forEach(apt => {
        if (!['completed', 'cancelled'].includes(apt.status)) {
            socket.emit('join-room', apt._id);
        }
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'confirmed': 'Confirmado',
        'in_progress': 'Em Andamento',
        'completed': 'Concluído',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

function showNotification(message) {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add styles dynamically if not present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                animation: slideIn 0.3s, fadeOut 0.3s 2.7s forwards;
                z-index: 1000;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            @keyframes fadeOut {
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Expose functions to window
window.newAppointment = () => {
    window.location.href = '/search.html';
};

window.cancelAppointment = async (id) => {
    if (!confirm('Tem certeza que deseja cancelar?')) return;
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/api/appointments/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'cancelled' })
        });
        loadDashboard();
    } catch (error) {
        console.error('Erro ao cancelar:', error);
        showNotification('Erro ao cancelar agendamento');
    }
};

window.startChat = (id) => {
    // Implement chat logic
    alert('Funcionalidade de chat em desenvolvimento');
};

// Inicializar
document.addEventListener('DOMContentLoaded', loadDashboard);
