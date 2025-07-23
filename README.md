<!-- # Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
# Astro-FloodMap -->

# 🗺️ Astro-FloodMap

Aplikasi visualisasi dan simulasi banjir interaktif untuk wilayah Gorontalo. Proyek ini dibangun dengan Astro, CesiumJS untuk pemetaan 3D, dan mengambil data cuaca dari BMKG.

## ✨ Fitur Utama

-   **Visualisasi Peta 3D**: Menampilkan data geografis Gorontalo dalam tampilan 3D yang interaktif menggunakan CesiumJS.
-   **Simulasi Banjir**: Fitur untuk menyimulasikan kenaikan permukaan air dan melihat area yang berpotensi terdampak.
-   **Prakiraan Cuaca**: Menampilkan data prakiraan cuaca yang diambil langsung dari data *open source* BMKG.
-   **Peta Dasar Detail**: Memuat lapisan-lapisan data geografis (GeoJSON) seperti batas administrasi kecamatan dan kota.
-   **Antarmuka Modern**: Dibangun dengan Astro dan komponen Vue.js untuk pengalaman pengguna yang responsif.

## 🛠️ Teknologi yang Digunakan

-   **Framework**: [Astro](https://astro.build/)
-   **Pemetaan 3D**: [CesiumJS](https://cesium.com/platform/cesiumjs/)
-   **Komponen UI**: [Vue.js](https://vuejs.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Deployment**: Siap untuk di-deploy di platform statis seperti Vercel, Netlify, atau GitHub Pages.

## 🚀 Memulai Proyek

Berikut adalah cara untuk menjalankan proyek ini di lingkungan lokal Anda.

1.  **Clone Repositori (Jika diperlukan)**
    ```bash
    git clone https://github.com/agungdunggio/Astro-FloodMap.git
    cd Astro-FloodMap
    ```

2.  **Instal Dependensi**
    Pastikan Anda memiliki Node.js terinstal. Jalankan perintah berikut di terminal:
    ```bash
    npm install
    ```

3.  **Jalankan Server Pengembangan**
    Perintah ini akan memulai server lokal di `http://localhost:4321` dengan *hot-reloading*.
    ```bash
    npm run dev
    ```

4.  **Build untuk Produksi**
    Untuk membuat versi produksi dari aplikasi Anda, jalankan:
    ```bash
    npm run build
    ```
    File hasil build akan tersedia di direktori `./dist/`.

5.  **Pratinjau Hasil Build**
    Untuk melihat hasil build produksi secara lokal sebelum di-deploy:
    ```bash
    npm run preview
    ```

## 📂 Struktur Proyek

Struktur file utama dalam proyek ini adalah sebagai berikut:

```text
/
├── public/
│   ├── data/                 # Data GeoJSON dan gambar
│   └── favicon.svg
├── src/
│   ├── assets/               # Aset statis seperti gambar & SVG
│   ├── components/           # Komponen Astro & Vue
│   ├── js/                   # Logika utama (CesiumJS, simulasi, fetch data)
│   ├── layouts/              # Tata letak dasar halaman
│   ├── pages/                # Halaman aplikasi (.astro)
│   └── style/                # File CSS global & styling
├── astro.config.mjs          # File konfigurasi Astro
└── package.json              # Dependensi dan skrip proyek