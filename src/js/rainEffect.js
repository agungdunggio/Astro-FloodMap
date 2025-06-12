// src/js/rainEffect.js
import * as Cesium from 'cesium';

// State internal modul ini, diekspor agar bisa diakses jika perlu oleh modul lain (misal simulationManager)
export let currentRainParticleSystem = null;
export let rainPreRenderListener = null;
let rainParticleSystems = [];

// Fungsi untuk mengupdate posisi emitter hujan (internal)
function updateRainEmitterPosition(scene) {
  if (currentRainParticleSystem && scene && scene.camera) {
    const offset = new Cesium.Cartesian3(0, 0, 2000);
    const newEmitterPosition = Cesium.Cartesian3.add(
        scene.camera.position,
        offset,
        new Cesium.Cartesian3()
    );
    currentRainParticleSystem.modelMatrix = Cesium.Matrix4.fromTranslation(newEmitterPosition);
  }
}

export function addRainEffect(scene) {
  if (currentRainParticleSystem) {
    console.log("Efek hujan sudah aktif, tidak membuat ulang.");
    return;
  }

  console.log("Memulai efek hujan (versi pengguna)...");

  // Baris asli pengguna untuk menghapus SEMUA sistem partikel (termasuk yang mungkin bukan dari modul ini)
  // Ini bisa dipertimbangkan ulang jika ada partikel lain. Untuk sekarang, kita ikuti.
  if (scene.primitives && scene.primitives._primitives) {
    scene.primitives._primitives = scene.primitives._primitives.filter(p => !(p instanceof Cesium.ParticleSystem));
  }
  
  currentRainParticleSystem = new Cesium.ParticleSystem({
    modelMatrix: Cesium.Matrix4.fromTranslation(scene.camera.position),
    speed: 15.0,
    lifetime: 1.5,
    emitter: new Cesium.BoxEmitter(new Cesium.Cartesian3(5000.0, 5000.0, 500.0)),
    startScale: 100.0,
    endScale: 20.0,
    image: '/data/img/particle_rain.png', // Path relatif ke public
    emissionRate: 1000.0,
    startColor: Cesium.Color.WHITE.withAlpha(0.4),
    endColor: Cesium.Color.WHITE.withAlpha(0.2),
    imageSize: new Cesium.Cartesian2(1.0, 15.0),
    updateCallback: (particle, dt) => {
      if (!particle.startVelocity) {
        particle.startVelocity = Cesium.Cartesian3.clone(particle.velocity);
        particle.dispersionAngle = Math.random() * Math.PI * 0.1; 
        particle.dispersionDirection = Math.random() * Math.PI * 2; 
      }
      const downwardVelocity = new Cesium.Cartesian3(
        Math.sin(particle.dispersionAngle) * Math.cos(particle.dispersionDirection),
        Math.sin(particle.dispersionAngle) * Math.sin(particle.dispersionDirection),
        -1.0
      );
      const velocityScale = 50.0;
      Cesium.Cartesian3.multiplyByScalar(downwardVelocity, velocityScale, particle.velocity);
      const windEffect = new Cesium.Cartesian3(
        Math.sin(Date.now() / 2000) * 0.5,
        Math.cos(Date.now() / 2000) * 0.5,
        0.0
      );
      Cesium.Cartesian3.add(particle.velocity, windEffect, particle.velocity);
    }
  });

  scene.primitives.add(currentRainParticleSystem);

  rainPreRenderListener = function() { 
    updateRainEmitterPosition(scene);
  };
  scene.preRender.addEventListener(rainPreRenderListener);

  scene.skyAtmosphere.hueShift = -0.97;
  scene.skyAtmosphere.saturationShift = -0.8;
  scene.skyAtmosphere.brightnessShift = -0.33;
  scene.fog.density = 0.001;
  scene.fog.minimumBrightness = 0.5;
}

export function removeRainEffect(scene) {
  if (currentRainParticleSystem) { 
    console.log("Menghentikan efek hujan (versi pengguna).");
    scene.primitives.remove(currentRainParticleSystem);
    currentRainParticleSystem = null; 
  }
  if (rainPreRenderListener) {
    scene.preRender.removeEventListener(rainPreRenderListener); 
    rainPreRenderListener = null;
  }

  scene.skyAtmosphere.hueShift = 0.0;
  scene.skyAtmosphere.saturationShift = 0.0;
  scene.skyAtmosphere.brightnessShift = 0.0;
  scene.fog.density = 0.0001; 
  scene.fog.minimumBrightness = 0.0;
}

export function addRainEffectForKecamatan(scene, kecamatanList) {
  // Hapus efek hujan lama jika ada
  removeRainEffectForKecamatan(scene);

  rainParticleSystems = kecamatanList.map(kec => {
    const particleSystem = new Cesium.ParticleSystem({
      modelMatrix: Cesium.Matrix4.fromTranslation(kec.position),
      speed: 15.0,
      lifetime: 1.5,
      emitter: new Cesium.BoxEmitter(new Cesium.Cartesian3(500.0, 500.0, 500.0)),
      startScale: 100.0,
      endScale: 20.0,
      image: '/data/img/particle_rain.png',
      emissionRate: 1000.0,
      startColor: Cesium.Color.WHITE.withAlpha(0.4),
      endColor: Cesium.Color.WHITE.withAlpha(0.2),
      imageSize: new Cesium.Cartesian2(1.0, 15.0),
    });
    scene.primitives.add(particleSystem);
    return particleSystem;
  });

  // (Opsional) Atur suasana langit dan fog seperti sebelumnya
  scene.skyAtmosphere.hueShift = -0.97;
  scene.skyAtmosphere.saturationShift = -0.8;
  scene.skyAtmosphere.brightnessShift = -0.33;
  scene.fog.density = 0.001;
  scene.fog.minimumBrightness = 0.5;
}

export function removeRainEffectForKecamatan(scene) {
  if (rainParticleSystems.length > 0) {
    rainParticleSystems.forEach(ps => scene.primitives.remove(ps));
    rainParticleSystems = [];
  }
  // Reset suasana langit dan fog
  scene.skyAtmosphere.hueShift = 0.0;
  scene.skyAtmosphere.saturationShift = 0.0;
  scene.skyAtmosphere.brightnessShift = 0.0;
  scene.fog.density = 0.0001;
  scene.fog.minimumBrightness = 0.0;
}