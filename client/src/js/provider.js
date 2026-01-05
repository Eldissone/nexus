import { API_URL } from '../utils/config.js';

function getId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadProvider() {
  const id = getId();
  if (!id) {
    document.getElementById('providerHeader').innerHTML = '<p>Prestador não encontrado.</p>';
    return;
  }

  try {
    const [userRes, reviewsRes] = await Promise.all([
      fetch(`${API_URL}/api/providers/${id}`),
      fetch(`${API_URL}/api/providers/${id}/reviews`)
    ]);

    const user = await userRes.json();
    const reviewsData = await reviewsRes.json();

    document.getElementById('providerHeader').innerHTML = `
      <h2>Dr. ${user.name}</h2>
      <p>${user.profile?.specialty || ''}</p>
      <div class="details-grid">
        <div><strong>Avaliação média:</strong> ${reviewsData.averageRating || 0} ★</div>
        <div><strong>Avaliações:</strong> ${reviewsData.reviewsCount || 0}</div>
      </div>
    `;

    const list = (reviewsData.reviews || []).map(r => `
      <div class="appointment-item">
        <div>
          <strong>${r.clientId?.name || 'Cliente'}</strong>
          <small> • ${new Date(r.createdAt).toLocaleDateString()}</small>
          <p>${r.serviceId?.title || ''}</p>
          <p>★ ${r.rating || 0}</p>
          <p>${r.review || ''}</p>
        </div>
      </div>
    `).join('');

    document.getElementById('providerReviews').innerHTML = `
      <h3>Avaliações</h3>
      ${list || '<p>Sem avaliações ainda.</p>'}
    `;
  } catch (e) {
    document.getElementById('providerHeader').innerHTML = '<p>Erro ao carregar prestador.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadProvider);
