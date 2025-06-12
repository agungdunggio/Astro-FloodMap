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
            <h5>{{ dataKecamatan.namaResmi.replace('Kecamatan ', '') }}</h5>
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(20px);
}

.modal-content {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding-bottom: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24px 24px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.modal-header h4 {
  margin: 0;
  font-size: 1.5rem;
  color: #000000;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, sans-serif;
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
  transition: color 0.2s;
  padding: 8px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
}

.modal-body.kecamatan-scroll {
  padding: 32px;
  max-height: 70vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
  scrollbar-width: thin;
  scrollbar-color: rgba(59, 130, 246, 0.5) rgba(241, 245, 249, 0.5);
}

.kecamatan-forecast-block {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  margin: 24px 0;
}

.kecamatan-forecast-block h5 {
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  color: #000000;
  font-weight: 600;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, sans-serif;
}

.forecast-row {
  display: flex;
  padding-bottom: 16px;
  justify-items: center;
  overflow-x: auto;
  gap: 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(59, 130, 246, 0.5) transparent;
}

.forecast-card {
  min-width: 140px;
  max-width: 160px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 20px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.forecast-card:hover {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 123, 255, 0.15);
}

.forecast-label {
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
  white-space: normal;
  font-size: 1rem;
  color: #1e3a8a;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, sans-serif;
}

.forecast-icon {
  width: 56px;
  height: 56px;
  margin: 12px 0;
  border-radius: 16px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
}

.forecast-bottom-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.5);
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  white-space: nowrap;
}

.forecast-rain,
.forecast-slash,
.forecast-temp {
  display: inline;
  vertical-align: middle;
  white-space: nowrap;
}

.forecast-rain {
  color: #3b82f6;
  font-size: 0.95rem;
  font-weight: 500;
}

.forecast-slash {
  color: #6b7280;
  font-size: 0.95rem;
  opacity: 0.6;
}

.forecast-temp {
  color: #f43f5e;
  font-size: 0.95rem;
  font-weight: 500;
}

.no-data {
  font-size: 0.95rem;
  color: #6b7280;
  text-align: center;
  margin: 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, sans-serif;
}

.loading-message {
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, sans-serif;
}

@media (max-width: 600px) {
  .modal-content {
    width: 98%;
    max-height: 95vh;
    border-radius: 20px;
  }

  .modal-header {
    padding: 20px 24px;
  }

  .modal-body.kecamatan-scroll {
    padding: 24px;
  }

  .forecast-card {
    min-width: 120px;
    max-width: 140px;
    padding: 16px 12px;
  }

  .forecast-label {
    font-size: 0.9rem;
  }

  .forecast-icon {
    width: 48px;
    height: 48px;
  }

  .forecast-bottom-row {
    padding: 6px 12px;
  }

  .forecast-rain,
  .forecast-slash,
  .forecast-temp {
    font-size: 0.85rem;
  }
}
</style>