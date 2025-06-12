<template>
  <div id="forecastModal" class="modal" :style="{ display: isModalVisible ? 'flex' : 'none' }">
    <div class="modal-content">
      <div class="modal-header">
        <h4>Prakiraan Cuaca Agregat (Kota Gorontalo)</h4>
        <button id="closeModalBtn" class="close-btn" aria-label="Tutup Modal" @click="closeModal">×</button>
      </div>
      <div id="bmkgAggregatedForecastContent" class="modal-body kecamatan-scroll overflow-x-scroll">
        <div v-if="Object.keys(forecasts).length > 0" class="forecast-row-horizontal">
          <div
            class="kecamatan-forecast-block"
            v-for="[kecamatanKey, dataKecamatan] in Object.entries(forecasts)"
            :key="kecamatanKey"
          >
            <h5>{{ dataKecamatan.namaResmi }}</h5>
            <div v-if="dataKecamatan.forecasts && dataKecamatan.forecasts.length > 0" class="forecast-row">
              <div
                class="forecast-card"
                v-for="(item, idx) in dataKecamatan.forecasts.slice(0, 17)"
                :key="idx"
                v-animate="{ enter: 'transition ease-out duration-300', leave: 'transition ease-in duration-200', enterStart: 'opacity-0 transform scale-90', enterEnd: 'opacity-100 transform scale-100', leaveStart: 'opacity-100 transform scale-100', leaveEnd: 'opacity-0 transform scale-90' }"
              >
                <div class="forecast-label">{{ formatDateTime(item.localDateTime) }}</div>
                <img
                  :src="item.iconUrl || '/placeholder-icon.png'"
                  :alt="item.weatherDesc || 'Ikon cuaca'"
                  class="forecast-icon"
                />
                <div class="forecast-bottom-row">
                  <span class="forecast-rain">{{ item.totalPrecipitation != null ? `${item.totalPrecipitation} mm` : '-' }}</span>
                  <span class="forecast-slash"> / </span>
                  <span class="forecast-temp">{{ item.temperature != null ? `${item.temperature}°C` : '-' }}</span>
                </div>
              </div>
            </div>
            <p v-else class="no-data">Tidak ada data prakiraan untuk kecamatan ini.</p>
          </div>
        </div>
        <div v-else class="loading-message">
          Tidak ada data prakiraan untuk ditampilkan.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue';

export default defineComponent({
  name: 'ForecastModal',
  props: {
    aggregatedData: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const forecasts = ref(props.aggregatedData || {});
    const isModalVisible = ref(false);

    const formatDateTime = (dateTime) => {
      const localDateTime = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
      const isValid = localDateTime instanceof Date && !isNaN(localDateTime.getTime());
      if (!isValid) return 'Waktu tidak valid';
      const dateStr = localDateTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const hourStr = localDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return `${dateStr} ${hourStr}`;
    };

    const closeModal = () => {
      isModalVisible.value = false;
    };

    onMounted(() => {
      // Listener untuk event updateForecastData
      window.addEventListener('updateForecastData', (event) => {
        forecasts.value = event.detail || {};
        isModalVisible.value = true;
      });

      // Listener untuk klik di luar modal
      const modal = document.getElementById('forecastModal');
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            isModalVisible.value = false;
          }
        });
      }
    });

    return {
      forecasts,
      isModalVisible,
      formatDateTime,
      closeModal,
    };
  },
  directives: {
    animate: {
      beforeMount(el, binding) {
        const { enter, leave, enterStart, enterEnd, leaveStart, leaveEnd } = binding.value;
        el.dataset.enter = enter;
        el.dataset.leave = leave;
        el.dataset.enterStart = enterStart;
        el.dataset.enterEnd = enterEnd;
        el.dataset.leaveStart = leaveStart;
        el.dataset.leaveEnd = leaveEnd;
      },
      mounted(el) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              el.className = `${el.className} ${el.dataset.enter} ${el.dataset.enterStart}`;
              setTimeout(() => {
                el.className = `${el.className.replace(el.dataset.enterStart, '')} ${el.dataset.enterEnd}`;
              }, 0);
            } else {
              el.className = `${el.className} ${el.dataset.leave} ${el.dataset.leaveStart}`;
              setTimeout(() => {
                el.className = `${el.className.replace(el.dataset.leaveStart, '')} ${el.dataset.leaveEnd}`;
              }, 0);
            }
          });
        });
        observer.observe(el);
      },
    },
  },
});
</script>

<style scoped>
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #ffffff;
  border-radius: 16px;
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding-bottom: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f0f4ff;
  border-radius: 16px 16px 0 0;
}

.modal-header h4 {
  margin: 0;
  font-size: 1.5rem;
  color: #000000;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.forecast-row-horizontal {
    display: flex;
    flex-direction: column;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #1e3a8a;
  font-weight: 600;
  transition: color 0.2s, transform 0.2s;
}

.close-btn:hover {
  color: #dc2626;
  transform: scale(1.1);
}

.modal-body.kecamatan-scroll {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  scrollbar-width: thin;
  scrollbar-color: #3b82f6 #f1f5f9;
}

.kecamatan-forecast-block {
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  transition: transform 0.2s;
}

.kecamatan-forecast-block:hover {
  transform: translateY(-2px);
}

.kecamatan-forecast-block h5 {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  color: #000000;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.forecast-row {
    display: flex;
    padding-bottom: 12px;
    justify-items: center;
    overflow-x: scroll;
    gap: 20px;
}

.forecast-card {
  min-width: 120px;
  max-width: 140px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(200, 220, 255, 0.6));
  backdrop-filter: blur(8px);
  border-radius: 16px;
  padding: 14px 12px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1rem;
  color: #1e3a8a;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: 100%;
  position: relative;
  overflow: hidden;
}

.forecast-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.3), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.forecast-card:hover::before {
  opacity: 1;
}

.forecast-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 10px 25px rgba(0, 123, 255, 0.3);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(180, 200, 255, 0.7));
}

.forecast-label {
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
  white-space: normal;
  font-size: 0.95rem;
  color: #2c5282;
}

.forecast-icon {
  width: 48px;
  height: 48px;
  margin: 8px 0;
  border-radius: 12px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  transition: transform 0.3s ease;
}

.forecast-card:hover .forecast-icon {
  transform: scale(1.1);
}

.forecast-bottom-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
  margin-top: 6px;
}

.forecast-rain {
  color: #3b82f6;
  font-size: 0.9rem;
}

.forecast-slash {
  color: #6b7280;
  font-size: 0.9rem;
}

.forecast-temp {
  color: #f43f5e;
  font-size: 0.9rem;
}

.no-data {
  font-size: 0.95rem;
  color: #6b7280;
  text-align: center;
  margin: 16px 0;
}

.loading-message {
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
  padding: 24px;
}

@media (max-width: 600px) {
  .modal-content {
    width: 98%;
    max-height: 95vh;
  }

  .forecast-card {
    min-width: 90px;
    max-width: 100px;
    padding: 10px 8px;
  }

  .forecast-label {
    font-size: 0.8rem;
  }

  .forecast-icon {
    width: 40px;
    height: 40px;
  }

  .forecast-bottom-row {
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .forecast-rain,
  .forecast-slash,
  .forecast-temp {
    font-size: 0.8rem;
  }
}
</style>