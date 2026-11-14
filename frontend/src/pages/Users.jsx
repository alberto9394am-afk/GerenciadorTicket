import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  Wrench, 
  User, 
  Clock, 
  CheckCheck,
  RotateCw
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Users() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'requests'

  // Dados dos usuários
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Dados de solicitações de senha
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Mensagens globais
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal Novo Usuário
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [newPerfil, setNewPerfil] = useState('usuario');
  const [creatingUser, setCreatingUser] = useState(false);

  // Modal Reset de Senha
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Carregar lista de usuários
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar usuários.');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Carregar solicitações de troca de senha
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await api.get('/users/password-requests/list');
      setRequests(res.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar solicitações de senha.');
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, [fetchUsers, fetchRequests]);

  // Criar Usuário
  async function handleCreateUser(e) {
    e.preventDefault();
    setCreatingUser(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.post('/users', {
        nome: newNome,
        login: newLogin,
        senha: newSenha,
        perfil: newPerfil
      });
      setSuccessMsg(`Usuário @${newLogin} cadastrado com sucesso!`);
      setIsNewUserModalOpen(false);
      setNewNome('');
      setNewLogin('');
      setNewSenha('');
      setNewPerfil('usuario');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Falha ao cadastrar usuário.');
    } finally {
      setCreatingUser(false);
    }
  }

  // Ativar / Desativar Usuário
  async function handleToggleStatus(targetUser) {
    const novoStatus = targetUser.ativo === 1 ? 0 : 1;
    setError('');
    setSuccessMsg('');

    try {
      await api.patch(`/users/${targetUser.id}/status`, { ativo: novoStatus });
      setSuccessMsg(`Usuário @${targetUser.login} foi ${novoStatus === 1 ? 'ativado' : 'desativado'}.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao alterar status do usuário.');
    }
  }

  // Resetar Senha
  async function handleResetPassword(e) {
    e.preventDefault();
    if (!resetTargetUser) return;

    setResettingPassword(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.post(`/users/${resetTargetUser.id}/reset-password`, {
        nova_senha: newPasswordVal
      });
      setSuccessMsg(`Senha do usuário @${resetTargetUser.login} redefinida com sucesso!`);
      setIsResetModalOpen(false);
      setResetTargetUser(null);
      setNewPasswordVal('');
      fetchRequests(); // Atualiza caso tenha sido solicitado
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao redefinir senha.');
    } finally {
      setResettingPassword(false);
    }
  }

  // Marcar solicitação como resolvida
  async function handleResolveRequest(requestId) {
    setError('');
    setSuccessMsg('');

    try {
      await api.patch(`/users/password-requests/${requestId}/resolve`);
      setSuccessMsg('Solicitação marcada como resolvida.');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao resolver solicitação.');
    }
  }

  const pendingRequestsCount = requests.filter((r) => r.status === 'pendente').length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gerenciamento de Usuários
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle de acessos, perfis, status ativo/inativo e redefinição de senhas.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setSuccessMsg('');
            setIsNewUserModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Abas */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UsersIcon className="h-4 w-4" />
          <span>Usuários Cadastrados</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'requests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Solicitações de Troca de Senha</span>
          {pendingRequestsCount > 0 && (
            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Conteúdo da Aba 1: Usuários */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loadingUsers ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-2 text-sm text-slate-500">Carregando usuários...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Nome / Login</th>
                    <th className="px-6 py-3.5">Perfil</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Data Cadastro</th>
                    <th className="px-6 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map((u) => {
                    const roleBadge =
                      u.perfil === 'admin'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : u.perfil === 'tecnico'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{u.nome}</div>
                          <div className="text-xs text-slate-400">@{u.login}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${roleBadge}`}>
                            {u.perfil}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.ativo === 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Inativo
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          {/* Botão Resetar Senha */}
                          <button
                            onClick={() => {
                              setResetTargetUser(u);
                              setNewPasswordVal('');
                              setIsResetModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                            title="Definir nova senha"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                            <span>Resetar Senha</span>
                          </button>

                          {/* Botão Ativar / Desativar */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition border ${
                              u.ativo === 1
                                ? 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {u.ativo === 1 ? 'Desativar' : 'Ativar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 2: Solicitações de Troca de Senha */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loadingRequests ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-2 text-sm text-slate-500">Carregando solicitações...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <h3 className="mt-2 text-base font-semibold text-slate-800">
                Nenhuma solicitação de senha registrada
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Todas as solicitações de recuperação foram atendidas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Login Informado</th>
                    <th className="px-6 py-3.5">Usuário Localizado</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Data da Solicitação</th>
                    <th className="px-6 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs">
                        {r.login_informado}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {r.usuario_nome ? (
                          <div>
                            <span className="font-semibold text-slate-800 text-xs">{r.usuario_nome}</span>
                            <span className="text-[11px] text-slate-400 block uppercase">perfil: {r.usuario_perfil}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-500 italic">Login não cadastrado</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {r.status === 'pendente' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pendente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Resolvida
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleString('pt-BR')}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        {r.status === 'pendente' && (
                          <>
                            {r.user_id && (
                              <button
                                onClick={() => {
                                  const target = users.find((u) => u.id === r.user_id) || {
                                    id: r.user_id,
                                    login: r.login_informado,
                                    nome: r.usuario_nome
                                  };
                                  setResetTargetUser(target);
                                  setNewPasswordVal('');
                                  setIsResetModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                <span>Resetar Senha</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleResolveRequest(r.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                            >
                              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Marcar Resolvida</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Novo Usuário */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Cadastrar Novo Usuário"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              placeholder="Ex: Carlos Oliveira"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Login de Acesso <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={newLogin}
              onChange={(e) => setNewLogin(e.target.value.toLowerCase().trim())}
              placeholder="Ex: coliveira"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Senha Inicial <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newSenha}
              onChange={(e) => setNewSenha(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Perfil de Acesso <span className="text-rose-500">*</span>
            </label>
            <select
              value={newPerfil}
              onChange={(e) => setNewPerfil(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="usuario">Usuário (Solicitante de chamados)</option>
              <option value="tecnico">Técnico (Atendimento de chamados)</option>
              <option value="admin">Administrador (Gestão total do sistema)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewUserModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creatingUser}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {creatingUser ? 'Salvando...' : 'Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reset de Senha */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Redefinir Senha do Usuário"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-slate-600">
            Defina uma nova senha para o usuário <strong>{resetTargetUser?.nome}</strong> (@{resetTargetUser?.login}).
            Ao confirmar, todas as sessões ativas do usuário serão revogadas.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nova Senha <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPasswordVal}
              onChange={(e) => setNewPasswordVal(e.target.value)}
              placeholder="Digite a nova senha (mín. 6 caracteres)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={resettingPassword}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {resettingPassword ? 'Atualizando...' : 'Definir Senha'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
