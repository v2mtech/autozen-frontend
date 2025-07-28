import axios, { AxiosHeaders } from 'axios';

const api = axios.create({
  baseURL: 'https://0d558e588f99.ngrok-free.app',
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@nanisound:token');

  if (token) {
    // Garante que o cabeçalho de autorização seja definido corretamente
    if (!config.headers) {
      // Cria uma nova instância de AxiosHeaders em vez de um objeto vazio
      config.headers = new AxiosHeaders();
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;