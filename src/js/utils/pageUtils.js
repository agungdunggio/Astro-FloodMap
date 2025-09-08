// src/js/utils/pageUtils.js

/**
 * Utility functions untuk page initialization
 */

/**
 * Initialize Cesium page dengan error handling yang comprehensive
 * @param {Function} initializerFunction - Function yang akan menginisialisasi page
 * @param {string} pageName - Nama halaman untuk logging
 */
export async function initializePage(initializerFunction, pageName = 'Cesium Page') {
  try {
    console.log(`🚀 Memulai inisialisasi ${pageName}...`);
    
    const viewer = await initializerFunction();
    
    if (viewer) {
      console.log(`✅ ${pageName} berhasil diinisialisasi`);
      return viewer;
    } else {
      throw new Error(`Viewer tidak berhasil dibuat untuk ${pageName}`);
    }
  } catch (error) {
    console.error(`❌ Gagal menginisialisasi ${pageName}:`, error);
    
    // Optional: Show user-friendly error message
    showErrorMessage(`Gagal memuat ${pageName}. Silakan refresh halaman.`);
    
    return null;
  }
}

/**
 * Show error message to user (optional UI feedback)
 * @param {string} message 
 */
function showErrorMessage(message) {
  // Create a simple error notification
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  `;
  errorDiv.textContent = message;
  
  document.body.appendChild(errorDiv);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

/**
 * Generic script loader dengan error handling
 * @param {Function} initFunction - Function yang akan dijalankan
 * @param {string} scriptName - Nama script untuk logging  
 */
export function loadScript(initFunction, scriptName = 'Script') {
  // Ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      executeScript(initFunction, scriptName);
    });
  } else {
    executeScript(initFunction, scriptName);
  }
}

/**
 * Execute script dengan error handling
 * @param {Function} initFunction 
 * @param {string} scriptName 
 */
function executeScript(initFunction, scriptName) {
  try {
    console.log(`📜 Memuat ${scriptName}...`);
    initFunction();
    console.log(`✅ ${scriptName} berhasil dimuat`);
  } catch (error) {
    console.error(`❌ Gagal memuat ${scriptName}:`, error);
  }
}
