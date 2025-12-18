import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('LSTM Prediction API (mocked)', () => {
  let moduleRef;

  beforeEach(async () => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchLSTMPrediction mengembalikan data saat sukses (status true)', async () => {
    const fakeResp = {
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
    };

    global.fetch = vi.fn(async () => ({ ok: true, json: async () => fakeResp }));
    moduleRef = await import('../src/js/fetch/lstmPredictionApi.js');
    const { fetchLSTMPrediction, formatPredictionForChart } = moduleRef;

    const apiData = await fetchLSTMPrediction(7);
    expect(apiData.status).toBe(true);

    const chart = formatPredictionForChart(apiData);
    expect(chart.values).toEqual([1,2]);
    expect(chart.metadata.location).toBe('Kota Gorontalo');
  });

  it('fetchLSTMPrediction melempar error saat status false', async () => {
    const fakeResp = { status: false, message: 'Failed' };
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => fakeResp }));
    moduleRef = await import('../src/js/fetch/lstmPredictionApi.js');
    const { fetchLSTMPrediction } = moduleRef;
    await expect(fetchLSTMPrediction(7)).rejects.toThrow();
  });

  it('fetchLSTMPrediction melempar error saat HTTP tidak ok dan body mengandung detail error', async () => {
    const fakeResp = { detail: [{ msg: 'Bad Request' }] };
    global.fetch = vi.fn(async () => ({ ok: false, status: 400, json: async () => fakeResp }));
    moduleRef = await import('../src/js/fetch/lstmPredictionApi.js');
    const { fetchLSTMPrediction } = moduleRef;
    await expect(fetchLSTMPrediction(3)).rejects.toThrow('Bad Request');
  });
});