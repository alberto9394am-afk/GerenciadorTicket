import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function NewTicket() {
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/tickets', {
        titulo,
        descricao,
        prioridade
      });
      const createdTicket = res.data.ticket;
      navigate(`/tickets/${createdTicket.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao abrir o ticket. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Botão Voltar */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar</span>
      </button>

      {/* Card do Formulário */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <PlusCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Novo Chamado de Suporte</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Preencha os detalhes do problema ou solicitação
            </p>
          </div>
        </div>

        {error && (
          <div className="m-6 mb-0 rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Título do Ticket <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={150}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Falha na conexão com a impressora do 2º andar"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Prioridade <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'baixa', label: 'Baixa', desc: 'Pode aguardar', border: 'border-emerald-300', bg: 'peer-checked:bg-emerald-50 peer-checked:border-emerald-500' },
                { id: 'media', label: 'Média', desc: 'Impacto moderado', border: 'border-amber-300', bg: 'peer-checked:bg-amber-50 peer-checked:border-amber-500' },
                { id: 'alta', label: 'Alta', desc: 'Urgente / Bloqueio', border: 'border-rose-300', bg: 'peer-checked:bg-rose-50 peer-checked:border-rose-500' },
              ].map((p) => (
                <label
                  key={p.id}
                  className="relative flex flex-col p-3.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition border-slate-200 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/40"
                >
                  <input
                    type="radio"
                    name="prioridade"
                    value={p.id}
                    checked={prioridade === p.id}
                    onChange={(e) => setPrioridade(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold text-slate-800">{p.label}</span>
                  <span className="text-xs text-slate-400 mt-0.5">{p.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Descrição Detalhada <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              minLength={5}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o problema com o máximo de detalhes possível, incluindo mensagens de erro observadas..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Criando Ticket...' : 'Cadastrar Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
