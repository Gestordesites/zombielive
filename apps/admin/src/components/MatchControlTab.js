import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Play, Pause, RotateCcw, Square, Heart, Shield, Sparkles, Flame, Snowflake, Bomb } from 'lucide-react';
import { api } from '../services/api.js';
export const MatchControlTab = ({ snapshot, settings, onSettingsUpdate }) => {
    const [waveSecs, setWaveSecs] = useState(settings.waveDurationSeconds);
    const [maxEnemies, setMaxEnemies] = useState(settings.maxEnemiesAlive);
    const [bossInterval, setBossInterval] = useState(settings.bossWaveInterval);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const status = snapshot?.status || 'IDLE';
    const handleAction = async (action) => {
        try {
            await api.controlMatch(action);
        }
        catch (err) {
            alert(`Erro ao executar ação: ${err.message}`);
        }
    };
    const handleTriggerSkill = (skill) => {
        api.triggerSkill(skill);
    };
    const handleSaveDifficulty = async (e) => {
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
        }
        catch (err) {
            alert(`Falha ao salvar dificuldade: ${err.message}`);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '24px' }, children: [_jsxs("div", { className: "card", children: [_jsx("h3", { style: { fontSize: '18px', marginBottom: '16px' }, children: "Controle da Partida" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '12px' }, children: [status === 'IDLE' || status === 'GAME_OVER' || status === 'VICTORY' ? (_jsxs("button", { className: "btn btn-success", onClick: () => handleAction('start'), children: [_jsx(Play, { size: 18 }), " Iniciar Partida"] })) : null, status === 'PLAYING' || status === 'BOSS_FIGHT' ? (_jsxs("button", { className: "btn btn-warning", onClick: () => handleAction('pause'), children: [_jsx(Pause, { size: 18 }), " Pausar Partida"] })) : null, status === 'PAUSED' ? (_jsxs("button", { className: "btn btn-success", onClick: () => handleAction('resume'), children: [_jsx(Play, { size: 18 }), " Retomar Partida"] })) : null, status !== 'IDLE' ? (_jsxs("button", { className: "btn btn-danger", onClick: () => handleAction('stop'), children: [_jsx(Square, { size: 18 }), " Encerrar Partida"] })) : null, _jsxs("button", { className: "btn btn-secondary", onClick: () => handleAction('restart'), children: [_jsx(RotateCcw, { size: 18 }), " Reiniciar do Zero"] })] })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { style: { fontSize: '18px', marginBottom: '8px' }, children: "Ativa\u00E7\u00E3o Manual de Habilidades Especiais" }), _jsx("p", { style: { color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }, children: "Permite que o administrador teste ou auxilie o sobrevivente acionando habilidades diretamente do painel:" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }, children: [_jsxs("button", { className: "btn btn-secondary", onClick: () => handleTriggerSkill('CURA'), children: [_jsx(Heart, { size: 16, color: "var(--accent-green)" }), " CURA (+50 HP)"] }), _jsxs("button", { className: "btn btn-secondary", onClick: () => handleTriggerSkill('ESCUDO'), children: [_jsx(Shield, { size: 16, color: "var(--accent-blue)" }), " ESCUDO (80% Def)"] }), _jsxs("button", { className: "btn btn-secondary", onClick: () => handleTriggerSkill('ATAQUE'), children: [_jsx(Sparkles, { size: 16, color: "var(--accent-yellow)" }), " ATAQUE (\u00C1rea 360\u00B0)"] }), _jsxs("button", { className: "btn btn-secondary", onClick: () => handleTriggerSkill('FOGO'), children: [_jsx(Flame, { size: 16, color: "var(--accent-red)" }), " FOGO (Solo Ardente)"] }), _jsxs("button", { className: "btn btn-secondary", onClick: () => handleTriggerSkill('CONGELAMENTO'), children: [_jsx(Snowflake, { size: 16, color: "var(--accent-blue)" }), " CONGELAMENTO (75%)"] }), _jsxs("button", { className: "btn btn-secondary", onClick: () => handleTriggerSkill('EXPLOSAO'), children: [_jsx(Bomb, { size: 16, color: "var(--accent-red)" }), " SUPERNOVA (Bomba)"] })] })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { style: { fontSize: '18px', marginBottom: '16px' }, children: "Ajuste de Ondas & Dificuldade" }), message && (_jsx("div", { style: { backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--accent-green)', padding: '10px', borderRadius: '8px', marginBottom: '16px', color: '#4ade80' }, children: message })), _jsxs("form", { onSubmit: handleSaveDifficulty, style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Dura\u00E7\u00E3o de Cada Onda (segundos)" }), _jsx("input", { type: "number", min: 10, max: 180, className: "form-input", value: waveSecs, onChange: e => setWaveSecs(Number(e.target.value)) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Limite M\u00E1ximo de Inimigos Simult\u00E2neos" }), _jsx("input", { type: "number", min: 15, max: 150, className: "form-input", value: maxEnemies, onChange: e => setMaxEnemies(Number(e.target.value)) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Intervalo de Onda para Surgimento de Chefe" }), _jsx("input", { type: "number", min: 1, max: 20, className: "form-input", value: bossInterval, onChange: e => setBossInterval(Number(e.target.value)) }), _jsx("small", { style: { color: 'var(--text-muted)' }, children: "Padr\u00E3o: A cada 5 ondas." })] }), _jsx("div", { style: { gridColumn: '1 / -1' }, children: _jsx("button", { type: "submit", className: "btn btn-primary", disabled: saving, children: saving ? 'Salvando...' : 'Aplicar Alterações na Partida' }) })] })] })] }));
};
