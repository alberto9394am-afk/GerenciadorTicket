import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Inbox, 
  Activity, 
  Users, 
  Filter, 
  RotateCcw
} from 'lucide-react';
import api from '../services/api';

export default function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const qs = params.toString();
      const url = qs ? `/reports/stats?${qs}` : '/reports/stats';

      const res = await api.get(url);
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar dados do relatório.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  function setDateRange(days) {
    if (days === null) {
      setStartDate('');
      setEndDate('');
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }

  const summary = stats?.summary || {
    total: 0,
    aberto: 0,
    em_andamento: 0,
    resolvido: 0,
    fechado: 0,
    avgResolutionFormatted: '0 min'
  };

  const byStatus = stats?.byStatus || {};
  const byPriority = stats?.byPriority || {};
  const byTechnician = stats?.byTechnician || [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Relatório de Acompanhamento
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Indicadores de desempenho, tempo médio de atendimento e volumetria por técnico e prioridade.
          </p>
        </div>

        {/* Botão Atualizar */}
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition self-start sm:self-auto"
        >
          <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Filtro por Período */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Filter className="h-4 w-4 text-indigo-600" />
            <span>Período:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-400 text-xs">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Atalhos Rápidos */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setDateRange(0)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            Hoje
          </button>
          <button
            onClick={() => setDateRange(7)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setDateRange(30)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            Últimos 30 dias
          </button>
          <button
            onClick={() => setDateRange(null)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
          >
            Todo o período
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            <Inbox className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{summary.total}</div>
          <span className="text-[11px] text-slate-400 mt-1">chamados abertos</span>
        </div>

        {/* Abertos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Abertos</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{summary.aberto}</div>
          <span className="text-[11px] text-slate-400 mt-1">aguardando início</span>
        </div>

        {/* Em Andamento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Em Atend.</span>
            <Activity className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{summary.em_andamento}</div>
          <span className="text-[11px] text-slate-400 mt-1">com técnico</span>
        </div>

        {/* Resolvidos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resolvidos</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{summary.resolvido}</div>
          <span className="text-[11px] text-slate-400 mt-1">solução informada</span>
        </div>

        {/* Fechados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fechados</span>
            <CheckCircle2 className="h-4 w-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-700">{summary.fechado}</div>
          <span className="text-[11px] text-slate-400 mt-1">concluídos/encerrados</span>
        </div>

        {/* Tempo Médio */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-900">Tempo Médio</span>
            <Clock className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-700">
            {summary.avgResolutionFormatted}
          </div>
          <span className="text-[11px] text-indigo-500 mt-1">para resolução</span>
        </div>
      </div>

      {/* Gráficos e Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600" />
            <span>Distribuição por Status</span>
          </h3>

          <div className="space-y-4">
            {[
              { label: 'Aberto', count: byStatus['Aberto'] || 0, color: 'bg-blue-500', barBg: 'bg-blue-100' },
              { label: 'Em andamento', count: byStatus['Em andamento'] || 0, color: 'bg-amber-500', barBg: 'bg-amber-100' },
              { label: 'Resolvido', count: byStatus['Resolvido'] || 0, color: 'bg-emerald-500', barBg: 'bg-emerald-100' },
              { label: 'Fechado', count: byStatus['Fechado'] || 0, color: 'bg-slate-400', barBg: 'bg-slate-100' }
            ].map((item) => {
              const pct = summary.total > 0 ? Math.round((item.count / summary.total) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.label}</span>
                    <span>{item.count} chamados ({pct}%)</span>
                  </div>
                  <div className={`w-full h-3 rounded-full ${item.barBg} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribuição por Prioridade */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <span>Distribuição por Prioridade</span>
          </h3>

          <div className="space-y-4">
            {[
              { label: 'Alta', count: byPriority['alta'] || 0, color: 'bg-rose-500', barBg: 'bg-rose-100' },
              { label: 'Média', count: byPriority['media'] || 0, color: 'bg-amber-500', barBg: 'bg-amber-100' },
              { label: 'Baixa', count: byPriority['baixa'] || 0, color: 'bg-emerald-500', barBg: 'bg-emerald-100' }
            ].map((item) => {
              const pct = summary.total > 0 ? Math.round((item.count / summary.total) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.label}</span>
                    <span>{item.count} chamados ({pct}%)</span>
                  </div>
                  <div className={`w-full h-3 rounded-full ${item.barBg} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabela de Produtividade por Técnico */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-800">Desempenho por Técnico</h3>
          </div>
          <span className="text-xs text-slate-400">Volumetria de chamados atendidos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">Técnico</th>
                <th scope="col" className="px-6 py-3.5 text-center">Total</th>
                <th scope="col" className="px-6 py-3.5 text-center">Em Aberto</th>
                <th scope="col" className="px-6 py-3.5 text-center">Em Andamento</th>
                <th scope="col" className="px-6 py-3.5 text-center">Resolvidos / Fechados</th>
                <th scope="col" className="px-6 py-3.5 text-right">Taxa Conclusão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {byTechnician.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                    Nenhum chamado no período selecionado.
                  </td>
                </tr>
              ) : (
                byTechnician.map((t, idx) => {
                  const resolucaoPct = t.total > 0 ? Math.round((t.resolvidos / t.total) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {t.tecnico_nome}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">
                        {t.total}
                      </td>
                      <td className="px-6 py-4 text-center text-blue-600 font-medium">
                        {t.abertos}
                      </td>
                      <td className="px-6 py-4 text-center text-amber-600 font-medium">
                        {t.em_andamento}
                      </td>
                      <td className="px-6 py-4 text-center text-emerald-600 font-bold">
                        {t.resolvidos}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {resolucaoPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
