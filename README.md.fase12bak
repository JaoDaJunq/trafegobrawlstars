# Brawl Adapt 3D - Fase 6 - Personagens caracterizados

Versao atualizada do prototipo com os 7 brawlers ja caracterizados visualmente no jogo, mantendo a base da Fase 5 com multiplayer, PvP, caixas sincronizadas e barra de vida acima dos personagens.

## O que entrou nesta versao

- Joao, Luan, Thomas, Djonga, Gui, Lorenzo e Ministro com visuais personalizados.
- Gui recebeu visual de controlador arcano: cabelo volumoso, oculos, camisa preta, detalhes roxos/dourados, faixa arcana e orbe magico.
- Lorenzo recebeu visual de suporte: hoodie preto, cabelo claro/franja, AirPods, corrente, rig tecnico, detalhes teal e canhao de suporte.
- Ministro recebeu visual de suporte/controle no estilo Byron: cabelo cacheado, barba leve, jaqueta puffer escura, frascos de elixir, detalhes verdes e arma de dardo/elixir.
- Barra de vida acima de todos os personagens, incluindo jogador local e remotos.
- A barra de vida diminui conforme o HP cai, entra em alerta com vida baixa e fica vermelha quando o personagem cai.
- Concept sheets dos 7 personagens incluidos em `assets/concepts/`.

## Mantido das fases anteriores

- Multiplayer online por PIN usando Supabase Realtime.
- Selecao de brawler antes de entrar/criar sala.
- Dano entre jogadores no modelo peer-authoritative.
- Vida, queda/nocaute e respawn simples sincronizados pela rede.
- Caixas quebradas/danificadas sincronizadas entre jogadores conectados.
- Ataque basico e Super especificos por brawler.

## Brawlers implementados no gameplay

- Joao: rosa azul de media distancia; Super de correntes em area.
- Luan: espada em cone; Super de avanco giratorio.
- Djonga: combo de 3 socos; Super de salto com impacto.
- Thomas: laminas em leque; Super de invisibilidade temporaria.
- Gui: orbe magico com fragmentos; Super de puxao/controle.
- Lorenzo: rajada larga de 9 estilhacos; Super de torreta de cura.
- Ministro: dardo longo; Super de frasco em area.

## Ressalvas

Os modelos ainda sao construidos com geometrias simples do Three.js, sem arquivos 3D externos. A intencao desta etapa e deixar os personagens reconheciveis e com identidade propria dentro do prototipo.

Esta versao ainda nao e um servidor autoritativo. O PvP funciona no modelo peer-authoritative: cada cliente calcula se o proprio jogador foi atingido pelos ataques recebidos pela rede.

## Como rodar

Abra `index.html` no navegador ou publique a pasta inteira no GitHub Pages.

A versao compilada esta em:

```txt
dist/bundle.js
```

## Como editar e recompilar

```bash
npm install
npm run build
```

Estrutura principal:

```txt
src/
  brawlers.js       catalogo dos brawlers e stats
  brawlerMesh.js    modelos visuais e caracterizacao dos personagens
  attackEffects.js  ataques em cone, area, dash, salto, corrente e torreta
  main.js           cena, HUD, selecao, sala, ataques, name tags e barras de vida
  player.js         jogador local e atributos por brawler
  remotePlayer.js   jogador remoto com brawler sincronizado
  network.js        Supabase Realtime com Presence + Broadcast
assets/concepts/    concept sheets dos 7 personagens caracterizados
```

## Fase 8 — Ajustes de gameplay, mapa e mira

- Barra de Super saiu do centro e foi para o canto inferior direito.
- Arena ampliada para 34 x 24, com obstáculos redistribuídos e mais espaço para combate.
- Spawns agora ficam bem separados entre si, priorizando cantos e laterais da arena.
- Recarga e cadência foram retunadas por brawler para reduzir a sensação de espera excessiva entre tiros.
- Super agora é disparada no Q. Espaço ainda funciona como atalho secundário.
- Segurar Shift mostra a área/alcance do ataque básico. Segurar Shift + Q mostra a prévia da Super.
- Lorenzo agora segue melhor a lógica da Pam: rajada de 9 projéteis espalhados, em voleio amplo.
- Thomas agora segue melhor a lógica do Leon: 4 lâminas em cone estreito, com dano mais forte de perto e menor à distância.
- Gui agora segue melhor a lógica do Eugênio/Gene: um orbe principal que, se não acertar nada, se divide em 6 projéteis em cone.

## Fase 9 — fidelidade visual máxima aos concepts

Nesta versão, os personagens jogáveis passaram a usar uma camada visual principal baseada diretamente nos concepts aprovados. Cada brawler recebeu um sprite recortado do próprio concept art em `assets/sprites/`, aplicado por cima do mesh 3D modular.

A prioridade desta fase foi deixar o personagem em jogo o mais fiel possível à arte criada: silhueta, roupa, cabelo, acessórios, arma e paleta. O mesh 3D continua existindo por baixo para manter sombra, posição, colisão, mira, ataques e compatibilidade com o multiplayer, mas fica suavizado visualmente para não competir com o sprite do concept.

## Fase 10 - Correções de jogabilidade e visibilidade

- Removida a solução de sprites colados sobre o boneco jogável. O jogo voltou para personagem 3D modular para evitar visual chapado e bugs de leitura.
- Arena ampliada para 60x40, com obstáculos e moitas reposicionados.
- Câmera agora acompanha o jogador local com suavização, em vez de ficar fixa no centro do mapa.
- Spawns reposicionados em cantos/laterais com mais distância entre jogadores.
- Projéteis agora têm visual específico por personagem: rosa azul, lâminas, orbe, sucata/rajada e dardo de elixir.
- Thomas fica invisível para outros jogadores durante a Super.
- Jogadores dentro de moitas ficam invisíveis para inimigos fora da mesma moita. Se os dois estiverem na mesma moita, eles se enxergam.
- Preview de alcance com Shift recebeu prioridade visual para aparecer por cima do chão e do cenário.

## Fase 11 · Battle Royale / Silhueta / Névoa

Mudanças desta versão:

- Arena ampliada para 100 x 80.
- Spawns fixos e bem separados usando uma lista global em `src/constants.js`.
- Moitas com geração visual determinística: todos os clientes veem as moitas no mesmo local e no mesmo formato geral.
- Removido o sprite 2D colado no personagem jogável.
- Personagens voltaram a ser 3D modular, com silhuetas mais exageradas:
  - João: jaqueta/hoodie e rosa azul grande.
  - Luan: corpo mais forte e espada longa vermelha.
  - Djonga: lutador sem camisa, shorts e luvas grandes.
  - Thomas: corpo slim, cabelo claro e lâminas duplas.
  - Gui: visual arcano com orbe roxo grande.
  - Lorenzo: canhão médico grande, rig técnico e hoodie.
  - Ministro: puffer, cabelo cacheado e dardos/frascos verdes.
- Névoa tóxica circular ao redor do mapa, fechando em 5 minutos.
- HUD com contador de vivos, tempo restante e porcentagem aproximada da zona segura.
- Ao zerar vida, o jogador é eliminado, não respawna automaticamente e entra em modo espectador.
- Em modo espectador, a câmera abre para uma visão maior do mapa.
- Thomas continua ficando invisível para outros jogadores na Ultimate.
- Jogadores dentro de moita ficam invisíveis para inimigos fora dela; se estiverem na mesma moita, conseguem se ver.


## Fase 12 — Modos, lobby e ranking

- Foram criados dois modos de jogo:
  - **Battle Royale**: usa lobby, host inicia a partida, início sincronizado, timer de 5 minutos, névoa tóxica e eliminação/espectador.
  - **Aberto por Kills**: entra direto no mapa, sem névoa/tempo final, com ranking por kills, respawn e coroa no líder.
- No modo Battle Royale, o canal usa o PIN + modo, então salas de modos diferentes não se misturam.
- No modo Aberto, aperte **C** para trocar de personagem dentro da partida.
- A seleção inicial de personagem agora abre uma tela de detalhes com a concept art, stats, ataque e Super antes de confirmar.
- O HUD ganhou contador de kills, modo atual e destaque do líder no modo aberto.
