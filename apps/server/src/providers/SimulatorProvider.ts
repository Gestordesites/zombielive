import { LiveProviderType, NormalizedLiveEvent, LiveEventType } from '@zombie-live/shared';
import { ILiveEventProvider, ProviderStatus, EventListener } from './ILiveEventProvider.js';

export class SimulatorProvider implements ILiveEventProvider {
  readonly type: LiveProviderType = 'SIMULATOR';
  private listeners: Set<EventListener> = new Set();
  private isConnected: boolean = true;
  private lastEventTime?: string;
  private recentErrors: string[] = [];

  async connect(): Promise<void> {
    this.isConnected = true;
    console.log('[SIMULATOR] Provedor de Simulação ativado e pronto.');
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  getStatus(): ProviderStatus {
    return {
      type: this.type,
      connected: this.isConnected,
      channelName: 'Ambiente de Simulação Local',
      lastEventTime: this.lastEventTime,
      supportedEvents: ['LIKE', 'COMMENT', 'FOLLOW', 'GIFT', 'VOTE'],
      unsupportedEvents: [],
      recentErrors: this.recentErrors
    };
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitSimulatedEvent(partialEvent: Partial<NormalizedLiveEvent>): void {
    if (!this.isConnected) return;

    const eventType: LiveEventType = partialEvent.type || 'COMMENT';
    const timestamp = Date.now();
    this.lastEventTime = new Date(timestamp).toLocaleTimeString('pt-BR');

    const event: NormalizedLiveEvent = {
      id: partialEvent.id || 'sim_' + Math.random().toString(36).substring(2, 9),
      type: eventType,
      timestamp,
      user: {
        id: partialEvent.user?.id || 'sim_user_' + Math.floor(Math.random() * 1000),
        username: partialEvent.user?.username || 'Espectador_' + Math.floor(Math.random() * 999),
        nickname: partialEvent.user?.nickname,
        avatarUrl: partialEvent.user?.avatarUrl
      },
      data: partialEvent.data || {}
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err: any) {
        this.recentErrors.unshift(err.message || 'Erro ao processar evento simulado');
        if (this.recentErrors.length > 10) this.recentErrors.pop();
      }
    }
  }
}
