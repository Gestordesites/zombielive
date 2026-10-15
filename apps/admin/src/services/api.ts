import { io, Socket } from 'socket.io-client';
import {
  GameStateSnapshot,
  SOCKET_EVENTS,
  MatchRecord,
  GameSettings,
  DiagnosticInfo,
  CommandProcessResult,
  NormalizedLiveEvent,
  LiveProviderType,
  SkillType
} from '@zombie-live/shared';

// Detecção automática de ambiente: conecta ao origin em produção ou porta 4000 em dev
const isDevPort = window.location.port === '3000' || window.location.port === '3001' || window.location.port === '5173';
const SERVER_URL = (import.meta as any).env?.VITE_SERVER_URL || (isDevPort ? `${window.location.protocol}//${window.location.hostname}:4000` : window.location.origin);

class ApiService {
  private socket: Socket;
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('zombie_live_admin_token');
    this.socket = io(SERVER_URL, {
      reconnection: true,
      transports: ['websocket', 'polling']
    });
  }

  getSocket(): Socket {
    return this.socket;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('zombie_live_admin_token', token);
    } else {
      localStorage.removeItem('zombie_live_admin_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as any)
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.setToken(null);
      window.dispatchEvent(new Event('auth_unauthorized'));
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  }

  // Auth
  async login(username: string, password: string): Promise<{ token: string; username: string }> {
    const data = await this.request<{ token: string; username: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.token);
    return data;
  }

  async getMe(): Promise<{ user: { username: string; userId: string } }> {
    return this.request('/api/auth/me');
  }

  // Partida
  async getMatchStatus(): Promise<GameStateSnapshot> {
    return this.request('/api/match/status');
  }

  async controlMatch(action: 'start' | 'pause' | 'resume' | 'stop' | 'restart'): Promise<{ success: boolean }> {
    return this.request('/api/match/control', {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  }

  async listMatches(limit = 20): Promise<MatchRecord[]> {
    return this.request(`/api/match/history?limit=${limit}`);
  }

  // Configurações
  async getSettings(): Promise<GameSettings> {
    return this.request('/api/settings');
  }

  async updateSettings(settings: Partial<GameSettings>): Promise<GameSettings> {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }

  // Diagnóstico
  async getDiagnostics(): Promise<DiagnosticInfo> {
    return this.request('/api/diagnostics');
  }

  // Provedor
  async setProvider(provider: LiveProviderType, username?: string, sessionId?: string): Promise<{ success: boolean; provider: any }> {
    return this.request('/api/provider', {
      method: 'POST',
      body: JSON.stringify({ provider, username, sessionId })
    });
  }

  // Simulador
  async simulateEvent(event: Partial<NormalizedLiveEvent>): Promise<{ success: boolean }> {
    return this.request('/api/simulator/event', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }

  async getRecentCommands(limit = 50): Promise<CommandProcessResult[]> {
    return this.request(`/api/commands/recent?limit=${limit}`);
  }

  // Socket triggers diretos
  triggerSkill(skill: SkillType): void {
    this.socket.emit(SOCKET_EVENTS.ADMIN_TRIGGER_SKILL, { skill });
  }
}

export const api = new ApiService();
