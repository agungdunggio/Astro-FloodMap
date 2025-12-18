import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/js/utils/notify.js', () => ({
  showLoadingToast: vi.fn(),
  successToast: vi.fn(),
  warningToast: vi.fn(),
  errorToast: vi.fn(),
}));

function makeBmkgResponse() {
  const cuaca = [
    [
      {
        local_datetime: '2025-01-01T00:00:00+08:00',
        t: '30',
        tp: '1.2',
        weather: '1',
        weather_desc: 'Cerah',
        image: 'icon-a',
        hu: '80',
        ws: '2.5',
        wd: 'N',
      },
      {
        local_datetime: '2025-01-01T03:00:00+08:00',
        t: '28',
        tp: '0.5',
        weather: '2',
        weather_desc: 'Hujan',
        image: 'icon-b',
        hu: '82',
        ws: '3.0',
        wd: 'NE',
      },
    ],
  ];
  return { data: [{ cuaca }] };
}

describe('BMKG Aggregated API integration (mocked)', () => {
  let moduleRef;

  beforeEach(async () => {
    vi.resetModules();

    global.fetch = vi.fn(async (url) => ({
      ok: true,
      json: async () => makeBmkgResponse(),
    }));

    vi.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      if (typeof fn === 'function') fn();
      return 0;
    });

    moduleRef = await import('../src/js/fetch/bmkgAggregatedForecast.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mengambil dan mengagregasi data untuk semua kecamatan, menghasilkan struktur hasil yang konsisten', async () => {
    const { getAggregatedForecastForKotaGorontalo } = moduleRef;
    const result = await getAggregatedForecastForKotaGorontalo();

    expect(result && typeof result === 'object').toBe(true);
    const keys = Object.keys(result);
    expect(keys.length).toBeGreaterThan(0);

    const firstKey = keys[0];
    const kec = result[firstKey];
    expect(kec).toHaveProperty('namaResmi');
    expect(Array.isArray(kec.forecasts)).toBe(true);
    expect(kec.forecasts.length).toBeGreaterThan(0);

    const firstInterval = kec.forecasts[0];
    expect(firstInterval).toHaveProperty('localDateTime');
    expect(firstInterval).toHaveProperty('temperature');
    expect(firstInterval).toHaveProperty('totalPrecipitation');
    expect(firstInterval).toHaveProperty('weatherCode');
    expect(firstInterval).toHaveProperty('weatherDesc');
    expect(firstInterval).toHaveProperty('iconUrl');
    expect(firstInterval).toHaveProperty('humidity');
    expect(firstInterval).toHaveProperty('windSpeed');
    expect(firstInterval).toHaveProperty('windDirectionCard');
  });

  it('memanggil fetch berkali-kali (per adm4) dan tidak melempar error', async () => {
    const { getAggregatedForecastForKotaGorontalo } = moduleRef;
    await getAggregatedForecastForKotaGorontalo();
    expect(global.fetch).toHaveBeenCalled();
  });
});


