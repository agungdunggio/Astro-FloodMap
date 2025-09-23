// src/js/petaDasarPageController.js
import { getAggregatedForecastForKotaGorontalo } from '../fetch/bmkgAggregatedForecast.js';
import { initRainForecastScheduler, updateRainForecastData } from '../forecast/rainForecastScheduler.js';
import { startFloodSimulationPerKecamatan, enableScheduledPerKecamatanFlood } from '../simulationManager.js';

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
async function fetchAndPrepareAggregatedForecast(viewer) {
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
    // Update scheduler agar hujan per-kecamatan mengikuti prakiraan
    try {
      if (viewer) {
        await initRainForecastScheduler(viewer);
      }
      updateRainForecastData(fetchedAggregatedData);
    } catch (e) {
      console.warn('Gagal menginisialisasi scheduler hujan:', e);
    }
  } else {
    fetchedAggregatedData = null;
    console.warn("Tidak ada data agregat yang valid diterima dari BMKG.");
  }

  // Dispatch custom event with fetched data
  window.dispatchEvent(new CustomEvent('updateForecastData', { detail: fetchedAggregatedData }));

  // Aktifkan simulasi terjadwal per-kecamatan 3 jam mengikuti interval prakiraan (tanpa membatasi timeline)
  try {
    if (viewer) {
      enableScheduledPerKecamatanFlood(viewer, 3 /* jam */);
    }
  } catch (e) {
    console.warn('Gagal mengaktifkan simulasi banjir terjadwal per-kecamatan:', e);
  }

  toggleLoading(false);
  return fetchedAggregatedData;
}

// Initialize UI
export function initializePetaDasarPageUI(viewer) {
  const openBtn = document.getElementById('openForecastBtn');

  if (openBtn) {
    openBtn.addEventListener('click', async () => {
      if (!fetchedAggregatedData) {
        await fetchAndPrepareAggregatedForecast(viewer);
      } else {
        // Re-dispatch cached data
        window.dispatchEvent(new CustomEvent('updateForecastData', { detail: fetchedAggregatedData }));
      }
    });
  }

  console.log("UI Controller untuk Peta Dasar (modal BMKG) telah diinisialisasi.");
}

