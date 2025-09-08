// src/js/landing-script.js

// Fungsi akan dijalankan setelah seluruh DOM siap
function onPageLoad() {
    try {
        if (typeof THREE !== 'undefined') {
            console.log("Three.js loaded, initializing 3D rain...");
            initThreeJSRain();
        } else {
            console.warn("Three.js not loaded or error during load, falling back to CSS rain.");
            initCSSRain(); // Fallback jika Three.js gagal dimuat
        }
    } catch (e) {
        console.error("Error initializing Three.js rain, falling back to CSS rain:", e);
        initCSSRain();
    }
    
    // Navigasi Tombol
    const cobaSimulasiBtn = document.getElementById('cobaSimulasiBtn');
    if (cobaSimulasiBtn) {
        cobaSimulasiBtn.addEventListener('click', () => {
            window.location.href = '/simulasi-banjir'; // Path untuk Astro
        });
    }

    const mulaiEksplorasiBtn = document.getElementById('mulaiEksplorasiBtn');
    if (mulaiEksplorasiBtn) {
        mulaiEksplorasiBtn.addEventListener('click', () => {
            window.location.href = '/simulasi-banjir'; // Path untuk Astro
        });
    }

    // Hamburger menu (opsional, dasar)
    const mobileMenuButton = document.querySelector('header button.md\\:hidden'); // Perlu escape untuk : di querySelector
    const mobileNav = document.querySelector('header nav.hidden.md\\:flex'); // Target nav yang benar
    if (mobileMenuButton && mobileNav) {
        mobileMenuButton.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden'); 
            // Anda mungkin perlu menambahkan/menghapus kelas lain untuk tampilan mobile yang benar
            // misal: flex, flex-col, absolute, top-16, left-0, right-0, bg-gray-800, p-4
        });
    }
}

function initCSSRain() {
    const rainContainer = document.getElementById('css-rain');
    if (!rainContainer) {
        console.warn("#css-rain container not found for CSS rain effect.");
        return;
    }
    rainContainer.innerHTML = ''; 
    const dropsCount = 70; 
    
    for (let i = 0; i < dropsCount; i++) {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = Math.random() * 100 + 'vw';
        const duration = Math.random() * 0.6 + 0.4; 
        drop.style.animationDuration = duration + 's';
        drop.style.animationDelay = Math.random() * 1 + 's'; // Delay agar tidak barengan
        drop.style.opacity = Math.random() * 0.5 + 0.2; // Variasi opacity
        rainContainer.appendChild(drop);
        
        // Create ripples
        // Hati-hati dengan performa jika membuat terlalu banyak interval
        // Pertimbangkan untuk membuat ripple hanya saat animasi drop selesai (sekali)
        // atau menggunakan pool objek jika memungkinkan.
        // Untuk sekarang, kita biarkan seperti kode asli Anda.
        const animationDurationMs = duration * 1000;
        if (animationDurationMs > 0) {
            // Ini akan membuat banyak interval, idealnya ripple dibuat saat drop 'jatuh'
            // Untuk tujuan demo, kita biarkan
            setTimeout(() => {
                if (document.body.contains(drop)) { 
                    const ripple = document.createElement('div');
                    ripple.className = 'ripple';
                    // Perkiraan posisi jatuhnya drop (mungkin perlu disesuaikan)
                    ripple.style.left = `calc(${drop.style.left} + 1px)`; // 1px adalah setengah lebar raindrop
                    ripple.style.bottom = '0px'; 
                    document.body.appendChild(ripple); // Tambahkan ke body agar bisa di atas #css-rain
                    setTimeout(() => ripple.remove(), 700); // Hapus ripple setelah 0.7 detik
                }
                drop.remove(); // Hapus raindrop setelah animasinya selesai + sedikit delay
            }, animationDurationMs + Math.random() * 500); // Hapus setelah durasi + delay
        }
    }
}

function initThreeJSRain() {
    const container = document.getElementById('canvas-container');
    if (!container || typeof THREE === 'undefined') {
        console.warn("Three.js or #canvas-container not found for 3D rain effect.");
        return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    camera.position.z = 5;

    const rainCount = 1500;
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = []; 

    for (let i = 0; i < rainCount; i++) {
        const x = Math.random() * 30 - 15; // Area sebaran hujan lebih luas
        const y = Math.random() * 20 - 10; 
        const z = Math.random() * 30 - 15; 
        rainPositions.push(x, y, z);
        rainPositions.push(x, y - (0.2 + Math.random() * 0.3), z); // Panjang rintik bervariasi
    }
    rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainPositions, 3));

    const rainMaterial = new THREE.LineBasicMaterial({
        color: 0xaaaaff, 
        transparent: true,
        opacity: 0.5,
        linewidth: 0.5 // Mungkin tidak didukung semua GPU, tapi bisa dicoba
    });

    const rain = new THREE.LineSegments(rainGeometry, rainMaterial);
    scene.add(rain);

    const lightning = new THREE.PointLight(0xffffff, 0, 100); // Intensitas awal 0
    lightning.position.set(0, 10, 0); // Posisi sumber cahaya petir
    scene.add(lightning);

    scene.fog = new THREE.FogExp2(0x0f2027, 0.05); // Warna fog disesuaikan dengan background

    let lightningBolt;
    const boltMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });

    function createLightningBolt() {
        const points = [];
        const startX = (Math.random() - 0.5) * 25;
        const startZ = (Math.random() - 0.5) * 25; 
        let currentY = 10 + Math.random() * 5; // Mulai dari atas dengan variasi
        let currentX = 0; 

        points.push(new THREE.Vector3(currentX, currentY, 0)); // Mulai dari Z=0 (relatif)

        for (let i = 0; i < 8 + Math.floor(Math.random() * 5) ; i++) { // Jumlah segmen bervariasi
            currentX += (Math.random() - 0.5) * 1.5;
            currentY -= (0.8 + Math.random() * 0.8);
            points.push(new THREE.Vector3(currentX, currentY, 0));
        }
        const boltShape = new THREE.BufferGeometry().setFromPoints(points);

        if (lightningBolt) scene.remove(lightningBolt);
        lightningBolt = new THREE.Line(boltShape, boltMaterial);
        lightningBolt.scale.set(1, 1, 1); // Skala normal dulu
        lightningBolt.position.set(startX, 0, startZ - 10); // Mundurkan sedikit Z agar di area pandang
        scene.add(lightningBolt);

        setTimeout(() => {
            if (lightningBolt) scene.remove(lightningBolt);
            lightningBolt = null;
        }, 80 + Math.random() * 70); 
    }

    let lightningFlashCooldown = 0;
    let lightningBoltCooldown = 50 + Math.random() * 100; // Cooldown awal untuk bolt

    function animate() {
        requestAnimationFrame(animate);
        
        const positions = rain.geometry.attributes.position.array;
        for (let i = 0; i < rainCount; i++) {
            positions[i * 6 + 1] -= (0.15 + Math.random() * 0.1); 
            positions[i * 6 + 4] -= (0.15 + Math.random() * 0.1); 

            if (positions[i * 6 + 1] < -10) { // Jika rintik hujan di bawah -10 (y)
                positions[i * 6 + 1] = 10 + Math.random() * 5; // Reset ke atas
                positions[i * 6 + 4] = positions[i * 6 + 1] - (0.2 + Math.random() * 0.3); // Panjang baru
                // Jaga X dan Z tetap sama agar tidak "teleport" horizontal
                // Jika ingin variasi X/Z saat reset:
                // positions[i * 6 + 0] = Math.random() * 30 - 15;
                // positions[i * 6 + 2] = Math.random() * 30 - 15;
                // positions[i * 6 + 3] = positions[i * 6 + 0];
                // positions[i * 6 + 5] = positions[i * 6 + 2];
            }
        }
        rain.geometry.attributes.position.needsUpdate = true;

        // const flashOverlay = document.getElementById('flash-overlay'); // Flash overlay tetap dikomentar

        if (lightningFlashCooldown <= 0 && Math.random() < 0.008) { // Peluang flash
            lightning.intensity = 2 + Math.random() * 3; // Intensitas flash
            // if(flashOverlay) flashOverlay.style.opacity = "0.7"; // Flash overlay dikomentar
            // setTimeout(() => { if(flashOverlay) flashOverlay.style.opacity = "0"; }, 80 + Math.random()*40);
            lightningFlashCooldown = 150 + Math.random() * 200; // Cooldown setelah flash
        }
        
        if (lightningBoltCooldown <= 0 && Math.random() < 0.01) { // Peluang kilat
            createLightningBolt();
            // if(flashOverlay) flashOverlay.style.opacity = "0.5"; // Flash overlay dikomentar
            // setTimeout(() => { if(flashOverlay) flashOverlay.style.opacity = "0"; }, 60 + Math.random()*30);
            lightningBoltCooldown = 200 + Math.random() * 300; // Cooldown setelah kilat
        }


        if (lightning.intensity > 0) {
            lightning.intensity *= 0.85; // Redupkan cahaya flash lebih cepat
             if (lightning.intensity < 0.1) lightning.intensity = 0;
        }
        if (lightningFlashCooldown > 0) lightningFlashCooldown--;
        if (lightningBoltCooldown > 0) lightningBoltCooldown--;


        renderer.render(scene, camera);
    }

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}


// Pastikan DOM sudah siap sebelum menjalankan skrip utama
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onPageLoad);
} else {
    onPageLoad();
}