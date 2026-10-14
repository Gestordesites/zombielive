import React, { useState } from 'react';
import { GameSettings, LiveProviderType } from '@zombie-live/shared';
import { Radio, ShieldAlert, CheckCircle2, XCircle, Save, ExternalLink } from 'lucide-react';
import { api } from '../services/api.js';

interface SettingsTabProps {
  settings: GameSettings;
  providerStatus: any;
  onSettingsUpdate: (newSettings: GameSettings) => void;
  onProviderChange: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  providerStatus,
  onSettingsUpdate,
  onProviderChange
}) => {
  const [providerType, setProviderType] = useState<LiveProviderType>(providerStatus?.type || 'SIMULATOR');
  const [tiktokUsername, setTiktokUsername] = useState(providerStatus?.channelName?.replace('@', '') || '');
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Formulário de Configurações
  const [formData, setFormData] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleConnectTikTok = async () => {
    if (!tiktokUsername.trim()) {
      alert('Por favor, informe o nome de usuário do TikTok (sem @).');
      return;
    }
    setConnecting(true);
    setConnectionError(null);
    try {
      await api.setProvider('CONNECTED', tiktokUsername.trim());
      onProviderChange();
    } catch (err: any) {
      setConnectionError(err.message || 'Erro ao conectar à live do TikTok.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectTikTok = async () => {
    setConnecting(true);
    try {
      await api.setProvider('SIMULATOR');
      onProviderChange();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateSettings(formData);
      onSettingsUpdate(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Erro ao salvar configurações: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Bloco de Integração TikTok LIVE */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={20} color="var(--accent-red)" /> Conector TikTok LIVE
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
          Conecte o Zombie Live à sua transmissão ativa do TikTok para receber comentários, curtidas, novos seguidores e presentes reais.
        </p>

        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
            <ShieldAlert size={18} /> Nota de Transparência e Segurança
          </div>
          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
            Esta integração utiliza a biblioteca aberta da comunidade (<code>tiktok-live-connector</code>) baseada no protocolo Webcast público.
            <strong> Nunca solicitamos sua senha, chave secreta ou cookies.</strong> Para que a conexão ocorra, sua live precisa estar <strong>AO VIVO</strong> no momento da conexão.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '280px' }}>
            <label className="form-label">Nome de Usuário TikTok (@usuario)</label>
            <input
              type="text"
              className="form-input"
              placeholder="ex: seucanal"
              value={tiktokUsername}
              onChange={e => setTiktokUsername(e.target.value)}
            />
          </div>

          {providerStatus?.connected && providerStatus?.type === 'CONNECTED' ? (
            <button className="btn btn-danger" onClick={handleDisconnectTikTok} disabled={connecting}>
              <XCircle size={16} /> Desconectar do TikTok
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleConnectTikTok} disabled={connecting}>
              <CheckCircle2 size={16} /> {connecting ? 'Conectando...' : 'Conectar à Live'}
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={async () => {
              await api.setProvider('SIMULATOR');
              onProviderChange();
            }}
          >
            Ativar Modo Simulador
          </button>
        </div>

        {connectionError && (
          <div style={{ marginTop: '14px', color: 'var(--accent-red)', fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>
            ⚠️ {connectionError}
          </div>
        )}

        {/* Status Atual do Provedor */}
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Status Atual do Conector</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
            <div><strong>Modo:</strong> {providerStatus?.type}</div>
            <div><strong>Conexão:</strong> {providerStatus?.connected ? '✅ Ativa' : '❌ Inativa'}</div>
            <div><strong>Canal:</strong> {providerStatus?.channelName || 'Nenhum'}</div>
            <div><strong>Último Evento:</strong> {providerStatus?.lastEventTime || 'Nenhum evento recente'}</div>
          </div>
        </div>
      </div>

      {/* Configurações Gerais do Jogo e Interações */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Regras de Interação & Anti-Spam</h3>
        {saveSuccess && (
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--accent-green)', padding: '10px', borderRadius: '8px', marginBottom: '16px', color: '#4ade80' }}>
            Configurações salvas e aplicadas com sucesso!
          </div>
        )}
        <form onSubmit={handleSaveSettings} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          <div className="form-group">
            <label className="form-label">Cooldown de Comandos por Usuário (ms)</label>
            <input
              type="number"
              className="form-input"
              value={formData.commandCooldownPerUserMs}
              onChange={e => setFormData({ ...formData, commandCooldownPerUserMs: Number(e.target.value) })}
            />
            <small style={{ color: 'var(--text-muted)' }}>Tempo mínimo que cada usuário deve aguardar entre comandos.</small>
          </div>

          <div className="form-group">
            <label className="form-label">Limite Global de Comandos por Segundo</label>
            <input
              type="number"
              className="form-input"
              value={formData.commandGlobalRateLimitPerSec}
              onChange={e => setFormData({ ...formData, commandGlobalRateLimitPerSec: Number(e.target.value) })}
            />
            <small style={{ color: 'var(--text-muted)' }}>Proteção contra enxurrada e travamento do servidor.</small>
          </div>

          <div className="form-group">
            <label className="form-label">Meta Coletiva Inicial de Curtidas</label>
            <input
              type="number"
              className="form-input"
              value={formData.collectiveGoalLikesTarget}
              onChange={e => setFormData({ ...formData, collectiveGoalLikesTarget: Number(e.target.value) })}
            />
            <small style={{ color: 'var(--text-muted)' }}>Quantidade de curtidas necessárias para ativar o super bônus coletivo.</small>
          </div>

          <div className="form-group">
            <label className="form-label">Mensagem de Boas-Vindas a Novos Seguidores</label>
            <input
              type="text"
              className="form-input"
              value={formData.welcomeFollowerText}
              onChange={e => setFormData({ ...formData, welcomeFollowerText: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Iniciar Partidas Automaticamente (Loop Contínuo 24/7)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <input
                type="checkbox"
                id="autoStartCheck"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={formData.autoStartMatches ?? true}
                onChange={e => setFormData({ ...formData, autoStartMatches: e.target.checked })}
              />
              <label htmlFor="autoStartCheck" style={{ fontSize: '13px', cursor: 'pointer', color: 'var(--text-main)' }}>
                {formData.autoStartMatches ? '✅ Ativado (Inicia e reinicia partidas sozinho)' : '❌ Desativado (Aguardar início manual)'}
              </label>
            </div>
            <small style={{ color: 'var(--text-muted)' }}>Mantém a live transmitindo continuamente sem intervenção manual.</small>
          </div>

          <div className="form-group">
            <label className="form-label">Tempo de Espera para Reinício Automático (segundos)</label>
            <input
              type="number"
              min={3}
              max={60}
              className="form-input"
              value={formData.autoRestartSeconds ?? 7}
              onChange={e => setFormData({ ...formData, autoRestartSeconds: Number(e.target.value) })}
            />
            <small style={{ color: 'var(--text-muted)' }}>Pausa na tela de vitória/derrota antes de reiniciar nova partida.</small>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Salvar Todas as Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
