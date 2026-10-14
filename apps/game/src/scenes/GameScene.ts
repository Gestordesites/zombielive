import Phaser from 'phaser';
import {
  GameStateSnapshot,
  EnemyData,
  ProjectileData,
  VisualEffectEvent,
  GameAnnouncement,
  VoteSession
} from '@zombie-live/shared';
import { GameSocketClient } from '../network/socketClient.js';

export class GameScene extends Phaser.Scene {
  private socketClient!: GameSocketClient;
  private currentSnapshot: GameStateSnapshot | null = null;

  // Sprites
  private floorTile!: Phaser.GameObjects.TileSprite;
  private survivorSprite!: Phaser.GameObjects.Sprite;
  private survivorHealthBar!: Phaser.GameObjects.Graphics;
  private survivorShieldSprite!: Phaser.GameObjects.Sprite;
  private enemySprites: Map<string, { sprite: Phaser.GameObjects.Sprite; healthBar: Phaser.GameObjects.Graphics; data: EnemyData }> = new Map();
  private projectileSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();

  // Elementos do HUD
  private hudContainer!: Phaser.GameObjects.Container;
  private waveText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private providerBadgeText!: Phaser.GameObjects.Text;
  private hpBarGfx!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private xpBarGfx!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private goalBarGfx!: Phaser.GameObjects.Graphics;
  private goalText!: Phaser.GameObjects.Text;

  // Chefe
  private bossBarContainer!: Phaser.GameObjects.Container;
  private bossBarGfx!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;

  // Votação
  private voteContainer!: Phaser.GameObjects.Container;
  private voteTitleText!: Phaser.GameObjects.Text;
  private voteTimerText!: Phaser.GameObjects.Text;
  private voteOptionTexts: Phaser.GameObjects.Text[] = [];

  // Anúncios flutuantes
  private announcementContainer!: Phaser.GameObjects.Container;
  private announcementText!: Phaser.GameObjects.Text;
  private announcementTimer?: Phaser.Time.TimerEvent;

  // Telas de Fim/Pausa
  private stateOverlayContainer!: Phaser.GameObjects.Container;
  private stateOverlayBg!: Phaser.GameObjects.Rectangle;
  private stateOverlayTitle!: Phaser.GameObjects.Text;
  private stateOverlaySubtitle!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const width = 1080;
    const height = 1920;

    // 1. Chão da Arena (Vertical 9:16)
    this.floorTile = this.add.tileSprite(width / 2, height / 2, width, height, 'arena_floor');

    // Bordas brilhantes da arena
    const borders = this.add.graphics();
    borders.lineStyle(6, 0x06b6d4, 0.85);
    borders.strokeRect(12, 12, width - 24, height - 24);
    borders.lineStyle(2, 0xef4444, 0.4);
    borders.strokeRect(20, 20, width - 40, height - 40);

    // 2. Sobrevivente
    this.survivorShieldSprite = this.add.sprite(width / 2, height / 2, 'shield_bubble');
    this.survivorShieldSprite.setVisible(false);
    this.survivorShieldSprite.setDepth(15);

    this.survivorSprite = this.add.sprite(width / 2, height / 2, 'survivor');
    this.survivorSprite.setDepth(10);
    this.survivorHealthBar = this.add.graphics();
    this.survivorHealthBar.setDepth(11);

    // 3. Montar HUD Vertical
    this.createHud(width, height);

    // 4. Conectar Socket
    this.socketClient = new GameSocketClient();

    const connOverlay = document.getElementById('connection-overlay');
    this.socketClient.onConnectionChange(connected => {
      if (connOverlay) {
        connOverlay.style.display = connected ? 'none' : 'block';
      }
    });

    this.socketClient.onSnapshot(snap => {
      this.currentSnapshot = snap;
      this.updateHudWithSnapshot(snap);
    });

    this.socketClient.onVisualEffect(effect => {
      this.playVisualEffect(effect);
    });

    this.socketClient.onAnnouncement(ann => {
      this.showAnnouncement(ann.message);
    });
  }

  private createHud(width: number, height: number): void {
    this.hudContainer = this.add.container(0, 0).setDepth(100);

    // Header Superior (Barra escura translúcida otimizada para celular)
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a0d14, 0.9);
    headerBg.fillRect(0, 0, width, 115);
    headerBg.lineStyle(3, 0x1e293b, 1);
    headerBg.lineBetween(0, 115, width, 115);
    this.hudContainer.add(headerBg);

    // Linha 1: Onda, Timer e Badge do Provedor
    this.waveText = this.add.text(32, 20, 'ONDA 1', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '32px',
      color: '#38bdf8'
    });
    this.timerText = this.add.text(190, 24, '⏱️ 00:30', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '24px',
      color: '#f8fafc',
      fontStyle: 'bold'
    });
    this.providerBadgeText = this.add.text(width - 32, 24, '🎮 SIMULADOR', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '17px',
      color: '#4ade80',
      backgroundColor: '#14532d',
      padding: { x: 14, y: 7 }
    }).setOrigin(1, 0);
    this.hudContainer.add([this.waveText, this.timerText, this.providerBadgeText]);

    // Linha 2: Zumbis Eliminados e Pontuação
    this.killsText = this.add.text(32, 68, '💀 0 Eliminados', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#ef4444',
      fontStyle: 'bold'
    });
    this.scoreText = this.add.text(360, 68, '🏆 0 Pontos', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#facc15',
      fontStyle: 'bold'
    });
    this.hudContainer.add([this.killsText, this.scoreText]);

    // Barra de Chefe (Abaixo do header)
    this.bossBarContainer = this.add.container(width / 2, 160).setVisible(false).setDepth(110);
    const bossBg = this.add.graphics();
    bossBg.fillStyle(0x450a0a, 0.95);
    bossBg.fillRoundedRect(-420, -22, 840, 46, 8);
    bossBg.lineStyle(3, 0xdc2626, 1);
    bossBg.strokeRoundedRect(-420, -22, 840, 46, 8);
    this.bossBarGfx = this.add.graphics();
    this.bossNameText = this.add.text(0, 0, '⚠️ O COLOSSO ZUMBI: 2500 / 2500 HP', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.bossBarContainer.add([bossBg, this.bossBarGfx, this.bossNameText]);

    // Banner Flutuante de Anúncios (Seguidores, Presentes, Metas)
    this.announcementContainer = this.add.container(width / 2, 235).setAlpha(0).setDepth(120);
    const annBg = this.add.graphics();
    annBg.fillStyle(0x1e1b4b, 0.95);
    annBg.fillRoundedRect(-380, -24, 760, 48, 24);
    annBg.lineStyle(3, 0x6366f1, 1);
    annBg.strokeRoundedRect(-380, -24, 760, 48, 24);
    this.announcementText = this.add.text(0, 0, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.announcementContainer.add([annBg, this.announcementText]);

    // Card Inferior Mobile (Vida, XP e Meta Coletiva)
    const bottomGfx = this.add.graphics();
    bottomGfx.fillStyle(0x0a0d14, 0.92);
    bottomGfx.fillRoundedRect(30, height - 215, width - 60, 185, 16);
    bottomGfx.lineStyle(3, 0x334155, 1);
    bottomGfx.strokeRoundedRect(30, height - 215, width - 60, 185, 16);
    this.hudContainer.add(bottomGfx);

    // Vida e XP (Coluna Esquerda do Card Inferior)
    this.hpBarGfx = this.add.graphics();
    this.hudContainer.add(this.hpBarGfx);

    this.hpText = this.add.text(55, height - 200, '❤️ SOBREVIVENTE: 100 / 100 HP', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.hudContainer.add(this.hpText);

    this.xpBarGfx = this.add.graphics();
    this.hudContainer.add(this.xpBarGfx);

    this.xpText = this.add.text(55, height - 130, '⭐ NÍVEL 1 (0 / 50 XP)', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '17px',
      color: '#38bdf8',
      fontStyle: 'bold'
    });
    this.hudContainer.add(this.xpText);

    // Meta Coletiva (Coluna Direita do Card Inferior)
    this.goalBarGfx = this.add.graphics();
    this.hudContainer.add(this.goalBarGfx);

    this.goalText = this.add.text(width - 505, height - 200, '🎯 META DA LIVE: 0 / 500 Curtidas (0%)', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '17px',
      color: '#facc15',
      fontStyle: 'bold'
    });
    const goalRewardSub = this.add.text(width - 505, height - 130, '🎁 Recompensa: Cura Coletiva + Super Bônus', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      color: '#94a3b8'
    });
    this.hudContainer.add([this.goalText, goalRewardSub]);

    // Modal de Votação (Centro da tela vertical)
    this.voteContainer = this.add.container(width / 2, height / 2 - 30).setVisible(false).setDepth(150);
    const voteBg = this.add.graphics();
    voteBg.fillStyle(0x0f172a, 0.96);
    voteBg.fillRoundedRect(-380, -180, 760, 360, 16);
    voteBg.lineStyle(4, 0x06b6d4, 1);
    voteBg.strokeRoundedRect(-380, -180, 760, 360, 16);
    this.voteTitleText = this.add.text(0, -140, '⚡ NÍVEL ALCANÇADO! VOTAÇÃO DOS ESPECTADORES', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#38bdf8',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.voteTimerText = this.add.text(0, -100, 'Digite no chat: VOTAR 1, VOTAR 2 ou VOTAR 3 (⏱️ 15s)', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#facc15',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.voteContainer.add([voteBg, this.voteTitleText, this.voteTimerText]);

    for (let i = 0; i < 3; i++) {
      const optTxt = this.add.text(0, -40 + i * 65, `Opção ${i + 1}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#f8fafc',
        backgroundColor: '#1e293b',
        padding: { x: 20, y: 12 }
      }).setOrigin(0.5);
      this.voteOptionTexts.push(optTxt);
      this.voteContainer.add(optTxt);
    }

    // Tela de Fim / Pausa / Contagem
    this.stateOverlayContainer = this.add.container(width / 2, height / 2).setVisible(false).setDepth(200);
    this.stateOverlayBg = this.add.rectangle(0, 0, width, height, 0x000000, 0.88);
    this.stateOverlayTitle = this.add.text(0, -40, '', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '56px',
      color: '#ef4444'
    }).setOrigin(0.5);
    this.stateOverlaySubtitle = this.add.text(0, 40, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '26px',
      color: '#e2e8f0'
    }).setOrigin(0.5);
    this.stateOverlayContainer.add([this.stateOverlayBg, this.stateOverlayTitle, this.stateOverlaySubtitle]);
  }

  // ==========================================
  // ATUALIZAÇÃO DO JOGO EM CADA QUADRO
  // ==========================================

  update(): void {
    if (!this.currentSnapshot) return;
    const snap = this.currentSnapshot;

    // 1. Atualizar Sobrevivente
    this.survivorSprite.setPosition(snap.survivor.x, snap.survivor.y);
    this.survivorShieldSprite.setPosition(snap.survivor.x, snap.survivor.y);
    this.survivorShieldSprite.setVisible(snap.survivor.shieldActive);

    // Mira do sobrevivente em direção ao alvo
    if (snap.survivor.targetEnemyId) {
      const target = this.enemySprites.get(snap.survivor.targetEnemyId);
      if (target) {
        const angle = Phaser.Math.Angle.Between(
          this.survivorSprite.x,
          this.survivorSprite.y,
          target.sprite.x,
          target.sprite.y
        );
        this.survivorSprite.setRotation(angle);
      }
    }

    // Mini barra de vida sobre o sobrevivente
    this.survivorHealthBar.clear();
    const hpRatio = Math.max(0, snap.survivor.hp / snap.survivor.maxHp);
    this.survivorHealthBar.fillStyle(0x000000, 0.6);
    this.survivorHealthBar.fillRect(snap.survivor.x - 24, snap.survivor.y - 32, 48, 6);
    this.survivorHealthBar.fillStyle(hpRatio > 0.3 ? 0x22c55e : 0xef4444, 1);
    this.survivorHealthBar.fillRect(snap.survivor.x - 24, snap.survivor.y - 32, 48 * hpRatio, 6);

    // 2. Atualizar Inimigos
    const activeEnemyIds = new Set<string>();

    for (const enemyData of snap.enemies) {
      activeEnemyIds.add(enemyData.id);
      let enemyObj = this.enemySprites.get(enemyData.id);

      if (!enemyObj) {
        let texture = 'zombie_common';
        if (enemyData.type === 'RUNNER') texture = 'zombie_runner';
        else if (enemyData.type === 'TANK') texture = 'zombie_tank';
        else if (enemyData.type === 'BOSS') texture = 'zombie_boss';

        const sprite = this.add.sprite(enemyData.x, enemyData.y, texture).setDepth(enemyData.isBoss ? 9 : 8);
        const healthBar = this.add.graphics().setDepth(enemyData.isBoss ? 10 : 9);
        enemyObj = { sprite, healthBar, data: enemyData };
        this.enemySprites.set(enemyData.id, enemyObj);
      }

      // Interpolação suave
      enemyObj.sprite.x += (enemyData.x - enemyObj.sprite.x) * 0.4;
      enemyObj.sprite.y += (enemyData.y - enemyObj.sprite.y) * 0.4;

      // Rotação do zumbi olhando para o herói
      const angle = Phaser.Math.Angle.Between(enemyObj.sprite.x, enemyObj.sprite.y, snap.survivor.x, snap.survivor.y);
      enemyObj.sprite.setRotation(angle);

      // Mini barra de vida sobre o zumbi
      enemyObj.healthBar.clear();
      const zHpRatio = Math.max(0, enemyData.hp / enemyData.maxHp);
      const barWidth = enemyData.isBoss ? 80 : 32;
      const barHeight = enemyData.isBoss ? 7 : 4;
      const offsetY = enemyData.isBoss ? 56 : 24;

      enemyObj.healthBar.fillStyle(0x000000, 0.6);
      enemyObj.healthBar.fillRect(enemyObj.sprite.x - barWidth / 2, enemyObj.sprite.y - offsetY, barWidth, barHeight);
      enemyObj.healthBar.fillStyle(enemyData.isBoss ? 0xdc2626 : 0x16a34a, 1);
      enemyObj.healthBar.fillRect(enemyObj.sprite.x - barWidth / 2, enemyObj.sprite.y - offsetY, barWidth * zHpRatio, barHeight);
    }

    // Remove zumbis que não estão mais no snapshot (derrotados)
    for (const [id, enemyObj] of this.enemySprites.entries()) {
      if (!activeEnemyIds.has(id)) {
        // Efeito de explosão de sangue/partícula ao morrer
        this.createDeathPuff(enemyObj.sprite.x, enemyObj.sprite.y);
        enemyObj.sprite.destroy();
        enemyObj.healthBar.destroy();
        this.enemySprites.delete(id);
      }
    }

    // 3. Atualizar Projéteis
    const activeProjIds = new Set<string>();
    for (const projData of snap.projectiles) {
      activeProjIds.add(projData.id);
      let pSprite = this.projectileSprites.get(projData.id);
      if (!pSprite) {
        pSprite = this.add.sprite(projData.x, projData.y, 'projectile').setDepth(12);
        this.projectileSprites.set(projData.id, pSprite);
      }
      pSprite.setPosition(projData.x, projData.y);
    }

    for (const [id, pSprite] of this.projectileSprites.entries()) {
      if (!activeProjIds.has(id)) {
        pSprite.destroy();
        this.projectileSprites.delete(id);
      }
    }

    // 4. Chefe
    if (snap.wave.isBossActive) {
      this.bossBarContainer.setVisible(true);
      this.bossBarGfx.clear();
      const bRatio = Math.max(0, snap.wave.bossHp / snap.wave.bossMaxHp);
      this.bossBarGfx.fillStyle(0xdc2626, 1);
      this.bossBarGfx.fillRoundedRect(-296, -12, 592 * bRatio, 28, 4);
      this.bossNameText.setText(`⚠️ O COLOSSO ZUMBI: ${Math.round(snap.wave.bossHp)} / ${snap.wave.bossMaxHp} HP`);
    } else {
      this.bossBarContainer.setVisible(false);
    }

    // 5. Votação
    if (snap.activeVote && snap.activeVote.active) {
      this.voteContainer.setVisible(true);
      this.voteTimerText.setText(`Digite no chat: VOTAR 1, VOTAR 2 ou VOTAR 3 (⏱️ ${Math.ceil(snap.activeVote.timeRemainingSeconds)}s)`);
      snap.activeVote.options.forEach((opt, idx) => {
        if (this.voteOptionTexts[idx]) {
          this.voteOptionTexts[idx].setText(`[${opt.id}] ${opt.title} (${opt.description}) — ${opt.votes} Votos`);
        }
      });
    } else {
      this.voteContainer.setVisible(false);
    }

    // 6. Overlays de Estado
    this.updateStateOverlay(snap.status);
  }

  private updateHudWithSnapshot(snap: GameStateSnapshot): void {
    // Topo
    this.waveText.setText(`ONDA ${snap.wave.currentWave}`);
    const minutes = Math.floor(snap.wave.timeRemainingSeconds / 60);
    const seconds = Math.floor(snap.wave.timeRemainingSeconds % 60);
    this.timerText.setText(`⏱️ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    this.killsText.setText(`💀 ${snap.kills} Eliminados`);
    this.scoreText.setText(`🏆 ${snap.score.toLocaleString('pt-BR')} Pontos`);

    // Provedor Badge
    if (snap.providerType === 'CONNECTED') {
      this.providerBadgeText.setText('🔴 TIKTOK LIVE CONECTADO').setBackgroundColor('#dc2626').setColor('#ffffff');
    } else if (snap.providerType === 'DISCONNECTED') {
      this.providerBadgeText.setText('⚪ DESCONECTADO DA LIVE').setBackgroundColor('#475569').setColor('#cbd5e1');
    } else {
      this.providerBadgeText.setText('🎮 MODO DEMONSTRAÇÃO (SIMULADOR)').setBackgroundColor('#14532d').setColor('#4ade80');
    }

    // Vida do Herói (Card Inferior Mobile)
    this.hpBarGfx.clear();
    const hpRatio = Math.max(0, snap.survivor.hp / snap.survivor.maxHp);
    this.hpBarGfx.fillStyle(0x1e293b, 1);
    this.hpBarGfx.fillRoundedRect(55, 1920 - 170, 440, 22, 6);
    this.hpBarGfx.fillStyle(hpRatio > 0.3 ? 0x22c55e : 0xef4444, 1);
    this.hpBarGfx.fillRoundedRect(55, 1920 - 170, 440 * hpRatio, 22, 6);
    this.hpText.setText(`❤️ SOBREVIVENTE: ${Math.round(snap.survivor.hp)} / ${snap.survivor.maxHp} HP`);

    // Experiência
    this.xpBarGfx.clear();
    const xpRatio = Math.min(1, Math.max(0, snap.survivor.xp / snap.survivor.xpNeeded));
    this.xpBarGfx.fillStyle(0x1e293b, 1);
    this.xpBarGfx.fillRoundedRect(55, 1920 - 100, 440, 16, 5);
    this.xpBarGfx.fillStyle(0x06b6d4, 1);
    this.xpBarGfx.fillRoundedRect(55, 1920 - 100, 440 * xpRatio, 16, 5);
    this.xpText.setText(`⭐ NÍVEL ${snap.survivor.level} (${snap.survivor.xp} / ${snap.survivor.xpNeeded} XP)`);

    // Meta Coletiva
    this.goalBarGfx.clear();
    const goalRatio = Math.min(1, snap.collectiveGoal.progressPercent / 100);
    this.goalBarGfx.fillStyle(0x1e293b, 1);
    this.goalBarGfx.fillRoundedRect(1080 - 505, 1920 - 170, 440, 22, 6);
    this.goalBarGfx.fillStyle(0xeab308, 1);
    this.goalBarGfx.fillRoundedRect(1080 - 505, 1920 - 170, 440 * goalRatio, 22, 6);
    this.goalText.setText(`🎯 META: ${snap.collectiveGoal.current} / ${snap.collectiveGoal.target} (${snap.collectiveGoal.progressPercent}%)`);
  }

  private updateStateOverlay(status: string): void {
    if (status === 'PLAYING' || status === 'BOSS_FIGHT') {
      this.stateOverlayContainer.setVisible(false);
      return;
    }

    this.stateOverlayContainer.setVisible(true);

    switch (status) {
      case 'IDLE':
        this.stateOverlayTitle.setText('ZOMBIE LIVE').setColor('#38bdf8');
        this.stateOverlaySubtitle.setText('Aguardando início da partida pelo painel de controle...');
        break;
      case 'COUNTDOWN':
        this.stateOverlayTitle.setText('PREPAREM-SE!').setColor('#facc15');
        this.stateOverlaySubtitle.setText('A horda zumbi está se aproximando!');
        break;
      case 'PAUSED':
        this.stateOverlayTitle.setText('JOGO PAUSADO').setColor('#f97316');
        this.stateOverlaySubtitle.setText('A transmissão continua ativa. Aguarde a retomada.');
        break;
      case 'GAME_OVER':
        this.stateOverlayTitle.setText('GAME OVER').setColor('#dc2626');
        this.stateOverlaySubtitle.setText('O Sobrevivente foi dominado pela horda zumbi!');
        break;
      case 'VICTORY':
        this.stateOverlayTitle.setText('VITÓRIA DA COMUNIDADE!').setColor('#22c55e');
        this.stateOverlaySubtitle.setText('Todos os desafios e chefes foram superados com sucesso!');
        break;
    }
  }

  // ==========================================
  // EFEITOS VISUAIS
  // ==========================================

  private playVisualEffect(effect: VisualEffectEvent): void {
    const gfx = this.add.graphics().setDepth(30);

    switch (effect.type) {
      case 'EXPLOSION': {
        gfx.lineStyle(6, 0xf97316, 1);
        gfx.strokeCircle(effect.x, effect.y, effect.radius);
        gfx.fillStyle(0xfef08a, 0.4);
        gfx.fillCircle(effect.x, effect.y, effect.radius);
        this.tweens.add({
          targets: gfx,
          alpha: 0,
          scale: 1.3,
          duration: effect.durationMs,
          onComplete: () => gfx.destroy()
        });
        break;
      }

      case 'SLASH': {
        gfx.lineStyle(4, 0x38bdf8, 1);
        gfx.strokeCircle(effect.x, effect.y, effect.radius);
        this.tweens.add({
          targets: gfx,
          alpha: 0,
          duration: effect.durationMs,
          onComplete: () => gfx.destroy()
        });
        break;
      }

      case 'FIRE_AREA': {
        gfx.fillStyle(0xe11d48, 0.35);
        gfx.fillCircle(effect.x, effect.y, effect.radius);
        gfx.lineStyle(2, 0xf97316, 0.8);
        gfx.strokeCircle(effect.x, effect.y, effect.radius);
        this.tweens.add({
          targets: gfx,
          alpha: 0,
          duration: effect.durationMs,
          onComplete: () => gfx.destroy()
        });
        break;
      }

      case 'ICE_BLAST': {
        gfx.fillStyle(0x06b6d4, 0.3);
        gfx.fillCircle(effect.x, effect.y, effect.radius);
        gfx.lineStyle(4, 0x67e8f9, 0.9);
        gfx.strokeCircle(effect.x, effect.y, effect.radius);
        this.tweens.add({
          targets: gfx,
          alpha: 0,
          duration: effect.durationMs,
          onComplete: () => gfx.destroy()
        });
        break;
      }

      case 'HEAL_RING': {
        gfx.lineStyle(5, 0x22c55e, 1);
        gfx.strokeCircle(effect.x, effect.y, effect.radius);
        this.tweens.add({
          targets: gfx,
          alpha: 0,
          scale: 1.4,
          duration: effect.durationMs,
          onComplete: () => gfx.destroy()
        });
        break;
      }

      case 'LEVEL_UP': {
        gfx.lineStyle(6, 0xfacc15, 1);
        gfx.strokeCircle(effect.x, effect.y, effect.radius);
        this.tweens.add({
          targets: gfx,
          alpha: 0,
          scale: 1.8,
          duration: effect.durationMs,
          onComplete: () => gfx.destroy()
        });
        break;
      }
    }
  }

  private createDeathPuff(x: number, y: number): void {
    const puff = this.add.graphics().setDepth(20);
    puff.fillStyle(0x16a34a, 0.8);
    puff.fillCircle(x, y, 16);
    this.tweens.add({
      targets: puff,
      alpha: 0,
      scale: 1.6,
      duration: 350,
      onComplete: () => puff.destroy()
    });
  }

  private showAnnouncement(text: string): void {
    this.announcementText.setText(text);
    this.announcementContainer.setAlpha(1);

    if (this.announcementTimer) {
      this.announcementTimer.remove();
    }

    this.announcementTimer = this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: this.announcementContainer,
        alpha: 0,
        duration: 500
      });
    });
  }
}
