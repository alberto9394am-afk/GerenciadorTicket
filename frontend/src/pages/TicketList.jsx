import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Ticket, 
  Search, 
  Plus, 
  Filter, 
  Clock, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Hand,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

export default function TicketList({ isUnassignedView = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Ação de assumir ticket
  const [assumingId, setAssumingId] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/tickets';
      const params = new URLSearchParams();

      if (isUnassignedView) {
        params.append('view', 'unassigned');
      } else {
        if (user?.perfil === 'tecnico') {
          params.append('view', 'mine');
        }
      }

      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('prioridade', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);

      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await api.get(url);
      setTickets(res.data.tickets || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar lista de tickets.');
    } finally {
      setLoading(false);
    }
  }, [isUnassignedView, user?.perfil, statusFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  async function handleAssume(e, ticketId) {
    e.stopPropagation(); // Evita navegar para o detalhe
    setError('');
    setSuccessMsg('');
    setAssumingId(ticketId);

    try {
      const res = await api.post(`/tickets/${ticketId}/assume`);
      setSuccessMsg(res.data.message || 'Ticket assumido com sucesso!');
      // Atualiza a lista
      fetchTickets();
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response.data.error || 'Este ticket já foi assumido por outro técnico.');
      } else {
        setError(err.response?.data?.error || 'Falha ao assumir ticket.');
      }
    } finally {
      setAssumingId(null);
    }
  }

  const pageTitle = isUnassignedView ? 'Novos Tickets (Aguardando Atendimento)' : 'Meus Tickets';
  const pageSubtitle = isUnassignedView
    ? 'Tickets que ainda não possuem um técnico associado. Assuma o chamado para iniciar o atendimento.'
    : user?.perfil === 'usuario'
    ? 'Acompanhe o andamento dos chamados abertos por você.'
    : user?.perfil === 'tecnico'
    ? 'Tickets atribuídos a você sob sua responsabilidade.'
    : 'Visão geral de todos os chamados registrados no sistema.';

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">{pageSubtitle}</p>
        </div>

        <Link
          to="/tickets/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Criar Ticket</span>
        </Link>
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

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Busca por texto */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou descrição..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filtro por Status */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700"
          >
            <option value="">Todos os status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Resolvido">Resolvido</option>
            <option value="Fechado">Fechado</option>
          </select>
        </div>

        {/* Filtro por Prioridade */}
        <div className="w-full md:w-48">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700"
          >
            <option value="">Todas as prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>
      </div>

      {/* Tabela / Lista de Tickets */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-sm text-slate-500">Carregando chamados...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-base font-semibold text-slate-800">Nenhum ticket encontrado</h3>
            <p className="mt-1 text-sm text-slate-400">
              {isUnassignedView
                ? 'Excelente! Não há chamados aguardando atendimento no momento.'
                : 'Não há chamados com os filtros selecionados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">ID & Título</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5">Prioridade</th>
                  <th scope="col" className="px-6 py-3.5">Criador</th>
                  <th scope="col" className="px-6 py-3.5">Técnico</th>
                  <th scope="col" className="px-6 py-3.5">Data Criação</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">#{t.id}</span>
                        <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition">
                          {t.titulo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{t.descricao}</p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge prioridade={t.prioridade} />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs">
                      {t.criador_nome}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {t.tecnico_nome ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                          {t.tecnico_nome}
                        </span>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                          Aguardando
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                      {new Date(t.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {/* Se for técnico ou admin e ticket estiver sem técnico */}
                      {t.tecnico_id === null && (user?.perfil === 'tecnico' || user?.perfil === 'admin') ? (
                        <button
                          onClick={(e) => handleAssume(e, t.id)}
                          disabled={assumingId === t.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                        >
                          <Hand className="h-3.5 w-3.5" />
                          {assumingId === t.id ? 'Assumindo...' : 'Assumir'}
                        </button>
                      ) : (
                        <span className="text-slate-400 group-hover:text-indigo-600 transition inline-flex items-center text-xs font-medium">
                          Ver detalhe
                          <ChevronRight className="h-4 w-4 ml-0.5" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
