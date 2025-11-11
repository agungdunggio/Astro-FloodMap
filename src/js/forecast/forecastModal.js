// src/js/forecastModal.js
import { getAggregatedForecastForKotaGorontalo } from '../fetch/bmkgAggregatedForecast.js';
const modal = document.getElementById('forecastModal');
const closeBtn = document.getElementById('closeModalBtn');
const contentEl = document.getElementById('bmkgAggregatedForecastContent');
const reloadBtn = document.getElementById('reloadForecastBtn');

if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });
}

if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
}

window.addEventListener('requestReloadForecast', async () => {
  try {
    const freshData = await getAggregatedForecastForKotaGorontalo();
    window.dispatchEvent(new CustomEvent('updateForecastData', { detail: freshData }));
  } catch (err) {
    console.error('Gagal memuat ulang prakiraan:', err);
  }
});


window.addEventListener('updateForecastData', (event) => {
  const aggregatedData = event.detail;
  fetch('/render-forecast-block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(aggregatedData),
  })
    .then((res) => res.text())
    .then((html) => {
      if (contentEl) contentEl.innerHTML = html;
      if (modal) modal.style.display = 'flex';
    });
});
