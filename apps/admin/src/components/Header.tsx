import React from 'react';
import {
  Gamepad2,
  Tv,
  Settings,
  Activity,
  History,
  FlaskConical,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { MatchStatus, LiveProviderType } from '@zombie-live/shared';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  matchStatus: MatchStatus;
  providerType: LiveProviderType;
  socketConnected: boolean;
  username: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  matchStatus,
  providerType,
  socketConnected,
  username,
  onLogout
}) => {
  const getStatusBadge = () => {
    switch (matchStatus) {
      case 'PLAYING':
        return <span className="badge badge-green">● EM ANDAMENTO</span>;
      case 'BOSS_FIGHT':
        return <span className="badge badge-red">⚠️ LUTA CONTRA CHEFE</span>;
      case 'PAUSED':
        return <span className="badge badge-yellow">⏸️ PAUSADO</span>;
      case 'COUNTDOWN':
        return <span className="badge badge-blue">⏱️ CONTAGEM</span>;
      case 'VICTORY':
        return <span className="badge badge-green">🏆 VITÓRIA</span>;
      case 'GAME_OVER':
        return <span className="badge badge-red">💀 DERROTA</span>;
      default:
        return <span className="badge badge-gray">○ AGUARDANDO</span>;
    }
  };

  const getProviderBadge = () => {
    if (providerType === 'CONNECTED') {
      return <span className="badge badge-red">🔴 TIKTOK CONECTADO</span>;
    } else if (providerType === 'DISCONNECTED') {
      return <span className="badge badge-gray">⚪ DESCONECTADO</span>;
    } else {
      return <span className="badge badge-green">🎮 MODO SIMULADOR</span>;
    }
  };

  return (
    <header className="admin-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="brand-title">
          <Gamepad2 size={24} color="#38bdf8" />
          <span>ZOMBIE LIVE</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {getStatusBadge()}
          {getProviderBadge()}
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <Activity size={16} /> Painel
        </button>
        <button
          className={`nav-btn ${currentTab === 'controls' ? 'active' : ''}`}
          onClick={() => onTabChange('controls')}
        >
          <Gamepad2 size={16} /> Partida & Habilidades
        </button>
        <button
          className={`nav-btn ${currentTab === 'simulator' ? 'active' : ''}`}
          onClick={() => onTabChange('simulator')}
        >
          <FlaskConical size={16} /> Simulador
        </button>
        <button
          className={`nav-btn ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange('settings')}
        >
          <Settings size={16} /> Configurações & TikTok
        </button>
        <button
          className={`nav-btn ${currentTab === 'history' ? 'active' : ''}`}
          onClick={() => onTabChange('history')}
        >
          <History size={16} /> Histórico
        </button>
        <button
          className={`nav-btn ${currentTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => onTabChange('diagnostics')}
        >
          <Tv size={16} /> Diagnóstico
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '13px' }}
          title="Abrir a tela pública do jogo em nova janela (compatível com OBS)"
        >
          <ExternalLink size={14} /> Abrir Jogo / OBS
        </a>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {username}
        </div>

        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{ padding: '6px 10px' }}
          title="Sair do painel"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
};
