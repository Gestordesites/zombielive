import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import {
  SOCKET_EVENTS,
  LiveProviderType,
  NormalizedLiveEvent,
  DiagnosticInfo,
  SkillType
} from '@zombie-live/shared';
import { config } from './config.js';
import { IRepository, InMemoryRepository, PostgresRepository } from './storage/Repository.js';
import { AuthService, AuthenticatedRequest } from './auth/authService.js';
import { GameEngine } from './engine/GameEngine.js';
import { CommandProcessor } from './engine/CommandProcessor.js';
import { ILiveEventProvider } from './providers/ILiveEventProvider.js';
import { SimulatorProvider } from './providers/SimulatorProvider.js';
import { DisconnectedProvider } from './providers/DisconnectedProvider.js';
import { TikTokProvider } from './providers/TikTokProvider.js';

export class ZombieLiveServer {
  private app: express.Express;
  private httpServer: http.Server;
  private io: SocketIOServer;

  private repository: IRepository;
  private authService: AuthService;
  private gameEngine: GameEngine;
  private commandProcessor: CommandProcessor;
  private currentProvider: ILiveEventProvider;
  private providerUnsubscribe: (() => void) | null = null;
  private providerStatusUnsubscribe: (() => void) | null = null;

  private startTime: number = Date.now();
  private eventCounters = {
    likes: 0,
    comments: 0,
    follows: 0,
    gifts: 0,
    votes: 0
  };
  private commandsAccepted: number = 0;
  private commandsRejected: number = 0;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Repositório (PostgreSQL se configurado, caso contrário memória volátil)
    if (config.databaseUrl) {
      console.log('[DATABASE] Conectando ao PostgreSQL...');
      this.repository = new PostgresRepository(config.databaseUrl);
    } else {
      console.log('[DATABASE] Utilizando Armazenamento em Memória (Sem dependência externa).');
      this.repository = new InMemoryRepository();
    }

    this.authService = new AuthService(this.repository);
    this.gameEngine = new GameEngine();
    this.commandProcessor = new CommandProcessor(
      config.commandCooldownMs,
      config.commandRateLimitGlobalPerSec
    );

    // Provedor inicial
    if (config.liveProvider === 'CONNECTED' && config.tiktokUsername) {
      this.currentProvider = new TikTokProvider(
        config.tiktokUsername,
        config.tiktokSessionId,
        config.tiktokReconnectInterval
      );
    } else if (config.liveProvider === 'DISCONNECTED') {
      this.currentProvider = new DisconnectedProvider();
    } else {
      this.currentProvider = new SimulatorProvider();
    }
  }

  async init(): Promise<void> {
    await this.repository.init();
    await this.authService.initializeDefaultAdmin();

    const initialSettings = await this.repository.getSettings();
    this.gameEngine.updateSettings(initialSettings);
    this.commandProcessor.updateLimits(
      initialSettings.commandCooldownPerUserMs,
      initialSettings.commandGlobalRateLimitPerSec
    );

    // Se houver configuração persistida de provedor, aplica
    if (initialSettings.liveProvider) {
      const targetUser = initialSettings.tiktokUsername || config.tiktokUsername;
      const targetSession = initialSettings.tiktokSessionId || config.tiktokSessionId;
      if (initialSettings.liveProvider === 'CONNECTED' && targetUser) {
        this.currentProvider = new TikTokProvider(
          targetUser,
          targetSession,
          config.tiktokReconnectInterval
        );
      } else if (initialSettings.liveProvider === 'DISCONNECTED') {
        this.currentProvider = new DisconnectedProvider();
      } else {
        this.currentProvider = new SimulatorProvider();
      }
    }

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupGameEngineEvents();
    this.setupSockets();
    await this.connectCurrentProvider();
  }

  private setupMiddlewares(): void {
    this.app.use(cors({ origin: '*' }));
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    const authMid = this.authService.middleware();

    // Healthcheck
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'OK', uptime: Math.floor((Date.now() - this.startTime) / 1000) });
    });

    // 1. Autenticação Administrativa
    this.app.post('/api/auth/login', async (req: Request, res: Response) => {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        return;
      }
      const result = await this.authService.login(username, password);
      if (!result) {
        res.status(401).json({ error: 'Credenciais inválidas.' });
        return;
      }
      res.json(result);
    });

    this.app.get('/api/auth/me', authMid, (req: AuthenticatedRequest, res: Response) => {
      res.json({ user: req.user });
    });

    // 2. Estado e Controle de Partida
    this.app.get('/api/match/status', (_req, res) => {
      res.json(this.gameEngine.getSnapshot());
    });

    this.app.post('/api/match/control', authMid, (req: Request, res: Response) => {
      const { action } = req.body;
      switch (action) {
        case 'start':
          this.gameEngine.startMatch();
          break;
        case 'pause':
          this.gameEngine.pauseMatch();
          break;
        case 'resume':
          this.gameEngine.resumeMatch();
          break;
        case 'stop':
          this.gameEngine.stopMatch('ABORTED');
          break;
        case 'restart':
          this.gameEngine.restartMatch();
          break;
        default:
          res.status(400).json({ error: 'Ação inválida.' });
          return;
      }
      res.json({ success: true, status: this.gameEngine.getStatus() });
    });

    // 3. Histórico de Partidas
    this.app.get('/api/match/history', authMid, async (req: Request, res: Response) => {
      const limit = parseInt(req.query.limit as string) || 20;
      const list = await this.repository.listMatches(limit);
      res.json(list);
    });

    // 4. Configurações
    this.app.get('/api/settings', async (_req, res) => {
      const settings = await this.repository.getSettings();
      res.json(settings);
    });

    this.app.post('/api/settings', authMid, async (req: Request, res: Response) => {
      const updated = await this.repository.updateSettings(req.body);
      this.gameEngine.updateSettings(updated);
      this.commandProcessor.updateLimits(
        updated.commandCooldownPerUserMs,
        updated.commandGlobalRateLimitPerSec
      );
      this.io.emit(SOCKET_EVENTS.NOTIFICATION, {
        id: 'set_' + Date.now(),
        type: 'SYSTEM',
        message: 'Configurações de jogo atualizadas.',
        timestamp: Date.now()
      });
      res.json(updated);
    });

    // 5. Diagnósticos
    this.app.get('/api/diagnostics', authMid, (_req, res) => {
      const diag: DiagnosticInfo = {
        serverStatus: 'UP',
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        activeSockets: this.io.engine.clientsCount,
        matchStatus: this.gameEngine.getStatus(),
        providerStatus: this.currentProvider.getStatus(),
        eventCounters: { ...this.eventCounters },
        commandsAccepted: this.commandsAccepted,
        commandsRejected: this.commandsRejected
      };
      res.json(diag);
    });

    // 6. Provedor de Eventos
    this.app.post('/api/provider', authMid, async (req: Request, res: Response) => {
      const { provider, username, sessionId } = req.body;
      try {
        await this.switchProvider(provider, username, sessionId);
        await this.repository.updateSettings({
          liveProvider: provider,
          tiktokUsername: username,
          tiktokSessionId: sessionId
        });
        res.json({ success: true, provider: this.currentProvider.getStatus() });
      } catch (err: any) {
        res.status(400).json({ error: err.message || 'Falha ao alterar provedor' });
      }
    });

    // 7. Injeção de Eventos Simulados
    this.app.post('/api/simulator/event', authMid, (req: Request, res: Response) => {
      const { type, user, data } = req.body;
      const event: Partial<NormalizedLiveEvent> = {
        type: type || 'COMMENT',
        user: user || { id: 'sim_admin', username: 'Administrador' },
        data: data || {}
      };

      if (this.currentProvider.emitSimulatedEvent) {
        this.currentProvider.emitSimulatedEvent(event);
        res.json({ success: true, message: 'Evento simulado enviado.' });
      } else {
        // Se o provedor atual não tiver emitSimulatedEvent, executa diretamente
        this.handleNormalizedEvent({
          id: 'manual_' + Date.now(),
          type: event.type!,
          timestamp: Date.now(),
          user: event.user as any,
          data: event.data as any
        });
        res.json({ success: true, message: 'Evento processado diretamente.' });
      }
    });

    // 8. Logs Recentes de Comandos
    this.app.get('/api/commands/recent', authMid, async (req: Request, res: Response) => {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await this.repository.getRecentCommands(limit);
      res.json(logs);
    });

    // 9. Servir arquivos estáticos de produção (/live, / e /admin)
    const gameDistPaths = [
      path.resolve(process.cwd(), 'apps/game/dist'),
      path.resolve(process.cwd(), '../game/dist'),
      path.resolve(process.cwd(), 'game/dist')
    ];
    const gameDist = gameDistPaths.find(p => fs.existsSync(p));

    const adminDistPaths = [
      path.resolve(process.cwd(), 'apps/admin/dist'),
      path.resolve(process.cwd(), '../admin/dist'),
      path.resolve(process.cwd(), 'admin/dist')
    ];
    const adminDist = adminDistPaths.find(p => fs.existsSync(p));

    // 1. Painel Administrativo em /admin
    if (adminDist) {
      this.app.use('/admin', express.static(adminDist));
      this.app.get(['/admin', '/admin/*'], (_req, res) => res.sendFile(path.join(adminDist, 'index.html')));
    }

    // 2. Jogo Phaser em /live, /game e na raiz /
    if (gameDist) {
      this.app.use('/live', express.static(gameDist));
      this.app.use('/game', express.static(gameDist));
      this.app.use(express.static(gameDist));
      this.app.get(['/live', '/live/*'], (_req, res) => res.sendFile(path.join(gameDist, 'index.html')));
      this.app.get(['/game', '/game/*'], (_req, res) => res.sendFile(path.join(gameDist, 'index.html')));
      this.app.get('/', (_req, res) => res.sendFile(path.join(gameDist, 'index.html')));
    }
  }

  // ==========================================
  // EVENTOS DO GAME ENGINE & SOCKETS
  // ==========================================

  private setupGameEngineEvents(): void {
    // Repassa todos os eventos do motor para os WebSockets conectados
    const events = [
      SOCKET_EVENTS.GAME_STATE_SNAPSHOT,
      SOCKET_EVENTS.GAME_STATE_UPDATED,
      SOCKET_EVENTS.ENEMY_SPAWNED,
      SOCKET_EVENTS.ENEMY_DEFEATED,
      SOCKET_EVENTS.PLAYER_DAMAGED,
      SOCKET_EVENTS.PLAYER_HEALED,
      SOCKET_EVENTS.ABILITY_ACTIVATED,
      SOCKET_EVENTS.LEVEL_UP,
      SOCKET_EVENTS.VOTE_STARTED,
      SOCKET_EVENTS.VOTE_UPDATED,
      SOCKET_EVENTS.VOTE_FINISHED,
      SOCKET_EVENTS.BOSS_SPAWNED,
      SOCKET_EVENTS.BOSS_DEFEATED,
      SOCKET_EVENTS.FOLLOWER_ANNOUNCEMENT,
      SOCKET_EVENTS.COLLECTIVE_GOAL_PROGRESS,
      SOCKET_EVENTS.COLLECTIVE_GOAL_ACHIEVED,
      SOCKET_EVENTS.NOTIFICATION,
      SOCKET_EVENTS.VISUAL_EFFECT
    ];

    for (const evt of events) {
      this.gameEngine.on(evt, payload => {
        this.io.emit(evt, payload);
      });
    }

    // Ao finalizar partida, salva histórico
    this.gameEngine.on(SOCKET_EVENTS.MATCH_FINISHED, async payload => {
      this.io.emit(SOCKET_EVENTS.MATCH_FINISHED, payload);
      const record = this.gameEngine.getMatchRecord(payload.result);
      record.providerType = this.currentProvider.type;
      await this.repository.saveMatch(record);
      console.log(`[MATCH] Partida salva com sucesso no histórico. Resultado: ${payload.result}`);
    });
  }

  private setupSockets(): void {
    this.io.on('connection', (socket: Socket) => {
      // Se motor estiver ocioso e autoStartMatches ativo, garante início automático
      if (this.gameEngine.getStatus() === 'IDLE' && this.gameEngine.getSettings().autoStartMatches) {
        this.gameEngine.ensureAutoStart();
      }

      // Envia snapshot completo imediatamente na conexão
      socket.emit(SOCKET_EVENTS.GAME_STATE_SNAPSHOT, this.gameEngine.getSnapshot());
      socket.emit(SOCKET_EVENTS.PROVIDER_STATUS_CHANGED, this.currentProvider.getStatus());

      // Comandos administrativos via WebSocket
      socket.on(SOCKET_EVENTS.ADMIN_START_MATCH, () => this.gameEngine.startMatch());
      socket.on(SOCKET_EVENTS.ADMIN_PAUSE_MATCH, () => this.gameEngine.pauseMatch());
      socket.on(SOCKET_EVENTS.ADMIN_RESUME_MATCH, () => this.gameEngine.resumeMatch());
      socket.on(SOCKET_EVENTS.ADMIN_STOP_MATCH, () => this.gameEngine.stopMatch('ABORTED'));
      socket.on(SOCKET_EVENTS.ADMIN_RESTART_MATCH, () => this.gameEngine.restartMatch());
      socket.on(SOCKET_EVENTS.ADMIN_TRIGGER_SKILL, (data: { skill: SkillType }) => {
        this.gameEngine.triggerSkill(data.skill, 'Painel Admin');
      });
      socket.on(SOCKET_EVENTS.ADMIN_SIMULATE_EVENT, (event: Partial<NormalizedLiveEvent>) => {
        if (this.currentProvider.emitSimulatedEvent) {
          this.currentProvider.emitSimulatedEvent(event);
        }
      });
    });
  }

  // ==========================================
  // GESTÃO DE PROVEDORES DE LIVE
  // ==========================================

  private async connectCurrentProvider(): Promise<void> {
    if (this.providerUnsubscribe) {
      this.providerUnsubscribe();
      this.providerUnsubscribe = null;
    }
    if (this.providerStatusUnsubscribe) {
      this.providerStatusUnsubscribe();
      this.providerStatusUnsubscribe = null;
    }

    this.providerUnsubscribe = this.currentProvider.subscribe(event => {
      this.handleNormalizedEvent(event);
    });

    if (this.currentProvider.onStatusChange) {
      this.providerStatusUnsubscribe = this.currentProvider.onStatusChange(status => {
        const engType = status.connected ? 'CONNECTED' : (status.type === 'CONNECTED' ? 'DISCONNECTED' : status.type);
        this.gameEngine.setProviderType(engType);
        this.io.emit(SOCKET_EVENTS.PROVIDER_STATUS_CHANGED, status);
      });
    }

    const initialStatus = this.currentProvider.getStatus();
    const initialEngType = initialStatus.connected ? 'CONNECTED' : (initialStatus.type === 'CONNECTED' ? 'DISCONNECTED' : initialStatus.type);
    this.gameEngine.setProviderType(initialEngType);

    try {
      await this.currentProvider.connect();
    } catch (err) {
      console.error('[PROVIDER] Erro ao conectar:', err);
    }

    const updatedStatus = this.currentProvider.getStatus();
    const updatedEngType = updatedStatus.connected ? 'CONNECTED' : (updatedStatus.type === 'CONNECTED' ? 'DISCONNECTED' : updatedStatus.type);
    this.gameEngine.setProviderType(updatedEngType);
    this.io.emit(SOCKET_EVENTS.PROVIDER_STATUS_CHANGED, updatedStatus);
  }

  async switchProvider(type: LiveProviderType, username?: string, sessionId?: string): Promise<void> {
    if (this.currentProvider) {
      await this.currentProvider.disconnect();
    }

    if (type === 'CONNECTED') {
      const targetUser = username || config.tiktokUsername;
      if (!targetUser) {
        throw new Error('Informe o nome de usuário do TikTok para conectar.');
      }
      this.currentProvider = new TikTokProvider(
        targetUser,
        sessionId || config.tiktokSessionId,
        config.tiktokReconnectInterval
      );
    } else if (type === 'DISCONNECTED') {
      this.currentProvider = new DisconnectedProvider();
    } else {
      this.currentProvider = new SimulatorProvider();
    }

    await this.connectCurrentProvider();
  }

  // ==========================================
  // PROCESSAMENTO DE EVENTOS NORMALIZADOS
  // ==========================================

  private handleNormalizedEvent(event: NormalizedLiveEvent): void {
    // 1. Atualiza contadores
    switch (event.type) {
      case 'LIKE': this.eventCounters.likes += (event.data.likeCount || 1); break;
      case 'COMMENT': this.eventCounters.comments++; break;
      case 'FOLLOW': this.eventCounters.follows++; break;
      case 'GIFT': this.eventCounters.gifts += (event.data.giftCount || 1); break;
      case 'VOTE': this.eventCounters.votes++; break;
    }

    // 2. Processa Comentários e Comandos
    if (event.type === 'COMMENT') {
      const comment = event.data.commentText || '';
      const snapshot = this.gameEngine.getSnapshot();
      const hasActiveVote = !!snapshot.activeVote?.active;

      const cmdResult = this.commandProcessor.processComment(
        event.user.username,
        comment,
        snapshot.status,
        hasActiveVote
      );

      if (cmdResult.success) {
        this.commandsAccepted++;
        if (cmdResult.commandType === 'VOTAR') {
          const optMatch = cmdResult.appliedAction?.match(/VOTO_OPCAO_(\d+)/);
          if (optMatch) {
            this.gameEngine.registerVote(event.user.username, parseInt(optMatch[1], 10));
          }
        } else if (cmdResult.commandType !== 'UNKNOWN') {
          this.gameEngine.triggerSkill(cmdResult.commandType as SkillType, `@${event.user.username}`);
        }
      } else {
        if (cmdResult.commandType !== 'UNKNOWN') {
          this.commandsRejected++;
        }
      }

      this.repository.logCommand(cmdResult);
      this.io.emit(SOCKET_EVENTS.COMMAND_PROCESSED, cmdResult);
    }

    // 3. Processa Voto direto (se suportado ou simulado)
    if (event.type === 'VOTE' && event.data.voteOption) {
      this.gameEngine.registerVote(event.user.username, event.data.voteOption);
    }

    // 4. Encaminha para o motor de jogo
    this.gameEngine.handleLiveEvent(event);
  }

  // ==========================================
  // INICIALIZAÇÃO DO SERVIDOR HTTP
  // ==========================================

  listen(port = config.port, host = config.host): Promise<void> {
    return new Promise(resolve => {
      this.httpServer.listen(port, host, () => {
        console.log(`=======================================================`);
        console.log(`  ZOMBIE LIVE SERVER INICIADO COM SUCESSO!            `);
        console.log(`  URL: http://${host}:${port}                         `);
        console.log(`  Provedor de Live Ativo: ${this.currentProvider.type}`);
        console.log(`=======================================================`);
        resolve();
      });
    });
  }

  close(): Promise<void> {
    return new Promise(resolve => {
      this.stopLoop();
      this.httpServer.close(() => resolve());
    });
  }

  private stopLoop(): void {
    this.gameEngine.stopMatch('ABORTED');
  }

  getGameEngine(): GameEngine {
    return this.gameEngine;
  }

  getRepository(): IRepository {
    return this.repository;
  }
}
