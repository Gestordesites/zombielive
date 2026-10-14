# 🛡️ Políticas de Segurança e Proteção — ZOMBIE LIVE

A segurança de uma aplicação transmitida ao vivo exige cuidados rigorosos para evitar vazamento de credenciais, abuso por spam ou tentativas de injeção maliciosa através do chat.

---

## 1. Isolamento Entre Rota Pública e Rota Administrativa

- **Rota Pública (`/live`)**:
  - Exibe estritamente o Canvas do jogo e o HUD para os espectadores.
  - Não carrega formulários administrativos, tokens de autenticação ou chaves secretas no bundle do navegador.
  - Não permite acionamento de comandos de controle de partida.
- **Rota Privada (`/admin` e `/api/*`)**:
  - Todas as rotas de mutação exigem cabeçalho `Authorization: Bearer <token_jwt>`.
  - Tentativas de acesso sem token resultam em resposta `401 Unauthorized`.

---

## 2. Autenticação e Hashing de Senhas

- As senhas dos administradores são criptografadas com **BCrypt** (salt rounds = 10). A senha original nunca é armazenada em texto plano.
- As sessões utilizam **JSON Web Tokens (JWT)** assinados com algoritmo HMAC-SHA256 e chave privada configurada em `JWT_SECRET`.
- O procedimento de setup automático inicializa o administrador apenas se a tabela de administradores estiver completamente vazia.

---

## 3. Higienização e Proteção Contra Injeção no Chat

O **Zombie Live** processa mensagens de texto enviadas por espectadores desconhecidos da internet:
- **Nenhum código é executado**: A aplicação **não** utiliza funções perigosas como `eval()`, `Function()` ou passagem de strings para interpretadores de comando do sistema operacional.
- **Filtro Regex Restritivo**: Os comentários passam por regex estrito que busca apenas palavras-chave conhecidas (`CURA`, `ESCUDO`, `ATAQUE`, `FOGO`, `CONGELAMENTO`, `EXPLOSAO`, `VOTAR 1`, `VOTAR 2`, `VOTAR 3`).
- **Comentários Arbitrários**: Frases comuns de espectadores que não coincidem com os comandos são ignoradas de forma segura e não disparam ações no motor.

---

## 4. Proteção Anti-Spam e Rate Limiting

Para impedir que espectadores mal-intencionados inundem o servidor com mensagens automatizadas (bots de chat):
1. **Cooldown por Usuário**: Cada usuário é obrigado a respeitar um intervalo mínimo configurável (padrão: 2.000 ms) entre um comando e outro. Comandos repetidos dentro da janela de cooldown são rejeitados com aviso de espera.
2. **Limite Global por Segundo**: O servidor monitora a taxa global de comandos. Caso a live receba mais de 50 comandos/segundo, o excesso é descartado com log explicativo no painel de diagnóstico, prevenindo sobrecarga da CPU.

---

## 5. Boas Práticas para o Administrador

1. Altere a senha padrão do administrador (`admin123456`) imediatamente após a instalação.
2. Gere uma chave `JWT_SECRET` exclusiva para seu ambiente de produção.
3. Nunca transmita a tela do Painel Administrativo durante a live; compartilhe apenas a janela ou a fonte de navegador do `/live`.
4. Mantenha o arquivo `.env` fora de commits públicos no Git (verifique o `.gitignore`).
