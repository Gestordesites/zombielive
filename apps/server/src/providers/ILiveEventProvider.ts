import { LiveProviderType, NormalizedLiveEvent } from '@zombie-live/shared';

export interface ProviderStatus {
  type: LiveProviderType;
  connected: boolean;
  channelName?: string;
  lastEventTime?: string;
  supportedEvents: string[];
  unsupportedEvents: string[];
  recentErrors: string[];
}

export type EventListener = (event: NormalizedLiveEvent) => void;

export interface ILiveEventProvider {
  readonly type: LiveProviderType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): ProviderStatus;
  subscribe(listener: EventListener): () => void;
  emitSimulatedEvent?(event: Partial<NormalizedLiveEvent>): void;
}
