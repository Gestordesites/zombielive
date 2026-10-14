# ⚙️ Guia de Configuração e Variáveis — ZOMBIE LIVE

Todas as configurações do servidor e integrações são controladas pelo arquivo `.env` na raiz do projeto.

---

## 1. Dicionário Completo de Variáveis de Ambiente

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Ambiente de execução (`development`, `production` ou `test`). |
| `PORT` | `4000` | Porta TCP do servidor principal (Express + Socket.IO). |
| `HOST` | `0.0.0.0` | Interface de rede na qual o servidor escutará conexões. |
| `GAME_PORT` | `3000` | Porta local do servidor de desenvolvimento Vite do jogo. |
| `ADMIN_PORT` | `3001` | Porta local do servidor de desenvolvimento Vite do painel admin. |
| `CLIENT_CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Lista de origens autorizadas para CORS (separadas por vírgula). |
| `VITE_SERVER_URL` | `http://localhost:4000` | URL do backend que os frontends utilizam para conectar via WebSocket/REST. |
| `JWT_SECRET` | *(chave padrão dev)* | Chave secreta para assinatura dos tokens JWT do painel administrativo. **Em produção, utilize uma chave aleatória com mais de 32 caracteres.** |
| `JWT_EXPIRES_IN` | `24h` | Tempo de validade do token de sessão do administrador. |
| `ADMIN_DEFAULT_USER` | `admin` | Nome de usuário inicial criado na primeira inicialização do sistema. |
| `ADMIN_DEFAULT_PASS` | `admin123456` | Senha padrão inicial para o primeiro login. Altere no primeiro acesso. |
| `DATABASE_URL` | *(vazio)* | String de conexão com o banco de dados PostgreSQL. Se omitido, o sistema utiliza armazenamento em memória de alta performance. |
| `LIVE_PROVIDER` | `SIMULATOR` | Modo padrão do conector (`SIMULATOR`, `CONNECTED` ou `DISCONNECTED`). |
| `TIKTOK_USERNAME` | *(vazio)* | Nome do canal do TikTok para conexão automática (ex: `seucanal`). |
| `TIKTOK_RECONNECT_INTERVAL` | `5000` | Tempo em milissegundos para tentar restabelecer conexão perdida. |
| `TIKTOK_DEBUG` | `false` | Exibe logs detalhados do conector no console do terminal (`true`/`false`). |
| `COMMAND_RATE_LIMIT_PER_USER` | `3` | Número máximo de comandos aceitos por usuário em rajada rápida. |
| `COMMAND_RATE_LIMIT_GLOBAL_PER_SEC` | `50` | Limite máximo de comandos globais processados por segundo (Anti-Spam). |
| `COMMAND_COOLDOWN_MS` | `2000` | Cooldown mínimo (em ms) entre comandos de um mesmo espectador. |

---

## 2. Configuração de Banco de Dados

### Modo Sem Banco (Padrão)
Não é necessário configurar nada. O Zombie Live armazena configurações, partidas recentes e logs em memória com retenção automática dos últimos 100 registros.

### Conectando ao PostgreSQL (Opcional)
Se desejar que as partidas e configurações persistam mesmo após reiniciar o servidor, configure a variável `DATABASE_URL`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/zombielive
```

O servidor criará automaticamente todas as tabelas e índices necessários no primeiro boot.

---

## 3. Gerando uma Chave JWT Segura para Produção

Em ambientes de produção, nunca mantenha a chave padrão. Gere uma chave segura no terminal:

```bash
# No PowerShell ou Linux:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie a string gerada e insira no seu `.env`:

```env
JWT_SECRET=8f9d3a7b6c5e4d2a1f0e9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d
```
