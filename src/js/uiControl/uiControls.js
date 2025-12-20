// src/js/uiControls.js
import * as Cesium from 'cesium'; // Mungkin tidak perlu Cesium di sini jika tidak ada interaksi langsung
import { startFloodSimulation, stopFloodSimulation } from '../simulationManager.js';
import { fetchHistoricalRainfall } from '../fetch/lstmPredictionApi.js';

function createModal() {
    if (document.getElementById('simpleModal')) return; 

    const modal = document.createElement('div');
    modal.id = 'simpleModal';
    // Hapus semua inline styles, biarkan CSS handle styling

    const modalTitle = document.createElement('h2');
    modalTitle.id = 'simpleModalTitle';
    
    const modalContent = document.createElement('p');
    modalContent.id = 'simpleModalText';
    

    const closeButton = document.createElement('button');
    closeButton.textContent = 'OK';
    closeButton.onclick = function() {
        // Tambahkan animasi fade out
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 300);
    };

    modal.appendChild(modalTitle);
    modal.appendChild(modalContent);
    modal.appendChild(closeButton);
    document.body.appendChild(modal);
}

function displayModalMessage(message, detail = "") {
    const modal = document.getElementById('simpleModal');
    const modalTitle = document.getElementById('simpleModalTitle');
    const modalText = document.getElementById('simpleModalText');
    if (modal && modalTitle && modalText) {
      modalTitle.textContent = message;
      modalText.textContent = detail;
        
        // Tampilkan dengan animasi fade in
        modal.style.display = 'block';
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        // Force reflow
        modal.offsetHeight;
        
        // Animate in
        modal.style.opacity = '1';
        modal.style.transform = 'translate(-50%, -50%) scale(1)';
    } else {
        alert(message); // Fallback
    }
}

export function initializeUIControls(viewer) {
  createModal(); // Buat modal saat UI diinisialisasi

  const raiseButton = document.getElementById("raiseGeoJsonButton");
  const rainControls = document.getElementById("rainControls");
  const applyRainButton = document.getElementById("applyRain");
  const cancelRainButton = document.getElementById("cancelRain");
  
  // Elemen untuk fitur tanggal
  const dateSelect = document.getElementById("dateSelect");
  const clearDateBtn = document.getElementById("clearDate");
  const dateHint = document.getElementById("dateHint");
  const rainInput = document.getElementById("rainInput");
  const durationInput = document.getElementById("rainDuration");

  // State untuk tracking panel visibility dan simulasi
  let isPanelOpen = false;
  let isSimulationRunning = false;
  let isAutoFilled = false; // Track apakah nilai diisi otomatis
  
  // Fungsi untuk update state tombol
  function updateButtonStates() {
    if (cancelRainButton) {
      cancelRainButton.disabled = !isSimulationRunning;
      if (isSimulationRunning) {
        cancelRainButton.classList.remove('disabled');
      } else {
        cancelRainButton.classList.add('disabled');
      }
    }
  }
  
  // Fungsi untuk update auto-fill indicator
  function updateAutoFillIndicator(filled) {
    isAutoFilled = filled;
    const rainGroup = rainInput?.closest('.input-group');
    const durationGroup = durationInput?.closest('.input-group');
    
    // Hapus badge lama jika ada
    document.querySelectorAll('.auto-badge').forEach(badge => badge.remove());
    
    if (filled) {
      rainGroup?.classList.add('auto-filled');
      durationGroup?.classList.add('auto-filled');
      
      // Tambah badge di bawah input (append ke input-group)
      if (rainGroup && !rainGroup.querySelector('.auto-badge')) {
        const badge = document.createElement('span');
        badge.className = 'auto-badge';
        badge.textContent = 'AUTO';
        rainGroup.appendChild(badge);
      }
      
      if (durationGroup && !durationGroup.querySelector('.auto-badge')) {
        const badge = document.createElement('span');
        badge.className = 'auto-badge';
        badge.textContent = 'AUTO';
        durationGroup.appendChild(badge);
      }
    } else {
      rainGroup?.classList.remove('auto-filled');
      durationGroup?.classList.remove('auto-filled');
    }
  }
  
  // Handler untuk perubahan tanggal (async - fetch dari API)
  async function handleDateChange() {
    const selectedDate = dateSelect?.value;
    
    if (!selectedDate) {
      // Tanggal dikosongkan
      dateSelect?.classList.remove('has-value');
      clearDateBtn?.classList.remove('visible');
      if (dateHint) {
        dateHint.textContent = 'Pilih tanggal untuk auto-fill dari data historis';
        dateHint.classList.remove('active', 'error', 'loading');
      }
      updateAutoFillIndicator(false);
      return;
    }
    
    // Tanggal dipilih - tambah class has-value untuk styling terang
    dateSelect?.classList.add('has-value');
    
    // Tampilkan tombol clear
    clearDateBtn?.classList.add('visible');
    
    // Tampilkan loading state
    if (dateHint) {
      dateHint.textContent = '⏳ Mengambil data...';
      dateHint.classList.add('loading');
      dateHint.classList.remove('active', 'error');
    }
    
    // Fetch data curah hujan dari API
    const rainfallInfo = await fetchHistoricalRainfall(selectedDate);
    
    if (rainfallInfo) {
      // Data ditemukan - auto-fill
      if (rainInput) rainInput.value = rainfallInfo.rainfall;
      if (durationInput) durationInput.value = rainfallInfo.duration;
      
      if (dateHint) {
        dateHint.textContent = `✓ Data ditemukan: ${rainfallInfo.rainfall}mm, ${rainfallInfo.duration}jam`;
        dateHint.classList.add('active');
        dateHint.classList.remove('error', 'loading');
      }
      
      updateAutoFillIndicator(true);
    } else {
      // Data tidak ditemukan
      if (dateHint) {
        dateHint.textContent = '⚠ Data tidak tersedia untuk tanggal ini, silakan input manual';
        dateHint.classList.add('error');
        dateHint.classList.remove('active', 'loading');
      }
      updateAutoFillIndicator(false);
    }
  }
  
  // Handler untuk clear tanggal
  function handleClearDate() {
    if (dateSelect) {
      dateSelect.value = '';
      handleDateChange(); // Reset state
    }
  }
  
  // Setup event listeners untuk date picker
  if (dateSelect) {
    dateSelect.addEventListener('change', handleDateChange);
  }
  
  if (clearDateBtn) {
    clearDateBtn.addEventListener('click', handleClearDate);
  }
  
  // Hapus auto-fill indicator jika user mengubah nilai manual
  if (rainInput) {
    rainInput.addEventListener('input', () => {
      if (isAutoFilled) {
        updateAutoFillIndicator(false);
        if (dateHint && dateSelect?.value) {
          dateHint.textContent = 'Nilai diubah manual';
          dateHint.classList.remove('active', 'error');
        }
      }
    });
  }
  
  if (durationInput) {
    durationInput.addEventListener('input', () => {
      if (isAutoFilled) {
        updateAutoFillIndicator(false);
        if (dateHint && dateSelect?.value) {
          dateHint.textContent = 'Nilai diubah manual';
          dateHint.classList.remove('active', 'error');
        }
      }
    });
  }
  
  // Set initial state
  updateButtonStates();

  if (raiseButton) {
    raiseButton.addEventListener("click", () => {
      // Toggle panel visibility
      if (isPanelOpen) {
        // Tutup panel dengan animasi fade out
        rainControls.style.opacity = "0";
        rainControls.style.transform = "translateY(-10px)";
        setTimeout(() => {
          rainControls.style.display = "none";
        }, 300);
        isPanelOpen = false;
        
        // Update button text untuk menunjukkan state
        raiseButton.innerHTML = `<ion-icon name="water-outline"></ion-icon> Simulasi Banjir`;
      } else {
        // Buka panel dengan animasi fade in
        rainControls.style.display = "block";
        rainControls.style.opacity = "0";
        rainControls.style.transform = "translateY(-10px)";
        
        // Force reflow untuk animasi
        rainControls.offsetHeight;
        
        rainControls.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        requestAnimationFrame(() => {
          rainControls.style.opacity = "1";
          rainControls.style.transform = "translateY(0)";
        });
        isPanelOpen = true;
        
        // Update button text untuk menunjukkan state
        raiseButton.innerHTML = `<ion-icon name="close-outline"></ion-icon> Tutup Panel`;
      }
    });
  }

  if (applyRainButton) {
    applyRainButton.addEventListener("click", () => {
      const rainMm = parseFloat(document.getElementById("rainInput").value);
      const durationInputHours = parseFloat(document.getElementById("rainDuration").value);

      if (isNaN(rainMm) || rainMm <= 0) {
        displayModalMessage("Masukkan curah hujan yang valid (lebih dari 0 mm).");
        return;
      }

      if (isNaN(durationInputHours) || durationInputHours <= 0) {
        displayModalMessage("Masukkan durasi hujan yang valid (lebih dari 0 jam).");
        return;
      }
      
      // Mulai simulasi banjir (sudah termasuk sinkronisasi waktu hujan)
      startFloodSimulation(viewer, rainMm, durationInputHours);
      
      // Update state simulasi
      isSimulationRunning = true;
      updateButtonStates();
      
      // Tutup panel dengan animasi
      rainControls.style.opacity = "0";
      rainControls.style.transform = "translateY(-10px)";
      setTimeout(() => {
        rainControls.style.display = "none";
      }, 300);
      isPanelOpen = false;
      
      // Reset button text
      raiseButton.innerHTML = `<ion-icon name="water-outline"></ion-icon> Simulasi Banjir`;
      
      // Cek apakah menggunakan data historis (tanggal dipilih)
      const selectedDate = dateSelect?.value;
      let modalDetail = `${rainMm} mm hujan selama ${durationInputHours} jam`;
      
      if (selectedDate) {
        // Format tanggal untuk tampilan (DD/MM/YYYY)
        const dateObj = new Date(selectedDate);
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        modalDetail = `Data kejadian: ${formattedDate}\n${rainMm} mm hujan selama ${durationInputHours} jam`;
      }
      
      displayModalMessage("Simulasi dimulai", modalDetail);
    });
  }

  if (cancelRainButton) {
    cancelRainButton.addEventListener("click", () => {
      // Jangan jalankan jika simulasi tidak berjalan
      if (!isSimulationRunning) return;
      
      stopFloodSimulation(viewer); // Sudah termasuk menghentikan efek hujan dan reset clock

      // Update state simulasi
      isSimulationRunning = false;
      updateButtonStates();

      // Tutup panel dengan animasi
      rainControls.style.opacity = "0";
      rainControls.style.transform = "translateY(-10px)";
      setTimeout(() => {
        rainControls.style.display = "none";
      }, 300);
      isPanelOpen = false;
      
      // Reset button text
      raiseButton.innerHTML = `<ion-icon name="water-outline"></ion-icon> Simulasi Banjir`;
      
      // Reset date picker dan auto-fill state
      handleClearDate();
      
      displayModalMessage("Simulasi dihentikan dan air direset ke ketinggian awal.");
    });
  }
}

// Fungsi reset water level sudah dipindahkan ke dataLoader.js sebagai resetWaterLevelToStatic()