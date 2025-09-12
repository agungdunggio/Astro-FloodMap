// src/js/fetch/lstmPredictionApi.js

/**
 * API client untuk LSTM prediction service
 */

const LSTM_API_BASE_URL = import.meta.env.PUBLIC_LSTM_URL_API || 'http://127.0.0.1:8000';

/**
 * Fetch LSTM prediction data
 * @param {number} nDays - Number of days to predict (default: 7)
 * @returns {Promise<Object>} Prediction data
 */
export async function fetchLSTMPrediction(nDays = 7) {
  const response = await fetch(`${LSTM_API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      n_days: nDays
    })
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle error response format
    if (data.detail && Array.isArray(data.detail) && data.detail.length > 0) {
      const errorMsg = data.detail[0].msg || `HTTP error! status: ${response.status}`;
      throw new Error(errorMsg);
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
  
  // Check success response format
  if (!data.status) {
    throw new Error(data.message || 'Failed to get prediction data');
  }

  return data;
}


/**
 * Format prediction data untuk chart
 * @param {Object} apiResponse - Response dari API
 * @returns {Object} Formatted data untuk chart
 */
export function formatPredictionForChart(apiResponse) {
  if (!apiResponse.data || apiResponse.data.length === 0) {
    return { labels: [], values: [], metadata: null };
  }

  const predictionData = apiResponse.data[0];
  const predictions = predictionData.predictions || [];

  return {
    labels: predictions.map(p => formatDateForDisplay(p.date)),
    values: predictions.map(p => p.value),
    metadata: {
      location: predictionData.location,
      unit: predictionData.unit,
      model: predictionData.model_used,
      startDate: predictionData.prediction_start,
      endDate: predictionData.prediction_end,
      totalDays: predictions.length
    }
  };
}

/**
 * Format date untuk display (DD/MM)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Get summary statistics dari prediction data
 * @param {Array} predictions - Array of prediction objects
 * @returns {Object} Summary statistics
 */
export function getPredictionSummary(predictions) {
  if (!predictions || predictions.length === 0) {
    return { min: 0, max: 0, avg: 0, total: 0 };
  }

  const values = predictions.map(p => p.value);
  
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    total: values.reduce((a, b) => a + b, 0)
  };
}



