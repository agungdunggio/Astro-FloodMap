
# 🌊 G-Flood: Simulasi Banjir 3D Kota Gorontalo

Aplikasi visualisasi dan simulasi banjir interaktif untuk wilayah Gorontalo. Proyek ini dibangun dengan arsitektur modern menggunakan Astro, CesiumJS untuk pemetaan 3D, dan mengintegrasikan data cuaca real-time dari BMKG.

## ✨ Fitur Utama

### 🌊 **Simulasi Banjir 3D Interaktif**
- Visualisasi simulasi banjir real-time dalam bentuk 3D
- Parameter curah hujan dan durasi yang dapat disesuaikan
- Analisis ketinggian air dan area terdampak
- Timeline dan animasi simulasi yang realistis

### 🗺️ **Peta Dasar & Prakiraan Cuaca**  
- Peta dasar 3D Kota Gorontalo dengan detail tinggi
- Integrasi API BMKG untuk prakiraan cuaca 3 hari
- Data curah hujan, suhu, kelembaban, dan angin
- Update data dua kali setiap hari

### 🧠 **Prediksi LSTM** *(Fitur Baru)*
- Model LSTM untuk prediksi curah hujan hingga 90 hari
- Analisis pola historis cuaca
- Visualisasi grafik prediksi interaktif
- Perencanaan mitigasi banjir jangka panjang

### 🎨 **Antarmuka Modern & Responsif**
- Landing page dengan efek hujan 3D menggunakan Three.js
- UI glassmorphism yang elegan dan modern
- Responsive design untuk desktop dan mobile
- Navigation yang intuitif antar halaman

## 🛠️ Teknologi yang Digunakan

### **Frontend Framework**
-   **[Astro](https://astro.build/)**: Framework modern untuk website yang cepat
-   **[Vue.js](https://vuejs.org/)**: Komponen interaktif dan reaktif
-   **[Three.js](https://threejs.org/)**: Efek 3D untuk landing page

### **Pemetaan & Visualisasi**
-   **[CesiumJS](https://cesium.com/platform/cesiumjs/)**: Pemetaan dan visualisasi 3D
-   **[GeoJSON](https://geojson.org/)**: Format data geografis
-   **Terrain Data**: World Terrain dari Cesium Ion

### **Styling & UI**
-   **[Tailwind CSS](https://tailwindcss.com/)**: Framework CSS utility-first
-   **Glassmorphism**: Desain UI modern dengan efek blur
-   **Ion Icons**: Koleksi ikon untuk interface

### **Data & API**
-   **[BMKG Open Data](https://data.bmkg.go.id/)**: Data cuaca dan prakiraan
-   **GeoJSON Files**: Data administratif Kota Gorontalo
-   **REST API**: Integrasi data cuaca real-time

### **Development & Deployment**
-   **Node.js**: Runtime JavaScript
-   **Vite**: Build tool yang cepat
-   **Git**: Version control
-   **Deployment**: Siap untuk Vercel, Netlify, atau GitHub Pages

## 🚀 Memulai Proyek

### **Prerequisites**
- Node.js (versi 18 atau lebih baru)
- NPM atau Yarn package manager
- Cesium Ion Access Token (gratis di [cesium.com](https://cesium.com/))

### **Installation Steps**

1.  **Clone Repositori**
    ```bash
    git clone https://github.com/agungdunggio/G-Flood-Simulation.git
    cd G-Flood-Simulation
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Buat file `.env` di root directory:
    ```bash
    # Cesium Ion Access Token (wajib)
    PUBLIC_CESIUM_ACCESS_TOKEN=your_cesium_token_here
    ```

4.  **Jalankan Development Server**
    ```bash
    npm run dev
    ```
    Server akan berjalan di `http://localhost:4321`

5.  **Build untuk Produksi**
    ```bash
    npm run build
    ```

6.  **Preview Production Build**
    ```bash
    npm run preview
    ```

### **🧞 Available Commands**

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview build locally |
| `npm run astro ...` | Run Astro CLI commands |

## 📂 Struktur Proyek

Proyek ini menggunakan arsitektur modern yang modular dan dapat dikembangkan:

```text
/
├── public/                   # Static assets
│   ├── cesium-assets/        # Cesium library assets
│   ├── data/                 # GeoJSON data files
│   │   ├── geojson/
│   │   │   ├── administrasi/ # Batas wilayah administratif
│   │   │   └── water/        # Data ketinggian air
│   │   └── img/              # Images & textures
│   ├── icon/                 # App icons
│   └── img/                  # Static images
├── src/
│   ├── assets/               # Build-time assets
│   ├── components/           # Reusable components
│   │   └── forecast/         # Weather forecast components
│   ├── js/                   # JavaScript modules
│   │   ├── config/           # 🆕 Configuration system
│   │   │   ├── pageConfigs.js    # Page configurations
│   │   │   └── README.md         # Config documentation
│   │   ├── core/             # 🆕 Core functionality
│   │   │   └── cesiumInitializer.js # Universal initializer
│   │   ├── utils/            # 🆕 Utility functions
│   │   │   └── pageUtils.js      # Page utilities
│   │   ├── Cesium/           # Cesium-specific utilities
│   │   ├── fetch/            # API data fetching
│   │   ├── forecast/         # Weather forecast logic
│   │   ├── uiControl/        # UI control handlers
│   │   ├── cesiumConfig.js   # Cesium configuration
│   │   ├── dataLoader.js     # GeoJSON data loading
│   │   ├── landing-script.js # Landing page effects
│   │   ├── mainCesium.js     # 🔄 Refactored entry point
│   │   ├── rainEffect.js     # Rain particle effects
│   │   ├── simulationManager.js # Flood simulation
│   │   └── viewerSetup.js    # Cesium viewer setup
│   ├── layouts/              # Page layouts
│   │   ├── BaseLayout.astro  # Base layout for Cesium pages
│   │   └── LandingLayout.astro # Landing page layout
│   ├── pages/                # Application pages
│   │   ├── index.astro       # 🏠 Landing page
│   │   ├── simulasi-banjir.astro # 🌊 Flood simulation
│   │   ├── peta-dasar.astro  # 🗺️ Base map & weather
│   │   └── prediksi-lstm.astro # 🧠 LSTM prediction (new)
│   ├── style/                # Styling files
│   │   ├── global.css        # Global styles
│   │   ├── landing-style.css # Landing page styles
│   │   ├── peta-dasar-style.css # Base map styles
│   │   └── tailwind.css      # Tailwind imports
│   └── types/                # TypeScript type definitions
├── astro.config.mjs          # Astro configuration
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies & scripts
```

### **🆕 Arsitektur Baru (Post-Refactor)**

Sistem baru menggunakan **configuration-driven architecture** yang memungkinkan:

- ✅ **Modular Page Setup**: Setiap halaman dikonfigurasi melalui `pageConfigs.js`
- ✅ **Universal Initializer**: Satu initializer untuk semua halaman Cesium
- ✅ **Easy Extension**: Mudah menambah halaman baru dalam 5 menit
- ✅ **Better Error Handling**: Comprehensive error management
- ✅ **Backward Compatibility**: API lama tetap bekerja

## 🎯 Halaman Aplikasi

### **🏠 Landing Page (`/`)**
- Hero section dengan efek hujan 3D
- Feature cards dengan glassmorphism design
- Technology showcase
- Navigation ke halaman utama

### **🌊 Simulasi Banjir (`/simulasi-banjir`)**
- Visualisasi 3D terrain Kota Gorontalo
- Panel kontrol simulasi (curah hujan & durasi)
- Timeline animasi banjir
- Analisis area terdampak

### **🗺️ Peta Dasar (`/peta-dasar`)**
- Peta dasar 3D dengan layer administratif
- Tombol prakiraan cuaca BMKG
- Modal data cuaca interaktif
- Informasi geografis detail

### **🧠 Prediksi LSTM (`/prediksi-lstm`)** *(Baru)*
- Interface untuk model prediksi LSTM
- Visualisasi grafik prediksi 90 hari
- Panel kontrol prediksi
- Analisis pola cuaca historis

## 🔧 Development Guide

### **Menambah Halaman Baru**

Sistem baru memungkinkan penambahan halaman dengan mudah:

#### 1. **Tambah Konfigurasi**
Di `src/js/config/pageConfigs.js`:
```javascript
export const PAGE_CONFIGS = {
  NEW_PAGE: {
    name: 'halaman-baru',
    dataLayers: [
      { type: 'waterLevel', path: '/data/geojson/water/waterLevel.json' }
    ],
    features: {
      simulation: false,
      customFeature: true
    },
    logMessage: 'Halaman baru berhasil diinisialisasi.'
  }
};
```

#### 2. **Buat Helper Function**
Di `src/js/mainCesium.js`:
```javascript
export async function initializeNewPage() {
  const { initializeCesiumPage } = await import('./core/cesiumInitializer.js');
  return await initializeCesiumPage('NEW_PAGE');
}
```

#### 3. **Buat Halaman Astro**
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Halaman Baru">
  <main>
    <div id="cesiumContainer"></div>
    <script>
      import { initializeNewPage } from '../js/mainCesium.js';
      import { initializePage } from '../js/utils/pageUtils.js';
      
      initializePage(initializeNewPage, 'Halaman Baru');
    </script>
  </main>
</BaseLayout>
```

### **Konfigurasi Environment**

Buat file `.env` di root directory:
```bash
# Cesium Ion Access Token (wajib untuk terrain data)
PUBLIC_CESIUM_ACCESS_TOKEN=your_token_here

# Optional: Custom API endpoints
# PUBLIC_BMKG_API_BASE=https://api.bmkg.go.id
```

### **Data Files**

#### **GeoJSON Data Structure**
```text
public/data/geojson/
├── administrasi/
│   ├── areaKotaAdministrasiKotaGtlo.json    # Area kota
│   ├── lineAdmnKec.json                      # Garis batas kecamatan  
│   └── lineAdministrasiKota.json             # Garis batas kota
└── water/
    └── waterLevel.json                       # Data ketinggian air
```

#### **Image Assets**
```text
public/data/img/
├── particle_rain.png                        # Texture hujan
└── rain_particle.png                        # Particle hujan alternatif
```

## 🏗️ Architecture Overview

### **Configuration System**
- **`pageConfigs.js`**: Central configuration untuk semua halaman
- **`cesiumInitializer.js`**: Universal initializer dengan error handling
- **`pageUtils.js`**: Utility functions untuk page management

### **Data Flow**
```
1. User akses halaman
2. Astro load page component  
3. Script call initializer function
4. Initializer baca config dari pageConfigs.js
5. Load data layers sesuai config
6. Initialize features sesuai config
7. Setup UI dan event handlers
```

### **Error Handling**
- ✅ Try-catch untuk setiap layer loading
- ✅ Validation konfigurasi halaman
- ✅ User-friendly error notifications
- ✅ Comprehensive console logging
- ✅ Graceful degradation untuk missing data

## 📊 Performance Optimizations

### **Lazy Loading**
- Dynamic imports untuk modules yang tidak selalu dibutuhkan
- Conditional loading berdasarkan konfigurasi halaman
- Asset optimization untuk gambar dan texture

### **Memory Management**
- Proper cleanup untuk Cesium entities
- Event listener cleanup pada page transitions
- Efficient GeoJSON processing

### **Build Optimizations**
- Astro static generation untuk halaman yang tidak berubah
- CSS purging dengan Tailwind
- JavaScript minification dan tree shaking

## 🚀 Deployment

### **Static Deployment**
Aplikasi ini adalah static site yang dapat di-deploy ke:

- **[Vercel](https://vercel.com/)** (Recommended)
- **[Netlify](https://netlify.com/)**
- **[GitHub Pages](https://pages.github.com/)**
- **[Cloudflare Pages](https://pages.cloudflare.com/)**

### **Build Command**
```bash
npm run build
```

### **Environment Variables di Production**
Pastikan set environment variables di platform deployment:
```bash
PUBLIC_CESIUM_ACCESS_TOKEN=your_production_token
```

## 🤝 Contributing

1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

### **Development Standards**
- Follow existing code style dan naming conventions
- Update dokumentasi untuk fitur baru
- Test di multiple browsers
- Ensure responsive design

## 📝 License

Proyek ini menggunakan MIT License. Lihat file `LICENSE` untuk detail lengkap.

## 👥 Credits

- **Developer**: [Agung Dunggio](https://github.com/agungdunggio)
- **Data Source**: [BMKG Open Data](https://data.bmkg.go.id/)
- **Mapping**: [CesiumJS](https://cesium.com/)
- **Framework**: [Astro](https://astro.build/)

---

**🌊 G-Flood** - Simulasi Banjir 3D Kota Gorontalo
*Dikembangkan dengan ❤️ untuk mitigasi bencana yang lebih baik*

