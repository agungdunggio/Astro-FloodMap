// src/js/uiControls.js
import * as Cesium from 'cesium'; // Mungkin tidak perlu Cesium di sini jika tidak ada interaksi langsung
import { startFloodSimulation, stopFloodSimulation } from '../simulationManager.js';

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
      
      rainControls.style.display = "none";
      raiseButton.disabled = false;
      
      displayModalMessage(`Simulasi dimulai: ${rainMm}mm hujan selama ${durationInputHours} jam`);
    });
  }

  if (cancelRainButton) {
    cancelRainButton.addEventListener("click", () => {
      stopFloodSimulation(viewer); // Sudah termasuk menghentikan efek hujan dan reset clock

      rainControls.style.display = "none";
      raiseButton.disabled = false;
      
      displayModalMessage("Simulasi dihentikan dan air direset ke ketinggian awal.");
    });
  }
}

// Fungsi reset water level sudah dipindahkan ke dataLoader.js sebagai resetWaterLevelToStatic()