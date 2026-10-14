# 🌐 Implantação na Hostinger — ZOMBIE LIVE

Este documento orienta a implantação do **Zombie Live** na infraestrutura da **Hostinger**, considerando os diferentes tipos de planos oferecidos.

---

## 1. Identificação do Tipo de Hospedagem

Antes de iniciar, verifique qual modalidade de plano você possui na Hostinger:

1. **VPS (Servidor Virtual Privado — KVM)**: **Recomendado**. Oferece acesso root completo (SSH), permitindo a execução de processos em segundo plano persistentes (Node.js + WebSockets + PM2 ou Docker).
2. **Hospedagem com Suporte a Node.js (Cloud / cPanel)**: Permite executar aplicações Node.js, porém pode ter limitações quanto à persistência de conexões WebSocket de longa duração.
3. **Hospedagem Compartilhada Tradicional (Single/Premium/Business)**: **Não suporta processos persistentes Node.js**. Nestes planos só é possível hospedar arquivos estáticos (HTML/CSS/JS). O backend precisará rodar em outro ambiente.

---

## 2. Implantação em VPS Hostinger (Ubuntu / Debian) — Passo a Passo

Esta é a opção ideal para produção com alta estabilidade.

### Passo 1: Conectar via SSH e Atualizar o Sistema

```bash
ssh root@SEU_IP_HOSTINGER
apt update && apt upgrade -y
```

### Passo 2: Instalar Node.js (v22 LTS) e Git

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git build-essential nginx
```

Verifique as versões:
```bash
node -v
npm -v
```

### Passo 3: Clonar o Repositório e Configurar `.env`

```bash
cd /var/www
git clone https://seu-repositorio/zombie-live.git
cd zombie-live

# Criar .env de produção
cp .env.example .env
nano .env
```

No `.env`, ajuste para valores de produção:
```env
NODE_ENV=production
PORT=4000
HOST=127.0.0.1
JWT_SECRET=coloque_uma_chave_aleatoria_longa_aqui
```

### Passo 4: Instalar e Construir a Aplicação

```bash
npm install
npm run build
```

### Passo 5: Gerenciador de Processos (PM2)

Instale o PM2 para garantir que o Zombie Live continue rodando em segundo plano e reinicie automaticamente caso o servidor seja reiniciado:

```bash
npm install -g pm2

# Iniciar o servidor com o PM2
pm2 start apps/server/dist/index.js --name "zombie-live"

# Configurar para inicializar no boot do Linux
pm2 startup
pm2 save
```

### Passo 6: Configurar Nginx como Proxy Reverso com Suporte a WebSockets

Crie o arquivo de configuração do Nginx:

```bash
nano /etc/nginx/sites-available/zombie-live
```

Insira o conteúdo:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Suporte dedicado a WebSockets do Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative a configuração e recarregue o Nginx:

```bash
ln -s /etc/nginx/sites-available/zombie-live /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Passo 7: Certificado SSL Gratuito (HTTPS com Certbot)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

O Certbot configurará o HTTPS automaticamente.

A partir desse momento:
- Jogo público para o OBS: `https://seu-dominio.com/live`
- Painel Administrativo: `https://seu-dominio.com/admin`

---

## 3. Opção Alternativa: Usando Docker Compose na VPS

Se sua VPS possuir Docker e Docker Compose:

```bash
cd /var/www/zombie-live
docker compose up -d --build
```

O contêiner subirá automaticamente o PostgreSQL e o Backend Zombie Live integrado.
