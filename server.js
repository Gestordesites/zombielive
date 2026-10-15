/**
 * Zombie Live — Arquivo de Inicialização para Hospedagem Node.js (Hostinger / cPanel / Passenger)
 *
 * Este arquivo serve como ponto de entrada na raiz para ambientes de hospedagem gerenciada
 * que exigem um arquivo de startup no diretório raiz da aplicação (ex: server.js ou app.js).
 */
import('./apps/server/dist/index.js').catch(err => {
  console.error('[FATAL] Erro ao iniciar o servidor Zombie Live via server.js:', err);
  process.exit(1);
});
