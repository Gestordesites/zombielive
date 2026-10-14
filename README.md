# 🧟‍♂️ ZOMBIE LIVE — Plataforma de Jogos Interativos para TikTok LIVE

> Jogo de sobrevivência 2D interativo em tempo real, onde um herói autônomo enfrenta hordas de zumbis e a audiência da live participa ativamente através de comentários, curtidas, novos seguidores e presentes.

![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![Phaser](https://img.shields.io/badge/Phaser-3.88-orange.svg)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black.svg)
![React](https://img.shields.io/badge/React-19.0-cyan.svg)

---

## 🎯 Visão Geral do Projeto

**ZOMBIE LIVE** foi construído como uma aplicação própria, 100% controlada pelo proprietário, com código modular, arquitetura desacoplada e foco em tecnologias gratuitas e de código aberto. 

Não exige APIs pagas, não cobra mensalidade de serviços externos e funciona em **Modo Demonstração (Simulador)** sem precisar de conta de TikTok, token ou banco de dados externo.

### Principais Características

- **Arena 2D Top-Down em Phaser 3**: Visual estilo survival apocalíptico, gráficos originais gerados procedimentalmente (sem risco de links quebrados ou violações de direitos autorais).
- **Sobrevivente com IA Autônoma**: Movimentação inteligente de kiting (desvia de ameaças quando zumbis se aproximam), detecção e mira automática de alvos, cálculo de alcance e disparos contínuos.
- **Sistema de Ondas e Chefes**: Ondas com dificuldade progressiva e Chefes Colossais a cada 5 ondas, com alertas de ataque em área (telegraphing) e barra de vida épica.
- **Participação Coletiva da Live**:
  - **Curtidas**: Alimentam a barra da Meta Coletiva, liberando Super Bônus e Curas em massa.
  - **Comentários**: Ativam habilidades especiais (`CURA`, `ESCUDO`, `ATAQUE`, `FOGO`, `CONGELAMENTO`, `EXPLOSAO`) e votam na evolução do herói (`VOTAR 1`, `VOTAR 2`, `VOTAR 3`).
  - **Novos Seguidores**: Disparam o anúncio triunfal *"NOVO SOBREVIVENTE! @usuario entrou na batalha!"* com bônus de vida para o herói.
  - **Presentes Virtuais**: Ativam a devastadora Supernova e restauram as energias do sobrevivente.
- **Painel Administrativo Completo**: Dashboard em tempo real, controle de partidas, ajuste dinâmico de ondas, simulador interativo de eventos, histórico e diagnóstico do sistema.
- **Integração TikTok LIVE**: Camada agnóstica (`LiveEventProvider`) com conector aberto baseado no protocolo Webcast público, proteção contra enxurradas e anti-spam.
- **Compatibilidade Nativa com OBS Studio**: Rota dedicada `/live` em proporção 16:9 (1080p/720p), limpa, sem controles administrativos ou dados sensíveis expostos.

---

## 🏗️ Estrutura do Monorepo

```text
zombie-live/
├── apps/
│   ├── game/             # Frontend do Jogo (Phaser 3 + Vite + TypeScript)
│   ├── admin/            # Painel Administrativo (React 19 + Lucide + Vite)
│   └── server/           # Backend Autoritativo (Node.js + Express + Socket.IO)
├── packages/
│   └── shared/           # Contratos, tipos TypeScript e constantes compartilhadas
├── docs/                 # Documentação técnica e operacional completa em PT-BR
│   ├── ARQUITETURA.md
│   ├── COMO_O_JOGO_FUNCIONA.md
│   ├── INSTALACAO_LOCAL.md
│   ├── CONFIGURACAO.md
│   ├── PAINEL_ADMINISTRATIVO.md
│   ├── INTEGRACAO_TIKTOK.md
│   ├── COMO_FAZER_LIVE.md
│   ├── IMPLANTACAO_HOSTINGER.md
│   ├── IMPLANTACAO_VERCEL.md
│   ├── SEGURANCA.md
│   ├── TESTES.md
│   └── RESOLUCAO_DE_PROBLEMAS.md
├── docker-compose.yml     # Orquestração com PostgreSQL opcional
├── Dockerfile             # Multi-stage build para produção
├── .env.example           # Modelo documentado de variáveis de ambiente
├── package.json           # Scripts de orquestração do monorepo
└── README.md              # Este guia
```

---

## 🚀 Início Rápido (Desenvolvimento Local)

### 1. Pré-requisitos
- **Node.js**: versão 20.x ou superior (testado e homologado no Node v25).
- **npm**: versão 10.x ou superior.

### 2. Instalação

```bash
# Clone o repositório ou acerte a pasta do projeto
cd zombie-live

# Crie o arquivo de variáveis de ambiente
cp .env.example .env

# Instale todas as dependências
npm install
```

### 3. Execução em Modo de Desenvolvimento

Você pode iniciar todos os serviços simultaneamente:

```bash
npm run dev
```

Ou iniciar cada serviço em terminais separados:

```bash
# Terminal 1 - Servidor Backend (Porta 4000)
npm run dev:server

# Terminal 2 - Jogo / OBS (Porta 3000)
npm run dev:game

# Terminal 3 - Painel Administrativo (Porta 3001)
npm run dev:admin
```

### 4. Acessando as Interfaces

| Aplicação | URL Local | Finalidade | Credenciais Padrão |
| :--- | :--- | :--- | :--- |
| **Jogo Público / OBS** | `http://localhost:3000` ou `http://localhost:4000/live` | Captura para live | Acesso livre |
| **Painel de Controle** | `http://localhost:3001` ou `http://localhost:4000/admin` | Gestão e simulação | `admin` / `admin123456` |
| **API Backend** | `http://localhost:4000` | REST API e WebSockets | — |

---

## 🎮 Comandos Disponíveis para a Audiência

Quando a partida estiver em andamento, os espectadores podem digitar no chat da live:

| Comando | Efeito no Jogo |
| :--- | :--- |
| `CURA` | Restaura +50 de Vida do sobrevivente (respeitando a vida máxima). |
| `ESCUDO` | Ativa barreira protetora que reduz 80% do dano sofrido durante 6 segundos. |
| `ATAQUE` | Desfere um golpe circular de energia de 360°, varrendo zumbis ao redor. |
| `FOGO` | Incendeia o chão da arena com chamas ardentes por 4 segundos. |
| `CONGELAMENTO` | Desacelera 75% da velocidade de todos os zumbis vivos por 5 segundos. |
| `EXPLOSAO` | Detona uma Supernova colossal, aniquilando inimigos na área. |
| `VOTAR 1`, `2`, `3` | Vota na melhoria de atributo durante a evolução de nível do herói. |

---

## 🧪 Testes Automatizados

Para rodar os testes unitários e de integração do motor de jogo, anti-spam, autenticação e armazenamento:

```bash
npm test
```

---

## 📚 Documentação Detalhada

Consulte os guias passo a passo no diretório [`docs/`](./docs/):

- [Arquitetura do Sistema](./docs/ARQUITETURA.md)
- [Como o Jogo Funciona](./docs/COMO_O_JOGO_FUNCIONA.md)
- [Instalação Local Passo a Passo](./docs/INSTALACAO_LOCAL.md)
- [Guia de Configuração e Variáveis](./docs/CONFIGURACAO.md)
- [Manual do Painel Administrativo](./docs/PAINEL_ADMINISTRATIVO.md)
- [Guia do Conector TikTok LIVE](./docs/INTEGRACAO_TIKTOK.md)
- [Como Configurar e Transmitir no OBS Studio](./docs/COMO_FAZER_LIVE.md)
- [Implantação em VPS Hostinger](./docs/IMPLANTACAO_HOSTINGER.md)
- [Publicação de Frontend na Vercel](./docs/IMPLANTACAO_VERCEL.md)
- [Políticas de Segurança e Proteção](./docs/SEGURANCA.md)
- [Suíte de Testes](./docs/TESTES.md)
- [Resolução de Problemas Comuns](./docs/RESOLUCAO_DE_PROBLEMAS.md)

---

## 📄 Licença

Distribuído sob a licença MIT. Livre para uso pessoal e comercial sem custos de licenciamento.
