import React, { useEffect, useState } from 'react';
import {
  GameStateSnapshot,
  SOCKET_EVENTS,
  GameSettings,
  CommandProcessResult,
  LiveProviderType
} from '@zombie-live/shared';
import { api } from './services/api.js';
import { Header } from './components/Header.js';
import { DashboardTab } from './components/DashboardTab.js';
import { MatchControlTab } from './components/MatchControlTab.js';
import { SimulatorTab } from './components/SimulatorTab.js';
import { SettingsTab } from './components/SettingsTab.js';
import { HistoryTab } from './components/HistoryTab.js';
import { DiagnosticsTab } from './components/DiagnosticsTab.js';
import { LoginModal } from './components/LoginModal.js';
import './styles/admin.css';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!api.getToken());
  const [currentUser, setCurrentUser] = useState<string>('admin');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const [snapshot, setSnapshot] = useState<GameStateSnapshot | null>(null);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [recentCommands, setRecentCommands] = useState<CommandProcessResult[]>([]);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  // Verificação inicial de autenticação
  useEffect(() => {
    if (isAuthenticated) {
      api.getMe()
        .then(res => setCurrentUser(res.user.username))
        .catch(() => setIsAuthenticated(false));
    }

    const handleUnauthorized = () => setIsAuthenticated(false);
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, [isAuthenticated]);

  // Carregamento de dados e conexão Socket.IO
  useEffect(() => {
    if (!isAuthenticated) return;

    // Busca configurações
    api.getSettings().then(setSettings).catch(console.error);
    api.getRecentCommands(20).then(setRecentCommands).catch(console.error);

    const socket = api.getSocket();

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on(SOCKET_EVENTS.GAME_STATE_SNAPSHOT, (snap: GameStateSnapshot) => {
      setSnapshot(snap);
    });

    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATED, (snap: GameStateSnapshot) => {
      setSnapshot(snap);
    });

    socket.on(SOCKET_EVENTS.PROVIDER_STATUS_CHANGED, (status: any) => {
      setProviderStatus(status);
    });

    socket.on(SOCKET_EVENTS.COMMAND_PROCESSED, (cmd: CommandProcessResult) => {
      setRecentCommands(prev => [cmd, ...prev.slice(0, 30)]);
    });

    return () => {
      socket.off(SOCKET_EVENTS.GAME_STATE_SNAPSHOT);
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATED);
      socket.off(SOCKET_EVENTS.PROVIDER_STATUS_CHANGED);
      socket.off(SOCKET_EVENTS.COMMAND_PROCESSED);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    api.setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <div className="admin-layout">
      {!isAuthenticated && (
        <LoginModal
          onSuccess={username => {
            setCurrentUser(username);
            setIsAuthenticated(true);
          }}
        />
      )}

      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        matchStatus={snapshot?.status || 'IDLE'}
        providerType={providerStatus?.type || snapshot?.providerType || 'SIMULATOR'}
        socketConnected={socketConnected}
        username={currentUser}
        onLogout={handleLogout}
      />

      <main className="admin-content">
        {currentTab === 'dashboard' && (
          <DashboardTab snapshot={snapshot} recentCommands={recentCommands} />
        )}

        {currentTab === 'controls' && settings && (
          <MatchControlTab
            snapshot={snapshot}
            settings={settings}
            onSettingsUpdate={setSettings}
          />
        )}

        {currentTab === 'simulator' && <SimulatorTab />}

        {currentTab === 'settings' && settings && (
          <SettingsTab
            settings={settings}
            providerStatus={providerStatus}
            onSettingsUpdate={setSettings}
            onProviderChange={() => {
              api.getDiagnostics().then(d => setProviderStatus(d.providerStatus));
            }}
          />
        )}

        {currentTab === 'history' && <HistoryTab />}

        {currentTab === 'diagnostics' && <DiagnosticsTab />}
      </main>
    </div>
  );
};
