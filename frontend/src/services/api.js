/**
 * Cliente API para comunicação com o backend
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function testConnection(headless = false) {
  const { data } = await api.post('/api/auth/test', { headless });
  return data;
}

export async function searchRas(ras, headless = false) {
  const { data } = await api.post('/api/ra/search', { ras, headless });
  return data;
}

export async function exportRas(ras, outputDir, headless = false) {
  const { data } = await api.post('/api/ra/export', { ras, outputDir, headless }, {
    timeout: 600000, // 10 min para exportação completa
  });
  return data;
}

export async function healthCheck() {
  const { data } = await api.get('/api/health');
  return data;
}

export default api;
