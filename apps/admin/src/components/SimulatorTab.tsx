import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, UserPlus, Gift, Skull, Trophy, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';

export const SimulatorTab: React.FC = () => {
  const [customUser, setCustomUser] = useState('Espectador_Top');
  const [customComment, setCustomComment] = useState('CURA');
  const [followerName, setFollowerName] = useState('NovoFã');
  const [feedback, setFeedback] = useState<string | null>(null);

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const simulateLikes = async (count: number) => {
    try {
      await api.simulateEvent({
        type: 'LIKE',
        user: { id: 'sim_like_user', username: customUser },
        data: { likeCount: count }
      });
      notify(`Simulado: +${count} curtidas enviadas!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const simulateComment = async (text: string) => {
    try {
      await api.simulateEvent({
        type: 'COMMENT',
        user: { id: 'sim_user_' + Math.floor(Math.random() * 999), username: customUser },
        data: { commentText: text }
      });
      notify(`Comentário simulado enviado: "${text}" por @${customUser}`);
    } catch (err: any) {
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
    } catch (err: any) {
      alert(err.message);
    }
  };

  const simulateGift = async (giftName: string, count = 1) => {
    try {
      await api.simulateEvent({
        type: 'GIFT',
        user: { id: 'sim_user_' + customUser.toLowerCase().replace(/[^a-z0-9]/g, ''), username: customUser },
        data: { giftId: '1001', giftName, giftCount: count }
      });
      notify(`Presente: ${giftName} por @${customUser}! Pet guardião invocado na arena!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {feedback && (
        <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', border: '1px solid var(--accent-blue)', padding: '12px', borderRadius: '8px', color: '#38bdf8' }}>
          {feedback}
        </div>
      )}

      {/* Identificação do Usuário Simulado */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Perfil do Espectador Simulado</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nome de Usuário:</label>
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: '250px' }}
            value={customUser}
            onChange={e => setCustomUser(e.target.value)}
          />
        </div>
      </div>

      {/* Simulação de Curtidas */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThumbsUp size={18} color="var(--accent-yellow)" /> Simulação de Curtidas (Avanço da Meta Coletiva)
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => simulateLikes(10)}>
            +10 Curtidas
          </button>
          <button className="btn btn-secondary" onClick={() => simulateLikes(50)}>
            +50 Curtidas
          </button>
          <button className="btn btn-secondary" onClick={() => simulateLikes(250)}>
            +250 Curtidas
          </button>
          <button className="btn btn-warning" onClick={() => simulateLikes(500)}>
            Completar Meta Imediatamente (+500)
          </button>
        </div>
      </div>

      {/* Simulação de Comandos de Bate-Papo */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="var(--accent-green)" /> Comentários e Comandos de Bate-Papo
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button className="btn btn-secondary" onClick={() => simulateComment('CURA')}>CURA</button>
          <button className="btn btn-secondary" onClick={() => simulateComment('ESCUDO')}>ESCUDO</button>
          <button className="btn btn-secondary" onClick={() => simulateComment('ATAQUE')}>ATAQUE</button>
          <button className="btn btn-secondary" onClick={() => simulateComment('FOGO')}>FOGO</button>
          <button className="btn btn-secondary" onClick={() => simulateComment('CONGELAMENTO')}>CONGELAMENTO</button>
          <button className="btn btn-secondary" onClick={() => simulateComment('EXPLOSAO')}>EXPLOSAO</button>
          <button className="btn btn-secondary" onClick={() => simulateComment('VOTAR 1')}>VOTAR 1</button>
          <button className="btn btn-secondary" onClick={() => simulateComment('VOTAR 2')}>VOTAR 2</button>
          <button className="btn btn-secondary" onClick={() => simulateComment('VOTAR 3')}>VOTAR 3</button>
        </div>

        {/* Comentário Personalizado */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Digite qualquer comentário ou comando..."
            value={customComment}
            onChange={e => setCustomComment(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => simulateComment(customComment)}>
            Enviar Comentário
          </button>
        </div>
      </div>

      {/* Simulação de Seguidores e Presentes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} color="var(--accent-blue)" /> Novo Seguidor
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              value={followerName}
              onChange={e => setFollowerName(e.target.value)}
            />
            <button className="btn btn-primary" onClick={simulateFollower}>
              Simular Seguidor
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={18} color="var(--accent-purple)" /> Presentes Virtuais (Invoca Bichinho Guardião)
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Cada presente invoca um pet de batalha aliado com o nome do doador que orbita o herói e ataca os zumbis!
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => simulateGift('Rosa')}>
              🌹 Rosa
            </button>
            <button className="btn btn-secondary" onClick={() => simulateGift('Coração')}>
              💖 Coração
            </button>
            <button className="btn btn-secondary" onClick={() => simulateGift('Mini Foguete')}>
              🚀 Foguete
            </button>
            <button className="btn btn-secondary" onClick={() => simulateGift('Leão TikTok')}>
              🦁 Leão Lendário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
