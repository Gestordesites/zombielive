# 🎛️ Manual do Painel Administrativo — ZOMBIE LIVE

O Painel Administrativo do **Zombie Live** foi projetado para permitir que o apresentador ou moderador controle a partida com agilidade e clareza durante transmissões ao vivo.

Acesse o painel em: `http://localhost:3001` (ou `/admin` na porta de produção).

---

## 1. Acesso e Autenticação

Ao acessar pela primeira vez, uma tela de login será apresentada:
- **Usuário Inicial:** `admin`
- **Senha Inicial:** `admin123456`

O sistema emite um token JWT armazenado localmente no navegador, mantendo sua sessão ativa mesmo após atualizar a página.

---

## 2. Visão Geral das Abas

### 📊 Aba 1: Painel (Dashboard)
Apresenta o panorama instantâneo da live:
- **Onda Atual e Temporizador**: Contagem regressiva para a próxima onda e contagem de zumbis vivos na tela.
- **Vida do Sobrevivente**: Indicador colorido da saúde do herói (verde = saudável, vermelho = crítico).
- **Zumbis Eliminados**: Total de eliminações na partida e na onda atual.
- **Pontuação Total**: Placar acumulado da transmissão.
- **Meta de Curtidas**: Progresso percentual da meta comunitária.
- **Status do Sobrevivente**: Dano base, velocidade, cadência, porcentagem de armadura e status do escudo.
- **Últimos Comandos da Audiência**: Feed em tempo real dos comentários recebidos, identificando quem enviou e se o comando foi aceito ou bloqueado pelo anti-spam.

---

### 🎮 Aba 2: Partida & Habilidades
Permite o gerenciamento tático da partida:
- **Botões de Controle de Fluxo**:
  - `Iniciar Partida`: Começa a contagem regressiva de 3 segundos e dá início à ação.
  - `Pausar Partida`: Congela o movimento e ataques sem perder o progresso.
  - `Retomar Partida`: Continua de onde parou.
  - `Encerrar Partida`: Finaliza a partida imediatamente e registra o resultado no histórico.
  - `Reiniciar do Zero`: Restaura o sobrevivente e as ondas ao estado inicial.
- **Ativação Manual de Habilidades**:
  - Botões dedicados para disparar instantaneamente `CURA`, `ESCUDO`, `ATAQUE`, `FOGO`, `CONGELAMENTO` e `EXPLOSAO`.
- **Ajuste de Ondas & Dificuldade**:
  - Duração de cada onda em segundos (padrão: 30s).
  - Limite máximo de inimigos simultâneos na tela (padrão: 60).
  - Intervalo de ondas para o Chefe (padrão: a cada 5 ondas).

---

### 🧪 Aba 3: Simulador
Essencial para testes e demonstrações sem necessitar de uma live do TikTok aberta:
- **Simulação de Curtidas**: Botões rápidos para adicionar +10, +50, +250 curtidas ou completar a meta instantaneamente.
- **Comandos de Chat**: Botões para disparar os comandos exatos que os espectadores usam.
- **Comentário Personalizado**: Campo livre para testar como o motor interpreta qualquer frase ou comando desconhecido.
- **Novo Seguidor**: Dispara a notificação oficial com nome customizável.
- **Presentes Virtuais**: Simula o envio de Rosa, Mini Foguete ou Leão do TikTok, ativando as super habilidades correspondentes.

---

### ⚙️ Aba 4: Configurações & TikTok
Central de conectividade:
- **Conector TikTok LIVE**:
  - Campo para informar o `@usuario` da live.
  - Botões `Conectar à Live` e `Desconectar do TikTok`.
  - Botão para retornar ao `Modo Simulador`.
  - Status em tempo real do conector (Online/Offline, último evento e eventuais erros reportados).
- **Regras Anti-Spam**:
  - Cooldown por espectador (tempo mínimo entre comandos do mesmo usuário).
  - Limite global de comandos por segundo no servidor.
  - Meta de curtidas e texto de boas-vindas.

---

### 📜 Aba 5: Histórico
Tabela cronológica de todas as partidas disputadas:
- Data e hora de início.
- Duração da sobrevivência.
- Onda máxima atingida.
- Pontuação total conquistada.
- Zumbis e chefes derrotados.
- Modo em que a partida ocorreu (`SIMULATOR` ou `CONNECTED`).
- Resultado final (`VITÓRIA`, `DERROTA` ou `INTERROMPIDA`).

---

### 🩺 Aba 6: Diagnóstico
Painel de telemetria técnica:
- Uptime e status do processo Node.js.
- Consumo de memória RAM alocada.
- Contagem de clientes WebSocket conectados.
- Métricas detalhadas de comandos aceitos vs rejeitados pelo filtro anti-spam.
- Contadores globais por categoria de interação (likes, chat, seguidores, presentes).
- Log dos últimos erros ocorridos para identificação ágil de problemas.
