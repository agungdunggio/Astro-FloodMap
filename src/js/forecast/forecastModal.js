// src/js/forecastModal.js
const modal = document.getElementById('forecastModal');
const closeBtn = document.getElementById('closeModalBtn');
const contentEl = document.getElementById('bmkgAggregatedForecastContent');

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
