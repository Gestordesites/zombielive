import { MatchRecord, GameSettings, CommandProcessResult } from '@zombie-live/shared';
import pg from 'pg';
import bcrypt from 'bcryptjs';

export interface AdminUserRecord {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface IRepository {
  init(): Promise<void>;
  getAdmin(username: string): Promise<AdminUserRecord | null>;
  createAdmin(username: string, passwordHash: string): Promise<AdminUserRecord>;
  getSettings(): Promise<GameSettings>;
  updateSettings(settings: Partial<GameSettings>): Promise<GameSettings>;
  saveMatch(match: MatchRecord): Promise<void>;
  listMatches(limit?: number): Promise<MatchRecord[]>;
  logCommand(cmd: CommandProcessResult): Promise<void>;
  getRecentCommands(limit?: number): Promise<CommandProcessResult[]>;
}

export const defaultSettings: GameSettings = {
  arenaWidth: 1080,
  arenaHeight: 1920,
  orientation: 'PORTRAIT',
  waveDurationSeconds: 30,
  bossWaveInterval: 5,
  maxEnemiesAlive: 60,
  commandCooldownPerUserMs: 2000,
  commandGlobalRateLimitPerSec: 50,
  collectiveGoalLikesTarget: 500,
  soundEnabled: true,
  reducedVfx: false,
  welcomeFollowerText: 'NOVO SOBREVIVENTE!'
};

/**
 * Armazenamento em Memória (Padrão, rápido e não exige banco externo)
 */
export class InMemoryRepository implements IRepository {
  private admins: Map<string, AdminUserRecord> = new Map();
  private settings: GameSettings = { ...defaultSettings };
  private matches: MatchRecord[] = [];
  private commandLogs: CommandProcessResult[] = [];

  async init(): Promise<void> {
    // Pronto imediatamente
  }

  async getAdmin(username: string): Promise<AdminUserRecord | null> {
    return this.admins.get(username) || null;
  }

  async createAdmin(username: string, passwordHash: string): Promise<AdminUserRecord> {
    const admin: AdminUserRecord = {
      id: 'admin_' + Date.now(),
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    this.admins.set(username, admin);
    return admin;
  }

  async getSettings(): Promise<GameSettings> {
    return { ...this.settings };
  }

  async updateSettings(settings: Partial<GameSettings>): Promise<GameSettings> {
    this.settings = { ...this.settings, ...settings };
    return { ...this.settings };
  }

  async saveMatch(match: MatchRecord): Promise<void> {
    this.matches.unshift(match);
    if (this.matches.length > 100) {
      this.matches.pop();
    }
  }

  async listMatches(limit = 20): Promise<MatchRecord[]> {
    return this.matches.slice(0, limit);
  }

  async logCommand(cmd: CommandProcessResult): Promise<void> {
    this.commandLogs.unshift(cmd);
    if (this.commandLogs.length > 500) {
      this.commandLogs.pop();
    }
  }

  async getRecentCommands(limit = 50): Promise<CommandProcessResult[]> {
    return this.commandLogs.slice(0, limit);
  }
}

/**
 * Armazenamento PostgreSQL (Ativado quando DATABASE_URL estiver configurado)
 */
export class PostgresRepository implements IRepository {
  private pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new pg.Pool({ connectionString: databaseUrl });
  }

  async init(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id VARCHAR(64) PRIMARY KEY,
          username VARCHAR(64) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS game_settings (
          id INT PRIMARY KEY DEFAULT 1,
          settings JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS matches (
          id VARCHAR(64) PRIMARY KEY,
          started_at TIMESTAMPTZ NOT NULL,
          ended_at TIMESTAMPTZ,
          duration_seconds INT NOT NULL,
          max_wave INT NOT NULL,
          score INT NOT NULL,
          zombies_killed INT NOT NULL,
          bosses_killed INT NOT NULL,
          result VARCHAR(32) NOT NULL,
          provider_type VARCHAR(32) NOT NULL,
          total_likes INT NOT NULL,
          total_comments INT NOT NULL,
          total_gifts INT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS command_logs (
          id VARCHAR(64) PRIMARY KEY,
          username VARCHAR(100) NOT NULL,
          raw_comment TEXT NOT NULL,
          command_type VARCHAR(32) NOT NULL,
          success BOOLEAN NOT NULL,
          reason TEXT,
          applied_action TEXT,
          timestamp BIGINT NOT NULL
        );
      `);
    } finally {
      client.release();
    }
  }

  async getAdmin(username: string): Promise<AdminUserRecord | null> {
    const res = await this.pool.query('SELECT id, username, password_hash as "passwordHash", created_at as "createdAt" FROM admins WHERE username = $1', [username]);
    return res.rows[0] || null;
  }

  async createAdmin(username: string, passwordHash: string): Promise<AdminUserRecord> {
    const id = 'admin_' + Date.now();
    const res = await this.pool.query(
      'INSERT INTO admins (id, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username, password_hash as "passwordHash", created_at as "createdAt"',
      [id, username, passwordHash]
    );
    return res.rows[0];
  }

  async getSettings(): Promise<GameSettings> {
    const res = await this.pool.query('SELECT settings FROM game_settings WHERE id = 1');
    if (res.rows.length === 0) {
      await this.pool.query('INSERT INTO game_settings (id, settings) VALUES (1, $1)', [JSON.stringify(defaultSettings)]);
      return { ...defaultSettings };
    }
    return { ...defaultSettings, ...res.rows[0].settings };
  }

  async updateSettings(settings: Partial<GameSettings>): Promise<GameSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await this.pool.query(
      'INSERT INTO game_settings (id, settings, updated_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO UPDATE SET settings = $1, updated_at = NOW()',
      [JSON.stringify(updated)]
    );
    return updated;
  }

  async saveMatch(match: MatchRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO matches (
        id, started_at, ended_at, duration_seconds, max_wave, score,
        zombies_killed, bosses_killed, result, provider_type, total_likes, total_comments, total_gifts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        match.id,
        match.startedAt,
        match.endedAt || null,
        match.durationSeconds,
        match.maxWave,
        match.score,
        match.zombiesKilled,
        match.bossesKilled,
        match.result,
        match.providerType,
        match.totalLikes,
        match.totalComments,
        match.totalGifts
      ]
    );
  }

  async listMatches(limit = 20): Promise<MatchRecord[]> {
    const res = await this.pool.query('SELECT * FROM matches ORDER BY started_at DESC LIMIT $1', [limit]);
    return res.rows.map(r => ({
      id: r.id,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      durationSeconds: r.duration_seconds,
      maxWave: r.max_wave,
      score: r.score,
      zombiesKilled: r.zombies_killed,
      bossesKilled: r.bosses_killed,
      result: r.result,
      providerType: r.provider_type,
      totalLikes: r.total_likes,
      totalComments: r.total_comments,
      totalGifts: r.total_gifts
    }));
  }

  async logCommand(cmd: CommandProcessResult): Promise<void> {
    await this.pool.query(
      `INSERT INTO command_logs (id, username, raw_comment, command_type, success, reason, applied_action, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [cmd.id, cmd.username, cmd.rawComment, cmd.commandType, cmd.success, cmd.reason || null, cmd.appliedAction || null, cmd.timestamp]
    );
  }

  async getRecentCommands(limit = 50): Promise<CommandProcessResult[]> {
    const res = await this.pool.query('SELECT * FROM command_logs ORDER BY timestamp DESC LIMIT $1', [limit]);
    return res.rows.map(r => ({
      id: r.id,
      username: r.username,
      rawComment: r.raw_comment,
      commandType: r.command_type,
      success: r.success,
      reason: r.reason,
      appliedAction: r.applied_action,
      timestamp: Number(r.timestamp)
    }));
  }
}
