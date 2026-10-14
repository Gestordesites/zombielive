# 🧟 Como o Jogo Funciona — ZOMBIE LIVE

## 1. O Conceito Central

**Zombie Live** é um jogo de sobrevivência em arena 2D com visão superior (top-down), projetado especificamente para transmissões ao vivo interativas.

O personagem central (o Sobrevivente) é **controlado de forma autônoma pela inteligência artificial**. A missão dos espectadores da live é atuar como uma equipe de suporte coletivo, enviando comandos no chat, curtindo a live, seguindo o perfil e enviando presentes para mantê-lo vivo contra ondas crescentes de mortos-vivos.

---

## 2. A Inteligência Artificial do Sobrevivente

O herói não depende de teclado ou controle humano:
1. **Radar de Ameaças**: O sobrevivente escaneia periodicamente o raio da arena e calcula o zumbi mais próximo.
2. **Kiting (Manobra Evasiva)**: Se qualquer inimigo se aproximar a menos de 120 pixels, o sobrevivente recua estrategicamente na direção oposta, mantendo os zumbis afastados enquanto dispara.
3. **Aproximação Cautelosa**: Caso os inimigos estejam fora do raio ideal de disparo, ele avança lentamente até estabelecer a distância de ataque ideal.
4. **Respeito aos Limites**: O algoritmo de navegação possui margens de colisão com as bordas da tela, impedindo que o personagem fique preso fora da arena visível.
5. **Disparo Automático**: A arma dispara projéteis de plasma na cadência definida (padrão de 1.8 ataques por segundo).

---

## 3. Tipos de Inimigos

| Inimigo | Características | Comportamento | Recompensas |
| :--- | :--- | :--- | :--- |
| **Zumbi Comum** | 100 HP, Vel 80, Dano 10 | Avança em bando em direção ao herói com passos regulares. | +10 XP, +100 Pontos |
| **Zumbi Corredor** | 50 HP, Vel 150, Dano 12 | Mutação rápida e agressiva. Fecha distância rapidamente. | +15 XP, +150 Pontos |
| **Zumbi Tanque** | 350 HP, Vel 45, Dano 25 | Bruto encouraçado. Suporta dezenas de tiros antes de cair. | +35 XP, +300 Pontos |
| **O Colosso Zumbi (Chefe)** | 2.500+ HP, Vel 60, Dano 40 | Surge a cada 5 ondas com barra de vida gigante na tela. | +300 XP, +2.500 Pontos + Cura total |

### Ataque Especial do Chefe (Telegraphing)
A cada 8 segundos, o Colosso Zumbi canaliza um ataque esmagador de solo (*Ground Smash*). Um círculo vermelho de aviso de 180 pixels pulsa no chão durante 2 segundos. Em seguida, uma explosão massiva causa dano devastador a qualquer um que estiver dentro da área.

---

## 4. Sistema de Ondas

- **Ondas 1 a 4**: Cada onda tem duração padrão de **30 segundos**. O intervalo entre o surgimento dos zumbis diminui gradativamente, aumentando a densidade da horda.
- **Onda 5 (Chefe)**: O tempo é congelado e o Chefe Colossal emerge na arena. A partida só avança para a próxima fase após a comunidade conseguir aniquilar o Chefe.
- **Ondas Seguintes (6+)**: Dificuldade progressiva com multiplicadores adicionais de vida (+12% por onda) e dano dos monstros.

---

## 5. Experiência, Evolução e Votação da Comunidade

Ao derrotar inimigos, o sobrevivente acumula esferas de experiência (XP).

Quando a barra de XP atinge o limite:
1. O personagem **sobe de nível**, acionando um efeito visual de supernova dourada.
2. Abre-se uma **Votação ao Vivo de 15 segundos** na tela com 3 cartas de melhoria:
   - **Opção [1] — Super Força**: +30% de Dano de Ataque.
   - **Opção [2] — Vitalidade Titânica**: +40 de Vida Máxima e Cura Completa.
   - **Opção [3] — Agilidade Noturna**: +25% de Velocidade e +15% de Armadura.
3. Os espectadores votam pelo chat digitando `VOTAR 1`, `VOTAR 2` ou `VOTAR 3`.
4. Ao término dos 15 segundos, o bônus mais votado é aplicado instantaneamente ao herói. Em caso de ausência de votos, a opção 1 é adotada como padrão.

---

## 6. Habilidades Especiais da Audiência

Os espectadores podem usar os seguintes comandos no chat:

- **`CURA`**: Restaura +50 de Vida (sem ultrapassar a vida máxima do sobrevivente).
- **`ESCUDO`**: Cria uma barreira de energia azul brilhante que absorve 80% de todo o dano por 6 segundos.
- **`ATAQUE`**: O herói desfere um golpe de espada radial de 360°, varrendo zumbis em um raio de 220 pixels.
- **`FOGO`**: Incendeia o chão da arena com uma onda de fogo que queima todos os zumbis ao redor por 4 segundos.
- **`CONGELAMENTO`**: Desencadeia uma nevasca ártica que reduz em 75% a velocidade de movimento de todos os zumbis por 5 segundos.
- **`EXPLOSAO`**: Detona uma Supernova massiva de 350 pixels que pulveriza zumbis menores instantaneamente.

Cada habilidade possui um tempo de recarga (cooldown) individual para manter a partida equilibrada e dinâmica.

---

## 7. Meta Coletiva de Curtidas

No canto superior direito da tela, é exibida a barra da **Meta da Live** (padrão inicial de 500 curtidas).

Todas as curtidas enviadas pelos espectadores na transmissão ao vivo somam-se a essa barra em tempo real. Ao atingir 100%, a recompensa coletiva é destravada:
- Cura em massa para o Sobrevivente.
- Ativação automática do Escudo Titânico.
- +1.000 Pontos bônus para a pontuação da transmissão.
- A meta é automaticamente reiniciada em um nível superior (ex: 900 curtidas, 1.600 curtidas, etc.).

---

## 8. Notificações Especiais

- **Novo Seguidor**: Sempre que alguém segue o canal durante a transmissão, uma faixa vibrante surge no topo:  
  `NOVO SOBREVIVENTE! @nome_do_usuario entrou na batalha!` e o herói ganha +10 HP bônus.
- **Presentes Virtuais**: Presentes enviados na live ativam a Supernova de fogos e restauram a vida do herói como agradecimento em tempo real.
