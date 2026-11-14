const BASE_URL = 'http://localhost:3001/api';

async function post(endpoint, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function get(endpoint, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function patch(endpoint, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function del(endpoint, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- INICIANDO TESTES DO BACKEND ---');

  // 1. Logins
  console.log('1. Testando login Admin...');
  const adminLogin = await post('/auth/login', { login: 'admin', senha: 'admin123' });
  if (adminLogin.status !== 200) throw new Error('Falha no login do admin');
  const adminToken = adminLogin.data.token;
  console.log('   OK! Token admin obtido.');

  console.log('2. Testando login Técnico...');
  const tecLogin = await post('/auth/login', { login: 'tecnico', senha: 'tecnico123' });
  if (tecLogin.status !== 200) throw new Error('Falha no login do técnico');
  const tecToken = tecLogin.data.token;
  console.log('   OK! Token técnico obtido.');

  console.log('3. Testando login Usuário...');
  const usrLogin = await post('/auth/login', { login: 'usuario', senha: 'usuario123' });
  if (usrLogin.status !== 200) throw new Error('Falha no login do usuário');
  const usrToken = usrLogin.data.token;
  console.log('   OK! Token usuário obtido.');

  // 4. Criação de ticket pelo usuário
  console.log('4. Usuário criando novo ticket...');
  const newTicketRes = await post('/tickets', {
    titulo: 'Problema com acesso à VPN',
    descricao: 'Não consigo conectar na VPN da empresa desde esta manhã.',
    prioridade: 'alta'
  }, usrToken);
  if (newTicketRes.status !== 201) throw new Error('Falha ao criar ticket: ' + JSON.stringify(newTicketRes.data));
  const ticketId = newTicketRes.data.ticket.id;
  console.log(`   OK! Ticket #${ticketId} criado com sucesso.`);

  // 5. Técnico verifica notificação e lista disponíveis
  console.log('5. Verificando notificações do técnico...');
  const tecNotif = await get('/notifications', tecToken);
  const foundNotif = tecNotif.data.notifications.some(n => n.ticket_id === ticketId);
  if (!foundNotif) throw new Error('Técnico não recebeu notificação de novo ticket');
  console.log('   OK! Notificação de novo ticket entregue ao técnico.');

  // 6. Técnico assume ticket (deve mudar para Em andamento)
  console.log('6. Técnico assumindo ticket...');
  const assumeRes = await post(`/tickets/${ticketId}/assume`, {}, tecToken);
  if (assumeRes.status !== 200) throw new Error('Falha ao assumir ticket: ' + JSON.stringify(assumeRes.data));
  if (assumeRes.data.ticket.status !== 'Em andamento') throw new Error('Status não mudou para Em andamento');
  console.log('   OK! Ticket assumido e status alterado para "Em andamento".');

  // 7. Tentativa de assumir novamente deve retornar 409
  console.log('7. Testando 409 Conflict ao tentar assumir ticket já assumido...');
  const conflictRes = await post(`/tickets/${ticketId}/assume`, {}, tecToken);
  if (conflictRes.status !== 409) throw new Error('Esperado status 409, recebeu: ' + conflictRes.status);
  console.log('   OK! Retornou 409 Conflito como esperado.');

  // 8. Comentário pelo técnico
  console.log('8. Técnico adicionando comentário no ticket...');
  const commentRes = await post(`/tickets/${ticketId}/comments`, {
    mensagem: 'Olá, verifiquei que seu certificado estava expirado. Atualizei as credenciais, tente novamente.'
  }, tecToken);
  if (commentRes.status !== 201) throw new Error('Falha ao adicionar comentário');
  console.log('   OK! Comentário adicionado pelo técnico.');

  // 9. Usuário verifica notificação de comentário e assume status
  console.log('9. Verificando notificação no usuário solicitante...');
  const usrNotif = await get('/notifications', usrToken);
  const commentNotif = usrNotif.data.notifications.some(n => n.ticket_id === ticketId && n.tipo === 'new_comment');
  if (!commentNotif) throw new Error('Usuário não recebeu notificação do novo comentário');
  console.log('   OK! Usuário recebeu notificação do comentário.');

  // 10. Técnico avança para Resolvido
  console.log('10. Técnico resolvendo o ticket...');
  const resolveRes = await patch(`/tickets/${ticketId}/status`, { status: 'Resolvido' }, tecToken);
  if (resolveRes.status !== 200) throw new Error('Falha ao resolver ticket: ' + JSON.stringify(resolveRes.data));
  console.log('   OK! Status avançado para "Resolvido".');

  // 11. Usuário confirma encerramento (Fechado)
  console.log('11. Usuário confirmando encerramento...');
  const closeRes = await patch(`/tickets/${ticketId}/status`, { status: 'Fechado' }, usrToken);
  if (closeRes.status !== 200) throw new Error('Falha ao encerrar ticket: ' + JSON.stringify(closeRes.data));
  console.log('   OK! Ticket encerrado (Fechado).');

  // 12. Usuário ou Técnico tenta comentar em ticket Fechado (bloqueado com 403)
  console.log('12. Tentando comentar em ticket Fechado (deve retornar 403)...');
  const blockedComment = await post(`/tickets/${ticketId}/comments`, { mensagem: 'Tentativa bloqueada' }, usrToken);
  if (blockedComment.status !== 403) throw new Error('Esperado 403 para comentário em ticket fechado');
  console.log('   OK! Comentário bloqueado com 403.');

  // 13. Admin pode comentar em ticket Fechado
  console.log('13. Admin comentando em ticket Fechado...');
  const adminComment = await post(`/tickets/${ticketId}/comments`, { mensagem: 'Nota administrativa de auditoria.' }, adminToken);
  if (adminComment.status !== 201) throw new Error('Admin deveria conseguir comentar em ticket fechado');
  console.log('   OK! Admin conseguiu comentar no ticket fechado.');

  // 14. Teste de reabertura por Usuário
  console.log('14. Criando outro ticket para testar reabertura...');
  const t2 = await post('/tickets', { titulo: 'Impressora travada', descricao: 'Papel encravado', prioridade: 'media' }, usrToken);
  const t2Id = t2.data.ticket.id;
  await post(`/tickets/${t2Id}/assume`, {}, tecToken);
  await patch(`/tickets/${t2Id}/status`, { status: 'Resolvido' }, tecToken);

  console.log('    Usuário reabrindo ticket sem motivo (deve falhar com 422)...');
  const reopenFail = await patch(`/tickets/${t2Id}/status`, { status: 'Em andamento' }, usrToken);
  if (reopenFail.status !== 422) throw new Error('Esperava 422 ao reabrir sem motivo');

  console.log('    Usuário reabrindo ticket com motivo...');
  const reopenSuccess = await patch(`/tickets/${t2Id}/status`, { status: 'Em andamento', motivo: 'Ainda está fazendo barulho' }, usrToken);
  if (reopenSuccess.status !== 200) throw new Error('Falha ao reabrir ticket');
  console.log('   OK! Ticket reaberto com sucesso e motivo registrado como comentário.');

  // 15. Solicitação de troca de senha (pública)
  console.log('15. Testando solicitação de troca de senha...');
  const passReq = await post('/auth/password-request', { login: 'usuario' });
  if (passReq.status !== 200) throw new Error('Falha na solicitação de senha');
  console.log('   OK! Resposta genérica retornada: ' + passReq.data.message);

  // 16. Admin lista solicitações de troca de senha
  console.log('16. Admin consultando solicitações pendentes...');
  const passList = await get('/users/password-requests/list', adminToken);
  if (passList.status !== 200 || !passList.data.requests.length) throw new Error('Solicitação não encontrada');
  console.log('   OK! Solicitação listada para o admin.');

  // 17. Relatórios do admin
  console.log('17. Verificando relatório de acompanhamento...');
  const reportRes = await get('/reports/stats', adminToken);
  if (reportRes.status !== 200) throw new Error('Falha ao obter relatório');
  console.log('   OK! Relatório gerado com estatísticas: Total tickets = ' + reportRes.data.summary.total);

  // 18. Exclusão lógica
  console.log('18. Admin executando exclusão lógica do ticket #1...');
  const delRes = await del(`/tickets/${ticketId}`, adminToken);
  if (delRes.status !== 200) throw new Error('Falha na exclusão lógica');
  const getDeleted = await get(`/tickets/${ticketId}`, adminToken);
  if (getDeleted.status !== 404) throw new Error('Ticket excluído ainda está acessível');
  console.log('   OK! Ticket deletado logicamente retorna 404 e é omitido das consultas.');

  console.log('====================================================');
  console.log(' TODOS OS TESTES DO BACKEND PASSARAM COM SUCESSO! ');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('ERRO NO TESTE:', err);
  process.exit(1);
});
