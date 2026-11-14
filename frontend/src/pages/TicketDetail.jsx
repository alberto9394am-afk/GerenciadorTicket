import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  UserCheck, 
  Clock, 
  Calendar, 
  CheckCircle, 
  RotateCcw, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Hand,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Modal from '../components/Modal';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Novo comentário
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Ações de status
  const [actionLoading, setActionLoading] = useState(false);

  // Modal de Reabertura (Usuário)
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Modal de Exclusão (Admin)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Admin status select
  const [adminStatusSelect, setAdminStatusSelect] = useState('');

  const fetchTicketData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
      setComments(res.data.comments || []);
      setAdminStatusSelect(res.data.ticket.status);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar detalhes do ticket.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

  // Enviar Comentário
  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/tickets/${id}/comments`, {
        mensagem: newComment.trim()
      });
      setComments([...comments, res.data.comment]);
      setNewComment('');
      setSuccessMsg('Comentário adicionado com sucesso!');
    } catch (err) {
      setError(err.response?.data?.error || 'Falha ao adicionar comentário.');
    } finally {
      setSubmittingComment(false);
    }
  }

  // Assumir ticket (Técnico / Admin)
  async function handleAssume() {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/tickets/${id}/assume`);
      setSuccessMsg('Você assumiu este ticket com sucesso! O status foi alterado para Em andamento.');
      fetchTicketData();
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response.data.error || 'Este ticket já foi assumido por outro técnico.');
      } else {
        setError(err.response?.data?.error || 'Falha ao assumir ticket.');
      }
    } finally {
      setActionLoading(false);
    }
  }

  // Atualizar Status (Técnico / Usuário)
  async function handleStatusChange(newStatus, motivo = undefined) {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = { status: newStatus };
      if (motivo) payload.motivo = motivo;

      const res = await api.patch(`/tickets/${id}/status`, payload);
      setSuccessMsg(res.data.message || 'Status atualizado com sucesso.');
      setIsReopenModalOpen(false);
      setReopenReason('');
      fetchTicketData();
    } catch (err) {
      setError(err.response?.data?.error || 'Falha ao atualizar status.');
    } finally {
      setActionLoading(false);
    }
  }

  // Excluir Ticket (Admin)
  async function handleDeleteTicket() {
    setActionLoading(true);
    setError('');

    try {
      await api.delete(`/tickets/${id}`);
      setIsDeleteModalOpen(false);
      navigate('/tickets', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao excluir ticket.');
      setIsDeleteModalOpen(false);
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-2 text-sm text-slate-500">Carregando detalhes do ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-2 text-lg font-bold text-slate-800">Ticket não encontrado</h2>
        <p className="mt-1 text-sm text-slate-500">{error || 'O ticket solicitado não existe ou foi excluído.'}</p>
        <button
          onClick={() => navigate('/tickets')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
        >
          Voltar para Meus Tickets
        </button>
      </div>
    );
  }

  // Regras de Comentário
  const isClosed = ticket.status === 'Fechado';
  const canComment =
    (user.perfil === 'admin') ||
    (user.perfil === 'usuario' && !isClosed) ||
    (user.perfil === 'tecnico' && ticket.tecnico_id === user.id && !isClosed);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para a lista</span>
        </button>

        {/* Botão de Exclusão (Admin) */}
        {user.perfil === 'admin' && (
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold border border-rose-200 transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Excluir Ticket</span>
          </button>
        )}
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

      {/* Card Principal do Ticket */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cabeçalho do Ticket */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
                #{ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge prioridade={ticket.prioridade} />
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Criado em {new Date(ticket.created_at).toLocaleString('pt-BR')}
              </span>
              {ticket.concluido_em && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Concluído em {new Date(ticket.concluido_em).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">{ticket.titulo}</h1>

          {/* Dados do Criador e Técnico */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Solicitante:</span>
              <span className="font-semibold text-slate-700">{ticket.criador_nome}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Técnico Responsável:</span>
              {ticket.tecnico_nome ? (
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                  {ticket.tecnico_nome}
                </span>
              ) : (
                <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Nenhum técnico associado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Descrição do Problema */}
        <div className="p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Descrição do Chamado
          </h3>
          <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {ticket.descricao}
          </p>
        </div>

        {/* Barra de Ações de Transição de Status */}
        <div className="p-4 sm:p-6 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs font-medium text-slate-500">
            Status atual: <strong className="text-slate-800">{ticket.status}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Botão Assumir para Técnico ou Admin caso esteja sem técnico */}
            {ticket.tecnico_id === null && (user.perfil === 'tecnico' || user.perfil === 'admin') && (
              <button
                onClick={handleAssume}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
              >
                <Hand className="h-4 w-4" />
                <span>Assumir este Ticket</span>
              </button>
            )}

            {/* 2. Ações do Técnico responsável */}
            {user.perfil === 'tecnico' && ticket.tecnico_id === user.id && (
              <>
                {ticket.status === 'Aberto' && (
                  <button
                    onClick={() => handleStatusChange('Em andamento')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    Iniciar Atendimento
                  </button>
                )}

                {ticket.status === 'Em andamento' && (
                  <button
                    onClick={() => handleStatusChange('Resolvido')}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirmar Solução / Conclusão</span>
                  </button>
                )}

                {ticket.status === 'Resolvido' && (
                  <span className="text-xs text-slate-500 italic bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    Aguardando confirmação de encerramento pelo solicitante.
                  </span>
                )}
              </>
            )}

            {/* 3. Ações do Usuário Criador (somente quando status é Resolvido) */}
            {user.perfil === 'usuario' && ticket.criador_id === user.id && ticket.status === 'Resolvido' && (
              <>
                <button
                  onClick={() => setIsReopenModalOpen(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-semibold border border-rose-200 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reabrir Chamado</span>
                </button>

                <button
                  onClick={() => handleStatusChange('Fechado')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Confirmar Encerramento</span>
                </button>
              </>
            )}

            {/* 4. Ações do Admin (altera livremente) */}
            {user.perfil === 'admin' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">Alterar status:</span>
                <select
                  value={adminStatusSelect}
                  onChange={(e) => {
                    setAdminStatusSelect(e.target.value);
                    handleStatusChange(e.target.value);
                  }}
                  disabled={actionLoading}
                  className="py-1.5 px-3 border border-slate-300 rounded-lg text-sm font-medium bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Aberto">Aberto</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Resolvido">Resolvido</option>
                  <option value="Fechado">Fechado</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Comentários / Histórico */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Comentários e Respostas</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">{comments.length} interação{comments.length !== 1 ? 'ões' : ''}</span>
        </div>

        {/* Lista de Comentários em Ordem Cronológica */}
        <div className="p-6 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhum comentário registrado ainda.
            </div>
          ) : (
            comments.map((c) => {
              const isCreator = c.autor_id === ticket.criador_id;
              const roleBadge = c.autor_perfil === 'admin' ? 'bg-indigo-100 text-indigo-800' : c.autor_perfil === 'tecnico' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800';

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition ${
                    isCreator ? 'bg-slate-50/70 border-slate-200/80' : 'bg-indigo-50/30 border-indigo-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">{c.autor_nome}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${roleBadge}`}>
                        {c.autor_perfil}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(c.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-slate-700 text-sm whitespace-pre-wrap">{c.mensagem}</p>
                </div>
              );
            })
          )}

          {/* Formulário de Novo Comentário */}
          <div className="pt-6 border-t border-slate-100">
            {canComment ? (
              <form onSubmit={handleAddComment} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Adicionar Comentário
                </label>
                <textarea
                  rows={3}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva sua mensagem ou atualização sobre este chamado..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{submittingComment ? 'Enviando...' : 'Enviar Resposta'}</span>
                  </button>
                </div>
              </form>
            ) : isClosed && user.perfil !== 'admin' ? (
              <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                <span>Este chamado está encerrado. Comentários estão bloqueados.</span>
              </div>
            ) : user.perfil === 'tecnico' && ticket.tecnico_id !== user.id ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center text-sm text-amber-700 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Você precisa assumir a responsabilidade deste chamado antes de comentar.</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal de Reabertura (Usuário com motivo obrigatório) */}
      <Modal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title="Reabrir Chamado"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Informe detalhadamente o motivo da reabertura. O chamado retornará para o status <strong>"Em andamento"</strong> sob responsabilidade do mesmo técnico.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Motivo da Reabertura <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Explique o que ainda não foi solucionado..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReopenModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={actionLoading || !reopenReason.trim()}
              onClick={() => handleStatusChange('Em andamento', reopenReason.trim())}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
            >
              {actionLoading ? 'Reabrindo...' : 'Confirmar Reabertura'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão (Admin) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Chamado (Exclusão Lógica)"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
            <p>
              Tem certeza que deseja apagar o ticket <strong>#{ticket.id} - "{ticket.titulo}"</strong>?
              O registro será ocultado de todas as listagens e relatórios, mas o histórico de dados permanecerá preservado no banco.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDeleteTicket}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
            >
              {actionLoading ? 'Excluindo...' : 'Sim, Excluir Ticket'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
