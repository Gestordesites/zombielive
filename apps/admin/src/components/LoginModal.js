import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../services/api.js';
import { Lock, User, AlertCircle } from 'lucide-react';
export const LoginModal = ({ onSuccess }) => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123456');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await api.login(username, password);
            onSuccess(data.username);
        }
        catch (err) {
            setError(err.message || 'Falha ao autenticar.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "modal-card", children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: '24px' }, children: [_jsx("div", { style: {
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 12px'
                            }, children: _jsx(Lock, { size: 26, color: "var(--accent-blue)" }) }), _jsx("h2", { style: { fontSize: '22px', fontWeight: 'bold' }, children: "Acesso Administrativo" }), _jsx("p", { style: { color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }, children: "Zombie Live \u2014 Painel de Controle da Transmiss\u00E3o" })] }), error && (_jsxs("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid var(--accent-red)',
                        color: '#f87171',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        marginBottom: '16px'
                    }, children: [_jsx(AlertCircle, { size: 16 }), _jsx("span", { children: error })] })), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Usu\u00E1rio" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("input", { type: "text", className: "form-input", style: { paddingLeft: '38px' }, value: username, onChange: e => setUsername(e.target.value), required: true }), _jsx(User, { size: 16, color: "var(--text-muted)", style: { position: 'absolute', left: '12px', top: '12px' } })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Senha" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("input", { type: "password", className: "form-input", style: { paddingLeft: '38px' }, value: password, onChange: e => setPassword(e.target.value), required: true }), _jsx(Lock, { size: 16, color: "var(--text-muted)", style: { position: 'absolute', left: '12px', top: '12px' } })] })] }), _jsx("div", { style: { marginTop: '20px' }, children: _jsx("button", { type: "submit", className: "btn btn-primary", style: { width: '100%', padding: '12px' }, disabled: loading, children: loading ? 'Entrando...' : 'Entrar no Painel' }) })] })] }) }));
};
