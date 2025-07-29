import axios, { AxiosHeaders } from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333'
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@nanisound:token');

  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
