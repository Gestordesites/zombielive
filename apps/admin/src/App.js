import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { SOCKET_EVENTS } from '@zombie-live/shared';
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
export const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!api.getToken());
    const [currentUser, setCurrentUser] = useState('admin');
    const [currentTab, setCurrentTab] = useState('dashboard');
    const [snapshot, setSnapshot] = useState(null);
    const [settings, setSettings] = useState(null);
    const [recentCommands, setRecentCommands] = useState([]);
    const [providerStatus, setProviderStatus] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
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
        if (!isAuthenticated)
            return;
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
        socket.on(SOCKET_EVENTS.GAME_STATE_SNAPSHOT, (snap) => {
            setSnapshot(snap);
        });
        socket.on(SOCKET_EVENTS.GAME_STATE_UPDATED, (snap) => {
            setSnapshot(snap);
        });
        socket.on(SOCKET_EVENTS.PROVIDER_STATUS_CHANGED, (status) => {
            setProviderStatus(status);
        });
        socket.on(SOCKET_EVENTS.COMMAND_PROCESSED, (cmd) => {
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
    return (_jsxs("div", { className: "admin-layout", children: [!isAuthenticated && (_jsx(LoginModal, { onSuccess: username => {
                    setCurrentUser(username);
                    setIsAuthenticated(true);
                } })), _jsx(Header, { currentTab: currentTab, onTabChange: setCurrentTab, matchStatus: snapshot?.status || 'IDLE', providerType: providerStatus?.type || snapshot?.providerType || 'SIMULATOR', socketConnected: socketConnected, username: currentUser, onLogout: handleLogout }), _jsxs("main", { className: "admin-content", children: [currentTab === 'dashboard' && (_jsx(DashboardTab, { snapshot: snapshot, recentCommands: recentCommands })), currentTab === 'controls' && settings && (_jsx(MatchControlTab, { snapshot: snapshot, settings: settings, onSettingsUpdate: setSettings })), currentTab === 'simulator' && _jsx(SimulatorTab, {}), currentTab === 'settings' && settings && (_jsx(SettingsTab, { settings: settings, providerStatus: providerStatus, onSettingsUpdate: setSettings, onProviderChange: () => {
                            api.getDiagnostics().then(d => setProviderStatus(d.providerStatus));
                        } })), currentTab === 'history' && _jsx(HistoryTab, {}), currentTab === 'diagnostics' && _jsx(DiagnosticsTab, {})] })] }));
};
