import Phaser from 'phaser';
import {
  GameStateSnapshot,
  EnemyData,
  ProjectileData,
  CompanionPetData,
  VisualEffectEvent,
  GameAnnouncement,
  VoteSession,
  SOCKET_EVENTS
} from '@zombie-live/shared';
import { GameSocketClient } from '../network/socketClient.js';
import { soundManager } from '../audio/SoundManager.js';

export class GameScene extends Phaser.Scene {
  private socketClient!: GameSocketClient;
  private currentSnapshot: GameStateSnapshot | null = null;
  private lastProjectileCount: number = 0;

  // Cenário e Iluminação
  private floorTile!: Phaser.GameObjects.TileSprite;
  private survivorLight!: Phaser.GameObjects.Image;
  private survivorShadow!: Phaser.GameObjects.Image;
  private vignetteOverlay!: Phaser.GameObjects.Image;

  // Personagens e Sprites
  private survivorSprite!: Phaser.GameObjects.Sprite;
  private survivorHealthBar!: Phaser.GameObjects.Graphics;
  private survivorShieldSprite!: Phaser.GameObjects.Sprite;
  private enemySprites: Map<string, {
    sprite: Phaser.GameObjects.Sprite;
    shadow: Phaser.GameObjects.Image;
    healthBar: Phaser.GameObjects.Graphics;
    data: EnemyData;
    lastHp: number;
    shadowOffsetY?: number;
  }> = new Map();
  private projectileSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private companionNodes: Map<string, {
    container: Phaser.GameObjects.Container;
    petSprite: Phaser.GameObjects.Sprite;
    nameTag: Phaser.GameObjects.Text;
    avatarImg?: Phaser.GameObjects.Image;
    data: CompanionPetData;
  }> = new Map();

  // Elementos do HUD Vertical
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

    // Desbloqueia contexto de áudio em clique ou toque
    this.input.on('pointerdown', () => {
      soundManager.resumeAudio();
      if (!soundManager.isBgmActive()) {
        soundManager.startBgm();
      }
    });

    // 1. Chão da Arena Cartoon (Asfalto escuro com rachaduras tóxicas)
    this.floorTile = this.add.tileSprite(width / 2, height / 2, width, height, 'arena_floor');

    // 2. Iluminação Dinâmica ao redor do Herói
    this.survivorLight = this.add.image(width / 2, height / 2, 'survivor_light')
      .setDepth(2)
      .setScale(1.35)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Sombra suave do Sobrevivente (proporcional ao novo tamanho maior)
    this.survivorShadow = this.add.image(width / 2, height / 2 + 36, 'shadow_blob')
      .setDepth(3)
      .setScale(1.30);

    // Bordas de arena minimalistas elegantes e discretas
    const borders = this.add.graphics().setDepth(5);
    borders.lineStyle(8, 0x0a0c12, 1);
    borders.strokeRect(8, 8, width - 16, height - 16);
    borders.lineStyle(2, 0x1e2433, 0.8);
    borders.strokeRect(14, 14, width - 28, height - 28);

    // 3. Sobrevivente Principal (+55% maior)
    this.survivorShieldSprite = this.add.sprite(width / 2, height / 2, 'shield_bubble');
    this.survivorShieldSprite.setVisible(false);
    this.survivorShieldSprite.setDepth(15);
    this.survivorShieldSprite.setScale(1.40);

    this.survivorSprite = this.add.sprite(width / 2, height / 2, 'survivor_idle')
      .setDepth(10)
      .setScale(1.12);
    this.survivorSprite.play('survivor_walk_anim');

    this.survivorHealthBar = this.add.graphics();
    this.survivorHealthBar.setDepth(16);

    // 4. Vinheta atmosférica escura nas bordas da tela vertical
    this.vignetteOverlay = this.add.image(width / 2, height / 2, 'vignette_overlay')
      .setDepth(85)
      .setScrollFactor(0);

    // 5. Montar HUD Vertical
    this.createHud(width, height);

    // 6. Conectar Socket
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
      if (!soundManager.isBgmActive()) {
        soundManager.startBgm();
      }
    });

    this.socketClient.onVisualEffect(effect => {
      this.playVisualEffect(effect);
    });

    this.socketClient.onAnnouncement(ann => {
      this.showAnnouncement(ann.message);
      if (ann.type === 'GIFT') {
        soundManager.playGiftAlert();
      }
    });

    // 7. Efeitos Sonoros do Jogo e da Live
    this.socketClient.on(SOCKET_EVENTS.FOLLOWER_ANNOUNCEMENT, () => soundManager.playFollowerAlert());
    this.socketClient.on(SOCKET_EVENTS.COLLECTIVE_GOAL_ACHIEVED, () => soundManager.playGoalAchieved());
    this.socketClient.on(SOCKET_EVENTS.BOSS_SPAWNED, () => soundManager.playBossSpawn());
    this.socketClient.on(SOCKET_EVENTS.BOSS_DEFEATED, () => soundManager.playBossDefeated());
    this.socketClient.on(SOCKET_EVENTS.LEVEL_UP, () => soundManager.playLevelUp());
    this.socketClient.on(SOCKET_EVENTS.PLAYER_DAMAGED, () => soundManager.playPlayerHurt());
    this.socketClient.on(SOCKET_EVENTS.ENEMY_DEFEATED, () => soundManager.playZombieDefeated());
    this.socketClient.on(SOCKET_EVENTS.MATCH_FINISHED, (payload: any) => {
      if (payload.result === 'GAME_OVER') soundManager.playGameOver();
      else if (payload.result === 'VICTORY') soundManager.playVictory();
    });
    this.socketClient.on(SOCKET_EVENTS.ABILITY_ACTIVATED, (payload: any) => {
      switch (payload.skill) {
        case 'CURA': soundManager.playHeal(); break;
        case 'ESCUDO': soundManager.playShield(); break;
        case 'ATAQUE': soundManager.playSlash(); break;
        case 'FOGO': soundManager.playFire(); break;
        case 'CONGELAMENTO': soundManager.playIce(); break;
        case 'EXPLOSAO': soundManager.playExplosion(); break;
      }
    });
  }

  private createHud(width: number, height: number): void {
    this.hudContainer = this.add.container(0, 0).setDepth(100);

    // Header Superior (Barra escura translúcida otimizada para celular)
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a0d14, 0.92);
    headerBg.fillRect(0, 0, width, 125);
    headerBg.lineStyle(3, 0x1e293b, 1);
    headerBg.lineBetween(0, 125, width, 125);
    this.hudContainer.add(headerBg);

    // Logo Oficial do Zombie Live (da imagem de referência)
    if (this.textures.exists('zombies_live_logo')) {
      const logoImg = this.add.image(width / 2, 62, 'zombies_live_logo').setDisplaySize(110, 110);
      this.hudContainer.add(logoImg);
    }

    // Linha 1: Onda, Timer e Badge do Provedor
    this.waveText = this.add.text(32, 20, 'ONDA 1', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '32px',
      color: '#38bdf8'
    });
    this.timerText = this.add.text(175, 24, '⏱️ 00:30', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
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
    this.killsText = this.add.text(32, 70, '💀 0 Eliminados', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#ef4444',
      fontStyle: 'bold'
    });
    this.scoreText = this.add.text(230, 70, '🏆 0 Pontos', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#facc15',
      fontStyle: 'bold'
    });
    this.hudContainer.add([this.killsText, this.scoreText]);

    // Barra de Chefe (Abaixo do header)
    this.bossBarContainer = this.add.container(width / 2, 168).setVisible(false).setDepth(110);
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
    this.announcementContainer = this.add.container(width / 2, 245).setAlpha(0).setDepth(120);
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

    // Vida e XP
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

    // Meta Coletiva
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

    // 1. Atualizar Sobrevivente Principal
    this.survivorSprite.setPosition(snap.survivor.x, snap.survivor.y);
    this.survivorShadow.setPosition(snap.survivor.x, snap.survivor.y + 36);
    this.survivorLight.setPosition(snap.survivor.x, snap.survivor.y);
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

    // Disparo / Animação de tiro quando novos projéteis são disparados
    if (snap.projectiles.length > this.lastProjectileCount) {
      soundManager.playShoot();
      this.survivorSprite.play('survivor_shoot_anim');
    }
    this.lastProjectileCount = snap.projectiles.length;

    // Mini barra de vida sobre o sobrevivente (proporcional ao herói maior)
    this.survivorHealthBar.clear();
    const hpRatio = Math.max(0, snap.survivor.hp / snap.survivor.maxHp);
    this.survivorHealthBar.fillStyle(0x050505, 0.7);
    this.survivorHealthBar.fillRect(snap.survivor.x - 38, snap.survivor.y - 58, 76, 9);
    this.survivorHealthBar.fillStyle(hpRatio > 0.3 ? 0x22c55e : 0xef4444, 1);
    this.survivorHealthBar.fillRect(snap.survivor.x - 38, snap.survivor.y - 58, 76 * hpRatio, 9);

    // 2. Atualizar Inimigos Zumbis
    const activeEnemyIds = new Set<string>();

    for (const enemyData of snap.enemies) {
      activeEnemyIds.add(enemyData.id);
      let enemyObj = this.enemySprites.get(enemyData.id);

      if (!enemyObj) {
        let texture = 'zombie_common';
        let animKey = 'zombie_common_walk_anim';
        let scale = 0.92; // +53% maior
        let shadowScale = 1.10;
        let shadowOffsetY = 36;

        if (enemyData.type === 'RUNNER') {
          texture = 'zombie_runner';
          animKey = 'zombie_runner_walk_anim';
          scale = 0.85; // +55% maior
          shadowScale = 1.00;
          shadowOffsetY = 34;
        } else if (enemyData.type === 'TANK') {
          texture = 'zombie_tank';
          animKey = 'zombie_tank_walk_anim';
          scale = 1.12; // +55% maior
          shadowScale = 1.75;
          shadowOffsetY = 52;
        } else if (enemyData.type === 'BOSS') {
          texture = 'zombie_boss';
          animKey = 'zombie_boss_walk_anim';
          scale = 1.24; // +51% maior
          shadowScale = 3.00;
          shadowOffsetY = 90;
        }

        const shadow = this.add.image(enemyData.x, enemyData.y + shadowOffsetY, 'shadow_blob')
          .setDepth(enemyData.isBoss ? 7 : 6)
          .setScale(shadowScale);

        const sprite = this.add.sprite(enemyData.x, enemyData.y, texture)
          .setDepth(enemyData.isBoss ? 9 : 8)
          .setScale(scale);
        sprite.play(animKey);

        const healthBar = this.add.graphics().setDepth(enemyData.isBoss ? 10 : 9);
        enemyObj = { sprite, shadow, healthBar, data: enemyData, lastHp: enemyData.hp, shadowOffsetY };
        this.enemySprites.set(enemyData.id, enemyObj);
      }

      // Interpolação suave de posição
      enemyObj.sprite.x += (enemyData.x - enemyObj.sprite.x) * 0.42;
      enemyObj.sprite.y += (enemyData.y - enemyObj.sprite.y) * 0.42;
      enemyObj.shadow.setPosition(enemyObj.sprite.x, enemyObj.sprite.y + (enemyObj.shadowOffsetY || 36));

      // Rotação do zumbi olhando para o herói
      const angle = Phaser.Math.Angle.Between(enemyObj.sprite.x, enemyObj.sprite.y, snap.survivor.x, snap.survivor.y);
      enemyObj.sprite.setRotation(angle);

      // Efeito de Dano / Flash ao ser atingido
      if (enemyData.hp < enemyObj.lastHp) {
        enemyObj.sprite.setTint(0xff7777);
        this.time.delayedCall(80, () => {
          if (enemyObj.sprite && enemyObj.sprite.active) enemyObj.sprite.clearTint();
        });
        enemyObj.lastHp = enemyData.hp;
      }

      // Mini barra de vida sobre o zumbi (proporcional aos tamanhos maiores)
      enemyObj.healthBar.clear();
      const zHpRatio = Math.max(0, enemyData.hp / enemyData.maxHp);
      let barWidth = 54;
      let barHeight = 7;
      let offsetY = 48;

      if (enemyData.type === 'RUNNER') {
        barWidth = 50;
        barHeight = 7;
        offsetY = 44;
      } else if (enemyData.type === 'TANK') {
        barWidth = 84;
        barHeight = 9;
        offsetY = 70;
      } else if (enemyData.isBoss) {
        barWidth = 135;
        barHeight = 11;
        offsetY = 110;
      }

      enemyObj.healthBar.fillStyle(0x050505, 0.7);
      enemyObj.healthBar.fillRect(enemyObj.sprite.x - barWidth / 2, enemyObj.sprite.y - offsetY, barWidth, barHeight);
      enemyObj.healthBar.fillStyle(enemyData.isBoss ? 0xdc2626 : 0x16a34a, 1);
      enemyObj.healthBar.fillRect(enemyObj.sprite.x - barWidth / 2, enemyObj.sprite.y - offsetY, barWidth * zHpRatio, barHeight);
    }

    // Remove zumbis que não estão mais no snapshot (derrotados)
    for (const [id, enemyObj] of this.enemySprites.entries()) {
      if (!activeEnemyIds.has(id)) {
        this.createDeathPuff(enemyObj.sprite.x, enemyObj.sprite.y, enemyObj.data.isBoss);
        enemyObj.sprite.destroy();
        enemyObj.shadow.destroy();
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
        const texture = projData.id.startsWith('proj_pet_') ? 'projectile_pet' : 'projectile';
        pSprite = this.add.sprite(projData.x, projData.y, texture).setDepth(12);
        this.projectileSprites.set(projData.id, pSprite);
      }
      pSprite.setPosition(projData.x, projData.y);
    }

    for (const [id, pSprite] of this.projectileSprites.entries()) {
      if (!activeProjIds.has(id)) {
        // Faísca de impacto cartoon
        const spark = this.add.image(pSprite.x, pSprite.y, 'fx_hit_spark').setDepth(15).setScale(0.85);
        this.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 1.3,
          duration: 120,
          onComplete: () => spark.destroy()
        });
        pSprite.destroy();
        this.projectileSprites.delete(id);
      }
    }

    // 4. Atualizar Bichinhos Aliados dos Doadores de Presentes (Pets de Batalha)
    const activeCompanionIds = new Set<string>();
    for (const petData of (snap.companions || [])) {
      activeCompanionIds.add(petData.id);
      let cObj = this.companionNodes.get(petData.id);

      if (!cObj) {
        const container = this.add.container(petData.x, petData.y).setDepth(14);
        const petSprite = this.add.sprite(0, 0, 'companion_pet').setScale(0.95);

        // Badge estilizada com o nome do espectador e ícone de estrela
        const nameTag = this.add.text(0, -38, `⭐ @${petData.username}`, {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '14px',
          color: '#fef08a',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: { x: 7, y: 3 }
        }).setOrigin(0.5);

        // Suporte a avatar de perfil do TikTok
        let avatarImg: Phaser.GameObjects.Image | undefined;
        if (petData.avatarUrl) {
          const key = `avatar_${petData.userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          if (!this.textures.exists(key)) {
            this.load.image(key, petData.avatarUrl);
            this.load.once(`filecomplete-image-${key}`, () => {
              if (container.active) {
                const img = this.add.image(0, 0, key).setDisplaySize(24, 24);
                const maskShape = this.make.graphics({ x: 0, y: 0 });
                maskShape.fillCircle(container.x, container.y, 12);
                img.setMask(maskShape.createGeometryMask());
                container.add(img);
              }
            });
            this.load.start();
          } else {
            avatarImg = this.add.image(0, 0, key).setDisplaySize(24, 24);
            const maskShape = this.make.graphics({ x: 0, y: 0 });
            maskShape.fillCircle(container.x, container.y, 12);
            avatarImg.setMask(maskShape.createGeometryMask());
          }
        }

        container.add(petSprite);
        if (avatarImg) container.add(avatarImg);
        container.add(nameTag);

        cObj = { container, petSprite, nameTag, avatarImg, data: petData };
        this.companionNodes.set(petData.id, cObj);
      }

      // Movimento orbital suave + flutuação kawaii (bobbing)
      const bobbing = Math.sin((this.time.now / 180) + petData.orbitAngle) * 3;
      cObj.container.x += (petData.x - cObj.container.x) * 0.45;
      cObj.container.y += (petData.y + bobbing - cObj.container.y) * 0.45;
    }

    for (const [id, cObj] of this.companionNodes.entries()) {
      if (!activeCompanionIds.has(id)) {
        this.createDeathPuff(cObj.container.x, cObj.container.y, false);
        cObj.container.destroy();
        this.companionNodes.delete(id);
      }
    }

    // 5. Chefe
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

    // 6. Votação
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

    // 7. Overlays de Estado
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
  // EFEITOS VISUAIS E HABILIDADES CARTOON
  // ==========================================

  private playVisualEffect(effect: VisualEffectEvent): void {
    switch (effect.type) {
      case 'EXPLOSION': {
        const expG = this.add.graphics().setDepth(35);
        expG.fillStyle(0xfef08a, 0.7);
        expG.fillCircle(effect.x, effect.y, effect.radius * 0.4);
        expG.lineStyle(8, 0xf97316, 1);
        expG.strokeCircle(effect.x, effect.y, effect.radius);

        const expSpark = this.add.image(effect.x, effect.y, 'fx_hit_spark').setDepth(36).setScale(effect.radius / 30);
        this.tweens.add({
          targets: [expG, expSpark],
          alpha: 0,
          scale: 1.5,
          duration: effect.durationMs,
          onComplete: () => {
            expG.destroy();
            expSpark.destroy();
          }
        });
        break;
      }

      case 'SLASH': {
        const slash = this.add.image(effect.x, effect.y, 'fx_slash_arc')
          .setDepth(32)
          .setScale(effect.radius / 55);
        this.tweens.add({
          targets: slash,
          angle: 360,
          alpha: 0,
          duration: effect.durationMs,
          onComplete: () => slash.destroy()
        });
        break;
      }

      case 'FIRE_AREA': {
        const fireG = this.add.graphics().setDepth(25);
        fireG.fillStyle(0xe11d48, 0.4);
        fireG.fillCircle(effect.x, effect.y, effect.radius);
        fireG.lineStyle(5, 0xf59e0b, 0.9);
        fireG.strokeCircle(effect.x, effect.y, effect.radius);

        const fireSprites: Phaser.GameObjects.Sprite[] = [];
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const dist = effect.radius * 0.65;
          const fs = this.add.sprite(effect.x + Math.cos(a) * dist, effect.y + Math.sin(a) * dist, 'particle_fire')
            .setDepth(26)
            .setScale(1.4);
          fireSprites.push(fs);
        }

        this.tweens.add({
          targets: [fireG, ...fireSprites],
          alpha: 0,
          duration: effect.durationMs,
          onComplete: () => {
            fireG.destroy();
            fireSprites.forEach(s => s.destroy());
          }
        });
        break;
      }

      case 'ICE_BLAST': {
        const iceG = this.add.graphics().setDepth(25);
        iceG.fillStyle(0x06b6d4, 0.35);
        iceG.fillCircle(effect.x, effect.y, effect.radius);
        iceG.lineStyle(6, 0xa5f3fc, 0.95);
        iceG.strokeCircle(effect.x, effect.y, effect.radius);

        const iceSprites: Phaser.GameObjects.Sprite[] = [];
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const dist = effect.radius * 0.6;
          const is = this.add.sprite(effect.x + Math.cos(a) * dist, effect.y + Math.sin(a) * dist, 'particle_ice')
            .setDepth(26)
            .setScale(1.5);
          iceSprites.push(is);
        }

        this.tweens.add({
          targets: [iceG, ...iceSprites],
          alpha: 0,
          duration: effect.durationMs,
          onComplete: () => {
            iceG.destroy();
            iceSprites.forEach(s => s.destroy());
          }
        });
        break;
      }

      case 'HEAL_RING': {
        const healG = this.add.graphics().setDepth(32);
        healG.lineStyle(6, 0x22c55e, 0.9);
        healG.strokeCircle(effect.x, effect.y, effect.radius);

        const cross = this.add.image(effect.x, effect.y - 20, 'fx_heal_cross')
          .setDepth(33)
          .setScale(1.2);
        this.tweens.add({
          targets: cross,
          y: effect.y - 70,
          alpha: 0,
          duration: effect.durationMs,
          onComplete: () => cross.destroy()
        });

        this.tweens.add({
          targets: healG,
          alpha: 0,
          scale: 1.4,
          duration: effect.durationMs,
          onComplete: () => healG.destroy()
        });
        break;
      }

      case 'SHIELD_PULSE': {
        const pulse = this.add.image(effect.x, effect.y, 'shield_bubble')
          .setDepth(30)
          .setScale(0.8);
        this.tweens.add({
          targets: pulse,
          scale: 1.4,
          alpha: 0,
          duration: effect.durationMs,
          onComplete: () => pulse.destroy()
        });
        break;
      }

      case 'LEVEL_UP': {
        const lvlG = this.add.graphics().setDepth(35);
        lvlG.lineStyle(8, 0xfacc15, 1);
        lvlG.strokeCircle(effect.x, effect.y, effect.radius);

        const star = this.add.image(effect.x, effect.y, 'projectile_pet')
          .setDepth(36)
          .setScale(2.5);

        this.tweens.add({
          targets: [lvlG, star],
          alpha: 0,
          scale: 2.2,
          duration: effect.durationMs,
          onComplete: () => {
            lvlG.destroy();
            star.destroy();
          }
        });
        break;
      }
    }
  }

  private createDeathPuff(x: number, y: number, isBoss = false): void {
    const puffCount = isBoss ? 12 : 5;
    const color = isBoss ? 0xdc2626 : 0x65a30d;

    for (let i = 0; i < puffCount; i++) {
      const p = this.add.graphics().setDepth(20);
      p.fillStyle(color, 0.9);
      p.fillCircle(x, y, isBoss ? 24 : 14);
      p.lineStyle(2.5, 0x050505, 1);
      p.strokeCircle(x, y, isBoss ? 24 : 14);

      const a = (i * (Math.PI * 2)) / puffCount;
      const dist = isBoss ? 110 : 50;
      const targetX = x + Math.cos(a) * dist;
      const targetY = y + Math.sin(a) * dist;

      this.tweens.add({
        targets: p,
        x: targetX - x,
        y: targetY - y,
        alpha: 0,
        scale: 0.3,
        duration: isBoss ? 600 : 350,
        onComplete: () => p.destroy()
      });
    }
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
