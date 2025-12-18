import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock simulationManager agar kita bisa assert pemanggilan fungsi
vi.mock('../src/js/simulationManager.js', () => ({
  startFloodSimulation: vi.fn(),
  stopFloodSimulation: vi.fn(),
}));

describe('Simulasi Banjir - UI (simulasi-banjir.astro) via initializeUIControls', () => {
  let initializeUIControls;
  let simMgr;

  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = `
      <div id="cesiumContainer"></div>
      <button id="raiseGeoJsonButton"></button>
      <div id="rainControls" style="display: none;">
        <div class="input-row">
          <div class="input-group">
            <input type="number" id="rainInput" />
          </div>
          <div class="input-group">
            <input type="number" id="rainDuration" />
          </div>
        </div>
        <div class="button-row">
          <button id="applyRain"></button>
          <button id="cancelRain"></button>
        </div>
      </div>
    `;

    // Import modul setelah DOM siap
    ({ initializeUIControls } = await import('../src/js/uiControl/uiControls.js'));
    simMgr = await import('../src/js/simulationManager.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  function createViewerMock() {
    return {
      clock: { startTime: {}, stopTime: {}, currentTime: {}, multiplier: 1, shouldAnimate: false, clockRange: 0 },
      timeline: { zoomTo: vi.fn() },
      scene: {},
    };
  }

  it('klik tombol Simulasi Banjir membuka panel kontrol', () => {
    const viewer = createViewerMock();
    initializeUIControls(viewer);

    const toggleBtn = document.getElementById('raiseGeoJsonButton');
    const panel = document.getElementById('rainControls');
    expect(panel.style.display).toBe(''); // belum diset ("") saat awal di kode

    toggleBtn.click();

    // Setelah animasi, panel ditampilkan (display di-set ke block)
    expect(panel.style.display).toBe('block');
  });

  it('klik Muat Simulasi memanggil startFloodSimulation dengan nilai input', async () => {
    const viewer = createViewerMock();
    initializeUIControls(viewer);

    // Buka panel
    document.getElementById('raiseGeoJsonButton').click();

    // Isi input
    const rainInput = document.getElementById('rainInput');
    const rainDuration = document.getElementById('rainDuration');
    rainInput.value = '50';
    rainDuration.value = '6';

    // Klik apply
    document.getElementById('applyRain').click();

    // Biarkan event queue jalan
    await Promise.resolve();

    expect(simMgr.startFloodSimulation).toHaveBeenCalledWith(viewer, 50, 6);
  });

  it('klik Hentikan memanggil stopFloodSimulation', async () => {
    const viewer = createViewerMock();
    initializeUIControls(viewer);

    // Buka panel dan set input valid lalu klik apply agar state simulasi running
    document.getElementById('raiseGeoJsonButton').click();
    document.getElementById('rainInput').value = '10';
    document.getElementById('rainDuration').value = '2';
    document.getElementById('applyRain').click();
    await Promise.resolve();

    // Klik cancel
    document.getElementById('cancelRain').click();
    expect(simMgr.stopFloodSimulation).toHaveBeenCalledWith(viewer);
  });

  it('validasi input: tidak memanggil startFloodSimulation jika nilai tidak valid', async () => {
    const viewer = createViewerMock();
    initializeUIControls(viewer);

    document.getElementById('raiseGeoJsonButton').click();
    document.getElementById('rainInput').value = '0'; // invalid
    document.getElementById('rainDuration').value = '2';

    document.getElementById('applyRain').click();
    await Promise.resolve();

    expect(simMgr.startFloodSimulation).not.toHaveBeenCalled();
  });
});





