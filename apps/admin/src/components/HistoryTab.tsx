import React, { useEffect, useState } from 'react';
import { MatchRecord } from '@zombie-live/shared';
import { api } from '../services/api.js';
import { History, RefreshCw } from 'lucide-react';

export const HistoryTab: React.FC = () => {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.listMatches(50);
      setMatches(data);
    } catch (err: any) {
      alert(`Erro ao carregar histórico: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} color="var(--accent-blue)" /> Histórico de Partidas Realizadas
        </h3>
        <button className="btn btn-secondary" onClick={fetchHistory} disabled={loading}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data e Hora</th>
              <th>Duração</th>
              <th>Onda Alcançada</th>
              <th>Pontuação</th>
              <th>Zumbis</th>
              <th>Chefes</th>
              <th>Modo</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                  Nenhuma partida finalizada registrada até o momento.
                </td>
              </tr>
            ) : (
              matches.map(m => (
                <tr key={m.id}>
                  <td>{new Date(m.startedAt).toLocaleString('pt-BR')}</td>
                  <td>{Math.floor(m.durationSeconds / 60)}m {m.durationSeconds % 60}s</td>
                  <td>Onda {m.maxWave}</td>
                  <td style={{ color: 'var(--accent-yellow)', fontWeight: 'bold' }}>{m.score.toLocaleString('pt-BR')}</td>
                  <td>{m.zombiesKilled}</td>
                  <td>{m.bossesKilled}</td>
                  <td>
                    <span className={`badge ${m.providerType === 'CONNECTED' ? 'badge-red' : 'badge-green'}`}>
                      {m.providerType}
                    </span>
                  </td>
                  <td>
                    {m.result === 'VICTORY' ? (
                      <span className="badge badge-green">VITÓRIA</span>
                    ) : m.result === 'GAME_OVER' ? (
                      <span className="badge badge-red">DERROTA</span>
                    ) : (
                      <span className="badge badge-gray">INTERROMPIDA</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
