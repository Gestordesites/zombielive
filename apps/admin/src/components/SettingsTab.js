import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Radio, ShieldAlert, CheckCircle2, XCircle, Save } from 'lucide-react';
import { api } from '../services/api.js';
export const SettingsTab = ({ settings, providerStatus, onSettingsUpdate, onProviderChange }) => {
    const [providerType, setProviderType] = useState(providerStatus?.type || 'SIMULATOR');
    const [tiktokUsername, setTiktokUsername] = useState(providerStatus?.channelName?.replace('@', '') || '');
    const [connecting, setConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
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
        }
        catch (err) {
            setConnectionError(err.message || 'Erro ao conectar à live do TikTok.');
        }
        finally {
            setConnecting(false);
        }
    };
    const handleDisconnectTikTok = async () => {
        setConnecting(true);
        try {
            await api.setProvider('SIMULATOR');
            onProviderChange();
        }
        catch (err) {
            alert(err.message);
        }
        finally {
            setConnecting(false);
        }
    };
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            const updated = await api.updateSettings(formData);
            onSettingsUpdate(updated);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
        catch (err) {
            alert(`Erro ao salvar configurações: ${err.message}`);
        }
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '24px' }, children: [_jsxs("div", { className: "card", children: [_jsxs("h3", { style: { fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Radio, { size: 20, color: "var(--accent-red)" }), " Conector TikTok LIVE"] }), _jsx("p", { style: { color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }, children: "Conecte o Zombie Live \u00E0 sua transmiss\u00E3o ativa do TikTok para receber coment\u00E1rios, curtidas, novos seguidores e presentes reais." }), _jsxs("div", { style: { backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '14px', marginBottom: '20px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }, children: [_jsx(ShieldAlert, { size: 18 }), " Nota de Transpar\u00EAncia e Seguran\u00E7a"] }), _jsxs("p", { style: { fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }, children: ["Esta integra\u00E7\u00E3o utiliza a biblioteca aberta da comunidade (", _jsx("code", { children: "tiktok-live-connector" }), ") baseada no protocolo Webcast p\u00FAblico.", _jsx("strong", { children: " Nunca solicitamos sua senha, chave secreta ou cookies." }), " Para que a conex\u00E3o ocorra, sua live precisa estar ", _jsx("strong", { children: "AO VIVO" }), " no momento da conex\u00E3o."] })] }), _jsxs("div", { style: { display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }, children: [_jsxs("div", { className: "form-group", style: { marginBottom: 0, minWidth: '280px' }, children: [_jsx("label", { className: "form-label", children: "Nome de Usu\u00E1rio TikTok (@usuario)" }), _jsx("input", { type: "text", className: "form-input", placeholder: "ex: seucanal", value: tiktokUsername, onChange: e => setTiktokUsername(e.target.value) })] }), providerStatus?.connected && providerStatus?.type === 'CONNECTED' ? (_jsxs("button", { className: "btn btn-danger", onClick: handleDisconnectTikTok, disabled: connecting, children: [_jsx(XCircle, { size: 16 }), " Desconectar do TikTok"] })) : (_jsxs("button", { className: "btn btn-success", onClick: handleConnectTikTok, disabled: connecting, children: [_jsx(CheckCircle2, { size: 16 }), " ", connecting ? 'Conectando...' : 'Conectar à Live'] })), _jsx("button", { className: "btn btn-secondary", onClick: async () => {
                                    await api.setProvider('SIMULATOR');
                                    onProviderChange();
                                }, children: "Ativar Modo Simulador" })] }), connectionError && (_jsxs("div", { style: { marginTop: '14px', color: 'var(--accent-red)', fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }, children: ["\u26A0\uFE0F ", connectionError] })), _jsxs("div", { style: { marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }, children: [_jsx("h4", { style: { fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }, children: "Status Atual do Conector" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }, children: [_jsxs("div", { children: [_jsx("strong", { children: "Modo:" }), " ", providerStatus?.type] }), _jsxs("div", { children: [_jsx("strong", { children: "Conex\u00E3o:" }), " ", providerStatus?.connected ? '✅ Ativa' : '❌ Inativa'] }), _jsxs("div", { children: [_jsx("strong", { children: "Canal:" }), " ", providerStatus?.channelName || 'Nenhum'] }), _jsxs("div", { children: [_jsx("strong", { children: "\u00DAltimo Evento:" }), " ", providerStatus?.lastEventTime || 'Nenhum evento recente'] })] })] })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { style: { fontSize: '18px', marginBottom: '16px' }, children: "Regras de Intera\u00E7\u00E3o & Anti-Spam" }), saveSuccess && (_jsx("div", { style: { backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--accent-green)', padding: '10px', borderRadius: '8px', marginBottom: '16px', color: '#4ade80' }, children: "Configura\u00E7\u00F5es salvas e aplicadas com sucesso!" })), _jsxs("form", { onSubmit: handleSaveSettings, style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Cooldown de Comandos por Usu\u00E1rio (ms)" }), _jsx("input", { type: "number", className: "form-input", value: formData.commandCooldownPerUserMs, onChange: e => setFormData({ ...formData, commandCooldownPerUserMs: Number(e.target.value) }) }), _jsx("small", { style: { color: 'var(--text-muted)' }, children: "Tempo m\u00EDnimo que cada usu\u00E1rio deve aguardar entre comandos." })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Limite Global de Comandos por Segundo" }), _jsx("input", { type: "number", className: "form-input", value: formData.commandGlobalRateLimitPerSec, onChange: e => setFormData({ ...formData, commandGlobalRateLimitPerSec: Number(e.target.value) }) }), _jsx("small", { style: { color: 'var(--text-muted)' }, children: "Prote\u00E7\u00E3o contra enxurrada e travamento do servidor." })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Meta Coletiva Inicial de Curtidas" }), _jsx("input", { type: "number", className: "form-input", value: formData.collectiveGoalLikesTarget, onChange: e => setFormData({ ...formData, collectiveGoalLikesTarget: Number(e.target.value) }) }), _jsx("small", { style: { color: 'var(--text-muted)' }, children: "Quantidade de curtidas necess\u00E1rias para ativar o super b\u00F4nus coletivo." })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Mensagem de Boas-Vindas a Novos Seguidores" }), _jsx("input", { type: "text", className: "form-input", value: formData.welcomeFollowerText, onChange: e => setFormData({ ...formData, welcomeFollowerText: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Iniciar Partidas Automaticamente (Loop Cont\u00EDnuo 24/7)" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }, children: [_jsx("input", { type: "checkbox", id: "autoStartCheck", style: { width: '18px', height: '18px', cursor: 'pointer' }, checked: formData.autoStartMatches ?? true, onChange: e => setFormData({ ...formData, autoStartMatches: e.target.checked }) }), _jsx("label", { htmlFor: "autoStartCheck", style: { fontSize: '13px', cursor: 'pointer', color: 'var(--text-main)' }, children: formData.autoStartMatches ? '✅ Ativado (Inicia e reinicia partidas sozinho)' : '❌ Desativado (Aguardar início manual)' })] }), _jsx("small", { style: { color: 'var(--text-muted)' }, children: "Mant\u00E9m a live transmitindo continuamente sem interven\u00E7\u00E3o manual." })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Tempo de Espera para Rein\u00EDcio Autom\u00E1tico (segundos)" }), _jsx("input", { type: "number", min: 3, max: 60, className: "form-input", value: formData.autoRestartSeconds ?? 7, onChange: e => setFormData({ ...formData, autoRestartSeconds: Number(e.target.value) }) }), _jsx("small", { style: { color: 'var(--text-muted)' }, children: "Pausa na tela de vit\u00F3ria/derrota antes de reiniciar nova partida." })] }), _jsx("div", { style: { gridColumn: '1 / -1' }, children: _jsxs("button", { type: "submit", className: "btn btn-primary", children: [_jsx(Save, { size: 16 }), " Salvar Todas as Configura\u00E7\u00F5es"] }) })] })] })] }));
};
