// src/js/utils/uiUtils.js
/**
 * Toggle loading indicator for UI elements.
 * @param {boolean} show - Show or hide the loading indicator.
 */
export function toggleLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
    const btnText = document.querySelector('#openForecastBtn .btn-text');
    const btnIcon = document.querySelector('#openForecastBtn .btn-icon');
    const btn = document.getElementById('openForecastBtn');
  
    if (indicator && btn && btnText && btnIcon) {
      indicator.classList.toggle('hidden', !show);
      btn.classList.toggle('loading', show);
      btn.disabled = show;
    }
  }