import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ticket_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Busca notificações do usuário logado
  const fetchNotifications = useCallback(async () => {
    if (!localStorage.getItem('ticket_auth_token')) return;
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      // Ignora erro se não autenticado
    }
  }, []);

  // Verifica validade da sessão no início
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('ticket_auth_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('ticket_auth_user', JSON.stringify(res.data.user));
          await fetchNotifications();
        } catch (err) {
          setUser(null);
          localStorage.removeItem('ticket_auth_token');
          localStorage.removeItem('ticket_auth_user');
        }
      }
      setLoading(false);
    }

    checkAuth();
  }, [fetchNotifications]);

  // Polling de notificações a cada 30 segundos conforme especificação
  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  async function login(loginStr, senha) {
    const response = await api.post('/auth/login', { login: loginStr, senha });
    const { token, user: userData } = response.data;
    localStorage.setItem('ticket_auth_token', token);
    localStorage.setItem('ticket_auth_user', JSON.stringify(userData));
    setUser(userData);
    await fetchNotifications();
    return userData;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // continua mesmo com erro no server
    } finally {
      localStorage.removeItem('ticket_auth_token');
      localStorage.removeItem('ticket_auth_user');
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
    }
  }

  async function markNotificationAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: 1 } : n))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  }

  async function markAllNotificationsAsRead() {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, lida: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Erro ao marcar todas notificações como lidas:', err);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        notifications,
        unreadCount,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
