import Phaser from 'phaser';

/**
 * CartoonTextureFactory
 * Gera texturas procedurais com estilo 2D Cartoon Top-Down profissional,
 * contornos pretos marcantes, proporções estilizadas, iluminação dinâmica e
 * animações fluidas baseadas na identidade visual de ZOMBIE LIVE.
 */
export class CartoonTextureFactory {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public generateAll(): void {
    // 1. Sombras e Iluminação
    this.createShadowBlob();
    this.createSurvivorLightHalo();
    this.createAtmosphericVignette();

    // 2. Cenário e Arena
    this.createCartoonArenaFloor();

    // 3. Sobrevivente Principal (Herói inspirado no visual da referência)
    this.createSurvivorFrames();

    // 4. Inimigos Zumbis Humanoides
    this.createCommonZombieFrames();
    this.createRunnerZombieFrames();
    this.createTankZombieFrames();
    this.createBossZombieFrames();

    // 5. Bichinho Guardião dos Espectadores (Pet dos Presentes)
    this.createCompanionPetFrames();

    // 6. Projéteis e Efeitos de Combate
    this.createCombatEffects();
    this.createSkillEffects();
  }

  // ========================================================
  // UTILITÁRIO: Cria um elemento Canvas HTML5 para desenhar
  // ========================================================
  private createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
    ctx.imageSmoothingEnabled = true;
    return { canvas, ctx };
  }

  private registerCanvas(key: string, canvas: HTMLCanvasElement): void {
    if (this.scene.textures.exists(key)) {
      this.scene.textures.remove(key);
    }
    this.scene.textures.addCanvas(key, canvas);
  }

  // ========================================================
  // 1. SOMBRAS E ILUMINAÇÃO
  // ========================================================
  private createShadowBlob(): void {
    const { canvas, ctx } = this.createCanvas(96, 48);
    const radG = ctx.createRadialGradient(48, 24, 0, 48, 24, 46);
    radG.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    radG.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    radG.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = radG;
    ctx.beginPath();
    ctx.ellipse(48, 24, 46, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    this.registerCanvas('shadow_blob', canvas);
  }

  private createSurvivorLightHalo(): void {
    const { canvas, ctx } = this.createCanvas(512, 512);
    const radG = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
    radG.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
    radG.addColorStop(0.35, 'rgba(37, 99, 235, 0.12)');
    radG.addColorStop(0.7, 'rgba(15, 23, 42, 0.05)');
    radG.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = radG;
    ctx.fillRect(0, 0, 512, 512);

    this.registerCanvas('survivor_light', canvas);
  }

  private createAtmosphericVignette(): void {
    const { canvas, ctx } = this.createCanvas(1080, 1920);
    const cx = 540;
    const cy = 960;
    const radG = ctx.createRadialGradient(cx, cy, 400, cx, cy, 1100);
    radG.addColorStop(0, 'rgba(0, 0, 0, 0)');
    radG.addColorStop(0.65, 'rgba(5, 7, 12, 0.45)');
    radG.addColorStop(0.9, 'rgba(2, 4, 8, 0.82)');
    radG.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

    ctx.fillStyle = radG;
    ctx.fillRect(0, 0, 1080, 1920);

    this.registerCanvas('vignette_overlay', canvas);
  }

  // ========================================================
  // 2. ARENA MINIMALISTA GRAFITE ESCURO (LIMPA E ELEGANTE)
  // ========================================================
  private createCartoonArenaFloor(): void {
    const size = 512;
    const { canvas, ctx } = this.createCanvas(size, size);

    // 1. Base Grafite Escuro (#11141B)
    ctx.fillStyle = '#11141B';
    ctx.fillRect(0, 0, size, size);

    // 2. Variação de Superfície Suave (#171B24 e #1C202A) em gradiente linear sutil
    const grad1 = ctx.createLinearGradient(0, 0, size, size);
    grad1.addColorStop(0, 'rgba(23, 27, 36, 0.65)'); // #171B24
    grad1.addColorStop(0.5, 'rgba(17, 20, 27, 0.0)'); // #11141B
    grad1.addColorStop(1, 'rgba(28, 32, 42, 0.55)'); // #1C202A
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, size, size);

    // 3. Gradiente radial discreto para leve iluminação de profundidade
    const radCenter = ctx.createRadialGradient(size / 2, size / 2, 40, size / 2, size / 2, size / 1.3);
    radCenter.addColorStop(0, 'rgba(28, 32, 42, 0.40)');
    radCenter.addColorStop(1, 'rgba(17, 20, 27, 0.0)');
    ctx.fillStyle = radCenter;
    ctx.fillRect(0, 0, size, size);

    // 4. Micro-textura imperceptível (sem repetições chamativas)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    for (let x = 12; x < size; x += 24) {
      for (let y = 12; y < size; y += 24) {
        if ((x + y) % 48 === 0) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }
    }

    this.registerCanvas('arena_floor', canvas);
  }

  // ========================================================
  // 3. SOBREVIVENTE PRINCIPAL (HERÓI CARTOON DA REFERÊNCIA)
  // ========================================================
  private createSurvivorFrames(): void {
    // Frames: Idle, Caminhada 1, Caminhada 2, e Disparo com clarão
    ['idle', 'walk_0', 'walk_1', 'shoot'].forEach(action => {
      const { canvas, ctx } = this.createCanvas(128, 128);
      const cx = 64;
      const cy = 64;

      const isShoot = action === 'shoot';
      const isWalk0 = action === 'walk_0';
      const isWalk1 = action === 'walk_1';

      const legBob = isWalk0 ? -4 : isWalk1 ? 4 : 0;
      const bodyBob = isShoot ? -2 : (isWalk0 || isWalk1) ? 2 : 0;

      // 1. Sombra redonda
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 38, 32, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Pernas / Botas de combate
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#050505';

      // Perna esquerda
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(cx - 18, cy + 18 + legBob, 12, 22, 5);
      ctx.fill();
      ctx.stroke();

      // Perna direita
      ctx.beginPath();
      ctx.roundRect(cx + 6, cy + 18 - legBob, 12, 22, 5);
      ctx.fill();
      ctx.stroke();

      // 3. Mochila tática nas costas
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(cx - 24, cy - 8 + bodyBob, 12, 26, 4);
      ctx.fill();
      ctx.stroke();

      // 4. Tronco / Colete tático preto
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(cx - 16, cy - 4 + bodyBob, 32, 28, 6);
      ctx.fill();
      ctx.stroke();

      // Detalhes do colete tático (fivelas e placas cinzas)
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - 11, cy + 2 + bodyBob, 22, 6);
      ctx.fillRect(cx - 11, cy + 11 + bodyBob, 22, 6);

      // 5. Arma tática: Carabina / Rifle com mira reflex holográfica
      const weaponRecoil = isShoot ? -6 : 0;
      const wx = cx + 8 + weaponRecoil;
      const wy = cy + 2 + bodyBob;

      // Corpo da arma
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(wx, wy, 44, 10, 2);
      ctx.fill();
      ctx.stroke();

      // Cano do rifle
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(wx + 44, wy + 2, 12, 5);
      ctx.strokeRect(wx + 44, wy + 2, 12, 5);

      // Mira Reflex / Holográfica (vidro vermelho no topo)
      ctx.fillStyle = '#334155';
      ctx.fillRect(wx + 16, wy - 7, 12, 7);
      ctx.strokeRect(wx + 16, wy - 7, 12, 7);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(wx + 20, wy - 5, 5, 4); // Ponto vermelho da mira!

      // Pente / Carregador curvo
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(wx + 14, wy + 9, 8, 14, 2);
      ctx.fill();
      ctx.stroke();

      // Mãos enluvadas segurando a arma
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(wx + 8, wy + 5, 6, 0, Math.PI * 2);
      ctx.arc(wx + 30, wy + 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 6. Cabeça expressiva com proporção cartoon
      const headY = cy - 24 + bodyBob;

      // Cabelo preto nas têmporas
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(cx - 16, headY + 6, 6, 0, Math.PI * 2);
      ctx.fill();

      // Formato da cabeça / pele
      ctx.fillStyle = '#fed7aa'; // Tom de pele pêssego/claro
      ctx.beginPath();
      ctx.arc(cx, headY + 4, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Boné virado para trás (estilo do personagem da logo!)
      ctx.fillStyle = '#0f172a'; // Preto do boné
      ctx.beginPath();
      ctx.arc(cx, headY - 2, 19, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + 20, headY - 2);
      ctx.lineTo(cx - 20, headY - 2);
      ctx.fill();
      ctx.stroke();

      // Aba do boné virada para a nuca
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(cx - 16, headY - 5, 10, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fecho do boné na frente
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(cx - 5, headY - 6, 10, 4);

      // Olhos cartoon expressivos e intensos (focados no combate)
      // Olho esquerdo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - 6, headY + 3, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx - 5, headY + 3, 3, 0, Math.PI * 2);
      ctx.fill();
      // Brilho no olho
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 6, headY + 2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Olho direito
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx + 8, headY + 3, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx + 9, headY + 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + 8, headY + 2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Sobrancelhas pretas grossas e arqueadas (expressão determinada)
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.moveTo(cx - 12, headY - 4);
      ctx.lineTo(cx - 1, headY - 1);
      ctx.lineTo(cx - 12, headY - 1);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx + 3, headY - 1);
      ctx.lineTo(cx + 14, headY - 4);
      ctx.lineTo(cx + 14, headY - 1);
      ctx.fill();

      // Máscara tática preta cobrindo boca e nariz (idêntica à referência!)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(cx - 16, headY + 8);
      ctx.lineTo(cx, headY + 12);
      ctx.lineTo(cx + 16, headY + 8);
      ctx.lineTo(cx + 14, headY + 21);
      ctx.lineTo(cx - 14, headY + 21);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 7. Efeito de Clarão de Disparo (Muzzle Flash) no frame 'shoot'
      if (isShoot) {
        const fx = wx + 58;
        const fy = wy + 4;

        // Estrela explosiva cartoon amarela e vermelha
        ctx.save();
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        // Desenha estrela pontiaguda de fogo
        const pts = 8;
        for (let i = 0; i < pts * 2; i++) {
          const r = i % 2 === 0 ? 22 : 8;
          const a = (i * Math.PI) / pts;
          const px = fx + Math.cos(a) * r;
          const py = fy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Núcleo branco incandescente
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fx, fy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      this.registerCanvas(`survivor_${action}`, canvas);
    });

    // Mantém alias 'survivor' para compatibilidade imediata
    const base = (this.scene.textures.get('survivor_idle').getSourceImage() as any);
    this.registerCanvas('survivor', base);
  }

  // ========================================================
  // 4.1. ZUMBI COMUM (ZOMBIE COMMON CARTOON)
  // ========================================================
  private createCommonZombieFrames(): void {
    ['walk_0', 'walk_1', 'attack'].forEach(action => {
      const { canvas, ctx } = this.createCanvas(128, 128);
      const cx = 64;
      const cy = 64;

      const isWalk0 = action === 'walk_0';
      const isWalk1 = action === 'walk_1';
      const isAttack = action === 'attack';

      const armExtend = isAttack ? 28 : isWalk0 ? 20 : 12;
      const legBob = isWalk0 ? -3 : isWalk1 ? 3 : 0;

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 38, 30, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#050505';

      // Pernas / Calça rasgada
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(cx - 16, cy + 18 + legBob, 11, 20, 4);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(cx + 5, cy + 18 - legBob, 11, 20, 4);
      ctx.fill();
      ctx.stroke();

      // Pés apodrecidos esverdeados
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(cx - 18, cy + 36 + legBob, 13, 6);
      ctx.fillRect(cx + 4, cy + 36 - legBob, 13, 6);

      // Tronco / Camiseta esfarrapada
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(cx - 16, cy - 6, 32, 26, 5);
      ctx.fill();
      ctx.stroke();

      // Carne viva / Costelas expostas
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(cx - 8, cy + 3, 14, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - 6, cy + 4, 10, 2);
      ctx.fillRect(cx - 6, cy + 8, 10, 2);

      // Braços zumbi com garras estendidas
      ctx.fillStyle = '#65a30d'; // Verde zumbi
      // Braço esquerdo
      ctx.beginPath();
      ctx.roundRect(cx + 10, cy - 6, armExtend, 10, 4);
      ctx.fill();
      ctx.stroke();
      // Garras podres
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(cx + 10 + armExtend, cy - 6, 4, 3);
      ctx.fillRect(cx + 10 + armExtend, cy - 2, 4, 3);
      ctx.fillRect(cx + 10 + armExtend, cy + 2, 4, 3);

      // Braço direito
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.roundRect(cx + 10, cy + 6, armExtend - (isAttack ? 0 : 6), 10, 4);
      ctx.fill();
      ctx.stroke();

      // Cabeça de Zumbi expressiva (inspirada no zumbi da esquerda na imagem de referência!)
      const headY = cy - 24;

      // Crânio verde apodrecido
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.arc(cx - 2, headY + 2, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mancha de ferida sangrenta na cabeça
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(cx - 10, headY - 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx - 10, headY - 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Olhos demoníacos brilhantes (amarelos com borda vermelha incandescente!)
      const drawDemonEye = (ex: number, ey: number) => {
        // Borda vermelha
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(ex, ey, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Centro amarelo brilhante
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupila miúda
        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
        ctx.fill();
      };

      drawDemonEye(cx - 7, headY + 1);
      drawDemonEye(cx + 8, headY + 1);

      // Boca escancarada grotesca com dentes podres afiados
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.roundRect(cx - 11, headY + 10, 22, 14, 4);
      ctx.fill();
      ctx.stroke();

      // Dentes amarelos irregulares
      ctx.fillStyle = '#fef08a';
      // Dentes superiores
      ctx.fillRect(cx - 9, headY + 10, 3, 4);
      ctx.fillRect(cx - 4, headY + 10, 3, 5);
      ctx.fillRect(cx + 1, headY + 10, 3, 4);
      ctx.fillRect(cx + 6, headY + 10, 3, 5);
      // Dentes inferiores
      ctx.fillRect(cx - 7, headY + 19, 3, 4);
      ctx.fillRect(cx - 1, headY + 18, 3, 5);
      ctx.fillRect(cx + 4, headY + 19, 3, 4);

      // Sangue escorrendo do queixo
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - 3, headY + 24, 3, 6);
      ctx.fillRect(cx + 3, headY + 24, 2, 4);

      this.registerCanvas(`zombie_common_${action}`, canvas);
    });

    const base = (this.scene.textures.get('zombie_common_walk_0').getSourceImage() as any);
    this.registerCanvas('zombie_common', base);
  }

  // ========================================================
  // 4.2. ZUMBI CORREDOR (ZOMBIE RUNNER CARTOON)
  // ========================================================
  private createRunnerZombieFrames(): void {
    ['walk_0', 'walk_1'].forEach(action => {
      const { canvas, ctx } = this.createCanvas(128, 128);
      const cx = 64;
      const cy = 64;

      const isWalk0 = action === 'walk_0';
      const leanX = 6;
      const legStride = isWalk0 ? 14 : -14;

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx + leanX, cy + 38, 32, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#050505';

      // Pernas ágeis esticadas em corrida
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(cx - 12 + legStride, cy + 18, 9, 20, 3);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(cx + 8 - legStride, cy + 18, 9, 20, 3);
      ctx.fill();
      ctx.stroke();

      // Tronco curvado para frente
      ctx.fillStyle = '#ea580c'; // Laranja mutado agressivo
      ctx.beginPath();
      ctx.roundRect(cx - 12 + leanX, cy - 6, 26, 26, 4);
      ctx.fill();
      ctx.stroke();

      // Braços compridos projetados para frente
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.roundRect(cx + 10 + leanX, cy - 4, 28, 8, 3);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(cx + 8 + leanX, cy + 6, 32, 8, 3);
      ctx.fill();
      ctx.stroke();

      // Garras afiadas
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx + 38 + leanX, cy - 4, 6, 3);
      ctx.fillRect(cx + 40 + leanX, cy + 6, 6, 3);

      // Cabeça enraivecida com mandíbula alongada
      const headY = cy - 22;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(cx + leanX, headY, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Olhos flamejantes amarelos ferozes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx + 3 + leanX, headY - 1, 5, 0, Math.PI * 2);
      ctx.arc(cx + 13 + leanX, headY - 1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx + 4 + leanX, headY - 1, 2, 0, Math.PI * 2);
      ctx.arc(cx + 14 + leanX, headY - 1, 2, 0, Math.PI * 2);
      ctx.fill();

      // Boca gritando com presas
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.roundRect(cx - 2 + leanX, headY + 7, 16, 12, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + leanX, headY + 7, 3, 5);
      ctx.fillRect(cx + 8 + leanX, headY + 7, 3, 5);

      this.registerCanvas(`zombie_runner_${action}`, canvas);
    });

    const base = (this.scene.textures.get('zombie_runner_walk_0').getSourceImage() as any);
    this.registerCanvas('zombie_runner', base);
  }

  // ========================================================
  // 4.3. ZUMBI TANQUE (ZOMBIE TANK CARTOON)
  // ========================================================
  private createTankZombieFrames(): void {
    ['walk_0', 'walk_1'].forEach(action => {
      const { canvas, ctx } = this.createCanvas(160, 160);
      const cx = 80;
      const cy = 80;

      const isWalk0 = action === 'walk_0';
      const stompBob = isWalk0 ? -4 : 4;

      // Sombra colossal
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 50, 48, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 5;
      ctx.strokeStyle = '#050505';

      // Pernas pesadíssimas com placas de aço
      ctx.fillStyle = '#1e3a1e';
      ctx.beginPath();
      ctx.roundRect(cx - 28, cy + 24 + stompBob, 20, 28, 6);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(cx + 8, cy + 24 - stompBob, 20, 28, 6);
      ctx.fill();
      ctx.stroke();

      // Tronco colossal de gigante
      ctx.fillStyle = '#283618';
      ctx.beginPath();
      ctx.roundRect(cx - 36, cy - 18, 72, 48, 10);
      ctx.fill();
      ctx.stroke();

      // Placas de blindagem de aço enferrujado nos ombros com rebites
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(cx - 48, cy - 24, 24, 24, 5);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(cx + 24, cy - 24, 24, 24, 5);
      ctx.fill();
      ctx.stroke();

      // Rebites de ferro
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(cx - 42, cy - 18, 3, 0, Math.PI * 2);
      ctx.arc(cx - 30, cy - 18, 3, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy - 18, 3, 0, Math.PI * 2);
      ctx.arc(cx + 42, cy - 18, 3, 0, Math.PI * 2);
      ctx.fill();

      // Braços grossos com punhos de marreta
      ctx.fillStyle = '#283618';
      ctx.beginPath();
      ctx.roundRect(cx - 46, cy + 2, 18, 34, 6);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(cx + 28, cy + 2, 18, 34, 6);
      ctx.fill();
      ctx.stroke();

      // Cabeça brutal com grampos de metal
      const headY = cy - 40;
      ctx.fillStyle = '#283618';
      ctx.beginPath();
      ctx.roundRect(cx - 22, headY, 44, 34, 8);
      ctx.fill();
      ctx.stroke();

      // Grampos de metal na testa rachada
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - 10, headY + 5, 8, 3);
      ctx.fillRect(cx + 4, headY + 5, 8, 3);

      // Olhos pequenos e brilhantes vermelhos
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx - 10, headY + 16, 5, 0, Math.PI * 2);
      ctx.arc(cx + 10, headY + 16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Boca blindada com presas amareladas pesadas
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.roundRect(cx - 16, headY + 24, 32, 12, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 12, headY + 22, 6, 6);
      ctx.fillRect(cx + 6, headY + 22, 6, 6);

      this.registerCanvas(`zombie_tank_${action}`, canvas);
    });

    const base = (this.scene.textures.get('zombie_tank_walk_0').getSourceImage() as any);
    this.registerCanvas('zombie_tank', base);
  }

  // ========================================================
  // 4.4. CHEFE: O COLOSSO ZUMBI (TITÃ CARTOON DA REFERÊNCIA)
  // ========================================================
  private createBossZombieFrames(): void {
    ['walk_0', 'walk_1', 'smash'].forEach(action => {
      const { canvas, ctx } = this.createCanvas(240, 240);
      const cx = 120;
      const cy = 120;

      const isSmash = action === 'smash';
      const armRaise = isSmash ? -30 : 0;

      // Sombra gigantesca
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 85, 75, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 6;
      ctx.strokeStyle = '#050505';

      // Pernas monstruosas
      ctx.fillStyle = '#3f1118';
      ctx.beginPath();
      ctx.roundRect(cx - 42, cy + 40, 32, 46, 8);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(cx + 10, cy + 40, 32, 46, 8);
      ctx.fill();
      ctx.stroke();

      // Tronco titânico com espinhos ósseos
      ctx.fillStyle = '#4c0519';
      ctx.beginPath();
      ctx.roundRect(cx - 56, cy - 25, 112, 75, 16);
      ctx.fill();
      ctx.stroke();

      // Espinhos ósseos brotando dos ombros (estilo monstro da logo!)
      ctx.fillStyle = '#e2e8f0';
      // Espinho esquerdo
      ctx.beginPath();
      ctx.moveTo(cx - 65, cy - 20);
      ctx.lineTo(cx - 95, cy - 50);
      ctx.lineTo(cx - 55, cy - 40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Espinho direito
      ctx.beginPath();
      ctx.moveTo(cx + 65, cy - 20);
      ctx.lineTo(cx + 95, cy - 50);
      ctx.lineTo(cx + 55, cy - 40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Núcleo carmesim pulsante no peito
      ctx.save();
      ctx.fillStyle = '#e11d48';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fecdd3';
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Braços titânicos com garras sangrentas
      ctx.fillStyle = '#3f1118';
      ctx.beginPath();
      ctx.roundRect(cx - 75, cy - 10 + armRaise, 26, 65, 8);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(cx + 49, cy - 10 + armRaise, 26, 65, 8);
      ctx.fill();
      ctx.stroke();

      // Cabeça gigantesca aterrorizante
      const headY = cy - 65;

      ctx.fillStyle = '#4c0519';
      ctx.beginPath();
      ctx.arc(cx, headY, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crânio partido com cérebro e osso exposto ensanguentado (como na referência!)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx - 16, headY - 14, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(cx - 16, headY - 14, 10, 0, Math.PI * 2);
      ctx.fill();

      // Olhos gigantes amarelos incandescentes com fogo
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx - 14, headY + 2, 11, 0, Math.PI * 2);
      ctx.arc(cx + 16, headY + 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx - 14, headY + 2, 7, 0, Math.PI * 2);
      ctx.arc(cx + 16, headY + 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(cx - 14, headY + 2, 3, 0, Math.PI * 2);
      ctx.arc(cx + 16, headY + 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Boca titânica escancarada com fileiras de dentes apodrecidos pontiagudos
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.roundRect(cx - 24, headY + 16, 48, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      // Dentes pontiagudos de tubarão/monstro
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 20 + i * 9, headY + 16);
        ctx.lineTo(cx - 16 + i * 9, headY + 26);
        ctx.lineTo(cx - 12 + i * 9, headY + 16);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx - 20 + i * 9, headY + 42);
        ctx.lineTo(cx - 16 + i * 9, headY + 32);
        ctx.lineTo(cx - 12 + i * 9, headY + 42);
        ctx.fill();
      }

      this.registerCanvas(`zombie_boss_${action}`, canvas);
    });

    const base = (this.scene.textures.get('zombie_boss_walk_0').getSourceImage() as any);
    this.registerCanvas('zombie_boss', base);
  }

  // ========================================================
  // 5. BICHINHO GUARDIÃO CARTOON DOS ESPECTADORES
  // ========================================================
  private createCompanionPetFrames(): void {
    const { canvas, ctx } = this.createCanvas(72, 72);
    const cx = 36;
    const cy = 36;

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 26, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#050505';

    // Asinhas de anjo cibernético cartoon brilhantes
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(cx - 18, cy - 2, 14, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx + 18, cy - 2, 14, 7, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Corpinho esférico fofo dourado
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(cx, cy + 3, 12, 0, Math.PI * 2);
    ctx.fill();

    // Orelhinhas fofas
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 14);
    ctx.lineTo(cx - 6, cy - 26);
    ctx.lineTo(cx, cy - 16);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx + 6, cy - 26);
    ctx.lineTo(cx + 12, cy - 14);
    ctx.fill();
    ctx.stroke();

    // Olhos kawaii brilhantes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 2, 4, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 7, cy - 4, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Auréola flutuante de anjo guerreiro
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 24, 14, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    this.registerCanvas('companion_pet', canvas);
  }

  // ========================================================
  // 6. PROJÉTEIS E EFEITOS DE COMBATE
  // ========================================================
  private createCombatEffects(): void {
    // 1. Projétil de Plasma Cartoon do Herói
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#050505';

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(16, 16, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(16, 16, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      this.registerCanvas('projectile', canvas);
    }

    // 2. Projétil Estelar do Bichinho Aliado
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#050505';

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      const pts = 5;
      for (let i = 0; i < pts * 2; i++) {
        const r = i % 2 === 0 ? 13 : 6;
        const a = (i * Math.PI) / pts - Math.PI / 2;
        const px = 16 + Math.cos(a) * r;
        const py = 16 + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();

      this.registerCanvas('projectile_pet', canvas);
    }

    // 3. Faísca de Impacto Cartoon (Hit Spark)
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;

      ctx.beginPath();
      const pts = 6;
      for (let i = 0; i < pts * 2; i++) {
        const r = i % 2 === 0 ? 22 : 7;
        const a = (i * Math.PI) / pts;
        const px = 24 + Math.cos(a) * r;
        const py = 24 + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      this.registerCanvas('fx_hit_spark', canvas);
    }
  }

  // ========================================================
  // 7. EFEITOS LUMINOSOS DAS HABILIDADES
  // ========================================================
  private createSkillEffects(): void {
    // 1. Bolha do Escudo de Energia com Padrão Hexagonal
    {
      const { canvas, ctx } = this.createCanvas(128, 128);
      const cx = 64;
      const cy = 64;

      // Brilho exterior
      ctx.save();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(cx, cy, 54, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Interior translúcido
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fill();

      // Hexágonos luminosos na superfície do escudo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      const drawHex = (hx: number, hy: number, r: number) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = hx + Math.cos(a) * r;
          const py = hy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      };

      drawHex(cx, cy, 14);
      drawHex(cx - 24, cy - 14, 12);
      drawHex(cx + 24, cy - 14, 12);
      drawHex(cx - 24, cy + 14, 12);
      drawHex(cx + 24, cy + 14, 12);

      this.registerCanvas('shield_bubble', canvas);
    }

    // 2. Partícula de Fogo Cartoon
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#7f1d1d';

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.quadraticCurveTo(28, 14, 24, 26);
      ctx.quadraticCurveTo(16, 30, 8, 26);
      ctx.quadraticCurveTo(4, 14, 16, 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(16, 20, 6, 0, Math.PI * 2);
      ctx.fill();

      this.registerCanvas('particle_fire', canvas);
    }

    // 3. Partícula de Gelo / Cristal Frost
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0284c7';

      ctx.fillStyle = '#a5f3fc';
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(26, 16);
      ctx.lineTo(16, 30);
      ctx.lineTo(6, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();

      this.registerCanvas('particle_ice', canvas);
    }

    // 4. Cruz de Cura Cartoon (Heal Cross)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#064e3b';

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      // Cruz estilizada
      ctx.rect(12, 4, 8, 24);
      ctx.rect(4, 12, 24, 8);
      ctx.fill();
      ctx.stroke();

      this.registerCanvas('fx_heal_cross', canvas);
    }

    // 5. Onda de Corte de Espada / Lâmina de Energia (Slash Arc)
    {
      const { canvas, ctx } = this.createCanvas(128, 128);
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(64, 64, 48, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(64, 64, 48, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();
      ctx.restore();

      this.registerCanvas('fx_slash_arc', canvas);
    }
  }
}
