# 🧪 Suíte de Testes Automatizados e Manuais — ZOMBIE LIVE

## 1. Executando os Testes Automatizados

O Zombie Live conta com uma suíte de testes integrada utilizando o Node Test Runner nativo e TypeScript via `tsx`.

Para executar todos os testes automatizados:

```bash
npm test
```

Para rodar apenas os testes do servidor:

```bash
npm test --workspace=@zombie-live/server
```

---

## 2. Cenários Cobertos pelos Testes Automatizados

A suíte em `apps/server/src/__tests__/gameEngine.test.ts` valida:

### 1. Motor de Jogo (`GameEngine`)
- **Estado Inicial**: Garante que o jogo inicia no estado `IDLE` com atributos corretos (100 HP, nível 1, placar zerado).
- **Cálculo de Dano e Armadura**: Verifica se o dano recebido considera a porcentagem de redução de armadura.
- **Cura sem Ultrapassar Vida Máxima**: Valida que curas parciais somam corretamente e que curas excedentes respeitam o teto de `maxHp`.
- **Habilidades Especiais e Cooldown**: Testa a ativação da primeira habilidade com sucesso e garante a rejeição de ativações consecutivas enquanto a habilidade estiver em tempo de recarga.
- **Ativação de Escudo**: Confirma que o escudo reduz o dano e atualiza a flag `shieldActive = true`.
- **Progressão de Meta Coletiva**: Simula a recepção de lotes de curtidas e calcula o percentual de avanço da barra coletiva.

### 2. Processador de Comandos e Anti-Spam (`CommandProcessor`)
- **Normalização de Texto**: Aceita comandos com espaços extras e letras maiúsculas/minúsculas (`  cura  ` -> `CURA`).
- **Cooldown por Usuário**: Aceita o primeiro comando e bloqueia o segundo comando imediato do mesmo usuário com mensagem explicativa de tempo restante.
- **Validação de Votação**: Rejeita votos quando não há votação ativa e aceita votos válidos (`VOTAR 1`, `VOTAR 2`) quando a votação de nível estiver aberta.
- **Bloqueio Fora de Partida Ativa**: Garante que comandos de combate não sejam executados com a partida parada ou em `IDLE`.

### 3. Autenticação e Repositório (`AuthService` & `InMemoryRepository`)
- **Inicialização do Administrador**: Garante a criação com hash BCrypt seguro no primeiro boot.
- **Validação de Senha**: Rejeita senhas incorretas e emite token JWT válido para senhas corretas.

---

## 3. Checklist de Testes Manuais de Aceitação

Ao executar o ambiente localmente, execute o seguinte roteiro de verificação:

- [x] O jogo abre no navegador em `http://localhost:3000` com resolução nítida 16:9.
- [x] O Sobrevivente movimenta-se sozinho e desvia quando os zumbis se aproximam.
- [x] Zumbis surgem pelas bordas da arena e perseguem o herói.
- [x] O herói ataca automaticamente com tiros de plasma nos zumbis mais próximos.
- [x] Zumbis derrotados concedem XP e sobem a pontuação.
- [x] O sistema de ondas avança a cada 30 segundos.
- [x] Na Onda 5, o Chefe Colossal emerge com barra de vida gigante e círculo de aviso de ataque especial.
- [x] O Chefe pode ser derrotado pela comunidade, liberando cura bônus.
- [x] Ao subir de nível, uma votação de 15 segundos surge na tela.
- [x] O comando `VOTAR 1` no chat ou simulador computa o voto em tempo real.
- [x] As habilidades `CURA`, `ESCUDO`, `ATAQUE`, `FOGO`, `CONGELAMENTO` e `EXPLOSAO` geram efeitos visuais nítidos.
- [x] Ao simular 500 curtidas, a meta coletiva atinge 100% e libera a recompensa na tela.
- [x] O Painel Administrativo em `http://localhost:3001` controla início, pausa, retomada e reinício.
- [x] O simulador permite testar todas as mecânicas sem nenhuma conta no TikTok.
- [x] A rota pública `/live` não exibe nenhum controle administrativo ou token.
