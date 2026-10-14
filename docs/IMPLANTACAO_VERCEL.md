# ▲ Implantação na Vercel — ZOMBIE LIVE

## 1. Características e Limitações da Vercel

A **Vercel** é uma plataforma especializada na distribuição de frontends estáticos e funções *serverless* efêmeras (com limite de execução de poucos segundos).

### O que PODE ser hospedado na Vercel:
- **O Frontend do Jogo (`apps/game`)**: Entrega ultra-rápida via CDN global de alta performance.
- **O Painel Administrativo (`apps/admin`)**: Aplicação SPA React moderna e veloz.

### O que NÃO PODE ser executado na Vercel:
- **O Servidor Backend (`apps/server`)**: O backend do Zombie Live executa um loop autoritativo contínuo de 30 FPS e mantém conexões WebSocket persistentes com os clientes e com a live do TikTok. Arquiteturas serverless não suportam daemons contínuos em segundo plano.

Portanto, a estratégia recomendada caso deseje usar a Vercel é a **Arquitetura Híbrida**:
- **Backend**: Executando em uma VPS (Hostinger, Render, Railway ou servidor local com túnel).
- **Frontend (Jogo / OBS)**: Distribuído gratuitamente pela Vercel.

---

## 2. Passo a Passo para Publicar o Jogo na Vercel

### Passo 1: Preparar o Repositório no GitHub / GitLab
Suba seu projeto para o seu repositório Git pessoal.

### Passo 2: Importar o Projeto na Vercel
1. Acesse o painel da [Vercel](https://vercel.com) e clique em **Add New... > Project**.
2. Conecte sua conta do GitHub e selecione o repositório `zombie-live`.

### Passo 3: Configurar o Diretório Raiz do Projeto
Nas configurações de importação:
- **Root Directory**: Clique em `Edit` e selecione `apps/game`.
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Passo 4: Configurar Variáveis de Ambiente na Vercel
Na seção **Environment Variables**, adicione:
- **`VITE_SERVER_URL`**: A URL pública onde seu backend está rodando (ex: `https://api.seudominio.com` ou `https://seu-vps.com`).

### Passo 5: Concluir o Deploy
Clique em **Deploy**. Em cerca de 1 minuto, a Vercel gerará uma URL segura como:
`https://zombie-live-game.vercel.app`

Você poderá utilizar esta URL diretamente como Fonte de Navegador no seu OBS Studio!

---

## 3. Publicando o Painel Administrativo na Vercel (Opcional)

Repita os mesmos passos acima, selecionando o **Root Directory** como `apps/admin`.
Defina a variável `VITE_SERVER_URL` apontando para o seu backend.
