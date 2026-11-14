import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Interceptor para adicionar o token de autenticação em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ticket_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratar respostas e erros de autorização
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se não for rota de login, limpa sessão e redireciona
      const isAuthRoute = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/password-request');
      if (!isAuthRoute) {
        localStorage.removeItem('ticket_auth_token');
        localStorage.removeItem('ticket_auth_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
