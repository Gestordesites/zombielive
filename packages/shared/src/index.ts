/**
 * Zombie Live - Contratos e Modelos Compartilhados
 */

// 1. Estados da Partida
export type MatchStatus =
  | 'IDLE'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'PAUSED'
  | 'BOSS_FIGHT'
  | 'VICTORY'
  | 'GAME_OVER'
  | 'RESTARTING';

// 2. Modos de Conexão com Eventos
export type LiveProviderType = 'SIMULATOR' | 'CONNECTED' | 'DISCONNECTED';

// 3. Tipos de Inimigos
export type EnemyType = 'COMMON' | 'RUNNER' | 'TANK' | 'BOSS';

export interface EnemyData {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  xpReward: number;
  scoreReward: number;
  isBoss?: boolean;
  bossName?: string;
  specialAttackCountdown?: number;
  specialAttackTelegraph?: boolean;
}

// 4. Habilidades Especiais
export type SkillType = 'CURA' | 'ESCUDO' | 'ATAQUE' | 'FOGO' | 'CONGELAMENTO' | 'EXPLOSAO';

export interface SkillConfig {
  id: SkillType;
  name: string;
  cooldownMs: number;
  lastUsedMs: number;
  durationMs: number;
  intensity: number;
  description: string;
  visualEffect: 'green_glow' | 'blue_barrier' | 'sword_arc' | 'fire_wave' | 'ice_burst' | 'explosion';
}

// 5. Atributos do Sobrevivente
export interface SurvivorStats {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackRate: number; // ataques por segundo
  armor: number; // redução percentual (0 a 0.8)
  level: number;
  xp: number;
  xpNeeded: number;
  shieldActive: boolean;
  shieldExpiresAt: number;
}

export interface SurvivorData extends SurvivorStats {
  x: number;
  y: number;
  targetEnemyId: string | null;
  kills: number;
  isAttacking: boolean;
  lastAttackTimestamp: number;
  skills: Record<SkillType, SkillConfig>;
}

// 6. Projéteis e Efeitos Visuais
export interface ProjectileData {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  damage: number;
  speed: number;
  splashRadius?: number;
  color?: number;
}

export interface VisualEffectEvent {
  id: string;
  type: 'EXPLOSION' | 'SLASH' | 'FIRE_AREA' | 'ICE_BLAST' | 'HEAL_RING' | 'SHIELD_PULSE' | 'LEVEL_UP';
  x: number;
  y: number;
  radius: number;
  durationMs: number;
}

// 7. Sistema de Votação
export interface VoteOption {
  id: number;
  title: string;
  description: string;
  statBonus: Partial<SurvivorStats>;
  votes: number;
}

export interface VoteSession {
  id: string;
  active: boolean;
  title: string;
  options: VoteOption[];
  durationSeconds: number;
  timeRemainingSeconds: number;
  voters: Record<string, number>; // username -> optionId
}

// 8. Metas Coletivas
export type CollectiveGoalType = 'LIKES' | 'KILLS' | 'SURVIVAL_TIME';

export interface CollectiveGoal {
  id: string;
  title: string;
  type: CollectiveGoalType;
  current: number;
  target: number;
  rewardSkillOrBuff: SkillType | 'DAMAGE_BOOST' | 'SCORE_BOOST';
  rewardDescription: string;
  achieved: boolean;
  progressPercent: number;
}

// 9. Sistema de Ondas
export interface WaveConfig {
  waveNumber: number;
  durationSeconds: number;
  spawnIntervalMs: number;
  maxEnemies: number;
  commonRatio: number;
  runnerRatio: number;
  tankRatio: number;
  isBossWave: boolean;
}

export interface WaveState {
  currentWave: number;
  timeRemainingSeconds: number;
  totalKillsInWave: number;
  isBossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
}

// 10. Estado Completo do Jogo
export interface GameStateSnapshot {
  status: MatchStatus;
  matchId: string;
  matchDurationSeconds: number;
  score: number;
  kills: number;
  survivor: SurvivorData;
  enemies: EnemyData[];
  projectiles: ProjectileData[];
  wave: WaveState;
  collectiveGoal: CollectiveGoal;
  activeVote: VoteSession | null;
  providerType: LiveProviderType;
  totalLikesReceived: number;
  recentAnnouncements: GameAnnouncement[];
}

export interface GameAnnouncement {
  id: string;
  type: 'FOLLOWER' | 'GIFT' | 'GOAL' | 'BOSS' | 'LEVEL_UP' | 'VICTORY' | 'GAME_OVER' | 'SYSTEM';
  message: string;
  author?: string;
  timestamp: number;
}

// 11. Eventos Normalizados da Live
export type LiveEventType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'GIFT' | 'VOTE';

export interface NormalizedLiveEvent {
  id: string;
  type: LiveEventType;
  timestamp: number;
  user: {
    id: string;
    username: string;
    nickname?: string;
    avatarUrl?: string;
  };
  data: {
    likeCount?: number;
    totalLikes?: number;
    commentText?: string;
    giftId?: string;
    giftName?: string;
    giftCount?: number;
    voteOption?: number;
  };
}

// 12. Comandos de Bate-Papo
export type GameCommandType =
  | 'CURA'
  | 'ESCUDO'
  | 'ATAQUE'
  | 'FOGO'
  | 'CONGELAMENTO'
  | 'EXPLOSAO'
  | 'VOTAR';

export interface CommandProcessResult {
  id: string;
  username: string;
  rawComment: string;
  commandType: GameCommandType | 'UNKNOWN';
  success: boolean;
  reason?: string;
  appliedAction?: string;
  timestamp: number;
}

// 13. Histórico e Relatórios de Partida
export interface MatchRecord {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  maxWave: number;
  score: number;
  zombiesKilled: number;
  bossesKilled: number;
  result: 'VICTORY' | 'GAME_OVER' | 'ABORTED';
  providerType: LiveProviderType;
  totalLikes: number;
  totalComments: number;
  totalGifts: number;
}

// 14. Configurações Dinâmicas do Jogo
export interface GameSettings {
  arenaWidth: number;
  arenaHeight: number;
  orientation?: 'PORTRAIT' | 'LANDSCAPE';
  waveDurationSeconds: number;
  bossWaveInterval: number;
  maxEnemiesAlive: number;
  commandCooldownPerUserMs: number;
  commandGlobalRateLimitPerSec: number;
  collectiveGoalLikesTarget: number;
  soundEnabled: boolean;
  reducedVfx: boolean;
  welcomeFollowerText: string;
}

// 15. Contrato de Eventos Socket.IO
export const SOCKET_EVENTS = {
  // Servidor -> Clientes
  GAME_STATE_SNAPSHOT: 'GAME_STATE_SNAPSHOT',
  GAME_STATE_UPDATED: 'GAME_STATE_UPDATED',
  ENEMY_SPAWNED: 'ENEMY_SPAWNED',
  ENEMY_DEFEATED: 'ENEMY_DEFEATED',
  PLAYER_DAMAGED: 'PLAYER_DAMAGED',
  PLAYER_HEALED: 'PLAYER_HEALED',
  ABILITY_ACTIVATED: 'ABILITY_ACTIVATED',
  LEVEL_UP: 'LEVEL_UP',
  VOTE_STARTED: 'VOTE_STARTED',
  VOTE_UPDATED: 'VOTE_UPDATED',
  VOTE_FINISHED: 'VOTE_FINISHED',
  BOSS_SPAWNED: 'BOSS_SPAWNED',
  BOSS_DEFEATED: 'BOSS_DEFEATED',
  MATCH_FINISHED: 'MATCH_FINISHED',
  FOLLOWER_ANNOUNCEMENT: 'FOLLOWER_ANNOUNCEMENT',
  COLLECTIVE_GOAL_PROGRESS: 'COLLECTIVE_GOAL_PROGRESS',
  COLLECTIVE_GOAL_ACHIEVED: 'COLLECTIVE_GOAL_ACHIEVED',
  COMMAND_PROCESSED: 'COMMAND_PROCESSED',
  PROVIDER_STATUS_CHANGED: 'PROVIDER_STATUS_CHANGED',
  NOTIFICATION: 'NOTIFICATION',
  VISUAL_EFFECT: 'VISUAL_EFFECT',

  // Clientes Admin -> Servidor
  ADMIN_START_MATCH: 'ADMIN_START_MATCH',
  ADMIN_PAUSE_MATCH: 'ADMIN_PAUSE_MATCH',
  ADMIN_RESUME_MATCH: 'ADMIN_RESUME_MATCH',
  ADMIN_STOP_MATCH: 'ADMIN_STOP_MATCH',
  ADMIN_RESTART_MATCH: 'ADMIN_RESTART_MATCH',
  ADMIN_TRIGGER_SKILL: 'ADMIN_TRIGGER_SKILL',
  ADMIN_SIMULATE_EVENT: 'ADMIN_SIMULATE_EVENT',
  ADMIN_UPDATE_SETTINGS: 'ADMIN_UPDATE_SETTINGS',
  ADMIN_SET_PROVIDER: 'ADMIN_SET_PROVIDER',
  ADMIN_CONNECT_TIKTOK: 'ADMIN_CONNECT_TIKTOK',
  ADMIN_DISCONNECT_TIKTOK: 'ADMIN_DISCONNECT_TIKTOK'
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// 16. Interfaces de Diagnóstico
export interface DiagnosticInfo {
  serverStatus: 'UP' | 'DOWN';
  uptimeSeconds: number;
  memoryUsageMb: number;
  activeSockets: number;
  matchStatus: MatchStatus;
  providerStatus: {
    type: LiveProviderType;
    connected: boolean;
    channelName?: string;
    lastEventTime?: string;
    supportedEvents: string[];
    unsupportedEvents: string[];
    recentErrors: string[];
  };
  eventCounters: {
    likes: number;
    comments: number;
    follows: number;
    gifts: number;
    votes: number;
  };
  commandsAccepted: number;
  commandsRejected: number;
}
