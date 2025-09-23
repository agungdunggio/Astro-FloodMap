// src/js/uiControl/floodLogControls.js

import { PANEL_OFFSET } from '../../constants/uiConstants.js';

let logPanelVisible = false;
let tableBodyEl = null;

export function initializeFloodLogControls(_viewer) {
  const toggleButton = createToggleButton();
  const logPanel = createLogPanel();

  const toolbar = document.querySelector('.cesium-viewer-toolbar');
  if (toolbar) {
    toolbar.appendChild(toggleButton);
  } else {
    document.body.appendChild(toggleButton);
  }
  document.body.appendChild(logPanel);

  // Listen events from simulation manager
  window.addEventListener('floodStartLog', (e) => {
    const d = e.detail || {};
    appendLogRow(d);
  });

  document.addEventListener('click', handleClickOutside);
}

function createToggleButton() {
  const button = document.createElement('button');
  button.id = 'floodlog-toggle-button';
  button.innerHTML = '<ion-icon name="reader-outline"></ion-icon>';
  button.title = 'Log Simulasi Banjir';
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
  button.addEventListener('mouseenter', () => { button.style.filter = 'brightness(1.1)'; });
  button.addEventListener('mouseleave', () => { button.style.filter = 'none'; });
  button.addEventListener('click', () => { toggleLogPanel(); });
  return button;
}

function createLogPanel() {
  const panel = document.createElement('div');
  panel.id = 'floodlog-panel';
  panel.style.cssText = `
    position: absolute;
    top: 0px;
    right: 0px;
    background: rgba(42, 42, 42, 0.95);
    border: 1px solid #444;
    border-radius: 8px;
    padding: 12px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 13px;
    z-index: 1000;
    min-width: 520px;
    max-width: 70vw;
    max-height: 60vh;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    display: none;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  `;

  const title = document.createElement('div');
  title.textContent = 'Log Start Simulasi Per Kecamatan';
  title.style.cssText = `
    font-weight: bold;
    margin-bottom: 8px;
    border-bottom: 1px solid #555;
    padding-bottom: 6px;
  `;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    overflow: auto;
    max-height: 48vh;
    border-radius: 6px;
    border: 1px solid #555;
    background: rgba(20,20,20,0.35);
  `;

  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
  `;

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background:#303030;">
      <th style="padding:6px;border-bottom:1px solid #555;text-align:left;">Jam</th>
      <th style="padding:6px;border-bottom:1px solid #555;text-align:left;">Kecamatan</th>
      <th style="padding:6px;border-bottom:1px solid #555;text-align:right;">maxMm</th>
      <th style="padding:6px;border-bottom:1px solid #555;text-align:right;">Base Height (m)</th>
      <th style="padding:6px;border-bottom:1px solid #555;text-align:right;">rise/M (m)</th>
      <th style="padding:6px;border-bottom:1px solid #555;text-align:right;">rise/Cm (cm)</th>
      <th style="padding:6px;border-bottom:1px solid #555;text-align:right;">New Base Height (m)</th>
      <th style="padding:6px;border-bottom:1px solid #555;text-align:right;">Durasi (jam)</th>
    </tr>
  `;

  tableBodyEl = document.createElement('tbody');

  table.appendChild(thead);
  table.appendChild(tableBodyEl);
  wrapper.appendChild(table);

  // Actions
  const actionRow = document.createElement('div');
  actionRow.style.cssText = 'margin-top:8px; display:flex; gap:8px; justify-content:flex-end;';
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear Log';
  clearBtn.className = 'cesium-button';
  clearBtn.addEventListener('click', () => { if (tableBodyEl) tableBodyEl.innerHTML = ''; });
  actionRow.appendChild(clearBtn);

  panel.appendChild(title);
  panel.appendChild(wrapper);
  panel.appendChild(actionRow);
  return panel;
}

function appendLogRow({ timestampIso, name, maxMm, baseHeight, riseM, riseCm, hBaru, durationHours }) {
  if (!tableBodyEl) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="padding:6px;border-bottom:1px solid #444;">${formatTime(timestampIso)}</td>
    <td style="padding:6px;border-bottom:1px solid #444;">${name}</td>
    <td style="padding:6px;border-bottom:1px solid #444;text-align:right;">${Number(maxMm).toFixed(2)}</td>
    <td style="padding:6px;border-bottom:1px solid #444;text-align:right;">${Number(baseHeight).toFixed(2)}</td>
    <td style="padding:6px;border-bottom:1px solid #444;text-align:right;">${Number(riseM).toFixed(5)}</td>
    <td style="padding:6px;border-bottom:1px solid #444;text-align:right;">${Number(riseCm).toFixed(2)}</td>
    <td style="padding:6px;border-bottom:1px solid #444;text-align:right;">${Number(hBaru).toFixed(5)}</td>
    <td style="padding:6px;border-bottom:1px solid #444;text-align:right;">${Number(durationHours).toFixed(2)}</td>
  `;
  tableBodyEl.appendChild(tr);
}

function formatTime(ts) {
  try {
    const d = ts ? new Date(ts) : new Date();
    return d.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}

function toggleLogPanel() {
  const panel = document.getElementById('floodlog-panel');
  const button = document.getElementById('floodlog-toggle-button');
  if (!panel || !button) return;

  logPanelVisible = !logPanelVisible;
  if (logPanelVisible) {
    const rect = button.getBoundingClientRect();
    panel.style.top = Math.round(rect.bottom + PANEL_OFFSET) + 'px';
    panel.style.right = Math.round(window.innerWidth - rect.right) + 'px';
    panel.style.display = 'block';
    panel.offsetHeight;
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
    button.style.outline = '2px solid rgba(76, 175, 80, 0.9)';
  } else {
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(-10px)';
    button.style.outline = 'none';
    setTimeout(() => { panel.style.display = 'none'; }, 300);
  }
}

function handleClickOutside(event) {
  const panel = document.getElementById('floodlog-panel');
  const button = document.getElementById('floodlog-toggle-button');
  if (panel && button && logPanelVisible) {
    if (!panel.contains(event.target) && !button.contains(event.target)) {
      toggleLogPanel();
    }
  }
}

export function removeFloodLogControls() {
  const toggleButton = document.getElementById('floodlog-toggle-button');
  const panel = document.getElementById('floodlog-panel');
  if (toggleButton) toggleButton.remove();
  if (panel) panel.remove();
  document.removeEventListener('click', handleClickOutside);
}


