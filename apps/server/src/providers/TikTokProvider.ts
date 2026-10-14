import { LiveProviderType, NormalizedLiveEvent } from '@zombie-live/shared';
import { ILiveEventProvider, ProviderStatus, EventListener } from './ILiveEventProvider.js';
// @ts-ignore - tiktok-live-connector é importado dinamicamente ou via CJS
import pkg from 'tiktok-live-connector';
const { WebcastPushConnection } = pkg as any;

export class TikTokProvider implements ILiveEventProvider {
  readonly type: LiveProviderType = 'CONNECTED';
  private listeners: Set<EventListener> = new Set();
  private connection: any = null;
  private isConnected: boolean = false;
  private channelName: string;
  private lastEventTime?: string;
  private recentErrors: string[] = [];
  private lastTotalLikes: number = 0;

  constructor(username: string) {
    this.channelName = username.trim().replace(/^@/, '');
  }

  async connect(): Promise<void> {
    if (!this.channelName) {
      throw new Error('Nome de usuário do TikTok não foi informado.');
    }

    try {
      this.connection = new WebcastPushConnection(this.channelName, {
        processInitialData: false,
        enableExtendedGiftInfo: true,
        requestPollingIntervalMs: 2000
      });

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
        // TikTok envia likeCount (incremental) e totalLikeCount (acumulado)
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
        // data.giftType === 1 geralmente representa presentes regulares
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
            giftName: data.giftName || 'Presente',
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

      this.connection.on('error', (err: any) => {
        const msg = `[TikTok LIVE] Erro de conexão: ${err?.message || err}`;
        console.error(msg);
        this.addError(msg);
      });

      this.connection.on('disconnected', () => {
        this.isConnected = false;
        console.warn(`[TikTok LIVE] Conexão com @${this.channelName} foi encerrada.`);
      });

      // Conecta à live do TikTok
      const state = await this.connection.connect();
      this.isConnected = true;
      console.log(`[TikTok LIVE] Conectado com sucesso à live de @${this.channelName} (Room ID: ${state?.roomId || 'N/A'})`);
    } catch (err: any) {
      this.isConnected = false;
      const msg = `Falha ao conectar à live do TikTok (@${this.channelName}): ${err?.message || 'Verifique se a live está online.'}`;
      this.addError(msg);
      throw new Error(msg);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.disconnect();
      } catch (e) {
        // ignora erro ao desconectar
      }
      this.connection = null;
    }
    this.isConnected = false;
  }

  getStatus(): ProviderStatus {
    return {
      type: this.type,
      connected: this.isConnected,
      channelName: this.channelName ? `@${this.channelName}` : undefined,
      lastEventTime: this.lastEventTime,
      supportedEvents: ['LIKE', 'COMMENT', 'GIFT', 'FOLLOW'],
      unsupportedEvents: ['VOTE (emulado via comentários)'],
      recentErrors: this.recentErrors
    };
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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
