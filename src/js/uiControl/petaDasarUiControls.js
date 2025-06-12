// src/js/petaDasarPageController.js
import { getAggregatedForecastForKotaGorontalo } from '../fetch/bmkgAggregatedForecast.js';

let fetchedAggregatedData = null;

// Show/hide loading indicator
function toggleLoading(show) {
  const indicator = document.getElementById('loadingIndicator');
  const btnText = document.querySelector('#openForecastBtn .btn-text');
  const btnIcon = document.querySelector('#openForecastBtn .btn-icon');
  const btn = document.getElementById('openForecastBtn');

  if (indicator && btn && btnText && btnIcon) {
    if (show) {
      indicator.classList.remove('hidden');
      btnText.style.display = 'inline';
      btnIcon.style.display = 'inline';
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      indicator.classList.add('hidden');
      btnText.style.display = 'inline';
      btnIcon.style.display = 'inline';
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }
}

// Fetch and prepare aggregated forecast data
async function fetchAndPrepareAggregatedForecast() {
  toggleLoading(true);

  console.log("Memulai pengambilan data prakiraan BMKG agregat (dari petaDasarPageController.js)...");
  const aggregatedData = await getAggregatedForecastForKotaGorontalo();

  try {
    console.log("--- DATA PRAKIRAAN BMKG AGREGAT (RAW dari petaDasarPageController.js) ---");
    console.log(JSON.parse(JSON.stringify(aggregatedData)));
    console.log("------------------------------------------");
  } catch (e) {
    console.error("Error saat mencetak data agregat:", e);
    console.log("Data Agregat (Fallback Log):", aggregatedData);
  }

  if (aggregatedData && Object.keys(aggregatedData).length > 0) {
    fetchedAggregatedData = aggregatedData;
  } else {
    fetchedAggregatedData = null;
    console.warn("Tidak ada data agregat yang valid diterima dari BMKG.");
  }

  // Dispatch custom event with fetched data
  window.dispatchEvent(new CustomEvent('updateForecastData', { detail: fetchedAggregatedData }));

  toggleLoading(false);
  return fetchedAggregatedData;
}

// Initialize UI
export function initializePetaDasarPageUI() {
  const openBtn = document.getElementById('openForecastBtn');

  if (openBtn) {
    openBtn.addEventListener('click', async () => {
      if (!fetchedAggregatedData) {
        await fetchAndPrepareAggregatedForecast();
      } else {
        // Re-dispatch cached data
        window.dispatchEvent(new CustomEvent('updateForecastData', { detail: fetchedAggregatedData }));
      }
    });
  }

  console.log("UI Controller untuk Peta Dasar (modal BMKG) telah diinisialisasi.");
}

