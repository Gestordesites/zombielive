# 📱 Integração com TikTok LIVE — ZOMBIE LIVE

## 1. Como Funciona a Integração

A integração do **Zombie Live** com o TikTok LIVE é realizada através de um adaptador dedicado (`TikTokProvider`), que utiliza a biblioteca de código aberto `tiktok-live-connector`.

A conexão opera assinando o fluxo de Webcast público da transmissão ao vivo. Isso significa que:
- **Você NUNCA precisa fornecer sua senha do TikTok.**
- **Não são exigidos cookies, tokens secretos ou credenciais privadas.**
- **O backend conecta-se apenas pelo nome de usuário público do canal.**

> ⚠️ **Importante**: A biblioteca `tiktok-live-connector` é uma solução aberta desenvolvida pela comunidade e não representa uma API oficial comercial do TikTok. Ela depende da disponibilidade pública dos eventos da sala de transmissão.

---

## 2. Pré-requisitos para Conexão

Para que a conexão seja bem-sucedida:
1. Sua conta do TikTok deve estar **ativamente em transmissão (AO VIVO)** no momento da conexão.
2. Seu perfil ou live não pode estar restrito para menores ou com bloqueio de região.
3. O nome de usuário inserido no painel deve ser exatamente o `@arroba` público do canal transmissor.

---

## 3. Eventos Mapeados e Normalizados

O `TikTokProvider` traduz os eventos brutos da rede nos contratos tipados do jogo (`NormalizedLiveEvent`):

| Evento Bruto TikTok | Evento Normalizado no Jogo | Ação Desencadeada |
| :--- | :--- | :--- |
| `chat` | `COMMENT` | Verificado pelo processador de comandos (`CURA`, `ESCUDO`, `VOTAR`, etc.). |
| `like` | `LIKE` | Soma o número de curtidas na Meta Coletiva da Live. |
| `follow` | `FOLLOW` | Exibe faixa de boas-vindas na tela e cura +10 HP do herói. |
| `gift` | `GIFT` | Dispara a Supernova devastadora e cura +30 HP em agradecimento. |

---

## 4. Tratamento Especial para Curtidas (Deduplicação de Likes)

O TikTok envia dados de curtidas em dois formatos distintos:
1. `likeCount`: Número incremental de toques na tela enviados pelo usuário.
2. `totalLikeCount`: Contador acumulado total de curtidas da sala da live.

O motor do Zombie Live implementa um algoritmo de **delta positivo**: quando o TikTok envia o contador acumulado, o sistema calcula apenas a diferença entre o valor atual e o último valor registrado, garantindo que o mesmo lote de curtidas nunca seja somado em duplicidade.

---

## 5. Passo a Passo para Conectar

1. Inicie a transmissão da sua live pelo celular ou pelo TikTok LIVE Studio.
2. Com a live ativa, abra o **Painel Administrativo** do Zombie Live (`http://localhost:3001`).
3. Vá até a aba **Configurações & TikTok**.
4. No campo **Nome de Usuário TikTok**, digite seu nome de usuário (ex: `meucanal`).
5. Clique no botão verde **Conectar à Live**.
6. O conector estabelecerá a conexão com a sala e o status mudará para `✅ Ativa` com o badge vermelho `🔴 TIKTOK LIVE CONECTADO`.
7. A partir deste momento, todos os comentários e curtidas dos seus espectadores passarão a interagir diretamente com o jogo.

---

## 6. Diagnóstico de Erros Comuns

- **"Falha ao conectar à live do TikTok: Live offline ou não encontrada"**:
  - Verifique se a live já foi iniciada e está visível para outras pessoas.
  - Certifique-se de que digitou o nome de usuário sem espaços e sem o caractere `@`.
- **"Limite de conexões atingido (IP Rate Limit)"**:
  - O TikTok pode temporariamente restringir consultas excessivas vindas do mesmo IP. Se ocorrer, aguarde 2 minutos ou utilize o **Modo Simulador** para continuar a partida normalmente.
