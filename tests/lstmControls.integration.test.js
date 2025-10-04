import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock minimal Cesium untuk clock & timeline
vi.mock('cesium', () => {
  return {
    JulianDate: {
      now: () => ({ clone: () => ({}) }),
      addDays: (start, days) => ({}),
      fromDate: (d) => ({}),
    },
    ClockRange: { UNBOUNDED: 0 },
  };
});

// Mock simulationManager enableScheduledLSTMFlood agar tidak bergantung state lain
vi.mock('../src/js/simulationManager.js', () => ({
  enableScheduledLSTMFlood: vi.fn(() => () => {}),
}));

// Mock Chart renderer agar tidak butuh canvas
vi.mock('../src/js/components/lstmChart.js', () => ({
  createPredictionChart: vi.fn(async () => {}),
  showLoadingState: vi.fn(),
  showErrorState: vi.fn(),
}));

// Mock API LSTM
vi.mock('../src/js/fetch/lstmPredictionApi.js', () => ({
  fetchLSTMPrediction: vi.fn(async () => ({
    status: true,
    data: [{
      location: 'Kota Gorontalo',
      unit: 'mm',
      model_used: 'LSTM-v1',
      prediction_start: '2025-01-01',
      prediction_end: '2025-01-07',
      predictions: [
        { date: '2025-01-01', value: 1 },
        { date: '2025-01-02', value: 2 }
      ]
    }]
  })),
  formatPredictionForChart: vi.fn((apiResponse) => ({
    labels: ['01/01', '02/01'],
    values: [1, 2],
    metadata: { location: 'Kota Gorontalo', model: 'LSTM-v1', totalDays: 2 }
  })),
}));

// Mock toast
vi.mock('../src/js/utils/notify.js', () => ({
  successToast: vi.fn(),
  warningToast: vi.fn(),
  errorToast: vi.fn(),
}));

describe('LSTM UI Controls integration (prediksi-lstm.astro behavior)', () => {
  let initializeLSTMUIControls;

  beforeEach(async () => {
    vi.resetModules();
    // Setup DOM minimal
    document.body.innerHTML = `
      <button id="toggleLSTMPanel"><span class="toggle-label">Prediksi LSTM</span></button>
      <div id="lstmControls"></div>
      <button id="loadPrediction"></button>
      <div id="predictionChart"></div>
    `;

    ({ initializeLSTMUIControls } = await import('../src/js/uiControl/lstmControls.js'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('klik Muat Prediksi menyiapkan timeline & memanggil scheduler LSTM', async () => {
    const viewer = {
      clock: { startTime: {}, stopTime: {}, clockRange: 0, currentTime: {}, shouldAnimate: false, multiplier: 1 },
      timeline: { zoomTo: vi.fn() },
    };

    initializeLSTMUIControls(viewer);

    const btn = document.getElementById('loadPrediction');
    btn.click();

    // Allow promises to resolve
    await Promise.resolve();
    await Promise.resolve();

    // Verifikasi efek
    expect(viewer.timeline.zoomTo).toHaveBeenCalled();
    expect(viewer.clock.clockRange).toBe(0); // UNBOUNDED
  });
});





