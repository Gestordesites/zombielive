/**
 * Script utilitário para testar a API e simular eventos em lote via linha de comando
 * Uso: node scripts/test-simulation.js
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';

async function runTestSimulation() {
  console.log(`[TEST-SIMULATOR] Conectando ao Zombie Live Server em: ${SERVER_URL}`);

  try {
    // 1. Healthcheck
    const healthRes = await fetch(`${SERVER_URL}/health`);
    const health = await healthRes.json();
    console.log(`[1] Servidor Online! Uptime: ${health.uptime}s`);

    // 2. Login como Admin
    const loginRes = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123456' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.error || 'Falha no login');
    console.log(`[2] Autenticação bem-sucedida para o usuário: ${loginData.username}`);
    const token = loginData.token;

    // 3. Iniciar Partida
    console.log('[3] Disparando início de partida...');
    await fetch(`${SERVER_URL}/api/match/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'start' })
    });

    // 4. Injetar Curtidas
    console.log('[4] Simulando envio de 250 curtidas na live...');
    await fetch(`${SERVER_URL}/api/simulator/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'LIKE',
        user: { id: 'test_user_1', username: 'SuperFan' },
        data: { likeCount: 250 }
      })
    });

    // 5. Injetar Comandos de Chat
    console.log('[5] Simulando comentários de batalha (CURA e ESCUDO)...');
    await fetch(`${SERVER_URL}/api/simulator/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'COMMENT',
        user: { id: 'test_user_2', username: 'GamerHero' },
        data: { commentText: 'CURA' }
      })
    });

    // 6. Injetar Novo Seguidor
    console.log('[6] Simulando novo seguidor na transmissão...');
    await fetch(`${SERVER_URL}/api/simulator/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'FOLLOW',
        user: { id: 'test_user_3', username: 'NovoSeguidorTikTok' },
        data: {}
      })
    });

    // 7. Obter Estado Atualizado
    const statusRes = await fetch(`${SERVER_URL}/api/match/status`);
    const status = await statusRes.json();
    console.log(`[7] Estado Atual da Partida: ${status.status} | Vida do Herói: ${status.survivor.hp}/${status.survivor.maxHp} | Onda: ${status.wave.currentWave} | Placar: ${status.score}`);

    console.log('\n✅ SIMULAÇÃO AUTOMATIZADA CONCLUÍDA COM SUCESSO TOTAL!');
  } catch (err) {
    console.error('❌ Erro durante a simulação:', err.message);
    process.exit(1);
  }
}

runTestSimulation();
