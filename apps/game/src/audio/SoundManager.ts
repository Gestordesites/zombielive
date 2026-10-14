/**
 * SoundManager — Sistema de Áudio Procedural via Web Audio API
 * Produz efeitos sonoros de alta fidelidade sem depender de arquivos externos,
 * garantindo compatibilidade imediata com OBS Studio e navegadores modernos.
 */

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('[AUDIO] Web Audio API não suportada ou bloqueada:', e);
    }
  }

  /**
   * Garante que o contexto de áudio esteja ativo após interação ou no OBS
   */
  public resumeAudio(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  // ==========================================
  // SONS DO JOGO (COMBATE E SOBREVIVENTE)
  // ==========================================

  /**
   * Disparo de plasma do herói (Pew-pew sci-fi rápido)
   */
  public playShoot(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Impacto de dano em zumbi
   */
  public playZombieHit(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.07);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Zumbi derrotado / eliminação
   */
  public playZombieDefeated(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const now = this.ctx.currentTime;
    // Ruído filtrado para simular esmagamento
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Sobrevivente ferido (alerta de dano)
   */
  public playPlayerHurt(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Habilidade: CURA (Sinos mágicos ascendentes)
   */
  public playHeal(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  /**
   * Habilidade: ESCUDO (Zumbido eletromagnético protetor)
   */
  public playShield(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.5);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.52);
  }

  /**
   * Habilidade: ATAQUE (Corte de espada veloz)
   */
  public playSlash(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  /**
   * Habilidade: FOGO (Onda incendiária ardente)
   */
  public playFire(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  /**
   * Habilidade: CONGELAMENTO (Cristais de gelo estalando)
   */
  public playIce(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const now = this.ctx.currentTime;
    [1200, 1500, 2100].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, t + 0.2);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  /**
   * Habilidade: EXPLOSAO / SUPERNOVA (Estrondo cinematográfico com sub-grave)
   */
  public playExplosion(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const now = this.ctx.currentTime;
    // Sub-grave
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.65);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.68);
  }

  // ==========================================
  // SONS DE INTERAÇÃO DA LIVE (SEGUIDORES, PRESENTES, METAS)
  // ==========================================

  /**
   * NOVO SEGUIDOR: Fanfarra vibrante de boas-vindas
   */
  public playFollowerAlert(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const notes = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  }

  /**
   * PRESENTE VIRTUAL: Efeito triunfal de moedas/estrelas e comemoração
   */
  public playGiftAlert(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const notes = [587.33, 739.99, 880.0, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  /**
   * META COLETIVA CONCLUÍDA: Trompete triunfal da comunidade
   */
  public playGoalAchieved(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const chords = [
      { f: 523.25, t: 0 },    // C5
      { f: 659.25, t: 0.12 }, // E5
      { f: 783.99, t: 0.24 }, // G5
      { f: 1046.5, t: 0.36 }, // C6
      { f: 1318.51, t: 0.55 } // E6 sustentado
    ];
    const now = this.ctx.currentTime;

    chords.forEach(c => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + c.t;
      const duration = c.t === 0.55 ? 0.7 : 0.3;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  }

  /**
   * SURGIMENTO DO CHEFE: Sirene apocalíptica e alerta profundo
   */
  public playBossSpawn(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.3);
    osc.frequency.linearRampToValueAtTime(80, now + 0.7);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.9);
  }

  /**
   * CHEFE DERROTADO: Vitória épica
   */
  public playBossDefeated(): void {
    if (!this.ctx || this.isMuted) return;
    this.playExplosion();
    setTimeout(() => this.playGoalAchieved(), 250);
  }

  /**
   * LEVEL UP & VOTAÇÃO: Melodia de evolução arcade
   */
  public playLevelUp(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  /**
   * GAME OVER: Acorde menor descendente
   */
  public playGameOver(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const notes = [349.23, 311.13, 277.18, 220.0]; // F4, Eb4, Db4, A3
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.2;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.55);
    });
  }

  /**
   * VITÓRIA DA COMUNIDADE: Fanfarra maior grandiosa
   */
  public playVictory(): void {
    if (!this.ctx || this.isMuted) return;
    this.resumeAudio();

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.32, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  }
}

export const soundManager = new SoundManager();
