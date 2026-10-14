import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ThumbsUp, MessageSquare, UserPlus, Gift } from 'lucide-react';
import { api } from '../services/api.js';
export const SimulatorTab = () => {
    const [customUser, setCustomUser] = useState('Espectador_Top');
    const [customComment, setCustomComment] = useState('CURA');
    const [followerName, setFollowerName] = useState('NovoFã');
    const [feedback, setFeedback] = useState(null);
    const notify = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(null), 2500);
    };
    const simulateLikes = async (count) => {
        try {
            await api.simulateEvent({
                type: 'LIKE',
                user: { id: 'sim_like_user', username: customUser },
                data: { likeCount: count }
            });
            notify(`Simulado: +${count} curtidas enviadas!`);
        }
        catch (err) {
            alert(err.message);
        }
    };
    const simulateComment = async (text) => {
        try {
            await api.simulateEvent({
                type: 'COMMENT',
                user: { id: 'sim_user_' + Math.floor(Math.random() * 999), username: customUser },
                data: { commentText: text }
            });
            notify(`Comentário simulado enviado: "${text}" por @${customUser}`);
        }
        catch (err) {
            alert(err.message);
        }
    };
    const simulateFollower = async () => {
        try {
            await api.simulateEvent({
                type: 'FOLLOW',
                user: { id: 'sim_follow_' + Date.now(), username: followerName },
                data: {}
            });
            notify(`Simulado: Novo seguidor @${followerName}!`);
        }
        catch (err) {
            alert(err.message);
        }
    };
    const simulateGift = async (giftName, count = 1) => {
        try {
            await api.simulateEvent({
                type: 'GIFT',
                user: { id: 'sim_gift_user', username: customUser },
                data: { giftId: '1001', giftName, giftCount: count }
            });
            notify(`Presente simulado: ${giftName} x${count} por @${customUser}!`);
        }
        catch (err) {
            alert(err.message);
        }
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '20px' }, children: [feedback && (_jsx("div", { style: { backgroundColor: 'rgba(56, 189, 248, 0.2)', border: '1px solid var(--accent-blue)', padding: '12px', borderRadius: '8px', color: '#38bdf8' }, children: feedback })), _jsxs("div", { className: "card", children: [_jsx("h3", { style: { fontSize: '16px', marginBottom: '12px' }, children: "Perfil do Espectador Simulado" }), _jsxs("div", { style: { display: 'flex', gap: '12px', alignItems: 'center' }, children: [_jsx("label", { style: { color: 'var(--text-muted)', fontSize: '13px' }, children: "Nome de Usu\u00E1rio:" }), _jsx("input", { type: "text", className: "form-input", style: { maxWidth: '250px' }, value: customUser, onChange: e => setCustomUser(e.target.value) })] })] }), _jsxs("div", { className: "card", children: [_jsxs("h3", { style: { fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(ThumbsUp, { size: 18, color: "var(--accent-yellow)" }), " Simula\u00E7\u00E3o de Curtidas (Avan\u00E7o da Meta Coletiva)"] }), _jsxs("div", { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' }, children: [_jsx("button", { className: "btn btn-secondary", onClick: () => simulateLikes(10), children: "+10 Curtidas" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateLikes(50), children: "+50 Curtidas" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateLikes(250), children: "+250 Curtidas" }), _jsx("button", { className: "btn btn-warning", onClick: () => simulateLikes(500), children: "Completar Meta Imediatamente (+500)" })] })] }), _jsxs("div", { className: "card", children: [_jsxs("h3", { style: { fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(MessageSquare, { size: 18, color: "var(--accent-green)" }), " Coment\u00E1rios e Comandos de Bate-Papo"] }), _jsxs("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }, children: [_jsx("button", { className: "btn btn-secondary", onClick: () => simulateComment('CURA'), children: "CURA" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateComment('ESCUDO'), children: "ESCUDO" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateComment('ATAQUE'), children: "ATAQUE" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateComment('FOGO'), children: "FOGO" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateComment('CONGELAMENTO'), children: "CONGELAMENTO" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateComment('EXPLOSAO'), children: "EXPLOSAO" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateComment('VOTAR 1'), children: "VOTAR 1" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateComment('VOTAR 2'), children: "VOTAR 2" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateComment('VOTAR 3'), children: "VOTAR 3" })] }), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx("input", { type: "text", className: "form-input", placeholder: "Digite qualquer coment\u00E1rio ou comando...", value: customComment, onChange: e => setCustomComment(e.target.value) }), _jsx("button", { className: "btn btn-primary", onClick: () => simulateComment(customComment), children: "Enviar Coment\u00E1rio" })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }, children: [_jsxs("div", { className: "card", children: [_jsxs("h3", { style: { fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(UserPlus, { size: 18, color: "var(--accent-blue)" }), " Novo Seguidor"] }), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx("input", { type: "text", className: "form-input", value: followerName, onChange: e => setFollowerName(e.target.value) }), _jsx("button", { className: "btn btn-primary", onClick: simulateFollower, children: "Simular Seguidor" })] })] }), _jsxs("div", { className: "card", children: [_jsxs("h3", { style: { fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Gift, { size: 18, color: "var(--accent-purple)" }), " Presentes Virtuais"] }), _jsxs("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' }, children: [_jsx("button", { className: "btn btn-secondary", onClick: () => simulateGift('Rosa'), children: "\uD83C\uDF39 Rosa" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateGift('Coração'), children: "\uD83D\uDC96 Cora\u00E7\u00E3o" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateGift('Mini Foguete'), children: "\uD83D\uDE80 Foguete" }), _jsx("button", { className: "btn btn-secondary", onClick: () => simulateGift('Leão TikTok'), children: "\uD83E\uDD81 Le\u00E3o Lend\u00E1rio" })] })] })] })] }));
};
