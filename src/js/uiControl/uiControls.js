// src/js/uiControls.js
import * as Cesium from 'cesium'; // Mungkin tidak perlu Cesium di sini jika tidak ada interaksi langsung
import { defineRainEvent, cancelRainEvent } from '../simulationManager.js';
// Jika ingin ada reset level air dari UI, impor fungsi resetnya
// import { resetWaterLevel } from './dataLoader.js'; // atau dari mana pun Anda menempatkannya

function createModal() {
    if (document.getElementById('simpleModal')) return; 

    const modal = document.createElement('div');
    modal.id = 'simpleModal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1000';
    modal.style.left = '50%';
    modal.style.top = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = '300px';
    modal.style.padding = '20px';
    modal.style.backgroundColor = 'white';
    modal.style.border = '1px solid #ccc';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    modal.style.textAlign = 'center';

    const modalContent = document.createElement('p');
    modalContent.id = 'simpleModalText';
    modalContent.style.marginBottom = '20px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'OK';
    closeButton.style.padding = '10px 20px';
    closeButton.style.border = 'none';
    closeButton.style.backgroundColor = '#007bff';
    closeButton.style.color = 'white';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        modal.style.display = 'none';
    };

    modal.appendChild(modalContent);
    modal.appendChild(closeButton);
    document.body.appendChild(modal);
}

function displayModalMessage(message) {
    const modal = document.getElementById('simpleModal');
    const modalText = document.getElementById('simpleModalText');
    if (modal && modalText) {
        modalText.textContent = message;
        modal.style.display = 'block';
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

  if (raiseButton) {
    raiseButton.addEventListener("click", () => {
      rainControls.style.display = "block";
      raiseButton.disabled = true;
    });
  }

  if (applyRainButton) {
    applyRainButton.addEventListener("click", () => {
      const durationInputHours = parseFloat(document.getElementById("rainDuration").value);
      // const intensity = parseFloat(document.getElementById("rainIntensity").value); // Tidak digunakan

      if (isNaN(durationInputHours) || durationInputHours <= 0) {
        displayModalMessage("Masukkan durasi hujan yang valid (lebih dari 0 jam).");
        return;
      }
      
      defineRainEvent(viewer, durationInputHours);
      // Jika ingin mengaktifkan animasi air juga:
      // import { startWaterRiseAnimation } from './simulationManager.js';
      // startWaterRiseAnimation(viewer);
      
      rainControls.style.display = "none";
      raiseButton.disabled = false;
    });
  }

  if (cancelRainButton) {
    cancelRainButton.addEventListener("click", () => {
      cancelRainEvent(viewer);
      // Jika ingin membatalkan animasi air juga:
      // import { cancelWaterRiseAnimation } from './simulationManager.js';
      // cancelWaterRiseAnimation();

      rainControls.style.display = "none";
      raiseButton.disabled = false;
    });
  }
}

// Fungsi resetWaterLevel yang sebelumnya ada di kode global Anda.
// Ini mungkin lebih cocok di dataLoader.js atau dikelola oleh simulationManager.js
// jika berhubungan dengan state simulasi.
// Untuk saat ini, kita bisa definisikan di sini jika hanya untuk UI reset manual.
// Impor waterLevelEntities jika akan dimanipulasi di sini.
import { waterLevelEntities } from '../dataLoader.js';
const startHeightFromConfig = 29; // Sesuaikan dengan kebutuhan reset Anda

export function uiResetWaterLevel() { // Ganti nama agar tidak bentrok jika ada di tempat lain
    waterLevelEntities.forEach((entity) => {
        if (Cesium.defined(entity.polygon)) {
            entity.polygon.extrudedHeight = startHeightFromConfig; 
            entity.polygon.material = Cesium.Color.fromCssColorString("#00BFFF").withAlpha(0.7);
        }
    });
    console.log("Water level direset dari UI (jika fungsi ini dipanggil).");
}