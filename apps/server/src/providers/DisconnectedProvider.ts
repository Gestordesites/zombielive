import { LiveProviderType, NormalizedLiveEvent } from '@zombie-live/shared';
import { ILiveEventProvider, ProviderStatus, EventListener } from './ILiveEventProvider.js';

export class DisconnectedProvider implements ILiveEventProvider {
  readonly type: LiveProviderType = 'DISCONNECTED';

  async connect(): Promise<void> {
    // Modo desconectado não realiza conexões
  }

  async disconnect(): Promise<void> {
    // Nada a desconectar
  }

  getStatus(): ProviderStatus {
    return {
      type: this.type,
      connected: false,
      channelName: undefined,
      lastEventTime: undefined,
      supportedEvents: [],
      unsupportedEvents: ['LIKE', 'COMMENT', 'FOLLOW', 'GIFT', 'VOTE'],
      recentErrors: []
    };
  }

  subscribe(_listener: EventListener): () => void {
    return () => {};
  }
}
