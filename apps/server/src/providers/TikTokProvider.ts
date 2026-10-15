import { LiveProviderType, NormalizedLiveEvent } from '@zombie-live/shared';
import { ILiveEventProvider, ProviderStatus, EventListener } from './ILiveEventProvider.js';
// @ts-ignore - tiktok-live-connector é importado dinamicamente ou via CJS
import pkg from 'tiktok-live-connector';
const { TikTokLiveConnection, WebcastPushConnection } = pkg as any;
const LiveConnectionClass = TikTokLiveConnection || WebcastPushConnection;

export class TikTokProvider implements ILiveEventProvider {
  readonly type: LiveProviderType = 'CONNECTED';
  private listeners: Set<EventListener> = new Set();
  private statusListeners: Set<(status: ProviderStatus) => void> = new Set();
  private connection: any = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private shouldStayConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private channelName: string;
  private sessionId?: string;
  private reconnectIntervalMs: number;
  private lastEventTime?: string;
  private recentErrors: string[] = [];
  private lastTotalLikes: number = 0;

  constructor(username: string, sessionId?: string, reconnectIntervalMs: number = 5000) {
    this.channelName = this.cleanUsername(username);
    this.sessionId = sessionId?.trim() || undefined;
    this.reconnectIntervalMs = Math.max(3000, reconnectIntervalMs);
  }

  private cleanUsername(input: string): string {
    let clean = (input || '').trim();
    const urlMatch = clean.match(/@([a-zA-Z0-9_.-]+)/);
    if (urlMatch) return urlMatch[1];
    clean = clean.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, '');
    clean = clean.replace(/\/live.*$/, '');
    clean = clean.replace(/^@/, '').trim();
    return clean;
  }

  async connect(): Promise<void> {
    if (!this.channelName) {
      throw new Error('Nome de usuário do TikTok não foi informado.');
    }

    this.shouldStayConnected = true;
    await this.attemptConnect();
  }

  private async attemptConnect(): Promise<void> {
    if (this.isConnecting || this.isConnected || !this.shouldStayConnected) {
      return;
    }

    this.isConnecting = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      if (this.connection) {
        try {
          await this.connection.disconnect();
        } catch (_) {}
        this.connection = null;
      }

      const connectionOptions: any = {
        processInitialData: false,
        enableExtendedGiftInfo: false,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 2000,
        clientParams: {
          app_language: 'pt-BR',
          webcast_language: 'pt-BR'
        },
        requestHeaders: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://www.tiktok.com/',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Origin': 'https://www.tiktok.com'
        },
        websocketHeaders: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      };

      if (this.sessionId) {
        connectionOptions.sessionId = this.sessionId;
      }

      const signApiKey = process.env.TIKTOK_SIGN_API_KEY || process.env.EULERSTREAM_API_KEY;
      if (signApiKey) {
        connectionOptions.signProviderOptions = {
          params: { apiKey: signApiKey },
          headers: {
            'Authorization': `Bearer ${signApiKey}`,
            'X-Argus-X-ApiKey': signApiKey
          }
        };
      }

      this.connection = new LiveConnectionClass(this.channelName, connectionOptions);

      // Registra eventos do TikTok LIVE
      this.connection.on('chat', (data: any) => {
        this.emitNormalized({
          id: 'tt_' + (data.msgId || Date.now()),
          type: 'COMMENT',
          timestamp: Date.now(),
          user: {
            id: String(data.userId || data.uniqueId || 'anon'),
            username: data.uniqueId || data.nickname || 'Espectador',
            nickname: data.nickname,
            avatarUrl: data.profilePictureUrl
          },
          data: {
            commentText: data.comment
          }
        });
      });

      this.connection.on('like', (data: any) => {
        let count = data.likeCount || 1;
        if (data.totalLikeCount) {
          if (this.lastTotalLikes > 0 && data.totalLikeCount > this.lastTotalLikes) {
            count = data.totalLikeCount - this.lastTotalLikes;
          }
          this.lastTotalLikes = data.totalLikeCount;
        }

        this.emitNormalized({
          id: 'tt_like_' + Date.now() + '_' + Math.random(),
          type: 'LIKE',
          timestamp: Date.now(),
          user: {
            id: String(data.userId || data.uniqueId || 'anon'),
            username: data.uniqueId || data.nickname || 'Espectador',
            nickname: data.nickname
          },
          data: {
            likeCount: count,
            totalLikes: data.totalLikeCount
          }
        });
      });

      this.connection.on('gift', (data: any) => {
        this.emitNormalized({
          id: 'tt_gift_' + (data.msgId || Date.now()),
          type: 'GIFT',
          timestamp: Date.now(),
          user: {
            id: String(data.userId || data.uniqueId || 'anon'),
            username: data.uniqueId || data.nickname || 'Espectador',
            nickname: data.nickname,
            avatarUrl: data.profilePictureUrl
          },
          data: {
            giftId: String(data.giftId),
            giftName: data.giftName || data.describe || 'Presente',
            giftCount: data.repeatCount || 1
          }
        });
      });

      this.connection.on('follow', (data: any) => {
        this.emitNormalized({
          id: 'tt_follow_' + Date.now(),
          type: 'FOLLOW',
          timestamp: Date.now(),
          user: {
            id: String(data.userId || data.uniqueId || 'anon'),
            username: data.uniqueId || data.nickname || 'Novo Seguidor',
            nickname: data.nickname
          },
          data: {}
        });
      });

      this.connection.on('share', (_data: any) => {
        this.emitNormalized({
          id: 'tt_share_' + Date.now(),
          type: 'COMMENT',
          timestamp: Date.now(),
          user: {
            id: 'share_supporter',
            username: 'Apoiador'
          },
          data: {
            commentText: '!escudo'
          }
        });
      });

      this.connection.on('error', (err: any) => {
        const msg = `[TikTok LIVE] Erro no conector: ${err?.message || err}`;
        console.error(msg);
        this.addError(msg);
      });

      this.connection.on('disconnected', () => {
        this.handleDisconnected('Conexão encerrada pelo TikTok');
      });

      this.connection.on('streamEnd', () => {
        this.handleDisconnected('Transmissão ao vivo encerrada');
      });

      // Conecta à live do TikTok
      const state = await this.connection.connect();
      this.isConnected = true;
      this.isConnecting = false;
      console.log(`[TikTok LIVE] Conectado com sucesso à live de @${this.channelName} (Room ID: ${state?.roomId || 'N/A'})`);
      this.notifyStatusChanged();
    } catch (err: any) {
      this.isConnected = false;
      this.isConnecting = false;
      const rawMsg = err?.message || String(err);
      let userFriendly = `Aguardando live de @${this.channelName} entrar online...`;
      if (rawMsg.includes('User is offline') || rawMsg.includes('LIVE has ended') || rawMsg.includes('room info')) {
        userFriendly = `Canal @${this.channelName} está offline ou aguardando abertura da live.`;
      } else if (rawMsg.includes('blocked') || rawMsg.includes('403') || rawMsg.includes('captcha')) {
        userFriendly = `TikTok solicitou verificação de sessão (IP datacentro). Configure TIKTOK_SESSION_ID no .env.`;
      }
      const msg = `[TikTok LIVE] ${userFriendly} (${rawMsg})`;
      console.warn(msg);
      this.addError(msg);
      this.notifyStatusChanged();

      this.scheduleReconnect();
    }
  }

  private handleDisconnected(reason: string): void {
    this.isConnected = false;
    this.isConnecting = false;
    const msg = `[TikTok LIVE] @${this.channelName}: ${reason}. Reconectando em ${Math.round(this.reconnectIntervalMs / 1000)}s...`;
    console.warn(msg);
    this.addError(msg);
    this.notifyStatusChanged();

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.shouldStayConnected) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldStayConnected && !this.isConnected) {
        this.attemptConnect().catch(e => {
          console.error('[TikTok LIVE] Erro no loop de reconexão:', e);
        });
      }
    }, this.reconnectIntervalMs);
  }

  async disconnect(): Promise<void> {
    this.shouldStayConnected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connection) {
      try {
        await this.connection.disconnect();
      } catch (e) {
        // ignora erro ao desconectar
      }
      this.connection = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.notifyStatusChanged();
  }

  getStatus(): ProviderStatus {
    return {
      type: this.type,
      connected: this.isConnected,
      channelName: this.channelName ? `@${this.channelName}` : undefined,
      lastEventTime: this.lastEventTime,
      supportedEvents: ['LIKE', 'COMMENT', 'GIFT', 'FOLLOW', 'SHARE'],
      unsupportedEvents: ['VOTE (emulado via comentários)'],
      recentErrors: this.recentErrors
    };
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatusChange(listener: (status: ProviderStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatusChanged(): void {
    const status = this.getStatus();
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch (err) {
        console.error('[TikTok LIVE] Erro no ouvinte de status:', err);
      }
    }
  }

  private emitNormalized(event: NormalizedLiveEvent): void {
    this.lastEventTime = new Date(event.timestamp).toLocaleTimeString('pt-BR');
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err: any) {
        this.addError(`Erro no ouvinte de evento: ${err?.message}`);
      }
    }
  }

  private addError(msg: string): void {
    this.recentErrors.unshift(`${new Date().toLocaleTimeString('pt-BR')}: ${msg}`);
    if (this.recentErrors.length > 10) this.recentErrors.pop();
  }
}
