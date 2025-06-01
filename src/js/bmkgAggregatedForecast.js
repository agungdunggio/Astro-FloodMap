// src/js/bmkgAggregatedForecast.js

// Struktur data wilayah (GANTI DENGAN DATA SEBENARNYA)
const KOTA_GORONTALO_STRUCTURE = {
    "Kota Tengah": {
        namaResmi: "Kecamatan Kota Tengah", // Nama yang akan ditampilkan
        adm4_codes: ["75.71.06.1001", "75.71.06.1002", "75.71.06.1003", "75.71.06.1004", "75.71.06.1005", "75.71.06.1006"]
    },
    "Kota Barat": {
        namaResmi: "Kecamatan Kota Barat",
        adm4_codes: ["75.71.01.1001", "75.71.01.1002", "75.71.01.1003", "75.71.01.1004", "75.71.01.1005", "75.71.01.1006", "75.71.01.1008"] 
    },
    "Dungingi": { 
        namaResmi: "Kecamatan Dungingi", 
        adm4_codes: ["75.71.04.1001", "75.71.04.1002", "75.71.04.1003", "75.71.04.1004", "75.71.04.1005",]
    },
    "Kota Selatan": { 
        namaResmi: "Kecamatan Kota Selatan", 
        adm4_codes: ["75.71.02.1010", "75.71.02.1012", "75.71.02.1013", "75.71.02.1019", "75.71.02.1020",] 
    },
    "Kota Timur": { 
        namaResmi: "Kecamatan Kota Timur", 
        adm4_codes: ["75.71.05.1003", "75.71.05.1004", "75.71.05.1005", "75.71.05.1008", "75.71.05.1009", "75.71.05.1011",]
    },
    "Kota Utara": { 
        namaResmi: "Kecamatan Kota Utara", 
        adm4_codes: ["75.71.03.1003", "75.71.03.1004", "75.71.03.1005", "75.71.03.1010", "75.71.03.1014", "75.71.03.1015"]
    },
    "Hulonthalangi": { 
        namaResmi: "Kecamatan Hulonthalangi", 
        adm4_codes: ["75.71.09.1001", "75.71.09.1002", "75.71.09.1003", "75.71.09.1004", "75.71.09.1005",] 
    },
    "Sipatana": { 
        namaResmi: "Kecamatan Sipatana", 
        adm4_codes: ["75.71.07.1001", "75.71.07.1002", "75.71.07.1003", "75.71.07.1004", "75.71.07.1005",]
    },
    "Dumbo Raya": { 
        namaResmi: "Kecamatan Dumbo Raya", 
        adm4_codes: ["75.71.08.1001", "75.71.08.1002", "75.71.08.1003", "75.71.08.1004", "75.71.08.1005",]
    }
};

const API_BASE_URL = 'https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=';

/**
 * Mengambil data prakiraan untuk satu kode adm4.
 * @param {string} adm4Code Kode wilayah tingkat IV (kelurahan/desa).
 * @returns {Promise<Array|null>} Array objek prakiraan per jam/interval atau null jika gagal.
 */
async function fetchForecastForSingleAdm4(adm4Code) {
    try {
        const response = await fetch(`${API_BASE_URL}${adm4Code}`);
        if (!response.ok) {
            console.warn(`Gagal mengambil data untuk adm4 ${adm4Code}: ${response.status}`);
            return null;
        }
        const jsonData = await response.json();
        if (jsonData && jsonData.data && jsonData.data.length > 0 && jsonData.data[0].cuaca) {
            // Menggabungkan semua array prakiraan menjadi satu array flat
            let flatForecasts = [];
            jsonData.data[0].cuaca.forEach(dailyArray => {
                flatForecasts = flatForecasts.concat(dailyArray);
            });
            return flatForecasts.map(item => ({ // Ambil field yang relevan
                localDateTime: new Date(item.local_datetime),
                temperature: parseFloat(item.t),
                totalPrecipitation: parseFloat(item.tp),
                weatherCode: parseInt(item.weather),
                weatherDesc: item.weather_desc,
                iconUrl: item.image,
                humidity: parseInt(item.hu),
                windSpeed: parseFloat(item.ws),
                windDirectionCard: item.wd
            }));
        }
        return null;
    } catch (error) {
        console.error(`Error fetching data untuk adm4 ${adm4Code}:`, error);
        return null;
    }
}

/**
 * Mengagregasi data prakiraan dari beberapa kelurahan menjadi satu representasi kecamatan.
 * @param {Array<Array<Object>>} allKelurahanForecasts Array berisi array prakiraan dari setiap kelurahan.
 * @returns {Array<Object>|null} Array prakiraan agregat per interval waktu atau null.
 */
function aggregateForecastsForKecamatan(allKelurahanForecasts) {
    if (!allKelurahanForecasts || allKelurahanForecasts.length === 0) return null;

    // Asumsi semua kelurahan memiliki jumlah dan interval waktu prakiraan yang sama.
    // Ambil interval waktu dari prakiraan kelurahan pertama.
    const numIntervals = allKelurahanForecasts[0] ? allKelurahanForecasts[0].length : 0;
    if (numIntervals === 0) return null;

    const aggregatedData = [];

    for (let i = 0; i < numIntervals; i++) {
        const forecastsForThisInterval = [];
        allKelurahanForecasts.forEach(kelurahanForecast => {
            if (kelurahanForecast && kelurahanForecast[i]) {
                forecastsForThisInterval.push(kelurahanForecast[i]);
            }
        });

        if (forecastsForThisInterval.length === 0) continue;

        // Agregasi:
        const avgTemp = forecastsForThisInterval.reduce((sum, d) => sum + d.temperature, 0) / forecastsForThisInterval.length;
        const avgHumidity = forecastsForThisInterval.reduce((sum, d) => sum + d.humidity, 0) / forecastsForThisInterval.length;
        const avgWindSpeed = forecastsForThisInterval.reduce((sum, d) => sum + d.windSpeed, 0) / forecastsForThisInterval.length;
        // const totalPrecipitation = forecastsForThisInterval.reduce((sum, d) => sum + d.totalPrecipitation, 0); // Bisa juga rata-rata, tergantung kebutuhan
        const maxPrecipitation = Math.max(...forecastsForThisInterval.map(d => d.totalPrecipitation));

        // Untuk cuaca (deskripsi & ikon), ambil yang paling sering muncul (modus)
        const weatherCodes = forecastsForThisInterval.map(d => d.weatherCode);
        const weatherDescs = forecastsForThisInterval.map(d => d.weatherDesc);
        const iconUrls = forecastsForThisInterval.map(d => d.iconUrl);

        const mode = (arr) => arr.sort((a,b) => arr.filter(v => v===a).length - arr.filter(v => v===b).length).pop();
        
        const dominantWeatherCode = mode(weatherCodes) || forecastsForThisInterval[0].weatherCode;
        const dominantWeatherDesc = mode(weatherDescs) || forecastsForThisInterval[0].weatherDesc;
        const dominantIconUrl = mode(iconUrls) || forecastsForThisInterval[0].iconUrl;

        aggregatedData.push({
            localDateTime: forecastsForThisInterval[0].localDateTime, // Ambil dari yang pertama
            temperature: parseFloat(avgTemp.toFixed(1)),
            totalPrecipitation: parseFloat(maxPrecipitation.toFixed(1)), // Atau avgPrecipitation
            weatherCode: dominantWeatherCode,
            weatherDesc: dominantWeatherDesc,
            iconUrl: dominantIconUrl,
            humidity: Math.round(avgHumidity),
            windSpeed: parseFloat(avgWindSpeed.toFixed(1)),
            // Arah angin (wd) lebih kompleks, bisa ambil modus atau dari kelurahan pertama
            windDirectionCard: forecastsForThisInterval[0].windDirectionCard 
        });
    }
    return aggregatedData;
}

/**
 * Fungsi utama untuk mendapatkan prakiraan agregat per kecamatan di Kota Gorontalo.
 * @returns {Promise<Object>} Objek dengan nama kecamatan sebagai kunci dan array prakiraan agregat sebagai nilai.
 */
export async function getAggregatedForecastForKotaGorontalo() {
    const allKecamatanData = {};

    for (const kecamatanKey in KOTA_GORONTALO_STRUCTURE) {
        const kecamatanInfo = KOTA_GORONTALO_STRUCTURE[kecamatanKey];
        console.log(`Mengambil data untuk ${kecamatanInfo.namaResmi}...`);
        const kelurahanForecastsPromises = kecamatanInfo.adm4_codes.map(adm4 => fetchForecastForSingleAdm4(adm4));
        
        try {
            const results = await Promise.all(kelurahanForecastsPromises);
            const validResults = results.filter(r => r !== null && r.length > 0); // Hanya ambil hasil yang valid

            if (validResults.length > 0) {
                const aggregated = aggregateForecastsForKecamatan(validResults);
                if (aggregated) {
                    allKecamatanData[kecamatanKey] = {
                        namaResmi: kecamatanInfo.namaResmi,
                        forecasts: aggregated
                    };
                } else {
                    console.warn(`Tidak ada data valid untuk diagregasi di ${kecamatanInfo.namaResmi}`);
                    allKecamatanData[kecamatanKey] = { namaResmi: kecamatanInfo.namaResmi, forecasts: [] };
                }
            } else {
                console.warn(`Tidak ada data yang berhasil diambil untuk ${kecamatanInfo.namaResmi}`);
                allKecamatanData[kecamatanKey] = { namaResmi: kecamatanInfo.namaResmi, forecasts: [] };
            }
        } catch (error) {
            console.error(`Error saat memproses kecamatan ${kecamatanInfo.namaResmi}:`, error);
            allKecamatanData[kecamatanKey] = { namaResmi: kecamatanInfo.namaResmi, forecasts: [] };
        }
        // Tambahkan delay kecil untuk menghindari rate limit API jika mengambil banyak kecamatan sekaligus
        await new Promise(resolve => setTimeout(resolve, 500)); 
    }
    return allKecamatanData;
}