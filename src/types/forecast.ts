// src/types/forecast.ts
export interface ForecastItem {
    localDateTime: Date | string; // Bisa string dari API, lalu di-parse jadi Date
    temperature: number | null;
    totalPrecipitation: number | null;
    weatherCode: number | null;
    weatherDesc: string | null;
    iconUrl: string | null;
    humidity: number | null;
    windSpeed: number | null;
    windDirectionCard: string | null;
}

export interface KecamatanForecast {
    namaResmi: string;
    forecasts: ForecastItem[];
}