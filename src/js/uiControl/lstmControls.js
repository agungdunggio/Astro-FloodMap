// src/js/uiControl/lstmControls.js
import * as Cesium from 'cesium';
import { fetchLSTMPrediction, formatPredictionForChart } from '../fetch/lstmPredictionApi.js';
import { createPredictionChart, showLoadingState, showErrorState } from '../components/lstmChart.js';
import { enableScheduledLSTMFlood } from '../simulationManager.js';
import { successToast, warningToast, errorToast } from '../utils/notify.js';

/**
 * Inisialisasi kontrol UI untuk halaman Prediksi LSTM
 * @param {any} viewer Cesium Viewer
 */
export function initializeLSTMUIControls(viewer) {
  const toggleButton = document.getElementById('toggleLSTMPanel');
  const lstmControls = document.getElementById('lstmControls');
  const loadBtn = document.getElementById('loadPrediction');
  const showChartBtn = document.getElementById('showChart');
  const chartContainer = document.getElementById('predictionChart');

  let disposeLSTMSchedule = null;

  // Toggle Panel
  if (toggleButton && lstmControls) {
    toggleButton.addEventListener('click', () => {
      const isOpen = lstmControls.classList.toggle('open');
      toggleButton.classList.toggle('open', isOpen);
      const label = toggleButton.querySelector('.toggle-label');
      if (label) label.textContent = isOpen ? 'Tutup Panel' : 'Prediksi LSTM';
    });
  }

  // Button Muat Prediksi
  if (loadBtn) {
    let isLoading = false;
    loadBtn.addEventListener('click', async () => {
      if (isLoading) return;

      const daysInput = document.getElementById('predictionDays');
      const nDays = parseInt((daysInput && daysInput.value) || '7');
      if (isNaN(nDays) || nDays < 1 || nDays > 90) {
        warningToast('lstm-validate', 'Jumlah hari harus 1-90');
        return;
      }

      isLoading = true;
      try {
        showLoadingState(chartContainer);
        loadBtn.disabled = true;
        loadBtn.style.opacity = '0.6';
        loadBtn.innerHTML = '<div class="loading-spinner"></div> Memuat...';

        const apiData = await fetchLSTMPrediction(nDays);
        const chartData = formatPredictionForChart(apiData);
        await createPredictionChart(chartContainer, chartData);

        // Jadwalkan simulasi LSTM harian 12:00 selama 6 jam
        const predictions = (apiData && apiData.data && apiData.data[0] && apiData.data[0].predictions) || [];
        if (viewer && Array.isArray(predictions) && predictions.length > 0) {
          if (typeof disposeLSTMSchedule === 'function') { disposeLSTMSchedule(); disposeLSTMSchedule = null; }
          
          // Atur timeline untuk melihat beberapa hari ke depan (jangan ubah clock range)
          const now = Cesium.JulianDate.now();
          const startTime = now.clone();
          const stopTime = Cesium.JulianDate.addDays(now, Math.max(predictions.length, 7), new Cesium.JulianDate());
          
          viewer.clock.startTime = startTime;
          viewer.clock.stopTime = stopTime;
          viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;
          
          // Zoom timeline ke range yang sesuai
          viewer.timeline.zoomTo(startTime, stopTime);
          
          disposeLSTMSchedule = enableScheduledLSTMFlood(viewer, predictions, 6);
          successToast('lstm-schedule', `Scheduler LSTM aktif (${predictions.length} hari)`);
        } else {
          warningToast('lstm-schedule', 'Tidak ada data prediksi untuk penjadwalan');
        }

      } catch (err) {
        const msg = (err && err.message) ? err.message : 'Gagal mengambil data LSTM';
        showErrorState(chartContainer, msg);
        errorToast('lstm-schedule', msg);
      } finally {
        setTimeout(() => {
          loadBtn.disabled = false;
          loadBtn.style.opacity = '1';
          loadBtn.innerHTML = '<ion-icon name="bar-chart-outline"></ion-icon> Muat Prediksi';
          isLoading = false;
        }, 200);
      }
    });
  }

  // Optional: toggle tampil/sembunyi chart
  if (showChartBtn && chartContainer) {
    showChartBtn.addEventListener('click', () => {
      const isHidden = chartContainer.style.display === 'none';
      if (isHidden) {
        chartContainer.style.display = 'block';
        showChartBtn.innerHTML = '📉 Sembunyikan Grafik';
      } else {
        chartContainer.style.display = 'none';
        showChartBtn.innerHTML = '📈 Tampilkan Grafik';
      }
    });
  }
}


