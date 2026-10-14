import {
  MatchStatus,
  EnemyType,
  EnemyData,
  SurvivorData,
  SkillType,
  SkillConfig,
  ProjectileData,
  VisualEffectEvent,
  VoteSession,
  VoteOption,
  CollectiveGoal,
  WaveState,
  GameStateSnapshot,
  GameAnnouncement,
  GameSettings,
  NormalizedLiveEvent,
  CompanionPetData,
  SOCKET_EVENTS
} from '@zombie-live/shared';
import { EventEmitter } from 'events';
import { defaultSettings } from '../storage/Repository.js';

export class GameEngine extends EventEmitter {
  private status: MatchStatus = 'IDLE';
  private matchId: string = '';
  private matchStartTime: number = 0;
  private matchDurationSeconds: number = 0;
  private score: number = 0;
  private kills: number = 0;
  private bossesKilled: number = 0;
  private totalLikesReceived: number = 0;
  private totalCommentsReceived: number = 0;
  private totalGiftsReceived: number = 0;

  private settings: GameSettings = { ...defaultSettings };
  private survivor!: SurvivorData;
  private enemies: Map<string, EnemyData> = new Map();
  private projectiles: ProjectileData[] = [];
  private companions: Map<string, CompanionPetData> = new Map();
  private activeVote: VoteSession | null = null;
  private collectiveGoal!: CollectiveGoal;
  private waveState!: WaveState;
  private announcements: GameAnnouncement[] = [];

  private loopInterval: NodeJS.Timeout | null = null;
  private lastTickTime: number = 0;
  private enemySpawnTimer: number = 0;
  private bossSpecialTimer: number = 0;
  private countdownTimer: number = 0;
  private autoRestartTimeout: NodeJS.Timeout | null = null;

  constructor(settings?: Partial<GameSettings>) {
    super();
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }
    this.resetState();

    // Início automático da primeira partida se configurado
    if (this.settings.autoStartMatches) {
      setTimeout(() => {
        if (this.status === 'IDLE') {
          this.startMatch();
        }
      }, 1500);
    }
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    if (this.collectiveGoal && newSettings.collectiveGoalLikesTarget) {
      this.collectiveGoal.target = newSettings.collectiveGoalLikesTarget;
      this.recalcGoalProgress();
    }
  }

  getStatus(): MatchStatus {
    return this.status;
  }

  private resetState(): void {
    this.matchId = 'match_' + Date.now();
    this.score = 0;
    this.kills = 0;
    this.bossesKilled = 0;
    this.totalLikesReceived = 0;
    this.totalCommentsReceived = 0;
    this.totalGiftsReceived = 0;
    this.matchDurationSeconds = 0;
    this.projectiles = [];
    this.companions.clear();
    this.enemies.clear();
    this.announcements = [];
    this.activeVote = null;

    const initialSkills: Record<SkillType, SkillConfig> = {
      CURA: {
        id: 'CURA',
        name: 'Cura Espiritual',
        cooldownMs: 8000,
        lastUsedMs: 0,
        durationMs: 0,
        intensity: 50,
        description: 'Restaura instantaneamente +50 de Vida.',
        visualEffect: 'green_glow'
      },
      ESCUDO: {
        id: 'ESCUDO',
        name: 'Barreira Titânica',
        cooldownMs: 12000,
        lastUsedMs: 0,
        durationMs: 6000,
        intensity: 0.8,
        description: 'Reduz 80% do dano recebido por 6 segundos.',
        visualEffect: 'blue_barrier'
      },
      ATAQUE: {
        id: 'ATAQUE',
        name: 'Golpe Giratório',
        cooldownMs: 6000,
        lastUsedMs: 0,
        durationMs: 0,
        intensity: 160,
        description: 'Desfere um golpe de espada em 360° em todos os zumbis ao redor.',
        visualEffect: 'sword_arc'
      },
      FOGO: {
        id: 'FOGO',
        name: 'Onda Incendiária',
        cooldownMs: 10000,
        lastUsedMs: 0,
        durationMs: 4000,
        intensity: 40,
        description: 'Incendeia o solo em raio amplo, causando dano contínuo.',
        visualEffect: 'fire_wave'
      },
      CONGELAMENTO: {
        id: 'CONGELAMENTO',
        name: 'Nevasca Ártica',
        cooldownMs: 12000,
        lastUsedMs: 0,
        durationMs: 5000,
        intensity: 0.75,
        description: 'Reduz a velocidade de todos os zumbis em 75% por 5 segundos.',
        visualEffect: 'ice_burst'
      },
      EXPLOSAO: {
        id: 'EXPLOSAO',
        name: 'Supernova',
        cooldownMs: 15000,
        lastUsedMs: 0,
        durationMs: 0,
        intensity: 300,
        description: 'Uma explosão colossal que aniquila zumbis próximos.',
        visualEffect: 'explosion'
      }
    };

    this.survivor = {
      x: this.settings.arenaWidth / 2,
      y: this.settings.arenaHeight / 2,
      hp: 100,
      maxHp: 100,
      speed: 160,
      damage: 35,
      attackRange: 220,
      attackRate: 1.8,
      armor: 0.1,
      level: 1,
      xp: 0,
      xpNeeded: 50,
      kills: 0,
      shieldActive: false,
      shieldExpiresAt: 0,
      targetEnemyId: null,
      isAttacking: false,
      lastAttackTimestamp: 0,
      skills: initialSkills
    };

    this.waveState = {
      currentWave: 1,
      timeRemainingSeconds: this.settings.waveDurationSeconds,
      totalKillsInWave: 0,
      isBossActive: false,
      bossHp: 0,
      bossMaxHp: 0
    };

    this.collectiveGoal = {
      id: 'goal_' + Date.now(),
      title: 'Meta de Curtidas da Live',
      type: 'LIKES',
      current: 0,
      target: this.settings.collectiveGoalLikesTarget,
      rewardSkillOrBuff: 'CURA',
      rewardDescription: 'Super Cura Coletiva + Bônus de Pontuação!',
      achieved: false,
      progressPercent: 0
    };
  }

  // ==========================================
  // CONTROLE DE PARTIDA
  // ==========================================

  startMatch(): void {
    if (this.autoRestartTimeout) {
      clearTimeout(this.autoRestartTimeout);
      this.autoRestartTimeout = null;
    }

    if (this.status !== 'IDLE' && this.status !== 'GAME_OVER' && this.status !== 'VICTORY') {
      return;
    }
    this.resetState();
    this.status = 'COUNTDOWN';
    this.countdownTimer = 3;
    this.addAnnouncement('SYSTEM', 'A batalha começará em 3 segundos! Preparem-se!');
    this.emitStateUpdated();

    const countdownInterval = setInterval(() => {
      this.countdownTimer--;
      if (this.countdownTimer > 0) {
        this.addAnnouncement('SYSTEM', `Iniciando em ${this.countdownTimer}...`);
        this.emitStateUpdated();
      } else {
        clearInterval(countdownInterval);
        this.status = 'PLAYING';
        this.matchStartTime = Date.now();
        this.lastTickTime = Date.now();
        this.addAnnouncement('SYSTEM', 'A horda chegou! Espectadores, usem os comandos para ajudar!');
        
        // Spawn inicial de horda (8 zumbis ao redor da arena)
        for (let i = 0; i < 8; i++) {
          this.spawnEnemy('COMMON');
        }

        this.startLoop();
        this.emitStateUpdated();
      }
    }, 1000);
  }

  pauseMatch(): void {
    if (this.status === 'PLAYING' || this.status === 'BOSS_FIGHT') {
      this.status = 'PAUSED';
      this.stopLoop();
      this.addAnnouncement('SYSTEM', 'Partida pausada pelo administrador.');
      this.emitStateUpdated();
    }
  }

  resumeMatch(): void {
    if (this.status === 'PAUSED') {
      this.status = this.waveState.isBossActive ? 'BOSS_FIGHT' : 'PLAYING';
      this.lastTickTime = Date.now();
      this.startLoop();
      this.addAnnouncement('SYSTEM', 'Partida retomada!');
      this.emitStateUpdated();
    }
  }

  stopMatch(result: 'VICTORY' | 'GAME_OVER' | 'ABORTED' = 'ABORTED'): void {
    if (this.autoRestartTimeout) {
      clearTimeout(this.autoRestartTimeout);
      this.autoRestartTimeout = null;
    }

    this.status = result === 'VICTORY' ? 'VICTORY' : result === 'GAME_OVER' ? 'GAME_OVER' : 'IDLE';
    this.stopLoop();
    this.addAnnouncement('SYSTEM', `Partida finalizada. Resultado: ${result}`);
    this.emit(SOCKET_EVENTS.MATCH_FINISHED, {
      matchId: this.matchId,
      result,
      score: this.score,
      kills: this.kills,
      duration: this.matchDurationSeconds
    });
    this.emitStateUpdated();

    // Auto-Restart automático para live contínua 24/7
    if (this.settings.autoStartMatches && (result === 'GAME_OVER' || result === 'VICTORY')) {
      const waitSecs = this.settings.autoRestartSeconds || 7;
      this.addAnnouncement('SYSTEM', `Próxima partida iniciando automaticamente em ${waitSecs} segundos...`);
      this.autoRestartTimeout = setTimeout(() => {
        if (this.status === 'GAME_OVER' || this.status === 'VICTORY' || this.status === 'IDLE') {
          this.startMatch();
        }
      }, waitSecs * 1000);
    }
  }

  restartMatch(): void {
    if (this.autoRestartTimeout) {
      clearTimeout(this.autoRestartTimeout);
      this.autoRestartTimeout = null;
    }
    this.stopLoop();
    this.startMatch();
  }

  private startLoop(): void {
    if (this.loopInterval) clearInterval(this.loopInterval);
    this.lastTickTime = Date.now();
    // 30 Ticks por segundo (~33.3ms)
    this.loopInterval = setInterval(() => this.tick(), 33);
  }

  private stopLoop(): void {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  // ==========================================
  // LOOP PRINCIPAL DO JOGO (TICK)
  // ==========================================

  private tick(): void {
    if (this.status !== 'PLAYING' && this.status !== 'BOSS_FIGHT') return;

    const now = Date.now();
    const dt = Math.min((now - this.lastTickTime) / 1000, 0.1); // limite de segurança no dt
    this.lastTickTime = now;

    this.matchDurationSeconds = Math.floor((now - this.matchStartTime) / 1000);

    // 1. Atualizar Ondas e Temporizador
    this.updateWave(dt);

    // 2. Atualizar Comportamento do Sobrevivente (IA autônoma)
    this.updateSurvivor(dt, now);

    // 3. Atualizar Inimigos (IA de perseguição e ataques)
    this.updateEnemies(dt, now);

    // 4. Atualizar Bichinhos Aliados dos Doadores de Presentes
    this.updateCompanions(dt, now);

    // 5. Atualizar Projéteis
    this.updateProjectiles(dt);

    // 6. Atualizar Votação Ativa (se houver)
    this.updateVoteSession(dt);

    // 7. Atualizar Escudo
    if (this.survivor.shieldActive && now > this.survivor.shieldExpiresAt) {
      this.survivor.shieldActive = false;
    }

    // 7. Notificar Clientes
    this.emit(SOCKET_EVENTS.GAME_STATE_UPDATED, this.getSnapshot());
  }

  // ==========================================
  // ONDAS E SURGIMENTO DE INIMIGOS
  // ==========================================

  private updateWave(dt: number): void {
    if (this.status === 'BOSS_FIGHT') {
      // Onda de chefe só avança quando o chefe morrer
      return;
    }

    this.waveState.timeRemainingSeconds -= dt;
    if (this.waveState.timeRemainingSeconds <= 0) {
      // Passa para a próxima onda
      this.waveState.currentWave++;
      this.waveState.timeRemainingSeconds = this.settings.waveDurationSeconds;
      this.waveState.totalKillsInWave = 0;

      const isBossWave = this.waveState.currentWave % this.settings.bossWaveInterval === 0;

      if (isBossWave) {
        this.status = 'BOSS_FIGHT';
        this.waveState.isBossActive = true;
        this.spawnBoss();
        this.addAnnouncement('BOSS', `ALERTA DE CHEFE: O Colosso Zumbi emergiu na Onda ${this.waveState.currentWave}!`);
        this.emit(SOCKET_EVENTS.BOSS_SPAWNED, { wave: this.waveState.currentWave });
      } else {
        this.addAnnouncement('SYSTEM', `ONDA ${this.waveState.currentWave} INICIADA! Inimigos mais fortes!`);
      }
    }

    // Spawn regular de inimigos
    this.enemySpawnTimer += dt;
    const baseSpawnRate = Math.max(0.6, 2.0 - this.waveState.currentWave * 0.15); // intervalo entre spawns

    if (this.enemySpawnTimer >= baseSpawnRate) {
      this.enemySpawnTimer = 0;
      if (this.enemies.size < this.settings.maxEnemiesAlive) {
        this.spawnWaveEnemy();
      }
    }
  }

  private spawnWaveEnemy(): void {
    const wave = this.waveState.currentWave;
    const packSize = Math.min(3, 1 + Math.floor(wave / 2));

    for (let p = 0; p < packSize; p++) {
      if (this.enemies.size >= this.settings.maxEnemiesAlive) break;
      const rand = Math.random();
      let type: EnemyType = 'COMMON';

      if (wave >= 3 && rand < 0.25) {
        type = 'TANK';
      } else if (wave >= 2 && rand < 0.55) {
        type = 'RUNNER';
      }

      this.spawnEnemy(type);
    }
  }

  private spawnEnemy(type: EnemyType): EnemyData {
    const id = 'enemy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const { x, y } = this.getRandomSpawnBorder();

    const waveMult = 1 + (this.waveState.currentWave - 1) * 0.12;

    let hp = 100 * waveMult;
    let speed = 80;
    let damage = 10 * waveMult;
    let radius = 24;
    let xpReward = 10;
    let scoreReward = 100;

    if (type === 'RUNNER') {
      hp = 50 * waveMult;
      speed = 150;
      damage = 12 * waveMult;
      radius = 20;
      xpReward = 15;
      scoreReward = 150;
    } else if (type === 'TANK') {
      hp = 350 * waveMult;
      speed = 45;
      damage = 25 * waveMult;
      radius = 36;
      xpReward = 35;
      scoreReward = 300;
    }

    const enemy: EnemyData = {
      id,
      type,
      x,
      y,
      hp: Math.round(hp),
      maxHp: Math.round(hp),
      speed,
      damage: Math.round(damage),
      radius,
      xpReward,
      scoreReward
    };

    this.enemies.set(id, enemy);
    this.emit(SOCKET_EVENTS.ENEMY_SPAWNED, enemy);
    return enemy;
  }

  private spawnBoss(): void {
    const id = 'boss_' + Date.now();
    const x = this.settings.arenaWidth / 2;
    const y = 80; // surge no topo da arena
    const bossHp = 2500 + (this.waveState.currentWave - 5) * 800;

    const boss: EnemyData = {
      id,
      type: 'BOSS',
      x,
      y,
      hp: bossHp,
      maxHp: bossHp,
      speed: 60,
      damage: 40,
      radius: 56,
      xpReward: 300,
      scoreReward: 2500,
      isBoss: true,
      bossName: 'O Colosso Zumbi',
      specialAttackCountdown: 8,
      specialAttackTelegraph: false
    };

    this.waveState.bossHp = bossHp;
    this.waveState.bossMaxHp = bossHp;
    this.enemies.set(id, boss);
    this.emit(SOCKET_EVENTS.ENEMY_SPAWNED, boss);
  }

  private getRandomSpawnBorder(): { x: number; y: number } {
    const side = Math.floor(Math.random() * 4);
    const w = this.settings.arenaWidth;
    const h = this.settings.arenaHeight;
    const margin = 20;

    switch (side) {
      case 0: return { x: Math.random() * w, y: -margin }; // Topo
      case 1: return { x: w + margin, y: Math.random() * h }; // Direita
      case 2: return { x: Math.random() * w, y: h + margin }; // Fundo
      default: return { x: -margin, y: Math.random() * h }; // Esquerda
    }
  }

  // ==========================================
  // SOBREVIVENTE (IA AUTÔNOMA)
  // ==========================================

  private updateSurvivor(dt: number, now: number): void {
    // 1. Procurar inimigo mais próximo
    let closestEnemy: EnemyData | null = null;
    let closestDistSq = Infinity;

    for (const enemy of this.enemies.values()) {
      const dx = enemy.x - this.survivor.x;
      const dy = enemy.y - this.survivor.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closestEnemy = enemy;
      }
    }

    this.survivor.targetEnemyId = closestEnemy ? closestEnemy.id : null;

    // 2. Movimentação inteligente (Kiting & desvio de ameaças)
    let moveX = 0;
    let moveY = 0;
    const closestDist = Math.sqrt(closestDistSq);

    if (closestEnemy && closestDist < 120) {
      // Perigo próximo: recua na direção oposta ao zumbi mais próximo
      const dx = this.survivor.x - closestEnemy.x;
      const dy = this.survivor.y - closestEnemy.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      moveX = dx / len;
      moveY = dy / len;
    } else if (closestEnemy && closestDist > this.survivor.attackRange - 40) {
      // Inimigo fora do alcance ideal: aproxima-se com cautela
      const dx = closestEnemy.x - this.survivor.x;
      const dy = closestEnemy.y - this.survivor.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      moveX = dx / len;
      moveY = dy / len;
    }

    // Aplica limites da arena (não sai da tela)
    const margin = 40;
    const newX = this.survivor.x + moveX * this.survivor.speed * dt;
    const newY = this.survivor.y + moveY * this.survivor.speed * dt;

    this.survivor.x = Math.max(margin, Math.min(this.settings.arenaWidth - margin, newX));
    this.survivor.y = Math.max(margin, Math.min(this.settings.arenaHeight - margin, newY));

    // 3. Ataque automático
    const attackIntervalMs = 1000 / this.survivor.attackRate;
    if (closestEnemy && closestDist <= this.survivor.attackRange && now - this.survivor.lastAttackTimestamp >= attackIntervalMs) {
      this.survivor.lastAttackTimestamp = now;
      this.survivor.isAttacking = true;
      this.shootProjectile(closestEnemy);
    } else {
      this.survivor.isAttacking = false;
    }
  }

  private shootProjectile(target: EnemyData): void {
    const id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    this.projectiles.push({
      id,
      x: this.survivor.x,
      y: this.survivor.y,
      targetX: target.x,
      targetY: target.y,
      damage: this.survivor.damage,
      speed: 550
    });
  }

  // ==========================================
  // INIMIGOS E CHEFES
  // ==========================================

  private updateEnemies(dt: number, now: number): void {
    const enemiesToRemove: string[] = [];

    for (const enemy of this.enemies.values()) {
      // Movimento em direção ao sobrevivente
      const dx = this.survivor.x - enemy.x;
      const dy = this.survivor.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Se congelado por habilidade, aplica lentidão
      const isFrozen = (enemy as any).frozenUntil && now < (enemy as any).frozenUntil;
      const currentSpeed = isFrozen ? enemy.speed * 0.25 : enemy.speed;

      if (dist > enemy.radius + 15) {
        enemy.x += (dx / dist) * currentSpeed * dt;
        enemy.y += (dy / dist) * currentSpeed * dt;
      } else {
        // Zumbi está tocando o sobrevivente -> Ataque corpo a corpo
        this.damageSurvivor(enemy.damage * dt);
      }

      // Lógica específica do Chefe (Ataque Especial com Alerta)
      if (enemy.isBoss) {
        this.waveState.bossHp = Math.max(0, enemy.hp);
        enemy.specialAttackCountdown = (enemy.specialAttackCountdown || 8) - dt;

        if (enemy.specialAttackCountdown <= 2 && !enemy.specialAttackTelegraph) {
          enemy.specialAttackTelegraph = true;
          this.emitVisualEffect({
            id: 'boss_warn_' + Date.now(),
            type: 'FIRE_AREA',
            x: enemy.x,
            y: enemy.y,
            radius: 180,
            durationMs: 2000
          });
        }

        if (enemy.specialAttackCountdown <= 0) {
          enemy.specialAttackCountdown = 8;
          enemy.specialAttackTelegraph = false;
          // Executa Ground Smash
          const bossDist = Math.sqrt((this.survivor.x - enemy.x) ** 2 + (this.survivor.y - enemy.y) ** 2);
          if (bossDist <= 180) {
            this.damageSurvivor(enemy.damage * 1.8);
          }
          this.emitVisualEffect({
            id: 'boss_smash_' + Date.now(),
            type: 'EXPLOSION',
            x: enemy.x,
            y: enemy.y,
            radius: 180,
            durationMs: 600
          });
        }
      }

      if (enemy.hp <= 0) {
        enemiesToRemove.push(enemy.id);
      }
    }

    // Remove inimigos mortos e concede recompensas
    for (const enemyId of enemiesToRemove) {
      const enemy = this.enemies.get(enemyId);
      if (enemy) {
        this.onEnemyKilled(enemy);
        this.enemies.delete(enemyId);
      }
    }
  }

  private onEnemyKilled(enemy: EnemyData): void {
    this.kills++;
    this.survivor.kills++;
    this.score += enemy.scoreReward;
    this.waveState.totalKillsInWave++;

    this.gainXp(enemy.xpReward);

    if (enemy.isBoss) {
      this.bossesKilled++;
      this.waveState.isBossActive = false;
      this.status = 'PLAYING';
      this.addAnnouncement('BOSS', `VITÓRIA ÉPICA! O Chefe ${enemy.bossName || ''} foi derrotado pela comunidade!`);
      this.emit(SOCKET_EVENTS.BOSS_DEFEATED, { bossName: enemy.bossName, scoreReward: enemy.scoreReward });

      // Cura o sobrevivente como prêmio pela vitória sobre o chefe
      this.healSurvivor(50);
    }

    this.emit(SOCKET_EVENTS.ENEMY_DEFEATED, {
      id: enemy.id,
      scoreReward: enemy.scoreReward,
      xpReward: enemy.xpReward
    });
  }

  // ==========================================
  // PROJÉTEIS E COLISÕES
  // ==========================================

  private updateProjectiles(dt: number): void {
    const remaining: ProjectileData[] = [];

    for (const proj of this.projectiles) {
      const dx = proj.targetX - proj.x;
      const dy = proj.targetY - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15) {
        // Atingiu o ponto de destino
        this.checkProjectileHit(proj.targetX, proj.targetY, proj.damage, proj.splashRadius || 30);
      } else {
        const step = proj.speed * dt;
        proj.x += (dx / dist) * step;
        proj.y += (dy / dist) * step;

        // Verifica colisão com qualquer zumbi no caminho
        let hit = false;
        for (const enemy of this.enemies.values()) {
          const eDist = Math.sqrt((enemy.x - proj.x) ** 2 + (enemy.y - proj.y) ** 2);
          if (eDist <= enemy.radius + 8) {
            enemy.hp -= proj.damage;
            hit = true;
            this.emitVisualEffect({
              id: 'hit_' + Date.now(),
              type: 'SLASH',
              x: enemy.x,
              y: enemy.y,
              radius: 20,
              durationMs: 200
            });
            break;
          }
        }

        if (!hit) {
          remaining.push(proj);
        }
      }
    }

    this.projectiles = remaining;
  }

  private checkProjectileHit(x: number, y: number, damage: number, radius: number): void {
    for (const enemy of this.enemies.values()) {
      const dist = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2);
      if (dist <= enemy.radius + radius) {
        enemy.hp -= damage;
      }
    }
  }

  // ==========================================
  // BICHINHOS ALIADOS (DOADORES DE PRESENTES)
  // ==========================================

  private updateCompanions(dt: number, now: number): void {
    const expired: string[] = [];

    for (const pet of this.companions.values()) {
      if (pet.expiresAt && now > pet.expiresAt) {
        expired.push(pet.id);
        continue;
      }

      // Orbita ao redor do sobrevivente
      pet.orbitAngle = (pet.orbitAngle + 1.2 * dt) % (Math.PI * 2);
      pet.x = this.survivor.x + Math.cos(pet.orbitAngle) * pet.orbitDistance;
      pet.y = this.survivor.y + Math.sin(pet.orbitAngle) * pet.orbitDistance;

      // Ataque automático do bichinho: alveja o zumbi mais próximo num raio de 350px
      if (now - pet.lastAttackTimestamp >= pet.attackCooldownMs) {
        let nearest: EnemyData | null = null;
        let nearestDistSq = 350 * 350;

        for (const enemy of this.enemies.values()) {
          const dx = enemy.x - pet.x;
          const dy = enemy.y - pet.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < nearestDistSq) {
            nearestDistSq = distSq;
            nearest = enemy;
          }
        }

        if (nearest) {
          pet.lastAttackTimestamp = now;
          pet.targetEnemyId = nearest.id;
          this.projectiles.push({
            id: 'proj_pet_' + now + '_' + Math.random().toString(36).substring(2, 6),
            x: pet.x,
            y: pet.y,
            targetX: nearest.x,
            targetY: nearest.y,
            damage: pet.damage,
            speed: 480,
            splashRadius: 20,
            color: 0xffe600
          });
        }
      }
    }

    for (const id of expired) {
      this.companions.delete(id);
    }
  }

  spawnOrUpgradeCompanion(userId: string, username: string, avatarUrl?: string, giftName = 'Presente'): void {
    const now = Date.now();
    const key = userId || username;
    const existing = this.companions.get(key);

    if (existing) {
      existing.damage += 15;
      existing.attackCooldownMs = Math.max(350, existing.attackCooldownMs - 100);
      existing.expiresAt = now + 90000;
      existing.giftName = giftName;
      if (avatarUrl) existing.avatarUrl = avatarUrl;
      this.addAnnouncement('GIFT', `Pet guardião de @${username} ficou mais forte com ${giftName}! (Dano: ${existing.damage})`, username);
    } else {
      const count = this.companions.size;
      const baseDistance = 80 + (count % 3) * 25;
      const angle = (count * ((2 * Math.PI) / 6)) % (Math.PI * 2);

      const pet: CompanionPetData = {
        id: 'pet_' + key.replace(/[^a-zA-Z0-9_-]/g, '') + '_' + Date.now(),
        userId: key,
        username,
        avatarUrl,
        giftName,
        x: this.survivor.x + Math.cos(angle) * baseDistance,
        y: this.survivor.y + Math.sin(angle) * baseDistance,
        targetEnemyId: null,
        damage: 35,
        attackCooldownMs: 800,
        lastAttackTimestamp: 0,
        orbitAngle: angle,
        orbitDistance: baseDistance,
        expiresAt: now + 90000
      };

      this.companions.set(key, pet);
      this.addAnnouncement('GIFT', `Novo bichinho guardião de @${username} invocado na arena!`, username);
      this.emitVisualEffect({
        id: 'pet_spawn_' + now,
        type: 'LEVEL_UP',
        x: pet.x,
        y: pet.y,
        radius: 60,
        durationMs: 800
      });
    }
  }

  // ==========================================
  // DANO E VIDA DO SOBREVIVENTE
  // ==========================================

  damageSurvivor(rawDamage: number): void {
    if (this.status !== 'PLAYING' && this.status !== 'BOSS_FIGHT') return;

    let finalDamage = rawDamage * (1 - this.survivor.armor);

    if (this.survivor.shieldActive) {
      finalDamage *= 0.2; // Escudo reduz 80% do dano
    }

    this.survivor.hp = Math.max(0, this.survivor.hp - finalDamage);
    this.emit(SOCKET_EVENTS.PLAYER_DAMAGED, { damage: finalDamage, currentHp: this.survivor.hp });

    if (this.survivor.hp <= 0) {
      this.status = 'GAME_OVER';
      this.stopLoop();
      this.addAnnouncement('GAME_OVER', 'O Sobrevivente caiu! Fim de jogo. A comunidade lutou bravamente!');
      this.emit(SOCKET_EVENTS.MATCH_FINISHED, {
        matchId: this.matchId,
        result: 'GAME_OVER',
        score: this.score,
        kills: this.kills,
        duration: this.matchDurationSeconds
      });
      this.emitStateUpdated();
    }
  }

  healSurvivor(amount: number): void {
    const prevHp = this.survivor.hp;
    this.survivor.hp = Math.min(this.survivor.maxHp, this.survivor.hp + amount);
    const healed = this.survivor.hp - prevHp;
    this.emit(SOCKET_EVENTS.PLAYER_HEALED, { amount: healed, currentHp: this.survivor.hp });
    this.emitVisualEffect({
      id: 'heal_' + Date.now(),
      type: 'HEAL_RING',
      x: this.survivor.x,
      y: this.survivor.y,
      radius: 60,
      durationMs: 800
    });
  }

  // ==========================================
  // EXPERIÊNCIA, NÍVEL E VOTAÇÃO
  // ==========================================

  private gainXp(amount: number): void {
    this.survivor.xp += amount;
    if (this.survivor.xp >= this.survivor.xpNeeded) {
      this.survivor.xp -= this.survivor.xpNeeded;
      this.survivor.level++;
      this.survivor.xpNeeded = Math.round(this.survivor.xpNeeded * 1.35);

      this.addAnnouncement('LEVEL_UP', `NÍVEL ${this.survivor.level}! Votação de melhoria aberta para os espectadores!`);
      this.emit(SOCKET_EVENTS.LEVEL_UP, { level: this.survivor.level });

      this.emitVisualEffect({
        id: 'lvl_' + Date.now(),
        type: 'LEVEL_UP',
        x: this.survivor.x,
        y: this.survivor.y,
        radius: 80,
        durationMs: 1200
      });

      this.startVoteSession();
    }
  }

  private startVoteSession(): void {
    const options: VoteOption[] = [
      {
        id: 1,
        title: 'Super Força',
        description: '+30% Dano nos Ataques',
        statBonus: { damage: Math.round(this.survivor.damage * 0.3) },
        votes: 0
      },
      {
        id: 2,
        title: 'Vitalidade Titânica',
        description: '+40 Vida Máxima e Cura Completa',
        statBonus: { maxHp: 40 },
        votes: 0
      },
      {
        id: 3,
        title: 'Agilidade Noturna',
        description: '+25% Velocidade e +15% Armadura',
        statBonus: { speed: Math.round(this.survivor.speed * 0.25), armor: 0.08 },
        votes: 0
      }
    ];

    this.activeVote = {
      id: 'vote_' + Date.now(),
      active: true,
      title: `Evolução para o Nível ${this.survivor.level}! Escolha o bônus:`,
      options,
      durationSeconds: 15,
      timeRemainingSeconds: 15,
      voters: {}
    };

    this.emit(SOCKET_EVENTS.VOTE_STARTED, this.activeVote);
  }

  registerVote(username: string, optionId: number): boolean {
    if (!this.activeVote || !this.activeVote.active) return false;
    if (optionId < 1 || optionId > this.activeVote.options.length) return false;

    // Se o usuário já votou, altera o voto
    const prevVote = this.activeVote.voters[username];
    if (prevVote) {
      const prevOption = this.activeVote.options.find(o => o.id === prevVote);
      if (prevOption) prevOption.votes = Math.max(0, prevOption.votes - 1);
    }

    const newOption = this.activeVote.options.find(o => o.id === optionId);
    if (newOption) {
      newOption.votes++;
      this.activeVote.voters[username] = optionId;
      this.emit(SOCKET_EVENTS.VOTE_UPDATED, this.activeVote);
      return true;
    }
    return false;
  }

  private updateVoteSession(dt: number): void {
    if (!this.activeVote || !this.activeVote.active) return;

    this.activeVote.timeRemainingSeconds -= dt;
    if (this.activeVote.timeRemainingSeconds <= 0) {
      this.resolveVote();
    }
  }

  private resolveVote(): void {
    if (!this.activeVote) return;

    let winningOption = this.activeVote.options[0];
    for (const opt of this.activeVote.options) {
      if (opt.votes > winningOption.votes) {
        winningOption = opt;
      }
    }

    // Aplica melhoria escolhida pela comunidade
    if (winningOption.statBonus.damage) {
      this.survivor.damage += winningOption.statBonus.damage;
    }
    if (winningOption.statBonus.maxHp) {
      this.survivor.maxHp += winningOption.statBonus.maxHp;
      this.survivor.hp = this.survivor.maxHp;
    }
    if (winningOption.statBonus.speed) {
      this.survivor.speed += winningOption.statBonus.speed;
    }
    if (winningOption.statBonus.armor) {
      this.survivor.armor = Math.min(0.7, this.survivor.armor + winningOption.statBonus.armor);
    }

    this.addAnnouncement(
      'LEVEL_UP',
      `Votação encerrada! A comunidade escolheu: ${winningOption.title} (${winningOption.votes} votos)!`
    );

    this.emit(SOCKET_EVENTS.VOTE_FINISHED, {
      winner: winningOption,
      totalVotes: Object.keys(this.activeVote.voters).length
    });

    this.activeVote = null;
  }

  // ==========================================
  // HABILIDADES ESPECIAIS
  // ==========================================

  triggerSkill(skillType: SkillType, activatedBy = 'Comunidade'): boolean {
    if (this.status !== 'PLAYING' && this.status !== 'BOSS_FIGHT') return false;

    const skill = this.survivor.skills[skillType];
    if (!skill) return false;

    const now = Date.now();
    if (now - skill.lastUsedMs < skill.cooldownMs) {
      return false; // Em recarga
    }

    skill.lastUsedMs = now;

    switch (skillType) {
      case 'CURA':
        this.healSurvivor(skill.intensity);
        this.addAnnouncement('SYSTEM', `${activatedBy} ativou CURA! +${skill.intensity} de Vida.`);
        break;

      case 'ESCUDO':
        this.survivor.shieldActive = true;
        this.survivor.shieldExpiresAt = now + skill.durationMs;
        this.emitVisualEffect({
          id: 'shield_' + now,
          type: 'SHIELD_PULSE',
          x: this.survivor.x,
          y: this.survivor.y,
          radius: 70,
          durationMs: skill.durationMs
        });
        this.addAnnouncement('SYSTEM', `${activatedBy} ativou ESCUDO! Danos reduzidos por 6s.`);
        break;

      case 'ATAQUE':
        // Causa dano a todos os inimigos num raio de 220px
        for (const enemy of this.enemies.values()) {
          const dist = Math.sqrt((enemy.x - this.survivor.x) ** 2 + (enemy.y - this.survivor.y) ** 2);
          if (dist <= 220) {
            enemy.hp -= skill.intensity;
          }
        }
        this.emitVisualEffect({
          id: 'slash_' + now,
          type: 'SLASH',
          x: this.survivor.x,
          y: this.survivor.y,
          radius: 220,
          durationMs: 400
        });
        this.addAnnouncement('SYSTEM', `${activatedBy} ativou ATAQUE GIRATÓRIO!`);
        break;

      case 'FOGO':
        // Causa dano continuo e queima inimigos
        for (const enemy of this.enemies.values()) {
          const dist = Math.sqrt((enemy.x - this.survivor.x) ** 2 + (enemy.y - this.survivor.y) ** 2);
          if (dist <= 280) {
            enemy.hp -= skill.intensity * 2;
          }
        }
        this.emitVisualEffect({
          id: 'fire_' + now,
          type: 'FIRE_AREA',
          x: this.survivor.x,
          y: this.survivor.y,
          radius: 280,
          durationMs: skill.durationMs
        });
        this.addAnnouncement('SYSTEM', `${activatedBy} lançou uma ONDA DE FOGO!`);
        break;

      case 'CONGELAMENTO':
        // Congela todos os zumbis
        for (const enemy of this.enemies.values()) {
          (enemy as any).frozenUntil = now + skill.durationMs;
        }
        this.emitVisualEffect({
          id: 'ice_' + now,
          type: 'ICE_BLAST',
          x: this.survivor.x,
          y: this.survivor.y,
          radius: 400,
          durationMs: skill.durationMs
        });
        this.addAnnouncement('SYSTEM', `${activatedBy} ativou NEVASCA ÁRTICA! Zumbis lentos por 5s.`);
        break;

      case 'EXPLOSAO':
        // Aniquila inimigos em raio de 350px
        for (const enemy of this.enemies.values()) {
          const dist = Math.sqrt((enemy.x - this.survivor.x) ** 2 + (enemy.y - this.survivor.y) ** 2);
          if (dist <= 350) {
            enemy.hp -= skill.intensity;
          }
        }
        this.emitVisualEffect({
          id: 'exp_' + now,
          type: 'EXPLOSION',
          x: this.survivor.x,
          y: this.survivor.y,
          radius: 350,
          durationMs: 800
        });
        this.addAnnouncement('SYSTEM', `${activatedBy} detonou uma SUPERNOVA!`);
        break;
    }

    this.emit(SOCKET_EVENTS.ABILITY_ACTIVATED, { skill: skillType, activatedBy });
    return true;
  }

  // ==========================================
  // EVENTOS DA LIVE (LIKES, SEGUIDORES, PRESENTES)
  // ==========================================

  handleLiveEvent(event: NormalizedLiveEvent): void {
    switch (event.type) {
      case 'LIKE': {
        const count = event.data.likeCount || 1;
        this.totalLikesReceived += count;
        this.collectiveGoal.current += count;
        this.recalcGoalProgress();
        this.emit(SOCKET_EVENTS.COLLECTIVE_GOAL_PROGRESS, this.collectiveGoal);
        break;
      }

      case 'FOLLOW': {
        const username = event.user.username || 'Espectador';
        const msg = `${this.settings.welcomeFollowerText} @${username} juntou-se à batalha!`;
        this.addAnnouncement('FOLLOWER', msg, username);
        this.emit(SOCKET_EVENTS.FOLLOWER_ANNOUNCEMENT, { username, message: msg });
        // Bônus simbólico de cura ao seguir
        this.healSurvivor(10);
        break;
      }

      case 'GIFT': {
        this.totalGiftsReceived += event.data.giftCount || 1;
        const giftName = event.data.giftName || 'Presente';
        const username = event.user.username;
        const userId = event.user.id || username;
        const avatarUrl = event.user.avatarUrl;

        // Invocação ou fortalecimento do bichinho aliado do doador
        this.spawnOrUpgradeCompanion(userId, username, avatarUrl, giftName);

        // Presentes ativam Supernova instantânea e curam o herói
        this.triggerSkill('EXPLOSAO', `@${username}`);
        this.healSurvivor(30);
        break;
      }

      case 'COMMENT': {
        this.totalCommentsReceived++;
        break;
      }
    }
  }

  private recalcGoalProgress(): void {
    if (this.collectiveGoal.target <= 0) return;
    this.collectiveGoal.progressPercent = Math.min(
      100,
      Math.round((this.collectiveGoal.current / this.collectiveGoal.target) * 100)
    );

    if (this.collectiveGoal.current >= this.collectiveGoal.target && !this.collectiveGoal.achieved) {
      this.collectiveGoal.achieved = true;
      this.addAnnouncement('GOAL', `META COLETIVA CONCLUÍDA! ${this.collectiveGoal.rewardDescription}`);
      this.emit(SOCKET_EVENTS.COLLECTIVE_GOAL_ACHIEVED, this.collectiveGoal);

      // Aplica a recompensa coletiva
      this.healSurvivor(80);
      this.triggerSkill('ESCUDO', 'Meta Coletiva');
      this.score += 1000;

      // Prepara a próxima meta mais desafiadora
      setTimeout(() => {
        this.collectiveGoal = {
          id: 'goal_' + Date.now(),
          title: 'Meta de Curtidas (Nível 2)',
          type: 'LIKES',
          current: 0,
          target: Math.round(this.collectiveGoal.target * 1.8),
          rewardSkillOrBuff: 'EXPLOSAO',
          rewardDescription: 'Supernova Coletiva + 2000 Pontos!',
          achieved: false,
          progressPercent: 0
        };
        this.emit(SOCKET_EVENTS.COLLECTIVE_GOAL_PROGRESS, this.collectiveGoal);
      }, 5000);
    }
  }

  // ==========================================
  // ANÚNCIOS E SNAPSHOT
  // ==========================================

  private addAnnouncement(type: GameAnnouncement['type'], message: string, author?: string): void {
    const announcement: GameAnnouncement = {
      id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type,
      message,
      author,
      timestamp: Date.now()
    };
    this.announcements.unshift(announcement);
    if (this.announcements.length > 8) {
      this.announcements.pop();
    }
    this.emit(SOCKET_EVENTS.NOTIFICATION, announcement);
  }

  private emitVisualEffect(effect: VisualEffectEvent): void {
    this.emit(SOCKET_EVENTS.VISUAL_EFFECT, effect);
  }

  private emitStateUpdated(): void {
    this.emit(SOCKET_EVENTS.GAME_STATE_SNAPSHOT, this.getSnapshot());
  }

  getSnapshot(): GameStateSnapshot {
    return {
      status: this.status,
      matchId: this.matchId,
      matchDurationSeconds: this.matchDurationSeconds,
      score: this.score,
      kills: this.kills,
      survivor: {
        ...this.survivor,
        skills: { ...this.survivor.skills }
      },
      enemies: Array.from(this.enemies.values()),
      projectiles: [...this.projectiles],
      companions: Array.from(this.companions.values()),
      wave: { ...this.waveState },
      collectiveGoal: { ...this.collectiveGoal },
      activeVote: this.activeVote ? { ...this.activeVote } : null,
      providerType: 'SIMULATOR',
      totalLikesReceived: this.totalLikesReceived,
      recentAnnouncements: [...this.announcements]
    };
  }

  getMatchRecord(result: 'VICTORY' | 'GAME_OVER' | 'ABORTED'): any {
    return {
      id: this.matchId,
      startedAt: new Date(this.matchStartTime || Date.now()).toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: this.matchDurationSeconds,
      maxWave: this.waveState.currentWave,
      score: this.score,
      zombiesKilled: this.kills,
      bossesKilled: this.bossesKilled,
      result,
      providerType: 'SIMULATOR',
      totalLikes: this.totalLikesReceived,
      totalComments: this.totalCommentsReceived,
      totalGifts: this.totalGiftsReceived
    };
  }
}
