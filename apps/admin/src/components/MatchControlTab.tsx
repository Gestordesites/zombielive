import React, { useState } from 'react';
import { GameStateSnapshot, SkillType, GameSettings } from '@zombie-live/shared';
import { Play, Pause, RotateCcw, Square, Heart, Shield, Sparkles, Flame, Snowflake, Bomb } from 'lucide-react';
import { api } from '../services/api.js';

interface MatchControlTabProps {
  snapshot: GameStateSnapshot | null;
  settings: GameSettings;
  onSettingsUpdate: (newSettings: GameSettings) => void;
}

export const MatchControlTab: React.FC<MatchControlTabProps> = ({ snapshot, settings, onSettingsUpdate }) => {
  const [waveSecs, setWaveSecs] = useState(settings.waveDurationSeconds);
  const [maxEnemies, setMaxEnemies] = useState(settings.maxEnemiesAlive);
  const [bossInterval, setBossInterval] = useState(settings.bossWaveInterval);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const status = snapshot?.status || 'IDLE';

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'stop' | 'restart') => {
    try {
      await api.controlMatch(action);
    } catch (err: any) {
      alert(`Erro ao executar ação: ${err.message}`);
    }
  };

  const handleTriggerSkill = (skill: SkillType) => {
    api.triggerSkill(skill);
  };

  const handleSaveDifficulty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings({
        waveDurationSeconds: Number(waveSecs),
        maxEnemiesAlive: Number(maxEnemies),
        bossWaveInterval: Number(bossInterval)
      });
      onSettingsUpdate(updated);
      setMessage('Dificuldade atualizada com sucesso!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`Falha ao salvar dificuldade: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Controles Principais da Partida */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Controle da Partida</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {status === 'IDLE' || status === 'GAME_OVER' || status === 'VICTORY' ? (
            <button className="btn btn-success" onClick={() => handleAction('start')}>
              <Play size={18} /> Iniciar Partida
            </button>
          ) : null}

          {status === 'PLAYING' || status === 'BOSS_FIGHT' ? (
            <button className="btn btn-warning" onClick={() => handleAction('pause')}>
              <Pause size={18} /> Pausar Partida
            </button>
          ) : null}

          {status === 'PAUSED' ? (
            <button className="btn btn-success" onClick={() => handleAction('resume')}>
              <Play size={18} /> Retomar Partida
            </button>
          ) : null}

          {status !== 'IDLE' ? (
            <button className="btn btn-danger" onClick={() => handleAction('stop')}>
              <Square size={18} /> Encerrar Partida
            </button>
          ) : null}

          <button className="btn btn-secondary" onClick={() => handleAction('restart')}>
            <RotateCcw size={18} /> Reiniciar do Zero
          </button>
        </div>
      </div>

      {/* Disparo Manual de Habilidades */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Ativação Manual de Habilidades Especiais</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
          Permite que o administrador teste ou auxilie o sobrevivente acionando habilidades diretamente do painel:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => handleTriggerSkill('CURA')}>
            <Heart size={16} color="var(--accent-green)" /> CURA (+50 HP)
          </button>
          <button className="btn btn-secondary" onClick={() => handleTriggerSkill('ESCUDO')}>
            <Shield size={16} color="var(--accent-blue)" /> ESCUDO (80% Def)
          </button>
          <button className="btn btn-secondary" onClick={() => handleTriggerSkill('ATAQUE')}>
            <Sparkles size={16} color="var(--accent-yellow)" /> ATAQUE (Área 360°)
          </button>
          <button className="btn btn-secondary" onClick={() => handleTriggerSkill('FOGO')}>
            <Flame size={16} color="var(--accent-red)" /> FOGO (Solo Ardente)
          </button>
          <button className="btn btn-secondary" onClick={() => handleTriggerSkill('CONGELAMENTO')}>
            <Snowflake size={16} color="var(--accent-blue)" /> CONGELAMENTO (75%)
          </button>
          <button className="btn btn-secondary" onClick={() => handleTriggerSkill('EXPLOSAO')}>
            <Bomb size={16} color="var(--accent-red)" /> SUPERNOVA (Bomba)
          </button>
        </div>
      </div>

      {/* Ajuste Dinâmico de Dificuldade */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Ajuste de Ondas & Dificuldade</h3>
        {message && (
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--accent-green)', padding: '10px', borderRadius: '8px', marginBottom: '16px', color: '#4ade80' }}>
            {message}
          </div>
        )}
        <form onSubmit={handleSaveDifficulty} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Duração de Cada Onda (segundos)</label>
            <input
              type="number"
              min={10}
              max={180}
              className="form-input"
              value={waveSecs}
              onChange={e => setWaveSecs(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Limite Máximo de Inimigos Simultâneos</label>
            <input
              type="number"
              min={15}
              max={150}
              className="form-input"
              value={maxEnemies}
              onChange={e => setMaxEnemies(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Intervalo de Onda para Surgimento de Chefe</label>
            <input
              type="number"
              min={1}
              max={20}
              className="form-input"
              value={bossInterval}
              onChange={e => setBossInterval(Number(e.target.value))}
            />
            <small style={{ color: 'var(--text-muted)' }}>Padrão: A cada 5 ondas.</small>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Aplicar Alterações na Partida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
