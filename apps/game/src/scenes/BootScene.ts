import Phaser from 'phaser';
import { CartoonTextureFactory } from '../graphics/CartoonTextureFactory.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // Carrega o logo oficial da referência
    this.load.image('zombies_live_logo', '/logo.png');
  }

  create(): void {
    // 1. Gera todas as texturas cartunescas 2D top-down da fábrica
    const factory = new CartoonTextureFactory(this);
    factory.generateAll();

    // 2. Registra o conjunto de animações do Phaser 3
    this.createCharacterAnimations();

    // 3. Inicia a cena principal do jogo
    this.scene.start('GameScene');
  }

  private createCharacterAnimations(): void {
    // Animações do Sobrevivente Principal
    this.anims.create({
      key: 'survivor_walk_anim',
      frames: [
        { key: 'survivor_walk_0' },
        { key: 'survivor_idle' },
        { key: 'survivor_walk_1' },
        { key: 'survivor_idle' }
      ],
      frameRate: 7,
      repeat: -1
    });

    this.anims.create({
      key: 'survivor_shoot_anim',
      frames: [
        { key: 'survivor_shoot' },
        { key: 'survivor_idle' }
      ],
      frameRate: 14,
      repeat: 0
    });

    // Animações do Zumbi Comum
    this.anims.create({
      key: 'zombie_common_walk_anim',
      frames: [
        { key: 'zombie_common_walk_0' },
        { key: 'zombie_common_walk_1' }
      ],
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: 'zombie_common_attack_anim',
      frames: [
        { key: 'zombie_common_attack' },
        { key: 'zombie_common_walk_0' }
      ],
      frameRate: 6,
      repeat: 0
    });

    // Animações do Zumbi Corredor
    this.anims.create({
      key: 'zombie_runner_walk_anim',
      frames: [
        { key: 'zombie_runner_walk_0' },
        { key: 'zombie_runner_walk_1' }
      ],
      frameRate: 10,
      repeat: -1
    });

    // Animações do Zumbi Tanque
    this.anims.create({
      key: 'zombie_tank_walk_anim',
      frames: [
        { key: 'zombie_tank_walk_0' },
        { key: 'zombie_tank_walk_1' }
      ],
      frameRate: 4,
      repeat: -1
    });

    // Animações do Chefe: O Colosso Zumbi
    this.anims.create({
      key: 'zombie_boss_walk_anim',
      frames: [
        { key: 'zombie_boss_walk_0' },
        { key: 'zombie_boss_walk_1' }
      ],
      frameRate: 3,
      repeat: -1
    });

    this.anims.create({
      key: 'zombie_boss_smash_anim',
      frames: [
        { key: 'zombie_boss_smash' },
        { key: 'zombie_boss_walk_0' }
      ],
      frameRate: 4,
      repeat: 0
    });
  }
}
