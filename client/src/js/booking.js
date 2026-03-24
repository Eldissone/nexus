import { API_URL } from '../utils/config.js';

let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let providerDetails = null;

function resolveAvatarUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (path.startsWith('/')) return `${API_URL}${path}`;
    return `${API_URL}/${path}`;
}

function formatCurrency(value) {
    const num = Number(value || 0);
    return `R$ ${num.toFixed(2)}`;
}

function categoryLabel(category) {
    const map = {
        consultation: 'Consulta',
        homeCare: 'Atendimento Domiciliar',
        nursing: 'Enfermagem',
        physiotherapy: 'Fisioterapia',
        laboratory: 'Laboratório',
        pharmacy: 'Farmácia'
    };
    return map[category] || 'Serviço';
}

function isHomeService(category) {
    return String(category || '').toLowerCase().includes('home');
}

function showToast(type, title, message) {
    const toastRoot = document.getElementById('globalToast');
    if (!toastRoot) return;
    const isSuccess = type === 'success';
    const color = isSuccess ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white';
    toastRoot.innerHTML = `
        <div class="pointer-events-auto max-w-sm w-full ${color} shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3">
            <span class="material-symbols-outlined text-xl">${isSuccess ? 'check_circle' : 'error'}</span>
            <div class="flex-1">
                <p class="text-sm font-semibold">${title}</p>
                ${message ? `<p class="text-xs opacity-90">${message}</p>` : ''}
            </div>
        </div>
    `;
    toastRoot.style.opacity = '1';
    toastRoot.style.transform = 'translateY(0)';
    setTimeout(() => {
        toastRoot.style.opacity = '0';
        toastRoot.style.transform = 'translateY(16px)';
    }, 1800);
}

function showLoading(on) {
    const btn = document.getElementById('confirmButton');
    const btnText = document.getElementById('buttonText');
    const spinner = document.getElementById('loadingSpinner');
    if (!btn || !btnText || !spinner) return;
    spinner.classList.toggle('hidden', !on);
    btn.disabled = on || !selectedDate || !selectedTime;
    btn.classList.toggle('opacity-60', on);
    btn.classList.toggle('cursor-not-allowed', on);
}

function getPaymentMethod() {
    const selected = document.querySelector('input[name="paymentMethod"]:checked');
    return selected ? selected.value : null;
}

async function simulatePayment(method, total) {
    const btnText = document.getElementById('buttonText');
    if (btnText) {
        btnText.textContent = method === 'cash' ? 'Confirmando...' : 'Processando pagamento...';
    }
    await new Promise(resolve => setTimeout(resolve, method === 'cash' ? 500 : 1200));
    return { status: 'approved', method, total };
}

function showError(msg) {
    const errorBox = document.getElementById('errorMessage');
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
    errorBox.classList.add('transition-opacity', 'duration-300');
    errorBox.style.opacity = '0';
    requestAnimationFrame(() => { errorBox.style.opacity = '1'; });
    showToast('error', 'Falha no agendamento', msg);
}

function showSuccess(msg) {
    const successBox = document.getElementById('successMessage');
    const btn = document.getElementById('confirmButton');
    if (!successBox || !btn) return;
    successBox.textContent = msg;
    successBox.classList.remove('hidden');
    successBox.classList.add('transition-opacity', 'duration-300');
    successBox.style.opacity = '0';
    requestAnimationFrame(() => { successBox.style.opacity = '1'; });
    btn.classList.add('ring-2', 'ring-green-400', 'animate-pulse');
    showToast('success', 'Agendamento confirmado', msg);
}

function updateSummary() {
    if (!selectedService) return;

    const summaryService = document.getElementById('summaryService');
    const summaryType = document.getElementById('summaryType');
    const summaryDuration = document.getElementById('summaryDuration');
    const summaryDate = document.getElementById('summaryDate');
    const summaryTime = document.getElementById('summaryTime');

    if (summaryService) summaryService.textContent = selectedService.title || 'Serviço';
    if (summaryType) summaryType.textContent = categoryLabel(selectedService.category);
    if (summaryDuration) summaryDuration.textContent = selectedService.duration ? `${selectedService.duration} min` : '-';

    if (summaryDate && selectedDate) {
        const dateObj = new Date(selectedDate);
        summaryDate.textContent = dateObj.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        });
    }
    if (summaryTime) summaryTime.textContent = selectedTime || '-';

    const servicePrice = Number(selectedService.price || 0);
    const travelFee = isHomeService(selectedService.category) ? 25.0 : 0;
    const platformFee = servicePrice * 0.1;
    const total = servicePrice + travelFee + platformFee;

    const servicePriceEl = document.getElementById('servicePrice');
    const travelFeeEl = document.getElementById('travelFee');
    const platformFeeEl = document.getElementById('platformFee');
    const totalPriceEl = document.getElementById('totalPrice');

    if (servicePriceEl) servicePriceEl.textContent = formatCurrency(servicePrice);
    if (travelFeeEl) travelFeeEl.textContent = formatCurrency(travelFee);
    if (platformFeeEl) platformFeeEl.textContent = formatCurrency(platformFee);
    if (totalPriceEl) totalPriceEl.textContent = formatCurrency(total);

    const btn = document.getElementById('confirmButton');
    if (btn) btn.disabled = !selectedDate || !selectedTime;
}

function updateProviderCard() {
    if (!selectedService) return;
    const provider = providerDetails || selectedService.providerId || {};

    const providerImage = document.getElementById('providerImage');
    const providerName = document.getElementById('providerName');
    const providerSpecialty = document.getElementById('providerSpecialty');
    const providerRating = document.getElementById('providerRating');
    const providerReviewsCount = document.getElementById('providerReviewsCount');
    const verificationBadge = document.getElementById('verificationBadge');

    const avatarUrl = resolveAvatarUrl(provider.avatar);
    if (providerImage && avatarUrl) providerImage.src = avatarUrl;
    if (providerName) providerName.textContent = provider.name || 'Prestador';
    if (providerSpecialty) providerSpecialty.textContent = provider.profile?.specialty || categoryLabel(selectedService.category);

    if (providerRating) {
        const rating = Number(provider.rating || 0);
        providerRating.textContent = rating.toFixed(1);
    }

    if (providerReviewsCount) {
        const count = Number(provider.reviewsCount || 0);
        providerReviewsCount.textContent = `(${count} avaliações)`;
    }

    if (verificationBadge) {
        verificationBadge.classList.toggle('hidden', !provider.isVerified);
    }
}

function updateServiceDetailsCard() {
    if (!selectedService) return;
    const container = document.getElementById('serviceDetails');
    if (!container) return;
    container.innerHTML = `
        <h2 class="text-xl font-bold text-text-dark dark:text-white mb-2">${selectedService.title || 'Serviço'}</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">${selectedService.description || ''}</p>
        <div class="details-grid text-sm text-gray-700 dark:text-gray-300">
            <div><strong>Prestador:</strong> ${providerDetails?.name || selectedService.providerId?.name || 'N/A'}</div>
            <div><strong>Duração:</strong> ${selectedService.duration ? `${selectedService.duration} min` : '-'}</div>
            <div><strong>Preço:</strong> ${formatCurrency(selectedService.price)}</div>
        </div>
    `;
}

function updateServiceBadge() {
    const badge = document.getElementById('serviceTypeBadge');
    const desc = document.getElementById('serviceDescription');
    if (badge) badge.textContent = categoryLabel(selectedService?.category);
    if (desc) desc.textContent = selectedService?.description || '—';
}

function setTimeSlots(slots) {
    const timeSlots = document.getElementById('timeSlots');
    const noTimes = document.getElementById('noTimesMessage');
    if (!timeSlots) return;

    if (!Array.isArray(slots) || slots.length === 0) {
        timeSlots.innerHTML = '';
        if (noTimes) noTimes.classList.remove('hidden');
        return;
    }

    if (noTimes) noTimes.classList.add('hidden');
    timeSlots.innerHTML = slots.map(time => `
        <button type="button" class="time-slot available py-3 px-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-surface-dark hover:border-primary"
            data-time="${time}">
            <span class="text-sm font-medium">${time}</span>
        </button>
    `).join('');

    timeSlots.querySelectorAll('.time-slot').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedTime = btn.getAttribute('data-time');
            timeSlots.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            updateSummary();
        });
    });
}

function generateCalendarStrip() {
    const calendarStrip = document.getElementById('calendarStrip');
    if (!calendarStrip) return;

    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        days.push({
            date: dateString,
            day: date.getDate(),
            weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' })
        });
    }

    calendarStrip.innerHTML = days.map(day => `
        <button type="button"
            class="calendar-day flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary ${selectedDate === day.date ? 'selected' : 'bg-white dark:bg-surface-dark'}"
            data-date="${day.date}">
            <span class="text-xs font-medium ${selectedDate === day.date ? 'text-white' : 'text-gray-500 dark:text-gray-400'} mb-1">
                ${day.weekday}
            </span>
            <span class="text-lg font-bold ${selectedDate === day.date ? 'text-white' : 'text-gray-900 dark:text-white'}">
                ${day.day}
            </span>
        </button>
    `).join('');

    calendarStrip.querySelectorAll('.calendar-day').forEach(btn => {
        btn.addEventListener('click', () => {
            const date = btn.getAttribute('data-date');
            const dateInput = document.getElementById('date');
            if (dateInput) dateInput.value = date;
            selectedDate = date;
            selectedTime = null;
            updateSummary();
            fetchAvailability(date);
            generateCalendarStrip();
        });
    });
}

async function fetchProviderDetails(providerId) {
    if (!providerId) return null;
    try {
        const res = await fetch(`${API_URL}/api/providers/${providerId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function fetchProviderReviews(providerId) {
    if (!providerId) return null;
    try {
        const res = await fetch(`${API_URL}/api/providers/${providerId}/reviews`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function loadServiceDetails(id) {
    const res = await fetch(`${API_URL}/api/services/${id}`);
    if (!res.ok) throw new Error('Serviço não encontrado');
    selectedService = await res.json();

    const providerId = selectedService?.providerId?._id || selectedService?.providerId;
    if (providerId) {
        providerDetails = await fetchProviderDetails(providerId);
        const reviews = await fetchProviderReviews(providerId);
        if (reviews && providerDetails) {
            providerDetails.rating = reviews.averageRating ?? providerDetails.rating;
            providerDetails.reviewsCount = reviews.reviewsCount ?? providerDetails.reviewsCount;
        }
    }

    updateServiceDetailsCard();
    updateProviderCard();
    updateServiceBadge();
    updateSummary();
}

async function fetchAvailability(date) {
    if (!selectedService) return;
    const providerId = selectedService?.providerId?._id || selectedService?.providerId;
    if (!providerId || !date) return;

    try {
        const res = await fetch(`${API_URL}/api/appointments/availability?providerId=${providerId}&date=${date}`);
        const slots = await res.json();
        setTimeSlots(Array.isArray(slots) ? slots : []);
    } catch {
        setTimeSlots([]);
    }
}

function setupFormHandlers() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.addEventListener('change', async (e) => {
            selectedDate = e.target.value;
            selectedTime = null;
            updateSummary();
            await fetchAvailability(selectedDate);
            generateCalendarStrip();
        });
    }

    const form = document.getElementById('bookingForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        document.getElementById('errorMessage')?.classList.add('hidden');
        document.getElementById('successMessage')?.classList.add('hidden');
        showLoading(true);

        const token = localStorage.getItem('token');
        if (!token) {
            showLoading(false);
            showError('Você precisa estar logado para agendar');
            setTimeout(() => { window.location.href = '/src/pages/login.html'; }, 900);
            return;
        }

        const date = document.getElementById('date')?.value;
        const address = document.getElementById('address')?.value;
        const notes = document.getElementById('notes')?.value;
        const terms = document.getElementById('terms');
        const paymentMethod = getPaymentMethod();

        if (!date || !selectedTime) {
            showLoading(false);
            showError('Selecione data e horário');
            return;
        }

        if (terms && !terms.checked) {
            showLoading(false);
            showError('Aceite os termos para continuar');
            return;
        }
        if (!paymentMethod) {
            showLoading(false);
            showError('Selecione uma forma de pagamento');
            return;
        }

        try {
            const servicePrice = Number(selectedService?.price || 0);
            const travelFee = isHomeService(selectedService?.category) ? 25.0 : 0;
            const platformFee = servicePrice * 0.1;
            const total = servicePrice + travelFee + platformFee;

            await simulatePayment(paymentMethod, total);

            const res = await fetch(`${API_URL}/api/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    serviceId: selectedService._id,
                    providerId: selectedService.providerId?._id || selectedService.providerId,
                    scheduledDate: date,
                    scheduledTime: selectedTime,
                    address,
                    notes,
                    paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid'
                })
            });

            showLoading(false);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                showError(err.message || 'Falha ao agendar. Tente novamente.');
                return;
            }

            const paymentLabel = paymentMethod === 'cash' ? 'Pagamento em dinheiro confirmado' : 'Pagamento autorizado (simulado)';
            showSuccess(`${paymentLabel}. Agendamento realizado com sucesso!`);
            setTimeout(() => { window.location.href = '/src/pages/dashboard.html'; }, 1000);
        } catch {
            showLoading(false);
            showError('Falha ao agendar. Tente novamente.');
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlServiceId = new URLSearchParams(window.location.search).get('service');
    const serviceId = urlServiceId || getStoredServiceId();

    setupFormHandlers();

    if (!serviceId || !isLikelyObjectId(serviceId)) {
        if (serviceId && !isLikelyObjectId(serviceId)) {
            localStorage.removeItem('selectedService');
        }
        await renderServicePicker();
        return;
    }

    await loadServiceOrFallback(serviceId);
    generateCalendarStrip();
});

function getStoredServiceId() {
    const raw = localStorage.getItem('selectedService');
    if (!raw) return null;
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
            const obj = JSON.parse(trimmed);
            return obj._id || obj.id || null;
        } catch {
            return null;
        }
    }
    return raw;
}

function isLikelyObjectId(value) {
    return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

async function loadServiceOrFallback(serviceId) {
    try {
        await loadServiceDetails(serviceId);
    } catch {
        showError('Erro ao carregar serviço');
        await renderServicePicker(true);
    }
}

async function renderServicePicker(fromError = false) {
    const container = document.getElementById('serviceDetails');
    if (!container) return;

    container.innerHTML = `
        <h2 class="text-xl font-bold text-text-dark dark:text-white mb-2">Escolha um serviço</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
            ${fromError ? 'Não foi possível carregar o serviço selecionado. ' : ''}Selecione um serviço para continuar.
        </p>
        <div id="servicePicker" class="space-y-3">
            <div class="animate-pulse">
                <div class="h-10 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
            </div>
        </div>
        <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Você também pode <a class="text-primary hover:text-primary-dark" href="/src/pages/search.html">buscar serviços</a>.
        </div>
    `;

    const picker = document.getElementById('servicePicker');
    if (!picker) return;

    try {
        const res = await fetch(`${API_URL}/api/services`);
        const services = res.ok ? await res.json() : [];

        if (!Array.isArray(services) || services.length === 0) {
            picker.innerHTML = `<p class="text-gray-600 dark:text-gray-300">Nenhum serviço disponível.</p>`;
            return;
        }

        picker.innerHTML = `
            <select id="serviceSelect" class="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="">Selecione um serviço</option>
                ${services.map(s => `<option value="${s._id}">${s.title} • ${formatCurrency(s.price)}</option>`).join('')}
            </select>
        `;

        const select = document.getElementById('serviceSelect');
        select.addEventListener('change', async (e) => {
            const id = e.target.value;
            if (!id) return;
            localStorage.setItem('selectedService', id);
            await loadServiceOrFallback(id);
            generateCalendarStrip();
        });
    } catch {
        picker.innerHTML = `<p class="text-gray-600 dark:text-gray-300">Falha ao carregar serviços.</p>`;
    }
}
