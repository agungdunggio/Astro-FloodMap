// src/js/uiControls.js
import * as Cesium from 'cesium'; // Mungkin tidak perlu Cesium di sini jika tidak ada interaksi langsung
import { startFloodSimulation, stopFloodSimulation } from '../simulationManager.js';

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

  // State untuk tracking panel visibility
  let isPanelOpen = false;

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
      
      // Tutup panel dengan animasi
      rainControls.style.opacity = "0";
      rainControls.style.transform = "translateY(-10px)";
      setTimeout(() => {
        rainControls.style.display = "none";
      }, 300);
      isPanelOpen = false;
      
      // Reset button text
      raiseButton.innerHTML = `<ion-icon name="water-outline"></ion-icon> Simulasi Banjir`;
      
      displayModalMessage(
        "Simulasi dimulai",
        `${rainMm} mm hujan selama ${durationInputHours} jam`
      );
    });
  }

  if (cancelRainButton) {
    cancelRainButton.addEventListener("click", () => {
      stopFloodSimulation(viewer); // Sudah termasuk menghentikan efek hujan dan reset clock

      // Tutup panel dengan animasi
      rainControls.style.opacity = "0";
      rainControls.style.transform = "translateY(-10px)";
      setTimeout(() => {
        rainControls.style.display = "none";
      }, 300);
      isPanelOpen = false;
      
      // Reset button text
      raiseButton.innerHTML = `<ion-icon name="water-outline"></ion-icon> Simulasi Banjir`;
      
      displayModalMessage("Simulasi dihentikan dan air direset ke ketinggian awal.");
    });
  }
}

// Fungsi reset water level sudah dipindahkan ke dataLoader.js sebagai resetWaterLevelToStatic()