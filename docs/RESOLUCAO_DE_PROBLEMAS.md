# 🔧 Resolução de Problemas — ZOMBIE LIVE

Este guia reúne as soluções para os problemas técnicos mais comuns que podem surgir durante o desenvolvimento, transmissão ou implantação do **Zombie Live**.

---

## 1. Erro: "Porta em Uso" (EADDRINUSE: 4000, 3000 ou 3001)

### Causa
Outra instância do servidor ou outro programa já está escutando na mesma porta.

### Solução (Windows PowerShell)
Descubra o processo que está usando a porta e encerre-o:

```powershell
# Verificar quem está usando a porta 4000
Get-NetTCPConnection -LocalPort 4000

# Ou encerrar processos Node órfãos:
Stop-Process -Name node -Force
```

### Solução (Linux / macOS)
```bash
# Encerrar processo na porta 4000
fuser -k 4000/tcp
```

---

## 2. Jogo exibe aviso: "Reconectando ao servidor Zombie Live..."

### Causa
O frontend do jogo não está conseguindo se comunicar com o backend via WebSocket (porta 4000).

### Como Resolver:
1. Verifique se o backend está em execução (`npm run dev:server`).
2. Abra `http://localhost:4000/health` no navegador. A resposta deve ser `{"status":"OK", ...}`.
3. Se estiver acessando de outro computador na rede local, certifique-se de configurar a variável `VITE_SERVER_URL` no `.env` com o IP da máquina do servidor (ex: `http://192.168.1.100:4000`), em vez de `localhost`.
4. Verifique se o firewall do Windows não está bloqueando a porta 4000.

---

## 3. Falha ao Conectar à Live do TikTok ("Live offline ou não encontrada")

### Causa
O conector do TikTok só consegue se acoplar a salas que estejam **ao vivo publicamente** no exato momento da tentativa de conexão.

### Como Resolver:
1. Abra o aplicativo do TikTok ou TikTok LIVE Studio e inicie a transmissão ao vivo primeiro.
2. Certifique-se de que a live está em modo público (não privada ou em teste fechado).
3. No Painel Administrativo, digite o nome de usuário **exatamente como aparece na URL do perfil** (sem o símbolo `@` e sem espaços).
4. Caso a conexão caia durante a live, clique em `Conectar à Live` novamente ou alterne temporariamente para o **Modo Simulador**.

---

## 4. O Painel Administrativo desloga ou dá "401 Não Autorizado"

### Causa
O token JWT expirou ou a chave secreta `JWT_SECRET` foi alterada no `.env` enquanto o servidor estava ativo.

### Como Resolver:
1. Abra o painel administrativo (`http://localhost:3001`).
2. Se a sessão tiver expirado, o modal de login surgirá automaticamente.
3. Insira as credenciais de administrador (`admin` / `admin123456` ou a senha definida no seu `.env`).
4. Para forçar um novo login limpo, abra o Console do Desenvolvedor (F12) e execute:
   ```javascript
   localStorage.removeItem('zombie_live_admin_token');
   window.location.reload();
   ```

---

## 5. Tela Preta no OBS Studio na Fonte de Navegador

### Causa
Aceleração por hardware do OBS ou bloqueio de scripts locais.

### Como Resolver:
1. Nas propriedades da **Fonte de Navegador** no OBS:
   - Clique com o botão direito na fonte > **Propriedades**.
   - Clique no botão **Atualizar cache da página atual** (Refresh cache of current page).
2. Verifique se a URL informada é acessível normalmente no Google Chrome ou Edge da mesma máquina.
3. Em configurações do OBS: **Configurações > Avançado > Fontes de Navegador**, tente alternar a opção "Ativar aceleração de hardware nas fontes do navegador".

---

## 6. As Partidas e Configurações Resetam Quando o Servidor Reinicia

### Causa
O Zombie Live está operando no **Modo Padrão em Memória** (`InMemoryRepository`), que não salva dados em disco por conveniência e facilidade de teste sem dependências externas.

### Como Resolver:
Para persistir os dados permanentemente em disco:
1. Suba uma instância local do PostgreSQL (ou use o `docker-compose up -d postgres`).
2. Defina a variável `DATABASE_URL` no seu arquivo `.env`:
   ```env
   DATABASE_URL=postgresql://zombielive:zombielive_secret@localhost:5432/zombielive
   ```
3. Reinicie o servidor Node.js. Ele passará a salvar todas as partidas, configurações e logs no banco de dados automaticamente.
