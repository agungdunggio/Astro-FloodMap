// src/js/petaDasarPageController.js
import { getAggregatedForecastForKotaGorontalo } from './bmkgAggregatedForecast.js';

let fetchedAggregatedData = null; // Data yang sudah di-fetch agar tidak fetch berulang

// Fungsi untuk menampilkan/menyembunyikan loading indicator
function toggleLoading(show) {
  const indicator = document.getElementById('loadingIndicator');
  const btnText = document.querySelector('#openForecastBtn .btn-text');
  const btnIcon = document.querySelector('#openForecastBtn .btn-icon');
  const btn = document.getElementById('openForecastBtn');

  if (indicator && btn && btnText && btnIcon) {
    if (show) {
      indicator.classList.remove('hidden');
      btnText.style.display = 'none';
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

// Fungsi untuk menampilkan/menyembunyikan modal
function toggleModal(show) {
  const modal = document.getElementById('forecastModal');
  if (modal) {
    modal.style.display = show ? 'flex' : 'none';
  }
}

// Fungsi untuk mengambil, mencetak, dan memproses data prakiraan BMKG agregat
async function fetchAndPrepareAggregatedForecast() {
  toggleLoading(true);
  const aggregatedContentEl = document.getElementById('bmkgAggregatedForecastContent');
  
  if (aggregatedContentEl) {
      aggregatedContentEl.innerHTML = '<div style="text-align:center; padding:20px;">Mengambil dan mengagregasi data...</div>';
  }

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
      if (aggregatedContentEl) {
          aggregatedContentEl.innerHTML = '<div style="text-align:center; padding:20px; color:red;">Gagal memuat data prakiraan atau tidak ada data.</div>';
      }
      fetchedAggregatedData = null;
      console.warn("Tidak ada data agregat yang valid diterima dari BMKG.");
  }
  
  toggleLoading(false);
  return fetchedAggregatedData;
}

// Fungsi untuk menampilkan data yang sudah di-fetch ke panel UI modal
function displayFetchedDataInUI() {
  const aggregatedContentEl = document.getElementById('bmkgAggregatedForecastContent');
  if (!aggregatedContentEl) {
      console.warn("Elemen #bmkgAggregatedForecastContent tidak ditemukan saat display UI.");
      return;
  }
  
  if (!fetchedAggregatedData || Object.keys(fetchedAggregatedData).length === 0) {
      aggregatedContentEl.innerHTML = '<div style="text-align:center; padding:20px;">Tidak ada data prakiraan untuk ditampilkan.</div>';
      return;
  }

  const aggregatedData = fetchedAggregatedData;
  let htmlContent = '';
  for (const kecamatanKey in aggregatedData) {
      const dataKecamatan = aggregatedData[kecamatanKey];
      htmlContent += `<div class="kecamatan-forecast-block">`;
      htmlContent += `<h5>${dataKecamatan.namaResmi}</h5>`; 
      
      if (dataKecamatan.forecasts && dataKecamatan.forecasts.length > 0) {
          htmlContent += '<ul>';
          dataKecamatan.forecasts.slice(0, 17).forEach(item => { // Menampilkan hingga 17 item
              const localTime = (item.localDateTime && item.localDateTime instanceof Date) 
                                ? item.localDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                                : 'Waktu tidak valid';
              const localDate = (item.localDateTime && item.localDateTime instanceof Date) 
                                ? item.localDateTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) 
                                : 'Tanggal tidak valid';

              htmlContent += `<li>
                  <strong>${localDate}, ${localTime} WITA</strong><br/>
                  <img src="${item.iconUrl}" alt="${item.weatherDesc || 'ikon cuaca'}" style="width:22px; height:22px; vertical-align:middle; margin-right:3px; background-color: #f0f0f0; border-radius: 4px;">
                  <span>${item.weatherDesc || 'N/A'}</span><br/>
                  <span>Suhu: ${item.temperature != null ? item.temperature + '°C' : 'N/A'} | Hujan: ${item.totalPrecipitation != null ? item.totalPrecipitation + ' mm' : 'N/A'}</span>
              </li>`;
          });
          htmlContent += '</ul>';
      } else {
          htmlContent += '<p><small>Tidak ada data prakiraan untuk kecamatan ini.</small></p>';
      }
      htmlContent += `</div>`;
  }
  aggregatedContentEl.innerHTML = htmlContent;
  console.log("Data prakiraan BMKG agregat telah ditampilkan di UI modal (dari petaDasarPageController.js).");
}

// Fungsi utama yang akan di-export dan dipanggil dari peta-dasar.astro
export function initializePetaDasarPageUI() {
  const openBtn = document.getElementById('openForecastBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const modal = document.getElementById('forecastModal');
  
  if (openBtn) {
      openBtn.addEventListener('click', async () => {
          if (!fetchedAggregatedData) { 
              await fetchAndPrepareAggregatedForecast();
          }
          if (fetchedAggregatedData) { 
              displayFetchedDataInUI();
              toggleModal(true);
          } else {
              const aggregatedContentEl = document.getElementById('bmkgAggregatedForecastContent');
              if(aggregatedContentEl && !fetchedAggregatedData) aggregatedContentEl.innerHTML = '<div style="text-align:center; padding:20px; color:red;">Gagal memuat data. Silakan coba lagi nanti.</div>';
              toggleModal(true);
          }
      });
  }
  
  if (closeBtn) {
      closeBtn.addEventListener('click', () => toggleModal(false));
  }
  
  if (modal) {
      modal.addEventListener('click', (e) => {
          if (e.target === modal) { 
              toggleModal(false);
          }
      });
  }
  console.log("UI Controller untuk Peta Dasar (modal BMKG) telah diinisialisasi.");
}
