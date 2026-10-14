import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '@zombie-live/shared';
// Detecção automática de ambiente: conecta ao origin em produção ou porta 4000 em dev
const isDevPort = window.location.port === '3000' || window.location.port === '3001' || window.location.port === '5173';
const SERVER_URL = import.meta.env?.VITE_SERVER_URL || (isDevPort ? `${window.location.protocol}//${window.location.hostname}:4000` : window.location.origin);
class ApiService {
    socket;
    token = null;
    constructor() {
        this.token = localStorage.getItem('zombie_live_admin_token');
        this.socket = io(SERVER_URL, {
            reconnection: true,
            transports: ['websocket', 'polling']
        });
    }
    getSocket() {
        return this.socket;
    }
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('zombie_live_admin_token', token);
        }
        else {
            localStorage.removeItem('zombie_live_admin_token');
        }
    }
    getToken() {
        return this.token;
    }
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
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
    async login(username, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this.setToken(data.token);
        return data;
    }
    async getMe() {
        return this.request('/api/auth/me');
    }
    // Partida
    async getMatchStatus() {
        return this.request('/api/match/status');
    }
    async controlMatch(action) {
        return this.request('/api/match/control', {
            method: 'POST',
            body: JSON.stringify({ action })
        });
    }
    async listMatches(limit = 20) {
        return this.request(`/api/match/history?limit=${limit}`);
    }
    // Configurações
    async getSettings() {
        return this.request('/api/settings');
    }
    async updateSettings(settings) {
        return this.request('/api/settings', {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }
    // Diagnóstico
    async getDiagnostics() {
        return this.request('/api/diagnostics');
    }
    // Provedor
    async setProvider(provider, username) {
        return this.request('/api/provider', {
            method: 'POST',
            body: JSON.stringify({ provider, username })
        });
    }
    // Simulador
    async simulateEvent(event) {
        return this.request('/api/simulator/event', {
            method: 'POST',
            body: JSON.stringify(event)
        });
    }
    async getRecentCommands(limit = 50) {
        return this.request(`/api/commands/recent?limit=${limit}`);
    }
    // Socket triggers diretos
    triggerSkill(skill) {
        this.socket.emit(SOCKET_EVENTS.ADMIN_TRIGGER_SKILL, { skill });
    }
}
export const api = new ApiService();
