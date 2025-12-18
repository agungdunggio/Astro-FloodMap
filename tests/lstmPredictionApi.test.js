import { describe, it, expect } from 'vitest';
import { formatPredictionForChart, getPredictionSummary } from '../src/js/fetch/lstmPredictionApi.js';

describe('LSTM utils', () => {
  it('formatPredictionForChart memetakan response API dengan benar', () => {
    const apiResponse = {
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

    const out = formatPredictionForChart(apiResponse);
    expect(out.labels.length).toBe(2);
    expect(out.values).toEqual([1,2]);
    expect(out.metadata.location).toBe('Kota Gorontalo');
    expect(out.metadata.model).toBe('LSTM-v1');
  });

  it('getPredictionSummary menghitung min/max/avg/total', () => {
    const predictions = [
      { date: '2025-01-01', value: 1 },
      { date: '2025-01-02', value: 3 },
      { date: '2025-01-03', value: 2 },
    ];

    const s = getPredictionSummary(predictions);
    expect(s.min).toBe(1);
    expect(s.max).toBe(3);
    expect(s.avg).toBeCloseTo(2, 6);
    expect(s.total).toBe(6);
  });
});


