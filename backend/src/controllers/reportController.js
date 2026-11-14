import db from '../db/connection.js';

export const reportController = {
  getStats(req, res) {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];

    if (startDate) {
      dateFilter += ' AND t.created_at >= ?';
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      dateFilter += ' AND t.created_at <= ?';
      params.push(`${endDate} 23:59:59`);
    }

    // 1. Total geral e contagem por status
    const statusRows = db.prepare(`
      SELECT 
        t.status,
        COUNT(*) as total
      FROM tickets t
      WHERE t.deleted_at IS NULL ${dateFilter}
      GROUP BY t.status
    `).all(...params);

    const statusMap = {
      'Aberto': 0,
      'Em andamento': 0,
      'Resolvido': 0,
      'Fechado': 0
    };

    let totalTickets = 0;
    for (const row of statusRows) {
      statusMap[row.status] = row.total;
      totalTickets += row.total;
    }

    // 2. Contagem por prioridade
    const priorityRows = db.prepare(`
      SELECT 
        t.prioridade,
        COUNT(*) as total
      FROM tickets t
      WHERE t.deleted_at IS NULL ${dateFilter}
      GROUP BY t.prioridade
    `).all(...params);

    const priorityMap = {
      'baixa': 0,
      'media': 0,
      'alta': 0
    };

    for (const row of priorityRows) {
      priorityMap[row.prioridade] = row.total;
    }

    // 3. Contagem por técnico
    const technicianRows = db.prepare(`
      SELECT 
        COALESCE(u.nome, 'Não atribuído') as tecnico_nome,
        COALESCE(t.tecnico_id, 0) as tecnico_id,
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'Resolvido' OR t.status = 'Fechado' THEN 1 ELSE 0 END) as resolvidos,
        SUM(CASE WHEN t.status = 'Em andamento' THEN 1 ELSE 0 END) as em_andamento,
        SUM(CASE WHEN t.status = 'Aberto' THEN 1 ELSE 0 END) as abertos
      FROM tickets t
      LEFT JOIN users u ON u.id = t.tecnico_id
      WHERE t.deleted_at IS NULL ${dateFilter}
      GROUP BY t.tecnico_id
      ORDER BY total DESC
    `).all(...params);

    // 4. Tempo médio de resolução
    // Calculado entre created_at e concluido_em dos tickets que possuem concluido_em
    const resolvedRows = db.prepare(`
      SELECT 
        t.created_at,
        t.concluido_em
      FROM tickets t
      WHERE t.deleted_at IS NULL 
        AND t.concluido_em IS NOT NULL
        ${dateFilter}
    `).all(...params);

    let avgResolutionMinutes = 0;
    if (resolvedRows.length > 0) {
      let totalMinutes = 0;
      for (const r of resolvedRows) {
        const start = new Date(r.created_at).getTime();
        const end = new Date(r.concluido_em).getTime();
        const diffMinutes = Math.max(0, (end - start) / (1000 * 60));
        totalMinutes += diffMinutes;
      }
      avgResolutionMinutes = Math.round(totalMinutes / resolvedRows.length);
    }

    return res.json({
      summary: {
        total: totalTickets,
        aberto: statusMap['Aberto'],
        em_andamento: statusMap['Em andamento'],
        resolvido: statusMap['Resolvido'],
        fechado: statusMap['Fechado'],
        avgResolutionMinutes,
        avgResolutionFormatted: formatMinutes(avgResolutionMinutes)
      },
      byStatus: statusMap,
      byPriority: priorityMap,
      byTechnician: technicianRows
    });
  }
};

function formatMinutes(minutes) {
  if (minutes === 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}
