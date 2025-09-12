// src/js/components/lstmChart.js

/**
 * Professional chart component menggunakan Chart.js untuk LSTM prediction data
 */

// Load Chart.js dari CDN dengan optimasi
let chartInstance = null;
let tooltipEl = null;

// Debounce function untuk performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

let chartLibraryPromise = null;
let chartLibraryLoaded = false;

async function loadChartLibrary() {
  if (chartLibraryLoaded) return Promise.resolve();
  if (chartLibraryPromise) return chartLibraryPromise; // kalau sudah ada yang jalan, pakai yang sama

  chartLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
    script.onload = () => {
      chartLibraryLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return chartLibraryPromise;
}


// Cleanup function untuk memory management
function cleanupChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  if (tooltipEl) {
    tooltipEl.remove();
    tooltipEl = null;
  }
}

/**
 * Create professional bar chart menggunakan Chart.js
 * @param {HTMLElement} container - Container element
 * @param {Object} chartData - Chart data from formatPredictionForChart
 */
export async function createPredictionChart(container, chartData) {
  if (!container || !chartData.labels.length) {
    container.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6); text-align: center; padding: 20px;">Tidak ada data untuk ditampilkan</p>';
    return;
  }

  // Cleanup existing chart untuk memory management
  cleanupChart();

  try {
    // Load Chart.js library
    await loadChartLibrary();
  } catch (error) {
    // Fallback to simple chart
    createSimpleChart(container, chartData);
    return;
  }

  const { labels, values, metadata } = chartData;

  // Clear container dengan fade effect
  container.style.opacity = '0';
  setTimeout(() => {
    container.innerHTML = '';
    
    // Create compact chart header
    const header = document.createElement('div');
    header.className = 'chart-header';
    header.style.cssText = 'margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);';
    header.innerHTML = `
      <h4 style="color: white; font-weight: 600; margin: 0 0 8px 0; font-size: 1.1em; display: flex; align-items: center; gap: 8px;">
        <ion-icon name="bar-chart-outline" style="font-size: 1.2em;"></ion-icon>
        Prediksi ${metadata.totalDays} Hari
      </h4>
      <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.85em; color: rgba(255, 255, 255, 0.8);">
        <div style="display: flex; align-items: center; gap: 4px;">
          <ion-icon name="location-outline" style="font-size: 1em;"></ion-icon>
          <span>${metadata.location}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <ion-icon name="hardware-chip-outline" style="font-size: 1em;"></ion-icon>
          <span>${metadata.model}</span>
        </div>
      </div>
    `;
    container.appendChild(header);
    
    container.style.opacity = '1';
  }, 150);

  // Create compact canvas for Chart.js dengan horizontal scroll support
  setTimeout(() => {
    const chartWrapper = document.createElement('div');
    chartWrapper.style.cssText = `
      position: relative;
      margin-bottom: 16px;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.15) 0%, rgba(59, 130, 246, 0.03) 100%);
      border: 1px solid rgba(59, 130, 246, 0.15);
      border-radius: 12px;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    `;

    // Create scroll wrapper untuk chart yang bisa di-scroll
    const scrollWrapper = document.createElement('div');
    scrollWrapper.style.cssText = `
      width: 100%;
      height: 280px;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-behavior: smooth;
      padding: 0;
    `;

    const canvasContainer = document.createElement('div');
    // Jika data > 15, buat scrollable horizontal
    const isScrollable = labels.length > 15;
    const containerWidth = isScrollable ? `${Math.max(labels.length * 45, 800)}px` : '100%';
    
    canvasContainer.style.cssText = `
      position: relative;
      height: 100%;
      width: ${containerWidth};
      min-width: ${isScrollable ? containerWidth : '100%'};
      padding: 16px;
    `;
    
    // Add scroll wheel support untuk horizontal scroll
    if (isScrollable) {
      scrollWrapper.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          scrollWrapper.scrollLeft += e.deltaY;
        }
      }, { passive: false });
      
      // Add touch support untuk mobile
      let startX = 0;
      scrollWrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
      }, { passive: true });
      
      scrollWrapper.addEventListener('touchmove', (e) => {
        const currentX = e.touches[0].clientX;
        const diffX = startX - currentX;
        scrollWrapper.scrollLeft += diffX;
        startX = currentX;
        e.preventDefault();
      }, { passive: false });
    }
    
    if (isScrollable) {
      // Add scroll controls
      const scrollControls = document.createElement('div');
      scrollControls.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 4px;
        z-index: 10;
      `;
      
      const leftBtn = document.createElement('button');
      leftBtn.innerHTML = '‹';
      leftBtn.style.cssText = `
        background: rgba(59, 130, 246, 0.8);
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;
      
      const rightBtn = document.createElement('button');
      rightBtn.innerHTML = '›';
      rightBtn.style.cssText = leftBtn.style.cssText;
      
      // Add hover effects
      [leftBtn, rightBtn].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          btn.style.background = 'rgba(37, 99, 235, 0.9)';
          btn.style.transform = 'scale(1.1)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'rgba(59, 130, 246, 0.8)';
          btn.style.transform = 'scale(1)';
        });
      });
      
      // Add scroll functionality
      leftBtn.addEventListener('click', () => {
        scrollWrapper.scrollBy({ left: -200, behavior: 'smooth' });
      });
      
      rightBtn.addEventListener('click', () => {
        scrollWrapper.scrollBy({ left: 200, behavior: 'smooth' });
      });
      
      scrollControls.appendChild(leftBtn);
      scrollControls.appendChild(rightBtn);
      chartWrapper.appendChild(scrollControls);
      
      // Add scroll indicator dengan visual feedback
      const scrollIndicator = document.createElement('div');
      scrollIndicator.style.cssText = `
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(59, 130, 246, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7em;
        font-weight: 600;
        z-index: 10;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
      `;
      scrollIndicator.innerHTML = `📊 ${labels.length} hari • Swipe/Scroll →`;
      chartWrapper.appendChild(scrollIndicator);
      
      // Add scroll position feedback
      scrollWrapper.addEventListener('scroll', () => {
        const scrollPercentage = Math.round((scrollWrapper.scrollLeft / (scrollWrapper.scrollWidth - scrollWrapper.clientWidth)) * 100);
        scrollIndicator.innerHTML = `📊 ${labels.length} hari • ${scrollPercentage}%`;
      });
    }
    
    const canvas = document.createElement('canvas');
    canvas.id = 'predictionChart';
    canvasContainer.appendChild(canvas);
    
    // Assemble the structure
    if (isScrollable) {
      scrollWrapper.appendChild(canvasContainer);
      chartWrapper.appendChild(scrollWrapper);
    } else {
      chartWrapper.appendChild(canvasContainer);
    }
    
    container.appendChild(chartWrapper);
    
    // Initialize chart setelah DOM ready
    initializeChart(canvas, labels, values, metadata, container, isScrollable);
  }, 200);
}

// Separate chart initialization untuk performance
function initializeChart(canvas, labels, values, metadata, container, isScrollable = false) {

  // Destroy existing chart instance
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Create Chart.js chart
  const ctx = canvas.getContext('2d');
  
  // Create gradient untuk bars
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
  gradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.8)');
  gradient.addColorStop(1, 'rgba(147, 197, 253, 0.6)');

  const hoverGradient = ctx.createLinearGradient(0, 0, 0, 300);
  hoverGradient.addColorStop(0, 'rgba(37, 99, 235, 1)');
  hoverGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.9)');
  hoverGradient.addColorStop(1, 'rgba(96, 165, 250, 0.7)');

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: `Curah Hujan (${metadata.unit})`,
        data: values,
        backgroundColor: gradient,
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: hoverGradient,
        hoverBorderColor: 'rgba(37, 99, 235, 1)',
        hoverBorderWidth: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          right: isScrollable ? 5 : 10,
          bottom: 10,
          left: isScrollable ? 5 : 10
        }
      },
      plugins: {
        legend: {
          display: false // Hide legend untuk tampilan lebih clean
        },
        tooltip: {
          enabled: false,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#ffffff',
          bodyColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 2,
          cornerRadius: 12,
          displayColors: false,
          titleFont: {
            size: 13,
            weight: 'bold'
          },
          bodyFont: {
            size: 12,
            weight: '500'
          },
          padding: 12,
          external: debounce(function(context) {
            // Buat container custom kalau belum ada
            if (!tooltipEl) {
              tooltipEl = document.createElement('div');
              tooltipEl.id = 'chartjs-tooltip';
              tooltipEl.style.cssText = `
                position: absolute;
                pointer-events: none;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 10px 12px;
                border-radius: 8px;
                font-size: 12px;
                z-index: 9999;
                border: 1px solid rgba(59, 130, 246, 0.3);
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                transition: opacity 0.2s ease;
              `;
              document.body.appendChild(tooltipEl);
            }
    
            const tooltipModel = context.tooltip;
            if (tooltipModel.opacity === 0) {
              tooltipEl.style.opacity = '0';
              return;
            }
    
            // isi tooltip custom dengan optimasi
            if (tooltipModel.body && tooltipModel.dataPoints[0]) {
              const dataPoint = tooltipModel.dataPoints[0];
              const label = dataPoint.label;
              const value = parseFloat(dataPoint.parsed.y).toFixed(1);
              tooltipEl.innerHTML = `
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                  <ion-icon name="calendar-outline" style="font-size:14px;"></ion-icon> ${label}
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <ion-icon name="water-outline" style="font-size:14px;color:#60a5fa;"></ion-icon> ${value} mm
                </div>
              `;
            }
    
            const position = context.chart.canvas.getBoundingClientRect();
            tooltipEl.style.opacity = '1';
            tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
            tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY - 60 + 'px';
          }, 50),
          // callbacks: {
          //   title: function(context) {
          //     return `📅 ${context[0].label}`;
          //   },
          //   label: function(context) {
          //     return `💧 ${context.parsed.y.toFixed(1)} ${metadata.unit}`;
          //   },
          //   afterLabel: function(context) {
          //     const total = context.dataset.data.reduce((a, b) => a + b, 0);
          //     const percentage = ((context.parsed.y / total) * 100).toFixed(1);
          //     return `📊 ${percentage}% dari total`;
          //   }
          // }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: isScrollable ? 9 : 10,
              weight: '500'
            },
            maxRotation: isScrollable ? 0 : 45,
            minRotation: 0,
            maxTicksLimit: isScrollable ? undefined : 15
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.08)',
            drawBorder: false,
            lineWidth: 1
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 10,
              weight: '500'
            },
            callback: function(value) {
              return value.toFixed(1) + ' mm';
            },
            stepSize: Math.max(...values) / 5 // Dynamic step size
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.08)',
            drawBorder: false,
            lineWidth: 1
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
        delay: (context) => {
          return context.dataIndex * 50; // Faster staggered animation
        }
      },
      onHover: debounce((event, activeElements) => {
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }, 100)
    }
  });

  // Create summary stats
  createSummaryStats(container, values, metadata);
}

/**
 * Create summary statistics section
 */
function createSummaryStats(container, values, metadata) {
  const summary = calculateSummary(values);
  const summaryContainer = document.createElement('div');
  summaryContainer.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  `;
  
  const stats = [
    { label: 'Total', value: summary.total, icon: 'bar-chart-outline', color: '#3b82f6', bgColor: '#1e40af20' },
    { label: 'Rata-rata', value: summary.avg, icon: 'trending-up-outline', color: '#10b981', bgColor: '#047857-20' },
    { label: 'Maksimal', value: summary.max, icon: 'arrow-up-outline', color: '#f59e0b', bgColor: '#d97706-20' },
    { label: 'Minimal', value: summary.min, icon: 'arrow-down-outline', color: '#ef4444', bgColor: '#dc2626-20' }
  ];
  
  stats.forEach(stat => {
    const statDiv = document.createElement('div');
    statDiv.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s ease;
    `;
    
    statDiv.innerHTML = `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: linear-gradient(135deg, ${stat.color}25, ${stat.color}08);
        border: 1px solid ${stat.color}30;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${stat.color};
        font-size: 1.1em;
        box-shadow: 0 2px 8px ${stat.color}15;
      ">
        <ion-icon name="${stat.icon}"></ion-icon>
      </div>
      <div style="flex: 1;">
        <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.75em; margin-bottom: 2px; font-weight: 500;">
          ${stat.label}
        </div>
        <div style="color: white; font-weight: 600; font-size: 1em; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
          ${stat.value.toFixed(1)} ${metadata.unit}
        </div>
      </div>
    `;
    
    // Add hover effect
    statDiv.addEventListener('mouseenter', () => {
      statDiv.style.background = 'rgba(255, 255, 255, 0.1)';
      statDiv.style.transform = 'translateY(-3px)';
      statDiv.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.4)';
      statDiv.style.borderColor = `rgba(${stat.color.slice(1)}, 0.4)`;
    });
    
    statDiv.addEventListener('mouseleave', () => {
      statDiv.style.background = 'rgba(255, 255, 255, 0.05)';
      statDiv.style.transform = 'translateY(0)';
      statDiv.style.boxShadow = 'none';
      statDiv.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });
    
    summaryContainer.appendChild(statDiv);
  });
  
  container.appendChild(summaryContainer);
}

/**
 * Fallback simple chart jika Chart.js gagal dimuat
 */
function createSimpleChart(container, chartData) {
  const { labels, values, metadata } = chartData;
  const maxValue = Math.max(...values);

  container.innerHTML = '';

  // Simple header
  const header = document.createElement('div');
  header.innerHTML = `
    <h4 style="color: white; margin-bottom: 16px;">📊 Prediksi Curah Hujan ${metadata.totalDays} Hari</h4>
    <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 20px;">
      📍 ${metadata.location} | 📏 ${metadata.unit} | 🤖 ${metadata.model}
    </p>
  `;
  container.appendChild(header);

  // Simple bars
  const chartContainer = document.createElement('div');
  chartContainer.style.cssText = `
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 200px;
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  `;

  values.forEach((value, index) => {
    const barHeight = maxValue > 0 ? Math.max(5, (value / maxValue) * 150) : 5;
    
    const bar = document.createElement('div');
    bar.style.cssText = `
      flex: 1;
      height: ${barHeight}px;
      background: linear-gradient(to top, #2563eb, #60a5fa);
      border-radius: 4px 4px 0 0;
      margin: 0 1px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    bar.title = `${labels[index]}: ${value.toFixed(1)} ${metadata.unit}`;
    
    chartContainer.appendChild(bar);
  });

  container.appendChild(chartContainer);
  createSummaryStats(container, values, metadata);
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
    </div>
  `;
}
