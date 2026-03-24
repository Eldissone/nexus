import { API_URL, socket } from '../utils/config.js';

let appointments = [];
let currentUser = null;

function resolveAvatarUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith('/')) return `${API_URL}${path}`;
  return `${API_URL}/${path}`;
}

function formatDisplayName(name) {
  if (!name || typeof name !== 'string') return 'Prestador';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Prestador';
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1]}`;
}

function statusText(status) {
  return ({
    pending: 'Pendente',
    confirmed: 'Confirmado',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    rejected: 'Rejeitado'
  })[status] || status;
}

function badgeClass(status) {
  const map = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    confirmed: 'bg-blue-500/10 text-blue-400',
    in_progress: 'bg-green-500/10 text-green-400',
    completed: 'bg-purple-500/10 text-purple-400',
    cancelled: 'bg-red-500/10 text-red-400',
    rejected: 'bg-red-500/10 text-red-400'
  };
  return map[status] || 'bg-slate-500/10 text-slate-400';
}

function getAppointmentDateTime(apt) {
  if (!apt?.scheduledDate) return null;
  const datePart = new Date(apt.scheduledDate);
  if (!apt.scheduledTime) return datePart;
  const [h, m] = String(apt.scheduledTime).split(':').map(Number);
  if (!isNaN(h)) datePart.setHours(h, isNaN(m) ? 0 : m, 0, 0);
  return datePart;
}

async function loadProviderDashboard() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/src/pages/login.html';
    return;
  }

  await loadProfile(token);
  if (currentUser?.role && currentUser.role !== 'provider') {
    window.location.href = '/src/pages/dashboard.html';
    return;
  }

  await loadAppointments(token);
  updateStats();
  renderPendingRequests();
  renderUpcomingSchedule();
  renderAppointmentsList();
  setupWebSocket();
}

async function loadProfile(token) {
  try {
    const res = await fetch(`${API_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      currentUser = await res.json();
      localStorage.setItem('user', JSON.stringify({
        id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatar: currentUser.avatar,
        profile: currentUser.profile
      }));
    }
  } catch {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { currentUser = JSON.parse(userStr); } catch {}
    }
  }

  const nameEl = document.getElementById('providerName');
  if (nameEl) nameEl.textContent = formatDisplayName(currentUser?.name);

  const avatarEl = document.getElementById('providerAvatar');
  const avatarUrl = resolveAvatarUrl(currentUser?.avatar);
  if (avatarEl && avatarUrl) avatarEl.src = avatarUrl;
}

async function loadAppointments(token) {
  try {
    const res = await fetch(`${API_URL}/api/appointments/my-appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    appointments = res.ok ? await res.json() : [];
  } catch {
    appointments = [];
  }
}

function updateStats() {
  const ratingEl = document.getElementById('statRating');
  if (ratingEl) ratingEl.textContent = `${Number(currentUser?.rating || 0).toFixed(1)} ★`;

  const today = new Date();
  const isSameDay = (d) => d && d.toDateString() === today.toDateString();
  const todays = appointments.filter(a => {
    const dt = getAppointmentDateTime(a);
    return dt && isSameDay(dt) && !['cancelled', 'rejected'].includes(a.status);
  });

  const countEl = document.getElementById('statAppointmentsToday');
  if (countEl) countEl.textContent = String(todays.length);

  const earnings = todays.reduce((sum, a) => sum + Number(a.serviceId?.price || 0), 0);
  const earningsEl = document.getElementById('statEarnings');
  if (earningsEl) earningsEl.textContent = `R$ ${earnings.toFixed(2)}`;
}

function renderPendingRequests() {
  const root = document.getElementById('pendingRequestsSection');
  if (!root) return;

  const pending = appointments.filter(a => a.status === 'pending');
  if (pending.length === 0) {
    root.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-bold dark:text-white">Solicitações Pendentes</h3>
      </div>
      <div class="rounded-2xl bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-white/5 p-5 text-slate-500 dark:text-slate-400">
        Nenhuma solicitação pendente no momento.
      </div>
    `;
    return;
  }

  const items = pending.slice(0, 3).map(apt => {
    const name = apt.clientId?.name || 'Cliente';
    const service = apt.serviceId?.title || 'Serviço';
    const price = Number(apt.serviceId?.price || 0).toFixed(2);
    const dt = getAppointmentDateTime(apt);
    const when = dt ? dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
    return `
      <div class="relative overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-lg">
        <div class="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <div class="p-5">
          <div class="flex justify-between items-start mb-4">
            <div class="flex gap-3">
              <div class="size-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl font-bold dark:text-white">
                ${name.split(' ').map(p => p[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h4 class="font-bold text-base dark:text-white">${name}</h4>
                <p class="text-sm text-slate-500 dark:text-slate-400">${service}</p>
              </div>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-lg font-bold text-primary">R$ ${price}</span>
              <span class="text-xs text-slate-400">${when || 'A combinar'}</span>
            </div>
          </div>
          <div class="flex gap-3">
            <button data-action="reject" data-id="${apt._id}"
              class="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-semibold py-3 px-4 rounded-xl transition-colors border border-transparent dark:border-white/10">
              Recusar
            </button>
            <button data-action="confirm" data-id="${apt._id}"
              class="flex-1 bg-primary hover:bg-primary/90 text-black font-bold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(19,236,91,0.3)] transition-all transform active:scale-95 flex items-center justify-center gap-2">
              <span>Aceitar</span>
              <span class="material-symbols-outlined text-lg">check_circle</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  root.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-bold dark:text-white">Solicitações Pendentes</h3>
      <span class="flex h-2 w-2 relative">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
    </div>
    ${items}
  `;

  root.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      await updateAppointmentStatus(id, action === 'confirm' ? 'confirmed' : 'rejected');
    });
  });
}

function renderUpcomingSchedule() {
  const root = document.getElementById('upcomingSchedule');
  if (!root) return;

  const now = new Date();
  const upcoming = appointments
    .filter(a => !['cancelled', 'rejected'].includes(a.status))
    .map(a => ({ apt: a, dt: getAppointmentDateTime(a) }))
    .filter(item => item.dt && item.dt >= now)
    .sort((a, b) => a.dt - b.dt)
    .slice(0, 3);

  if (upcoming.length === 0) {
    root.innerHTML = `
      <div class="rounded-xl bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-white/5 p-4 text-slate-500 dark:text-slate-400">
        Nenhum agendamento futuro.
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="absolute left-[59px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-white/10"></div>
    ${upcoming.map(({ apt, dt }, index) => {
      const time = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="flex gap-4 relative">
          <div class="w-12 text-right pt-1">
            <span class="text-sm font-bold ${index === 0 ? 'dark:text-white' : 'dark:text-slate-400'}">${time}</span>
          </div>
          <div class="absolute left-[55px] top-2 size-2.5 rounded-full ${index === 0 ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'} ring-4 ring-background-light dark:ring-background-dark z-10"></div>
          <div class="flex-1 bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-slate-100 dark:border-white/5 ${index === 0 ? '' : 'opacity-75'}">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-sm dark:text-white">${apt.clientId?.name || 'Cliente'}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${apt.serviceId?.title || 'Serviço'}</p>
              </div>
              <span class="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
            </div>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function renderAppointmentsList() {
  const root = document.getElementById('providerAppointments');
  if (!root) return;

  root.innerHTML = `
    <h3 class="text-lg font-bold dark:text-white mb-3">Meus Atendimentos</h3>
    ${appointments.slice(0, 8).map(apt => `
      <div class="relative overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow">
        <div class="p-4 flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">${apt.clientId?.name || 'Cliente'}</p>
            <h4 class="font-bold dark:text-white">${apt.serviceId?.title || 'Serviço'} • ${new Date(apt.scheduledDate).toLocaleDateString()} ${apt.scheduledTime || ''}</h4>
          </div>
          <span class="text-xs font-bold px-2 py-1 rounded-full ${badgeClass(apt.status)}">${statusText(apt.status)}</span>
        </div>
      </div>
    `).join('')}
  `;
}

async function updateAppointmentStatus(id, status) {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    await fetch(`${API_URL}/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    await loadAppointments(token);
    updateStats();
    renderPendingRequests();
    renderUpcomingSchedule();
    renderAppointmentsList();
  } catch {
    alert('Falha ao atualizar status');
  }
}

function setupWebSocket() {
  if (!socket.connected) {
    try { socket.connect(); } catch {}
  }
  socket.on('status-updated', data => {
    const index = appointments.findIndex(a => a._id === data._id);
    if (index !== -1) {
      appointments[index] = data;
      updateStats();
      renderPendingRequests();
      renderUpcomingSchedule();
      renderAppointmentsList();
    }
  });
  appointments.forEach(apt => {
    if (!['completed', 'cancelled', 'rejected'].includes(apt.status)) {
      socket.emit('join-room', apt._id);
    }
  });
}

document.addEventListener('DOMContentLoaded', loadProviderDashboard);
