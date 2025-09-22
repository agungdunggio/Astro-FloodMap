// src/js/uiControl/layerControls.js
import { switchAdminLayer, cleanupAllLayers } from '../dataLoader.js';

let layerPanelVisible = false;
let currentLayerType = 'kecamatan';
let isSwitching = false; // Prevent rapid switching

/**
 * Initialize layer controls UI
 * @param {Cesium.Viewer} viewer 
 */
export function initializeLayerControls(viewer) {
  // Create toggle button
  const toggleButton = createToggleButton();
  
  // Create layer control panel (initially hidden)
  const layerControlPanel = createLayerPanel(viewer);
  
  // Add to Cesium toolbar if available for horizontal alignment with Home button
  const toolbar = document.querySelector('.cesium-viewer-toolbar');
  if (toolbar) {
    toolbar.appendChild(toggleButton);
  } else {
    document.body.appendChild(toggleButton);
  }
  document.body.appendChild(layerControlPanel);

  // Add click outside listener
  document.addEventListener('click', handleClickOutside);

  // Initialize with kecamatan layer (default)
  switchAdminLayer(viewer, 'kecamatan');
}

/**
 * Create toggle button for layer controls
 * @returns {HTMLElement}
 */
function createToggleButton() {
  const button = document.createElement('button');
  button.id = 'layer-toggle-button';
  button.innerHTML = '<ion-icon name="map-sharp"></ion-icon>';
  button.title = 'Layer Administrasi';
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

  // Hover effects
  button.addEventListener('mouseenter', () => {
    button.style.filter = 'brightness(1.1)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.filter = 'none';
  });

  // Toggle panel visibility
  button.addEventListener('click', () => {
    toggleLayerPanel();
  });

  return button;
}

/**
 * Create layer control panel
 * @param {Cesium.Viewer} viewer 
 * @returns {HTMLElement}
 */
function createLayerPanel(viewer) {
  const panel = document.createElement('div');
  panel.id = 'layer-controls-panel';
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
    min-width: 200px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    display: none;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  `;

  // Create title
  const title = document.createElement('div');
  title.textContent = 'Layer Administrasi';
  title.style.cssText = `
    font-weight: bold;
    margin-bottom: 10px;
    color: #fff;
    border-bottom: 1px solid #555;
    padding-bottom: 5px;
  `;

  // Create radio buttons container
  const radioContainer = document.createElement('div');
  radioContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  // Create kecamatan option
  const kecamatanOption = createRadioOption('kecamatan', 'Kecamatan', true);
  const kelurahanOption = createRadioOption('kelurahan', 'Kelurahan', false);

  // Add event listeners with proper async handling and debouncing
  kecamatanOption.addEventListener('change', async (e) => {
    if (e.target.checked && !isSwitching) {
      await handleLayerSwitch(viewer, 'kecamatan', kecamatanOption, kelurahanOption);
    }
  });

  kelurahanOption.addEventListener('change', async (e) => {
    if (e.target.checked && !isSwitching) {
      await handleLayerSwitch(viewer, 'kelurahan', kelurahanOption, kecamatanOption);
    }
  });

  // Assemble the panel
  radioContainer.appendChild(kecamatanOption);
  radioContainer.appendChild(kelurahanOption);
  panel.appendChild(title);
  panel.appendChild(radioContainer);

  return panel;
}

/**
 * Handle layer switching with loading indicator and debouncing
 * @param {Cesium.Viewer} viewer 
 * @param {string} layerType 
 * @param {HTMLElement} selectedOption 
 * @param {HTMLElement} otherOption 
 */
async function handleLayerSwitch(viewer, layerType, selectedOption, otherOption) {
  if (isSwitching || currentLayerType === layerType) return;
  
  isSwitching = true;
  currentLayerType = layerType;
  
  // Show loading state
  const originalText = selectedOption.querySelector('span').textContent;
  selectedOption.querySelector('span').textContent = 'Loading...';
  selectedOption.style.opacity = '0.6';
  otherOption.style.pointerEvents = 'none';
  
  try {
    console.log(`Switching to ${layerType} layer...`);
    await switchAdminLayer(viewer, layerType);
    console.log(`Successfully switched to ${layerType} layer`);
  } catch (error) {
    console.error(`Failed to switch to ${layerType} layer:`, error);
    // Revert selection on error
    otherOption.querySelector('input').checked = true;
    currentLayerType = otherOption.querySelector('input').value;
  } finally {
    // Restore UI state
    selectedOption.querySelector('span').textContent = originalText;
    selectedOption.style.opacity = '1';
    otherOption.style.pointerEvents = 'auto';
    
    // Add small delay to prevent rapid switching
    setTimeout(() => {
      isSwitching = false;
    }, 500);
  }
}

/**
 * Toggle layer panel visibility
 */
function toggleLayerPanel() {
  const panel = document.getElementById('layer-controls-panel');
  const button = document.getElementById('layer-toggle-button');
  
  if (!panel || !button) return;

  layerPanelVisible = !layerPanelVisible;

  if (layerPanelVisible) {
    // Posisi panel tepat di bawah tombol layer
    const buttonRect = button.getBoundingClientRect();
    panel.style.top = Math.round(buttonRect.bottom + 10) + 'px';
    panel.style.right = Math.round(window.innerWidth - buttonRect.right) + 'px';
    panel.style.display = 'block';
    // Force reflow
    panel.offsetHeight;
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

/**
 * Create radio option element
 * @param {string} value 
 * @param {string} label 
 * @param {boolean} checked 
 * @returns {HTMLElement}
 */
function createRadioOption(value, label, checked) {
  const container = document.createElement('label');
  container.style.cssText = `
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: background-color 0.2s;
  `;

  container.addEventListener('mouseenter', () => {
    container.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  });

  container.addEventListener('mouseleave', () => {
    container.style.backgroundColor = 'transparent';
  });

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'adminLayer';
  radio.value = value;
  radio.checked = checked;
  radio.style.cssText = `
    margin-right: 8px;
    accent-color: #4CAF50;
  `;

  const labelText = document.createElement('span');
  labelText.textContent = label;
  labelText.style.cssText = `
    color: #fff;
    user-select: none;
  `;

  container.appendChild(radio);
  container.appendChild(labelText);

  return container;
}

/**
 * Remove layer controls from DOM
 * @param {Cesium.Viewer} viewer - Optional viewer for cleanup
 */
export function removeLayerControls(viewer = null) {
  const toggleButton = document.getElementById('layer-toggle-button');
  const layerPanel = document.getElementById('layer-controls-panel');
  
  if (toggleButton) {
    toggleButton.remove();
  }
  if (layerPanel) {
    layerPanel.remove();
  }
  
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside);
  
  // Clean up layers if viewer is provided
  if (viewer) {
    cleanupAllLayers(viewer);
  }
}

/**
 * Handle clicks outside the layer panel to close it
 * @param {Event} event 
 */
function handleClickOutside(event) {
  const panel = document.getElementById('layer-controls-panel');
  const button = document.getElementById('layer-toggle-button');
  
  if (panel && button && layerPanelVisible) {
    if (!panel.contains(event.target) && !button.contains(event.target)) {
      toggleLayerPanel();
    }
  }
}
