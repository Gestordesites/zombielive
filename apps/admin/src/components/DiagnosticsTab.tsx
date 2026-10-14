import React, { useEffect, useState } from 'react';
import { DiagnosticInfo } from '@zombie-live/shared';
import { api } from '../services/api.js';
import { Activity, Server, Cpu, Radio, AlertTriangle, RefreshCw } from 'lucide-react';

export const DiagnosticsTab: React.FC = () => {
  const [diag, setDiag] = useState<DiagnosticInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const data = await api.getDiagnostics();
      setDiag(data);
    } catch (err: any) {
      alert(`Erro ao buscar diagnósticos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!diag) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados de telemetria...</div>;
  }

  const totalCommands = diag.commandsAccepted + diag.commandsRejected;
  const rejectRate = totalCommands > 0 ? ((diag.commandsRejected / totalCommands) * 100).toFixed(1) : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--accent-blue)" /> Diagnóstico & Saúde do Sistema
        </h3>
        <button className="btn btn-secondary" onClick={fetchDiagnostics} disabled={loading}>
          <RefreshCw size={14} /> Atualizar Agora
        </button>
      </div>

      {/* Cards de Infraestrutura */}
      <div className="metrics-grid">
        <div className="card">
          <div className="card-title">
            <span>Status do Servidor</span>
            <Server size={16} color="var(--accent-green)" />
          </div>
          <div className="card-value" style={{ color: 'var(--accent-green)' }}>
            ONLINE (UP)
          </div>
          <div className="card-subtitle">
            Tempo de atividade: {Math.floor(diag.uptimeSeconds / 60)} minutos
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Memória RAM Usada</span>
            <Cpu size={16} color="var(--accent-blue)" />
          </div>
          <div className="card-value">
            {diag.memoryUsageMb} MB
          </div>
          <div className="card-subtitle">
            Node.js Heap Allocation
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Conexões WebSocket</span>
            <Radio size={16} color="var(--accent-yellow)" />
          </div>
          <div className="card-value" style={{ color: 'var(--accent-yellow)' }}>
            {diag.activeSockets} Ativas
          </div>
          <div className="card-subtitle">
            Clientes (Jogadores, OBS e Painel)
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Filtro Anti-Spam</span>
            <AlertTriangle size={16} color="var(--accent-red)" />
          </div>
          <div className="card-value" style={{ color: 'var(--accent-green)' }}>
            {diag.commandsAccepted} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ {diag.commandsRejected} rejeitados ({rejectRate}%)</span>
          </div>
          <div className="card-subtitle">
            Comandos processados com sucesso
          </div>
        </div>
      </div>

      {/* Contadores de Eventos da Live */}
      <div className="card">
        <h4 style={{ fontSize: '16px', marginBottom: '16px' }}>Total de Eventos Recebidos por Categoria</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Curtidas (Likes)</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>{diag.eventCounters.likes}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Comentários</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-green)' }}>{diag.eventCounters.comments}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Novos Seguidores</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{diag.eventCounters.follows}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Presentes (Gifts)</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{diag.eventCounters.gifts}</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Votos Registrados</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{diag.eventCounters.votes}</div>
          </div>
        </div>
      </div>

      {/* Eventos Suportados & Erros Recentes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Capacidades do Provedor ({diag.providerStatus.type})</h4>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Eventos Suportados:</strong>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              {diag.providerStatus.supportedEvents.map((evt, idx) => (
                <span key={idx} className="badge badge-green">{evt}</span>
              ))}
            </div>
          </div>
          <div>
            <strong style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Eventos Não Suportados:</strong>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              {diag.providerStatus.unsupportedEvents.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nenhuma limitação no modo atual.</span>
              ) : (
                diag.providerStatus.unsupportedEvents.map((evt, idx) => (
                  <span key={idx} className="badge badge-gray">{evt}</span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h4 style={{ fontSize: '15px', marginBottom: '12px', color: diag.providerStatus.recentErrors.length > 0 ? 'var(--accent-red)' : 'var(--text-main)' }}>
            Erros Recentes do Conector
          </h4>
          <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {diag.providerStatus.recentErrors.length === 0 ? (
              <div style={{ color: 'var(--accent-green)', fontSize: '13px' }}>
                ✅ Nenhum erro registrado. Tudo operando normalmente.
              </div>
            ) : (
              diag.providerStatus.recentErrors.map((err, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '4px' }}>
                  {err}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
