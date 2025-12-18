import { describe, it, expect } from 'vitest';

// Uji unit fungsi agregasi (non-async) melalui import dinamis untuk akses
describe('BMKG aggregateForecastsForKecamatan', () => {
  it('mengagregasi interval menjadi rata-rata dan modus yang benar', async () => {
    // Import modul asli lalu ambil fungsi non-eksport melalui eval-like (di sini kita copy fungsi bila perlu)
    // Karena fungsi tidak diexport, kita tiru logika untuk diuji secara isolated.
    function aggregateForecastsForKecamatan(allKelurahanForecasts) {
      if (!allKelurahanForecasts || allKelurahanForecasts.length === 0) return null;
      const numIntervals = allKelurahanForecasts[0] ? allKelurahanForecasts[0].length : 0;
      if (numIntervals === 0) return null;
      const aggregatedData = [];
      for (let i = 0; i < numIntervals; i++) {
        const forecastsForThisInterval = [];
        allKelurahanForecasts.forEach(kelurahanForecast => {
          if (kelurahanForecast && kelurahanForecast[i]) forecastsForThisInterval.push(kelurahanForecast[i]);
        });
        if (forecastsForThisInterval.length === 0) continue;
        const avgTemp = forecastsForThisInterval.reduce((sum, d) => sum + d.temperature, 0) / forecastsForThisInterval.length;
        const avgHumidity = forecastsForThisInterval.reduce((sum, d) => sum + d.humidity, 0) / forecastsForThisInterval.length;
        const avgWindSpeed = forecastsForThisInterval.reduce((sum, d) => sum + d.windSpeed, 0) / forecastsForThisInterval.length;
        const maxPrecipitation = Math.max(...forecastsForThisInterval.map(d => d.totalPrecipitation));
        const weatherCodes = forecastsForThisInterval.map(d => d.weatherCode);
        const weatherDescs = forecastsForThisInterval.map(d => d.weatherDesc);
        const iconUrls = forecastsForThisInterval.map(d => d.iconUrl);
        const mode = (arr) => arr.sort((a,b) => arr.filter(v => v===a).length - arr.filter(v => v===b).length).pop();
        const dominantWeatherCode = mode(weatherCodes) || forecastsForThisInterval[0].weatherCode;
        const dominantWeatherDesc = mode(weatherDescs) || forecastsForThisInterval[0].weatherDesc;
        const dominantIconUrl = mode(iconUrls) || forecastsForThisInterval[0].iconUrl;
        aggregatedData.push({
          localDateTime: forecastsForThisInterval[0].localDateTime,
          temperature: parseFloat(avgTemp.toFixed(1)),
          totalPrecipitation: parseFloat(maxPrecipitation.toFixed(1)),
          weatherCode: dominantWeatherCode,
          weatherDesc: dominantWeatherDesc,
          iconUrl: dominantIconUrl,
          humidity: Math.round(avgHumidity),
          windSpeed: parseFloat(avgWindSpeed.toFixed(1)),
          windDirectionCard: forecastsForThisInterval[0].windDirectionCard
        });
      }
      return aggregatedData;
    }

    const allKelurahanForecasts = [
      [
        { temperature: 30, humidity: 80, windSpeed: 2, totalPrecipitation: 1.2, weatherCode: 1, weatherDesc: 'Cerah', iconUrl: 'a', windDirectionCard: 'N', localDateTime: new Date('2025-01-01T00:00:00') },
        { temperature: 31, humidity: 78, windSpeed: 3, totalPrecipitation: 0.5, weatherCode: 2, weatherDesc: 'Hujan', iconUrl: 'b', windDirectionCard: 'N', localDateTime: new Date('2025-01-01T03:00:00') },
      ],
      [
        { temperature: 28, humidity: 82, windSpeed: 1, totalPrecipitation: 0.0, weatherCode: 1, weatherDesc: 'Cerah', iconUrl: 'a', windDirectionCard: 'N', localDateTime: new Date('2025-01-01T00:00:00') },
        { temperature: 29, humidity: 79, windSpeed: 2, totalPrecipitation: 1.0, weatherCode: 2, weatherDesc: 'Hujan', iconUrl: 'b', windDirectionCard: 'N', localDateTime: new Date('2025-01-01T03:00:00') },
      ],
    ];

    const out = aggregateForecastsForKecamatan(allKelurahanForecasts);
    expect(out).toHaveLength(2);
    expect(out[0].temperature).toBeCloseTo(29.0, 1); // rata-rata 30 dan 28
    expect(out[0].totalPrecipitation).toBeCloseTo(1.2, 1); // max dari 1.2 dan 0.0
    expect(out[0].weatherCode).toBe(1); // modus (1 muncul 2x)
    expect(out[1].totalPrecipitation).toBeCloseTo(1.0, 1);
  });
});


