import React from 'react';

export default function StatusBadge({ status }) {
  const styles = {
    'Aberto': 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
    'Em andamento': 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20',
    'Resolvido': 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
    'Fechado': 'bg-slate-100 text-slate-600 border-slate-200 ring-1 ring-slate-400/20'
  };

  const dots = {
    'Aberto': 'bg-blue-500',
    'Em andamento': 'bg-amber-500 animate-pulse',
    'Resolvido': 'bg-emerald-500',
    'Fechado': 'bg-slate-400'
  };

  const styleClass = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const dotClass = dots[status] || 'bg-slate-400';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styleClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
      {status}
    </span>
  );
}
