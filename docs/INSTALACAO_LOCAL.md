# 💻 Instalação e Execução Local — ZOMBIE LIVE

Este guia detalha o processo de instalação e execução do **Zombie Live** no seu computador local (Windows, Linux ou macOS).

---

## 1. Requisitos do Sistema

- **Sistema Operacional**: Windows 10/11, Ubuntu 20.04+, Debian 11+, macOS 12+
- **Processador**: Dual-Core 2.0 GHz ou superior
- **Memória RAM**: Mínimo 4 GB (Recomendado 8 GB)
- **Node.js**: Versão 20.x, 22.x ou superior (Verifique com `node -v`)
- **Navegador**: Google Chrome, Edge, Firefox, Brave ou Opera atualizados

---

## 2. Passo a Passo de Instalação

### Passo 1: Abrir o Terminal na Pasta do Projeto

Abra o PowerShell (Windows) ou Bash (Linux/macOS) na raiz do projeto `zombie-live`:

```bash
cd zombie-live
```

### Passo 2: Configurar o Arquivo de Variáveis de Ambiente (`.env`)

Copie o modelo de variáveis pré-configurado:

```bash
# No Windows PowerShell:
Copy-Item .env.example .env

# No Linux ou macOS:
cp .env.example .env
```

> **Nota:** As configurações padrão do `.env.example` já vêm prontas para rodar o jogo imediatamente no modo local sem nenhuma alteração obrigatória.

### Passo 3: Instalar as Dependências

Execute o comando na raiz do projeto:

```bash
npm install
```

O comando instalará automaticamente os módulos do monorepo (`packages/shared`, `apps/server`, `apps/game` e `apps/admin`).

### Passo 4: Compilar o Pacote Compartilhado

Antes de iniciar as aplicações pela primeira vez, compile os contratos de dados compartilhados:

```bash
npm run build:shared
```

---

## 3. Iniciando as Aplicações

Você tem duas opções para iniciar o ambiente:

### Opção A: Iniciar tudo de uma vez (Recomendado)

```bash
npm run dev
```

Este comando inicia em paralelo com cores distintas no terminal:
- `SERVER` em `http://localhost:4000`
- `GAME` em `http://localhost:3000`
- `ADMIN` em `http://localhost:3001`

### Opção B: Iniciar em três terminais separados

Caso prefira acompanhar os logs individuais de cada módulo:

```bash
# Terminal 1: Backend Node.js
npm run dev:server

# Terminal 2: Jogo Phaser 3
npm run dev:game

# Terminal 3: Painel Administrativo React
npm run dev:admin
```

---

## 4. Testando a Instalação

1. **Abrir o Painel Administrativo**:
   - Acesse no seu navegador: `http://localhost:3001`
   - Entre com as credenciais padrão:
     - **Usuário:** `admin`
     - **Senha:** `admin123456`
2. **Abrir a Tela do Jogo**:
   - Em outra aba ou janela, acesse: `http://localhost:3000`
   - A arena do jogo abrirá na tela no estado de espera (*IDLE*).
3. **Iniciar a Partida**:
   - No Painel Administrativo, vá até a aba **Partida & Habilidades** e clique no botão verde **Iniciar Partida**.
   - Na tela do jogo, uma contagem regressiva de 3 segundos iniciará e os zumbis começarão a surgir.
4. **Testar os Eventos no Simulador**:
   - No Painel, clique na aba **Simulador**.
   - Clique em **+50 Curtidas**: observe a barra de meta enchendo no canto inferior direito do jogo.
   - Clique em **CURA**, **ESCUDO** ou **EXPLOSAO**: veja os efeitos visuais acontecendo ao redor do herói no jogo em tempo real.

---

## 5. Como Parar a Execução

Para encerrar as aplicações, pressione `Ctrl + C` no terminal onde o comando `npm run dev` está em execução e confirme digitando `S` (Sim).
