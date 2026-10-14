import { GameCommandType, CommandProcessResult, MatchStatus } from '@zombie-live/shared';

export interface CommandRule {
  commandType: GameCommandType;
  patterns: RegExp[];
  cooldownMs: number;
}

export class CommandProcessor {
  private userLastCommandTime: Map<string, number> = new Map();
  private globalCommandTimestamps: number[] = [];

  constructor(
    private userCooldownMs: number = 2000,
    private maxGlobalPerSecond: number = 50
  ) {}

  updateLimits(userCooldownMs: number, maxGlobalPerSecond: number): void {
    this.userCooldownMs = userCooldownMs;
    this.maxGlobalPerSecond = maxGlobalPerSecond;
  }

  processComment(
    username: string,
    rawText: string,
    matchStatus: MatchStatus,
    activeVoteSession: boolean
  ): CommandProcessResult {
    const timestamp = Date.now();
    const id = 'cmd_' + timestamp + '_' + Math.random().toString(36).substring(2, 7);
    const text = (rawText || '').trim();

    // 1. Limpeza de logs antigos de rate limit global
    this.globalCommandTimestamps = this.globalCommandTimestamps.filter(t => timestamp - t < 1000);
    if (this.globalCommandTimestamps.length >= this.maxGlobalPerSecond) {
      return {
        id,
        username,
        rawComment: text,
        commandType: 'UNKNOWN',
        success: false,
        reason: 'Limite global de comandos por segundo atingido (Anti-Spam).',
        timestamp
      };
    }

    // 2. Cooldown por usuário
    const lastTime = this.userLastCommandTime.get(username) || 0;
    if (timestamp - lastTime < this.userCooldownMs) {
      const waitSeconds = ((this.userCooldownMs - (timestamp - lastTime)) / 1000).toFixed(1);
      return {
        id,
        username,
        rawComment: text,
        commandType: 'UNKNOWN',
        success: false,
        reason: `Aguarde ${waitSeconds}s antes de enviar outro comando.`,
        timestamp
      };
    }

    // 3. Normalização
    const normalized = text.toUpperCase().replace(/\s+/g, ' ');

    // 4. Reconhecimento de Votação
    const voteMatch = normalized.match(/^(?:VOTAR\s*|VOTO\s*|OPCAO\s*|OPÇÃO\s*)?([1-3])$/i);
    if (voteMatch) {
      const optionIndex = parseInt(voteMatch[1], 10);
      if (!activeVoteSession) {
        return {
          id,
          username,
          rawComment: text,
          commandType: 'VOTAR',
          success: false,
          reason: 'Não há nenhuma votação ativa no momento.',
          timestamp
        };
      }

      this.userLastCommandTime.set(username, timestamp);
      this.globalCommandTimestamps.push(timestamp);

      return {
        id,
        username,
        rawComment: text,
        commandType: 'VOTAR',
        success: true,
        appliedAction: `VOTO_OPCAO_${optionIndex}`,
        timestamp
      };
    }

    // 5. Validação de partida ativa para habilidades de combate
    if (matchStatus !== 'PLAYING' && matchStatus !== 'BOSS_FIGHT') {
      return {
        id,
        username,
        rawComment: text,
        commandType: 'UNKNOWN',
        success: false,
        reason: 'Comandos de combate só podem ser usados durante a partida em andamento.',
        timestamp
      };
    }

    // 6. Reconhecimento de Habilidades
    let matchedCommand: GameCommandType | null = null;

    if (/^(CURA|HEAL|CURAR|VIDA)$/i.test(normalized)) {
      matchedCommand = 'CURA';
    } else if (/^(ESCUDO|SHIELD|DEFESA|ESCUDAR)$/i.test(normalized)) {
      matchedCommand = 'ESCUDO';
    } else if (/^(ATAQUE|GOLPE|SLASH|ATACAR|ESPADA)$/i.test(normalized)) {
      matchedCommand = 'ATAQUE';
    } else if (/^(FOGO|FIRE|CHAMAS|QUEIMAR)$/i.test(normalized)) {
      matchedCommand = 'FOGO';
    } else if (/^(CONGELAMENTO|GELO|FREEZE|CONGELAR|SLOW)$/i.test(normalized)) {
      matchedCommand = 'CONGELAMENTO';
    } else if (/^(EXPLOSAO|EXPLOSÃO|BOMBA|BOMB|EXPLODIR|BOOM)$/i.test(normalized)) {
      matchedCommand = 'EXPLOSAO';
    }

    if (!matchedCommand) {
      return {
        id,
        username,
        rawComment: text,
        commandType: 'UNKNOWN',
        success: false,
        reason: 'Comentário comum ou comando desconhecido.',
        timestamp
      };
    }

    // Registra uso bem-sucedido
    this.userLastCommandTime.set(username, timestamp);
    this.globalCommandTimestamps.push(timestamp);

    return {
      id,
      username,
      rawComment: text,
      commandType: matchedCommand,
      success: true,
      appliedAction: `ATIVAR_${matchedCommand}`,
      timestamp
    };
  }
}
