import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { GameEngine } from '../engine/GameEngine.js';
import { CommandProcessor } from '../engine/CommandProcessor.js';
import { InMemoryRepository } from '../storage/Repository.js';
import { AuthService } from '../auth/authService.js';

describe('GameEngine & Core Mechanics', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine({
      arenaWidth: 1080,
      arenaHeight: 1920,
      waveDurationSeconds: 10,
      bossWaveInterval: 2,
      maxEnemiesAlive: 20,
      autoStartMatches: false
    });
  });

  it('deve inicializar no estado IDLE com valores padrão', () => {
    const snap = engine.getSnapshot();
    assert.strictEqual(snap.status, 'IDLE');
    assert.strictEqual(snap.survivor.hp, 100);
    assert.strictEqual(snap.survivor.level, 1);
    assert.strictEqual(snap.score, 0);
    assert.strictEqual(snap.kills, 0);
  });

  it('deve curar o sobrevivente sem ultrapassar a vida máxima', () => {
    (engine as any).status = 'PLAYING';
    // Aplica dano manual
    engine.damageSurvivor(40);
    let snap = engine.getSnapshot();
    assert.strictEqual(snap.survivor.hp, 64); // 40 * (1 - 0.1 armor) = 36 de dano -> 100 - 36 = 64

    // Cura parcial
    engine.healSurvivor(20);
    snap = engine.getSnapshot();
    assert.strictEqual(snap.survivor.hp, 84);

    // Cura excedente (não pode passar de maxHp)
    engine.healSurvivor(50);
    snap = engine.getSnapshot();
    assert.strictEqual(snap.survivor.hp, 100);
  });

  it('deve ativar habilidades especiais com recarga (cooldown)', () => {
    // Para ativar habilidades precisa estar em partida
    (engine as any).status = 'PLAYING';
    
    // 1ª ativação deve ser bem-sucedida
    const success1 = engine.triggerSkill('CURA', 'Teste');
    assert.strictEqual(success1, true);

    // 2ª ativação imediata deve falhar por recarga
    const success2 = engine.triggerSkill('CURA', 'Teste');
    assert.strictEqual(success2, false);

    // Escudo deve ativar e deixar shieldActive = true
    const shieldSuccess = engine.triggerSkill('ESCUDO', 'Teste');
    assert.strictEqual(shieldSuccess, true);
    assert.strictEqual(engine.getSnapshot().survivor.shieldActive, true);
  });

  it('deve progredir meta coletiva com curtidas', () => {
    engine.handleLiveEvent({
      id: 'like_1',
      type: 'LIKE',
      timestamp: Date.now(),
      user: { id: 'user1', username: 'Gamer' },
      data: { likeCount: 150 }
    });

    const snap = engine.getSnapshot();
    assert.strictEqual(snap.totalLikesReceived, 150);
    assert.strictEqual(snap.collectiveGoal.current, 150);
    assert.strictEqual(snap.collectiveGoal.progressPercent, 30);
  });

  it('deve atualizar providerType dinamicamente no snapshot', () => {
    assert.strictEqual(engine.getSnapshot().providerType, 'SIMULATOR');
    engine.setProviderType('CONNECTED');
    assert.strictEqual(engine.getSnapshot().providerType, 'CONNECTED');
    engine.setProviderType('DISCONNECTED');
    assert.strictEqual(engine.getSnapshot().providerType, 'DISCONNECTED');
  });

  it('deve agendar reinício automático após GAME_OVER quando autoStartMatches estiver ativo', (_t, done) => {
    engine.updateSettings({ autoStartMatches: true, autoRestartSeconds: 1 });
    (engine as any).status = 'PLAYING';
    engine.stopMatch('GAME_OVER');
    assert.strictEqual(engine.getSnapshot().status, 'GAME_OVER');
    setTimeout(() => {
      assert.strictEqual(engine.getSnapshot().status, 'COUNTDOWN');
      engine.updateSettings({ autoStartMatches: false });
      engine.stopMatch('ABORTED');
      done();
    }, 1200);
  });
});

describe('CommandProcessor & Anti-Spam', () => {
  let processor: CommandProcessor;

  beforeEach(() => {
    processor = new CommandProcessor(1000, 10);
  });

  it('deve aceitar e normalizar comandos válidos em jogo ativo (com ou sem !)', () => {
    const res1 = processor.processComment('jogador1', '  cura  ', 'PLAYING', false);
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.commandType, 'CURA');

    const res2 = processor.processComment('jogador2', '!escudo', 'PLAYING', false);
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.commandType, 'ESCUDO');

    const res3 = processor.processComment('jogador3', '/fogo', 'PLAYING', false);
    assert.strictEqual(res3.success, true);
    assert.strictEqual(res3.commandType, 'FOGO');
  });

  it('deve aplicar cooldown por usuário para evitar spam', () => {
    const res1 = processor.processComment('spammer', 'ESCUDO', 'PLAYING', false);
    assert.strictEqual(res1.success, true);

    // Imediato em seguida pelo mesmo usuário
    const res2 = processor.processComment('spammer', 'FOGO', 'PLAYING', false);
    assert.strictEqual(res2.success, false);
    assert.match(res2.reason || '', /Aguarde/);
  });

  it('deve aceitar votação somente quando houver votação ativa', () => {
    const resSemVotacao = processor.processComment('user_a', 'VOTAR 1', 'PLAYING', false);
    assert.strictEqual(resSemVotacao.success, false);
    assert.strictEqual(resSemVotacao.commandType, 'VOTAR');

    const resComVotacao = processor.processComment('user_b', 'VOTAR 2', 'PLAYING', true);
    assert.strictEqual(resComVotacao.success, true);
    assert.strictEqual(resComVotacao.commandType, 'VOTAR');
  });

  it('deve rejeitar comandos de combate fora de partida ativa', () => {
    const res = processor.processComment('user_c', 'EXPLOSAO', 'IDLE', false);
    assert.strictEqual(res.success, false);
    assert.match(res.reason || '', /partida em andamento/);
  });
});

describe('Storage & AuthService', () => {
  it('deve criar e autenticar o administrador padrão', async () => {
    const repo = new InMemoryRepository();
    const auth = new AuthService(repo);

    await auth.initializeDefaultAdmin();

    const loginFail = await auth.login('admin', 'senha_errada');
    assert.strictEqual(loginFail, null);

    const loginSuccess = await auth.login('admin', 'admin123456');
    assert.ok(loginSuccess);
    assert.strictEqual(loginSuccess?.username, 'admin');
    assert.ok(loginSuccess?.token);
  });
});
