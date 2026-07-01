# Brawl Adapt 3D - Fase 15 - Polimento, contadores e combate

Esta versão parte da Fase 14 e foca em polimento visual, revisão de bugs e preparação da arquitetura de combate para próximas fases.

## Principais mudanças

- Sistema de tipos de hit preparado para balanceamento futuro:
  - projectile
  - melee
  - area
  - poison
  - heal
  - control
  - environment
- Contadores internos de combate:
  - dano causado
  - dano recebido
  - cura realizada/recebida
  - hits básicos
  - hits de Super
  - kills/deaths
  - hits por tipo
- HUD novo com resumo: `DMG`, `TOMOU` e `CURA`.
- Números flutuantes de dano, veneno, cura e ganho de Super.
- Carregamento de Super com limite por ação, evitando que rajadas com muitos projéteis carreguem de forma absurda.
- Lógica de Super preparada para crescer sem misturar projétil, melee, área, veneno, cura e controle.

## Ajustes de gameplay

- Ataques do Luan e Djonga foram revisados para terem alcance mais confiável.
- Combo do Djonga recalcula posição e mira em cada soco, evitando o bug de socar o vazio quando o player se movimenta.
- Super do Luan mantém deslocamento controlado e com duração definida.
- Super gain revisado por personagem:
  - João carrega bem por tiro forte.
  - Luan carrega por acerto melee.
  - Djonga carrega por combo, com limite por ação.
  - Thomas e Lorenzo carregam menos por projétil, já que disparam múltiplos projéteis.
  - Gui carrega forte no orbe principal e menos nos fragmentos.
  - Ministro carrega pelo dardo, com poça focada em veneno/cura.

## Polimento visual

- Projéteis redesenhados por personagem:
  - João: rosa azul mágica.
  - Thomas: lâminas físicas, menos brilho.
  - Gui: orbe arcano brilhante.
  - Lorenzo: sucatas metálicas, sem rastro mágico exagerado.
  - Ministro: dardo/elixir com vial verde.
- Armas dos personagens ficaram mais lógicas:
  - Luan com espada maior e guarda mais clara.
  - Thomas com lâminas físicas duplas.
  - Lorenzo com canhão mais robusto e multi-barril.
  - Ministro com arma de dardo mais parecida com seringa/elixir.
- Efeitos de cura/dano agora têm feedback visual mais claro.

## Build

Gerado com:

```bash
npm run build
```

Bundle gerado em `dist/bundle.js`.
