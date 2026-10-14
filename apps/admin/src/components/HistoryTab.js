import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { History, RefreshCw } from 'lucide-react';
export const HistoryTab = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await api.listMatches(50);
            setMatches(data);
        }
        catch (err) {
            alert(`Erro ao carregar histórico: ${err.message}`);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchHistory();
    }, []);
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }, children: [_jsxs("h3", { style: { fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(History, { size: 20, color: "var(--accent-blue)" }), " Hist\u00F3rico de Partidas Realizadas"] }), _jsxs("button", { className: "btn btn-secondary", onClick: fetchHistory, disabled: loading, children: [_jsx(RefreshCw, { size: 14 }), " Atualizar"] })] }), _jsx("div", { className: "table-container", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Data e Hora" }), _jsx("th", { children: "Dura\u00E7\u00E3o" }), _jsx("th", { children: "Onda Alcan\u00E7ada" }), _jsx("th", { children: "Pontua\u00E7\u00E3o" }), _jsx("th", { children: "Zumbis" }), _jsx("th", { children: "Chefes" }), _jsx("th", { children: "Modo" }), _jsx("th", { children: "Resultado" })] }) }), _jsx("tbody", { children: matches.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, style: { textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }, children: "Nenhuma partida finalizada registrada at\u00E9 o momento." }) })) : (matches.map(m => (_jsxs("tr", { children: [_jsx("td", { children: new Date(m.startedAt).toLocaleString('pt-BR') }), _jsxs("td", { children: [Math.floor(m.durationSeconds / 60), "m ", m.durationSeconds % 60, "s"] }), _jsxs("td", { children: ["Onda ", m.maxWave] }), _jsx("td", { style: { color: 'var(--accent-yellow)', fontWeight: 'bold' }, children: m.score.toLocaleString('pt-BR') }), _jsx("td", { children: m.zombiesKilled }), _jsx("td", { children: m.bossesKilled }), _jsx("td", { children: _jsx("span", { className: `badge ${m.providerType === 'CONNECTED' ? 'badge-red' : 'badge-green'}`, children: m.providerType }) }), _jsx("td", { children: m.result === 'VICTORY' ? (_jsx("span", { className: "badge badge-green", children: "VIT\u00D3RIA" })) : m.result === 'GAME_OVER' ? (_jsx("span", { className: "badge badge-red", children: "DERROTA" })) : (_jsx("span", { className: "badge badge-gray", children: "INTERROMPIDA" })) })] }, m.id)))) })] }) })] }));
};
