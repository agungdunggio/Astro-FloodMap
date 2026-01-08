/**
 * @file Menampilkan Waktu CesiumJS sebagai UTC+8 (WITA)
 * @description Contoh ini menunjukkan cara mengubah format tampilan waktu pada
 * widget Animasi dan Timeline CesiumJS agar menunjukkan waktu UTC+8 (WITA).
 */

// Helper untuk mendapatkan Cesium dari window (sudah di-set oleh cesiumSetup.js)
function getCesium() {
    return window.Cesium;
}

/**
 * Format tanggal saja ke zona waktu WITA (Asia/Makassar).
 * Contoh hasil: "5 Jun 2025"
 */
export function formatJulianDateToWITA(julianDate) {
    const Cesium = getCesium();
    if (!Cesium || !Cesium.defined(julianDate)) return '';

    const jsDate = Cesium.JulianDate.toDate(julianDate);
    return jsDate.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Makassar',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format waktu saja ke zona waktu WITA.
 * Contoh hasil: "21:28:20 WITA"
 */
export function formatJulianTimeToWITA(julianDate) {
    const Cesium = getCesium();
    if (!Cesium || !Cesium.defined(julianDate)) return '';

    const jsDate = Cesium.JulianDate.toDate(julianDate);
    const time = jsDate.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return `${time} WITA`;
}

/**
 * Format pendek untuk label timeline (hanya waktu).
 * Contoh hasil: "21:28 WITA"
 */
export function formatJulianDateToShortWITAForTimeline(julianDate) {
    const Cesium = getCesium();
    if (!Cesium || !Cesium.defined(julianDate)) return '';

    const jsDate = Cesium.JulianDate.toDate(julianDate);
    const time = jsDate.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `${time} WITA`;
}
