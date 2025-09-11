// src/js/components/lstmChart.js

/**
 * Simple chart component untuk LSTM prediction data
 */

/**
 * Create simple bar chart
 * @param {HTMLElement} container - Container element
 * @param {Object} chartData - Chart data from formatPredictionForChart
 */
export function createPredictionChart(container, chartData) {
  if (!container || !chartData.labels.length) {
    container.innerHTML = '<p class="text-center text-gray-400">Tidak ada data untuk ditampilkan</p>';
    return;
  }

  const { labels, values, metadata } = chartData;
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  // Clear container
  container.innerHTML = '';

  // Create chart header
  const header = document.createElement('div');
  header.className = 'chart-header';
  header.style.cssText = 'margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);';
  header.innerHTML = `
    <h4 style="color: white; font-weight: 600; margin: 0 0 8px 0; font-size: 1.1em;">📊 Prediksi Curah Hujan ${metadata.totalDays} Hari</h4>
    <div style="font-size: 0.85em; color: rgba(255, 255, 255, 0.7); line-height: 1.4;">
      <div style="margin-bottom: 4px;">📍 ${metadata.location}</div>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <span>📏 ${metadata.unit}</span>
        <span>🤖 ${metadata.model}</span>
      </div>
    </div>
  `;
  container.appendChild(header);

  // Create chart container
  const chartContainer = document.createElement('div');
  chartContainer.style.cssText = `
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 2px;
    height: 150px;
    margin-bottom: 16px;
    padding: 0 4px;
    overflow-x: auto;
  `;

  // Create bars
  values.forEach((value, index) => {
    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      min-width: 20px;
      position: relative;
    `;

    // Calculate bar height (minimum 3px for zero values)
    const barHeight = maxValue > 0 ? Math.max(3, (value / maxValue) * 120) : 3;
    
    // Create value label (above bar)
    const valueLabel = document.createElement('div');
    valueLabel.style.cssText = `
      font-size: 10px;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 4px;
      text-align: center;
      font-weight: 500;
      min-height: 12px;
    `;
    valueLabel.textContent = value.toFixed(1);
    
    // Create bar
    const bar = document.createElement('div');
    bar.style.cssText = `
      background: linear-gradient(to top, #2563eb, #60a5fa);
      border-radius: 4px 4px 0 0;
      width: 100%;
      min-width: 12px;
      height: ${barHeight}px;
      transition: all 0.3s ease;
      cursor: pointer;
      border: 1px solid rgba(59, 130, 246, 0.3);
    `;
    bar.title = `${labels[index]}: ${value.toFixed(1)} ${metadata.unit}`;

    // Add hover effect
    bar.addEventListener('mouseenter', () => {
      bar.style.background = 'linear-gradient(to top, #1d4ed8, #3b82f6)';
      bar.style.transform = 'scaleY(1.05)';
    });
    bar.addEventListener('mouseleave', () => {
      bar.style.background = 'linear-gradient(to top, #2563eb, #60a5fa)';
      bar.style.transform = 'scaleY(1)';
    });

    // Create label (below bar)
    const label = document.createElement('div');
    label.style.cssText = `
      font-size: 9px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 6px;
      text-align: center;
      transform: rotate(-45deg);
      transform-origin: center;
      white-space: nowrap;
      min-height: 14px;
    `;
    label.textContent = labels[index];

    barContainer.appendChild(valueLabel);
    barContainer.appendChild(bar);
    barContainer.appendChild(label);
    chartContainer.appendChild(barContainer);
  });

  container.appendChild(chartContainer);

  // Create summary stats
  const summary = calculateSummary(values);
  const summaryContainer = document.createElement('div');
  summaryContainer.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    font-size: 0.85em;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  `;
  
  const stats = [
    { label: 'Total', value: summary.total, icon: '📊' },
    { label: 'Rata-rata', value: summary.avg, icon: '📈' },
    { label: 'Maksimal', value: summary.max, icon: '⬆️' },
    { label: 'Minimal', value: summary.min, icon: '⬇️' }
  ];
  
  stats.forEach(stat => {
    const statDiv = document.createElement('div');
    statDiv.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    `;
    statDiv.innerHTML = `
      <span style="color: rgba(255, 255, 255, 0.7);">${stat.icon} ${stat.label}:</span>
      <span style="color: white; font-weight: 600;">${stat.value.toFixed(1)} ${metadata.unit}</span>
    `;
    summaryContainer.appendChild(statDiv);
  });
  
  container.appendChild(summaryContainer);
}

/**
 * Calculate summary statistics
 * @param {Array} values - Array of numeric values
 * @returns {Object} Summary statistics
 */
function calculateSummary(values) {
  if (!values.length) return { total: 0, avg: 0, max: 0, min: 0 };

  return {
    total: values.reduce((a, b) => a + b, 0),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    max: Math.max(...values),
    min: Math.min(...values)
  };
}

/**
 * Show loading state
 * @param {HTMLElement} container - Container element
 */
export function showLoadingState(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; text-align: center;">
      <div style="margin-bottom: 16px;">
        <div style="
          width: 32px; 
          height: 32px; 
          border: 3px solid rgba(255, 255, 255, 0.3); 
          border-top: 3px solid white; 
          border-radius: 50%; 
          animation: spin 1s linear infinite;
        "></div>
      </div>
      <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 0.9em;">🧠 Memuat prediksi LSTM...</p>
      <p style="color: rgba(255, 255, 255, 0.6); margin: 8px 0 0 0; font-size: 0.8em;">Mohon tunggu sebentar</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
}

/**
 * Show error state
 * @param {HTMLElement} container - Container element
 * @param {string} errorMessage - Error message to display
 */
export function showErrorState(container, errorMessage) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; text-align: center;">
      <div style="font-size: 2rem; margin-bottom: 16px; opacity: 0.8;">⚠️</div>
      <p style="color: rgba(239, 68, 68, 0.9); text-align: center; margin: 0 0 16px 0; font-size: 0.9em; line-height: 1.4;">
        ${errorMessage || 'Gagal memuat data prediksi'}
      </p>
      <p style="color: rgba(255, 255, 255, 0.6); text-align: center; margin: 0 0 20px 0; font-size: 0.8em;">
        Silakan periksa koneksi internet dan coba lagi
      </p>
      <button id="retryPrediction" style="
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9em;
        font-weight: 500;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
      " onmouseover="this.style.background='linear-gradient(135deg, #b91c1c, #991b1b)'; this.style.transform='translateY(-1px)';" onmouseout="this.style.background='linear-gradient(135deg, #dc2626, #b91c1c)'; this.style.transform='translateY(0)';">
        🔄 Coba Lagi
      </button>
    </div>
  `;
}
