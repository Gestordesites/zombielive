import { io, Socket } from 'socket.io-client';
import { GameStateSnapshot, SOCKET_EVENTS, VisualEffectEvent, GameAnnouncement, VoteSession, CollectiveGoal } from '@zombie-live/shared';

export class GameSocketClient {
  private socket: Socket;
  private onSnapshotCallback?: (snapshot: GameStateSnapshot) => void;
  private onVisualEffectCallback?: (effect: VisualEffectEvent) => void;
  private onAnnouncementCallback?: (announcement: GameAnnouncement) => void;
  private onVoteStartedCallback?: (vote: VoteSession) => void;
  private onVoteFinishedCallback?: (result: any) => void;
  private onConnectionChangeCallback?: (connected: boolean) => void;

  constructor() {
    // URL do servidor a partir de variável ou porta padrão 4000
    const serverUrl = (import.meta as any).env?.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:4000`;
    
    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('[GAME SOCKET] Conectado com sucesso ao servidor Zombie Live!');
      this.onConnectionChangeCallback?.(true);
    });

    this.socket.on('disconnect', () => {
      console.warn('[GAME SOCKET] Desconectado do servidor. Tentando reconexão...');
      this.onConnectionChangeCallback?.(false);
    });

    this.socket.on(SOCKET_EVENTS.GAME_STATE_SNAPSHOT, (snapshot: GameStateSnapshot) => {
      this.onSnapshotCallback?.(snapshot);
    });

    this.socket.on(SOCKET_EVENTS.GAME_STATE_UPDATED, (snapshot: GameStateSnapshot) => {
      this.onSnapshotCallback?.(snapshot);
    });

    this.socket.on(SOCKET_EVENTS.VISUAL_EFFECT, (effect: VisualEffectEvent) => {
      this.onVisualEffectCallback?.(effect);
    });

    this.socket.on(SOCKET_EVENTS.NOTIFICATION, (ann: GameAnnouncement) => {
      this.onAnnouncementCallback?.(ann);
    });

    this.socket.on(SOCKET_EVENTS.VOTE_STARTED, (vote: VoteSession) => {
      this.onVoteStartedCallback?.(vote);
    });

    this.socket.on(SOCKET_EVENTS.VOTE_FINISHED, (res: any) => {
      this.onVoteFinishedCallback?.(res);
    });
  }

  onSnapshot(cb: (snapshot: GameStateSnapshot) => void) { this.onSnapshotCallback = cb; }
  onVisualEffect(cb: (effect: VisualEffectEvent) => void) { this.onVisualEffectCallback = cb; }
  onAnnouncement(cb: (announcement: GameAnnouncement) => void) { this.onAnnouncementCallback = cb; }
  onVoteStarted(cb: (vote: VoteSession) => void) { this.onVoteStartedCallback = cb; }
  onVoteFinished(cb: (result: any) => void) { this.onVoteFinishedCallback = cb; }
  onConnectionChange(cb: (connected: boolean) => void) { this.onConnectionChangeCallback = cb; }
}
