import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import NewTicket from './pages/NewTicket';
import Reports from './pages/Reports';
import Users from './pages/Users';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota Pública de Login */}
          <Route path="/login" element={<Login />} />

          {/* Rotas Protegidas sob Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Redirecionamento da raiz para Meus Tickets */}
            <Route index element={<Navigate to="/tickets" replace />} />

            {/* Cadastro de Ticket (todos os perfis) */}
            <Route
              path="tickets/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'tecnico', 'usuario']}>
                  <NewTicket />
                </ProtectedRoute>
              }
            />

            {/* Novos Tickets sem técnico (Admin e Técnico) */}
            <Route
              path="tickets/unassigned"
              element={
                <ProtectedRoute allowedRoles={['admin', 'tecnico']}>
                  <TicketList isUnassignedView={true} />
                </ProtectedRoute>
              }
            />

            {/* Meus Tickets (todos os perfis) */}
            <Route
              path="tickets"
              element={
                <ProtectedRoute allowedRoles={['admin', 'tecnico', 'usuario']}>
                  <TicketList isUnassignedView={false} />
                </ProtectedRoute>
              }
            />

            {/* Detalhe do Ticket (todos os perfis com controle fino interno) */}
            <Route
              path="tickets/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'tecnico', 'usuario']}>
                  <TicketDetail />
                </ProtectedRoute>
              }
            />

            {/* Relatório de Acompanhamento (apenas Admin) */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* Gestão de Usuários (apenas Admin) */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Rota coringa */}
          <Route path="*" element={<Navigate to="/tickets" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
