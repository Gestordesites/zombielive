# 🎥 Como Fazer Live com OBS Studio — ZOMBIE LIVE

Este guia ensina como configurar o OBS Studio (ou Streamlabs OBS) para transmitir o **Zombie Live** em alta qualidade com proporção 16:9 profissional.

---

## 1. A Rota Pública Dedicada (`/live`)

Para garantir segurança e limpeza visual na transmissão, o Zombie Live possui uma rota exclusiva:
- Em desenvolvimento: `http://localhost:3000`
- Em produção: `http://seu-servidor:4000/live`

Esta rota contém **estritamente os elementos visuais do jogo** (arena, personagens, efeitos, vida e placar). **Nenhum controle administrativo, botão confidencial ou token é renderizado nessa tela.**

---

## 2. Passo a Passo de Configuração no OBS Studio

### Passo 1: Iniciar os Serviços do Zombie Live
Certifique-se de que o servidor do jogo está em execução no seu computador (`npm run dev`).

### Passo 2: Adicionar a Fonte de Navegador
1. Abra o **OBS Studio**.
2. Na caixa **Fontes** (Sources), clique no botão **`+`** (Adicionar).
3. Selecione a opção **Navegador** (Browser Source).
4. Dê um nome para a fonte, como `Zombie Live - Jogo`.
5. Na janela de propriedades que se abrir:
   - **URL**: `http://localhost:3000` (ou a URL de produção).
   - **Largura (Width)**: `1920` (ou `1280`).
   - **Altura (Height)**: `1080` (ou `720`).
   - **Taxa de quadros (FPS)**: `60`.
   - **Desmarcar**: "Desativar fonte quando invisível" (para manter o jogo sincronizado mesmo se você alternar de cena).
6. Clique em **OK**.

A arena de sobrevivência do Zombie Live surgirá perfeitamente enquadrada na tela do seu OBS.

---

## 3. Fluxo de Trabalho Durante a Transmissão

Recomendamos utilizar uma configuração de dois monitores ou dividir a tela em duas metades:

```text
┌──────────────────────────────┐  ┌──────────────────────────────┐
│         MONITOR 1            │  │          MONITOR 2           │
│                              │  │                              │
│       OBS STUDIO             │  │   PAINEL ADMINISTRATIVO      │
│  (Cena com o Jogo Rodando)   │  │   (http://localhost:3001)    │
│                              │  │                              │
│  - Captura de microfone      │  │   - Iniciar / Pausar         │
│  - Webcam do apresentador    │  │   - Disparo de habilidades   │
│  - Transmitindo para TikTok  │  │   - Monitor de comandos      │
└──────────────────────────────┘  └──────────────────────────────┘
```

---

## 4. Roteiro da Live Passo a Passo

1. **Abrir a live**: Inicie sua live no TikTok (pelo TikTok LIVE Studio ou celular).
2. **Conectar o Zombie Live**: No Painel Administrativo, informe seu `@arroba` na aba **Configurações & TikTok** e clique em **Conectar à Live**.
3. **Engajar o público**: Diga aos espectadores:
   > *"Galera, o jogo começou! O nosso herói precisa da ajuda de vocês! Curtam a live para encher a barra de meta e digitem CURA, ESCUDO ou EXPLOSÃO no chat para ajudar nos momentos difíceis!"*
4. **Iniciar a Partida**: No painel, clique em **Iniciar Partida**.
5. **Acompanhar e Narrar**: Conforme a barra de meta subir ou votações de melhoria aparecerem na tela, comemore e incentive os espectadores a votarem com `VOTAR 1`, `VOTAR 2` ou `VOTAR 3`.
6. **Encerrar a Partida**: Ao final da sessão, clique em **Encerrar Partida** no painel para salvar os resultados no histórico.
