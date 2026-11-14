import React from 'react';

export default function PriorityBadge({ prioridade }) {
  const styles = {
    'baixa': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'media': 'bg-amber-50 text-amber-700 border-amber-200',
    'alta': 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20'
  };

  const labels = {
    'baixa': 'Baixa',
    'media': 'Média',
    'alta': 'Alta'
  };

  const pKey = (prioridade || '').toLowerCase();
  const styleClass = styles[pKey] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = labels[pKey] || prioridade;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styleClass}`}>
      {label}
    </span>
  );
}
