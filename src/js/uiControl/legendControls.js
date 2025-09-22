// src/js/uiControl/legendControls.js
import { WATER_COLOR_LEGEND } from '../utils/colorUtils.js';
import { DEFAULT_COLOR } from '../../constants/color.js';

let legendPanelVisible = false;

/**
 * Inisialisasi Legend warna ketinggian air
 * Mengikuti gaya dan pola interaksi seperti `layerControls`
 * @param {Cesium.Viewer} _viewer
 */
export function initializeLegendControls(_viewer) {
  const toggleButton = createToggleButton();
  const legendPanel = createLegendPanel();

  const toolbar = document.querySelector('.cesium-viewer-toolbar');
  if (toolbar) {
    toolbar.appendChild(toggleButton);
  } else {
    document.body.appendChild(toggleButton);
  }
  document.body.appendChild(legendPanel);

  document.addEventListener('click', handleClickOutside);
}

function createToggleButton() {
  const button = document.createElement('button');
  button.id = 'legend-toggle-button';
  button.innerHTML = '<ion-icon name="water-outline"></ion-icon>';
  button.title = 'Kedalaman Air';
  button.className = 'cesium-button cesium-toolbar-button';
  button.style.cssText = `
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 6px;
    font-size: 16px;
    border-radius: 6px;
  `;

  // Hover subtle effect (biarkan style toolbar yang utama)
  button.addEventListener('mouseenter', () => {
    button.style.filter = 'brightness(1.1)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.filter = 'none';
  });

  button.addEventListener('click', () => {
    toggleLegendPanel();
  });

  return button;
}

function createLegendPanel() {
  const panel = document.createElement('div');
  panel.id = 'legend-controls-panel';
  panel.style.cssText = `
    position: absolute;
    top: 0px;
    right: 0px;
    background: rgba(42, 42, 42, 0.95);
    border: 1px solid #444;
    border-radius: 8px;
    padding: 15px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 1000;
    min-width: 220px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    display: none;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  `;

  const title = document.createElement('div');
  title.textContent = 'Legenda Kedalaman Air';
  title.style.cssText = `
    font-weight: bold;
    margin-bottom: 10px;
    color: #fff;
    border-bottom: 1px solid #555;
    padding-bottom: 5px;
  `;

  const list = document.createElement('div');
  list.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  WATER_COLOR_LEGEND.forEach(({ range, color }) => {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const swatch = document.createElement('span');
    swatch.style.cssText = `
      width: 22px;
      height: 14px;
      border-radius: 3px;
      border: 1px solid #666;
      display: inline-block;
      background: ${color.toCssColorString ? color.toCssColorString() : DEFAULT_COLOR};
    `;

    const label = document.createElement('span');
    label.textContent = range;
    label.style.cssText = `
      color: #fff;
      user-select: none;
    `;

    row.appendChild(swatch);
    row.appendChild(label);
    list.appendChild(row);
  });

  const note = document.createElement('div');
  note.textContent = 'Warna menyesuaikan kedalaman (meter) saat simulasi berjalan.';
  note.style.cssText = `
    margin-top: 10px;
    color: #ccc;
    font-size: 12px;
  `;

  panel.appendChild(title);
  panel.appendChild(list);
  panel.appendChild(note);

  return panel;
}

function toggleLegendPanel() {
  const panel = document.getElementById('legend-controls-panel');
  const button = document.getElementById('legend-toggle-button');

  if (!panel || !button) return;

  legendPanelVisible = !legendPanelVisible;

  if (legendPanelVisible) {
    // Posisi panel tepat di bawah tombol legend
    const buttonRect = button.getBoundingClientRect();
    panel.style.top = Math.round(buttonRect.bottom + 10) + 'px';
    panel.style.right = Math.round(window.innerWidth - buttonRect.right) + 'px';
    panel.style.display = 'block';
    panel.offsetHeight; // force reflow
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
    button.style.outline = '2px solid rgba(76, 175, 80, 0.9)';
  } else {
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(-10px)';
    button.style.outline = 'none';
    setTimeout(() => {
      panel.style.display = 'none';
    }, 300);
  }
}

function handleClickOutside(event) {
  const panel = document.getElementById('legend-controls-panel');
  const button = document.getElementById('legend-toggle-button');

  if (panel && button && legendPanelVisible) {
    if (!panel.contains(event.target) && !button.contains(event.target)) {
      toggleLegendPanel();
    }
  }
}

export function removeLegendControls() {
  const toggleButton = document.getElementById('legend-toggle-button');
  const legendPanel = document.getElementById('legend-controls-panel');

  if (toggleButton) toggleButton.remove();
  if (legendPanel) legendPanel.remove();

  document.removeEventListener('click', handleClickOutside);
}


