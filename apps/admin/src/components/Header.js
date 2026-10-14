import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Gamepad2, Tv, Settings, Activity, History, FlaskConical, LogOut, ExternalLink } from 'lucide-react';
export const Header = ({ currentTab, onTabChange, matchStatus, providerType, socketConnected, username, onLogout }) => {
    const getStatusBadge = () => {
        switch (matchStatus) {
            case 'PLAYING':
                return _jsx("span", { className: "badge badge-green", children: "\u25CF EM ANDAMENTO" });
            case 'BOSS_FIGHT':
                return _jsx("span", { className: "badge badge-red", children: "\u26A0\uFE0F LUTA CONTRA CHEFE" });
            case 'PAUSED':
                return _jsx("span", { className: "badge badge-yellow", children: "\u23F8\uFE0F PAUSADO" });
            case 'COUNTDOWN':
                return _jsx("span", { className: "badge badge-blue", children: "\u23F1\uFE0F CONTAGEM" });
            case 'VICTORY':
                return _jsx("span", { className: "badge badge-green", children: "\uD83C\uDFC6 VIT\u00D3RIA" });
            case 'GAME_OVER':
                return _jsx("span", { className: "badge badge-red", children: "\uD83D\uDC80 DERROTA" });
            default:
                return _jsx("span", { className: "badge badge-gray", children: "\u25CB AGUARDANDO" });
        }
    };
    const getProviderBadge = () => {
        if (providerType === 'CONNECTED') {
            return _jsx("span", { className: "badge badge-red", children: "\uD83D\uDD34 TIKTOK CONECTADO" });
        }
        else if (providerType === 'DISCONNECTED') {
            return _jsx("span", { className: "badge badge-gray", children: "\u26AA DESCONECTADO" });
        }
        else {
            return _jsx("span", { className: "badge badge-green", children: "\uD83C\uDFAE MODO SIMULADOR" });
        }
    };
    return (_jsxs("header", { className: "admin-header", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '20px' }, children: [_jsxs("div", { className: "brand-title", children: [_jsx(Gamepad2, { size: 24, color: "#38bdf8" }), _jsx("span", { children: "ZOMBIE LIVE" })] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [getStatusBadge(), getProviderBadge()] })] }), _jsxs("nav", { className: "nav-tabs", children: [_jsxs("button", { className: `nav-btn ${currentTab === 'dashboard' ? 'active' : ''}`, onClick: () => onTabChange('dashboard'), children: [_jsx(Activity, { size: 16 }), " Painel"] }), _jsxs("button", { className: `nav-btn ${currentTab === 'controls' ? 'active' : ''}`, onClick: () => onTabChange('controls'), children: [_jsx(Gamepad2, { size: 16 }), " Partida & Habilidades"] }), _jsxs("button", { className: `nav-btn ${currentTab === 'simulator' ? 'active' : ''}`, onClick: () => onTabChange('simulator'), children: [_jsx(FlaskConical, { size: 16 }), " Simulador"] }), _jsxs("button", { className: `nav-btn ${currentTab === 'settings' ? 'active' : ''}`, onClick: () => onTabChange('settings'), children: [_jsx(Settings, { size: 16 }), " Configura\u00E7\u00F5es & TikTok"] }), _jsxs("button", { className: `nav-btn ${currentTab === 'history' ? 'active' : ''}`, onClick: () => onTabChange('history'), children: [_jsx(History, { size: 16 }), " Hist\u00F3rico"] }), _jsxs("button", { className: `nav-btn ${currentTab === 'diagnostics' ? 'active' : ''}`, onClick: () => onTabChange('diagnostics'), children: [_jsx(Tv, { size: 16 }), " Diagn\u00F3stico"] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsxs("a", { href: "http://localhost:3000", target: "_blank", rel: "noreferrer", className: "btn btn-secondary", style: { padding: '6px 12px', fontSize: '13px' }, title: "Abrir a tela p\u00FAblica do jogo em nova janela (compat\u00EDvel com OBS)", children: [_jsx(ExternalLink, { size: 14 }), " Abrir Jogo / OBS"] }), _jsx("div", { style: { fontSize: '13px', color: 'var(--text-muted)' }, children: username }), _jsx("button", { onClick: onLogout, className: "btn btn-secondary", style: { padding: '6px 10px' }, title: "Sair do painel", children: _jsx(LogOut, { size: 14 }) })] })] }));
};
