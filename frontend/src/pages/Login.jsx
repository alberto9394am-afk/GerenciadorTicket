import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Lock, User, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [formLogin, setFormLogin] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado da modal de solicitação de troca de senha
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotLogin, setForgotLogin] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // Se já estiver logado, redireciona
  if (user) {
    navigate('/tickets', { replace: true });
    return null;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formLogin, formSenha);
      navigate('/tickets');
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');

    try {
      const res = await api.post('/auth/password-request', { login: forgotLogin });
      setForgotMessage(res.data.message || 'Solicitação registrada com sucesso.');
    } catch (err) {
      setForgotMessage('Solicitação registrada. Se o login existir, os administradores foram notificados.');
    } finally {
      setForgotLoading(false);
    }
  }

  function fillDemoUser(loginVal, senhaVal) {
    setFormLogin(loginVal);
    setFormSenha(senhaVal);
    setError('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <Ticket className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white">
          Sistema de Helpdesk
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Acesse para gerenciar seus tickets de suporte
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Login / Usuário
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formLogin}
                  onChange={(e) => setFormLogin(e.target.value)}
                  placeholder="Seu login de acesso"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotLogin(formLogin);
                    setForgotMessage('');
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  Solicitar troca da senha
                </button>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={formSenha}
                  onChange={(e) => setFormSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>

          {/* Atalhos para preenchimento rápido (Demo) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-400 mb-2.5 text-center uppercase tracking-wider">
              Contas de demonstração
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoUser('admin', 'admin123')}
                className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded text-xs font-medium text-center transition"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoUser('tecnico', 'tecnico123')}
                className="py-1.5 px-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded text-xs font-medium text-center transition"
              >
                Técnico
              </button>
              <button
                type="button"
                onClick={() => fillDemoUser('usuario', 'usuario123')}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded text-xs font-medium text-center transition"
              >
                Usuário
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Solicitar Troca de Senha */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Solicitar Troca de Senha"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Informe o seu login de acesso. A solicitação será registrada e encaminhada aos administradores do sistema.
          </p>

          {forgotMessage && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-sm text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{forgotMessage}</span>
            </div>
          )}

          {!forgotMessage ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Login Informado
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={forgotLogin}
                    onChange={(e) => setForgotLogin(e.target.value)}
                    placeholder="Digite seu login cadastrado"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
