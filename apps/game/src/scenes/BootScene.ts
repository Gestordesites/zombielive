import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.createProceduralTextures();
    this.scene.start('GameScene');
  }

  private createProceduralTextures(): void {
    // 1. Textura do Chão da Arena (Grade Futurista Apocalíptica)
    const floorG = this.make.graphics({ x: 0, y: 0 });
    floorG.fillStyle(0x131722, 1);
    floorG.fillRect(0, 0, 128, 128);
    floorG.lineStyle(1, 0x1f293d, 1);
    floorG.strokeRect(0, 0, 128, 128);
    // Detalhes de desgaste no chão
    floorG.fillStyle(0x1a2130, 0.4);
    floorG.fillCircle(30, 40, 8);
    floorG.fillCircle(90, 80, 12);
    floorG.generateTexture('arena_floor', 128, 128);
    floorG.destroy();

    // 2. Sobrevivente (Herói com armadura, visor azul neon e canhão)
    const heroG = this.make.graphics({ x: 0, y: 0 });
    // Sombra
    heroG.fillStyle(0x000000, 0.35);
    heroG.fillEllipse(24, 38, 36, 14);
    // Corpo / Armadura
    heroG.fillStyle(0x2563eb, 1);
    heroG.fillCircle(24, 22, 16);
    // Placas de ombro
    heroG.fillStyle(0x1d4ed8, 1);
    heroG.fillCircle(12, 18, 6);
    heroG.fillCircle(36, 18, 6);
    // Capacete
    heroG.fillStyle(0x0f172a, 1);
    heroG.fillCircle(24, 20, 10);
    // Visor Neon Ciano
    heroG.fillStyle(0x06b6d4, 1);
    heroG.fillRect(20, 14, 8, 4);
    // Arma / Rifle de Energia
    heroG.fillStyle(0x475569, 1);
    heroG.fillRect(32, 14, 14, 6);
    heroG.fillStyle(0x06b6d4, 1);
    heroG.fillRect(44, 15, 3, 4);
    heroG.generateTexture('survivor', 48, 48);
    heroG.destroy();

    // 3. Zumbi Comum (Verde apodrecido, silhueta irregular, olhos vermelhos)
    const zComG = this.make.graphics({ x: 0, y: 0 });
    zComG.fillStyle(0x000000, 0.35);
    zComG.fillEllipse(20, 32, 28, 12);
    // Corpo
    zComG.fillStyle(0x16a34a, 1); // verde zumbi
    zComG.fillCircle(20, 18, 14);
    // Roupas esfarrapadas
    zComG.fillStyle(0x334155, 1);
    zComG.fillCircle(20, 22, 11);
    // Olhos vermelhos brilhantes
    zComG.fillStyle(0xef4444, 1);
    zComG.fillCircle(16, 14, 3);
    zComG.fillCircle(24, 14, 3);
    zComG.generateTexture('zombie_common', 40, 40);
    zComG.destroy();

    // 4. Zumbi Corredor (Vermelho mutado, ágil, garras estendidas)
    const zRunG = this.make.graphics({ x: 0, y: 0 });
    zRunG.fillStyle(0x000000, 0.35);
    zRunG.fillEllipse(18, 28, 24, 10);
    // Corpo
    zRunG.fillStyle(0xd97706, 1);
    zRunG.fillCircle(18, 16, 11);
    zRunG.fillStyle(0xb45309, 1);
    zRunG.fillCircle(18, 19, 8);
    // Olhos flamejantes
    zRunG.fillStyle(0xfacc15, 1);
    zRunG.fillCircle(15, 12, 2.5);
    zRunG.fillCircle(21, 12, 2.5);
    zRunG.generateTexture('zombie_runner', 36, 36);
    zRunG.destroy();

    // 5. Zumbi Tanque (Bruto colossal, armadura pesada)
    const zTankG = this.make.graphics({ x: 0, y: 0 });
    zTankG.fillStyle(0x000000, 0.45);
    zTankG.fillEllipse(32, 54, 52, 20);
    // Corpo maciço
    zTankG.fillStyle(0x14532d, 1);
    zTankG.fillCircle(32, 30, 24);
    // Placas de aço
    zTankG.fillStyle(0x475569, 1);
    zTankG.fillCircle(14, 24, 10);
    zTankG.fillCircle(50, 24, 10);
    zTankG.fillRect(22, 18, 20, 20);
    // Olhos sombrios
    zTankG.fillStyle(0xdc2626, 1);
    zTankG.fillCircle(27, 26, 4);
    zTankG.fillCircle(37, 26, 4);
    zTankG.generateTexture('zombie_tank', 64, 64);
    zTankG.destroy();

    // 6. Chefe: O Colosso Zumbi (Titã maciço com runas místicas e aura ameaçadora)
    const bossG = this.make.graphics({ x: 0, y: 0 });
    bossG.fillStyle(0x000000, 0.6);
    bossG.fillEllipse(50, 88, 80, 26);
    // Corpo do Chefe
    bossG.fillStyle(0x4c0519, 1);
    bossG.fillCircle(50, 46, 40);
    // Espinhos e ossos
    bossG.fillStyle(0x881337, 1);
    bossG.fillTriangle(15, 30, 25, 46, 5, 40);
    bossG.fillTriangle(85, 30, 75, 46, 95, 40);
    bossG.fillTriangle(50, 6, 40, 25, 60, 25);
    // Núcleo pulsante roxo/vermelho
    bossG.fillStyle(0xe11d48, 1);
    bossG.fillCircle(50, 46, 18);
    bossG.fillStyle(0xfb7185, 1);
    bossG.fillCircle(50, 46, 10);
    bossG.generateTexture('zombie_boss', 100, 100);
    bossG.destroy();

    // 7. Projétil de Plasma / Energia
    const projG = this.make.graphics({ x: 0, y: 0 });
    projG.fillStyle(0x38bdf8, 1);
    projG.fillCircle(8, 8, 7);
    projG.fillStyle(0xffffff, 1);
    projG.fillCircle(8, 8, 4);
    projG.generateTexture('projectile', 16, 16);
    projG.destroy();

    // 8. Partícula de Fogo
    const fireG = this.make.graphics({ x: 0, y: 0 });
    fireG.fillStyle(0xf97316, 0.85);
    fireG.fillCircle(6, 6, 6);
    fireG.fillStyle(0xfef08a, 1);
    fireG.fillCircle(6, 6, 3);
    fireG.generateTexture('particle_fire', 12, 12);
    fireG.destroy();

    // 9. Partícula de Gelo
    const iceG = this.make.graphics({ x: 0, y: 0 });
    iceG.fillStyle(0xa5f3fc, 0.9);
    iceG.fillRect(2, 2, 8, 8);
    iceG.fillStyle(0xffffff, 1);
    iceG.fillRect(4, 4, 4, 4);
    iceG.generateTexture('particle_ice', 12, 12);
    iceG.destroy();

    // 10. Bolha do Escudo
    const shieldG = this.make.graphics({ x: 0, y: 0 });
    shieldG.lineStyle(3, 0x38bdf8, 0.9);
    shieldG.strokeCircle(36, 36, 34);
    shieldG.fillStyle(0x0284c7, 0.25);
    shieldG.fillCircle(36, 36, 33);
    shieldG.generateTexture('shield_bubble', 72, 72);
    shieldG.destroy();
  }
}
