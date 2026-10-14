import React from 'react';
import { GameStateSnapshot, CommandProcessResult } from '@zombie-live/shared';
import { Heart, Skull, Trophy, Flame, Shield, Users, Radio, ThumbsUp } from 'lucide-react';

interface DashboardTabProps {
  snapshot: GameStateSnapshot | null;
  recentCommands: CommandProcessResult[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ snapshot, recentCommands }) => {
  if (!snapshot) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados do jogo...</div>;
  }

  const { survivor, wave, collectiveGoal } = snapshot;

  return (
    <div>
      {/* Grid de Métricas Principais */}
      <div className="metrics-grid">
        <div className="card">
          <div className="card-title">
            <span>Onda Atual</span>
            <Radio size={16} color="var(--accent-blue)" />
          </div>
          <div className="card-value" style={{ color: 'var(--accent-blue)' }}>
            Onda {wave.currentWave}
          </div>
          <div className="card-subtitle">
            Tempo restante: {Math.floor(wave.timeRemainingSeconds)}s | Inimigos: {snapshot.enemies.length}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Vida do Sobrevivente</span>
            <Heart size={16} color="var(--accent-green)" />
          </div>
          <div className="card-value" style={{ color: survivor.hp < 30 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {Math.round(survivor.hp)} <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>/ {survivor.maxHp} HP</span>
          </div>
          <div className="card-subtitle">
            Nível {survivor.level} ({survivor.xp} / {survivor.xpNeeded} XP)
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Zumbis Derrotados</span>
            <Skull size={16} color="var(--accent-red)" />
          </div>
          <div className="card-value" style={{ color: 'var(--accent-red)' }}>
            {snapshot.kills}
          </div>
          <div className="card-subtitle">
            Total nesta onda: {wave.totalKillsInWave}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Pontuação Total</span>
            <Trophy size={16} color="var(--accent-yellow)" />
          </div>
          <div className="card-value" style={{ color: 'var(--accent-yellow)' }}>
            {snapshot.score.toLocaleString('pt-BR')}
          </div>
          <div className="card-subtitle">
            Duração da partida: {snapshot.matchDurationSeconds}s
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Meta de Curtidas</span>
            <ThumbsUp size={16} color="var(--accent-yellow)" />
          </div>
          <div className="card-value" style={{ color: 'var(--accent-yellow)' }}>
            {collectiveGoal.current} <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>/ {collectiveGoal.target}</span>
          </div>
          <div className="card-subtitle">
            Progresso coletivo: {collectiveGoal.progressPercent}%
          </div>
        </div>
      </div>

      {/* Grid com Status do Herói & Feed de Atividades */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Atributos do Sobrevivente */}
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--accent-blue)" /> Status do Sobrevivente
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Dano por Ataque</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{survivor.damage}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Velocidade de Movimento</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{survivor.speed} px/s</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Cadência de Ataque</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{survivor.attackRate} /s</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Armadura (Redução)</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{Math.round(survivor.armor * 100)}%</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Escudo Ativo</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: survivor.shieldActive ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                {survivor.shieldActive ? 'PROTEGIDO (80%)' : 'Inativo'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Alcance do Radar</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{survivor.attackRange} px</div>
            </div>
          </div>
        </div>

        {/* Feed de Comandos e Eventos Recentes */}
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--accent-purple)" /> Últimos Comandos da Audiência
          </h3>
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentCommands.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                Nenhum comando processado ainda. Use a aba "Simulador" para enviar comandos de teste!
              </div>
            ) : (
              recentCommands.slice(0, 8).map(cmd => (
                <div
                  key={cmd.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderLeft: `3px solid ${cmd.success ? 'var(--accent-green)' : 'var(--accent-red)'}`
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--accent-blue)' }}>
                      @{cmd.username}:
                    </span>{' '}
                    <span style={{ fontSize: '13px' }}>"{cmd.rawComment}"</span>
                  </div>
                  <div>
                    {cmd.success ? (
                      <span className="badge badge-green" style={{ fontSize: '10px' }}>ACEITO ({cmd.commandType})</span>
                    ) : (
                      <span className="badge badge-red" style={{ fontSize: '10px' }}>{cmd.reason || 'REJEITADO'}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
