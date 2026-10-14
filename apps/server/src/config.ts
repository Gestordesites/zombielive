import dotenv from 'dotenv';
import path from 'path';

// Carrega .env da raiz do projeto ou diretório local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  corsOrigins: (process.env.CLIENT_CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001').split(','),
  
  jwtSecret: process.env.JWT_SECRET || 'zombie_live_dev_secret_key_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  adminDefaultUser: process.env.ADMIN_DEFAULT_USER || 'admin',
  adminDefaultPass: process.env.ADMIN_DEFAULT_PASS || 'admin123456',

  databaseUrl: process.env.DATABASE_URL || '',

  liveProvider: (process.env.LIVE_PROVIDER || 'SIMULATOR') as 'SIMULATOR' | 'CONNECTED' | 'DISCONNECTED',
  tiktokUsername: process.env.TIKTOK_USERNAME || '',
  tiktokReconnectInterval: parseInt(process.env.TIKTOK_RECONNECT_INTERVAL || '5000', 10),
  tiktokDebug: process.env.TIKTOK_DEBUG === 'true',

  commandRateLimitPerUser: parseInt(process.env.COMMAND_RATE_LIMIT_PER_USER || '3', 10),
  commandRateLimitGlobalPerSec: parseInt(process.env.COMMAND_RATE_LIMIT_GLOBAL_PER_SEC || '50', 10),
  commandCooldownMs: parseInt(process.env.COMMAND_COOLDOWN_MS || '2000', 10),
};
