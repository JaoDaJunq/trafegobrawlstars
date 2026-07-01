export const ARENA_W = 60;
export const ARENA_D = 40;

export const COLORS = {
  grassBase: 0x6dbf3e,
  grassShade: 0x4e9a2c,
  grassHighlight: 0x8fdb5e,
  dirt: 0xe0b169,
  dirtShade: 0xc0925022,

  sky: 0xbfe8ff,
  fog: 0xbfe8ff,

  playerBody: 0x22e0c2,
  playerShade: 0x0e9e88,
  playerVisor: 0x102033,
  gunMetal: 0x33465a,

  pilarBase: 0x4d6a89,
  pilarShade: 0x33455c,
  pilarGold: 0xf4b740,

  crateWood: 0xd79a46,
  crateShade: 0x9c6a2c,
  cratePaper: 0xf7f2e6,
  crateSeal: 0xe5484d,

  bushLeaf: 0x2fa98c,
  bushShade: 0x1d7a64,

  gold: 0xf4b740,
  crimson: 0xe5484d,
  outline: 0x0c1420
};

export const OBSTACLES = [
  // Paredes externas internas / pilares grandes, bem espaçados
  { type: 'wall', x: 9, z: 7, w: 6.0, d: 1.0, label: 'Pilar de Report' },
  { type: 'wall', x: 51, z: 7, w: 6.0, d: 1.0, label: 'Pilar de Report' },
  { type: 'wall', x: 9, z: 33, w: 6.0, d: 1.0, label: 'Pilar de Report' },
  { type: 'wall', x: 51, z: 33, w: 6.0, d: 1.0, label: 'Pilar de Report' },

  { type: 'wall', x: 30, z: 20, w: 1.2, d: 7.0, label: 'Pilar de Report' },
  { type: 'wall', x: 30, z: 10, w: 6.4, d: 1.0, label: 'Pilar de Report' },
  { type: 'wall', x: 30, z: 30, w: 6.4, d: 1.0, label: 'Pilar de Report' },

  { type: 'wall', x: 18, z: 15, w: 4.4, d: 1.0, label: 'Pilar de Report' },
  { type: 'wall', x: 42, z: 25, w: 4.4, d: 1.0, label: 'Pilar de Report' },
  { type: 'wall', x: 18, z: 25, w: 1.0, d: 4.4, label: 'Pilar de Report' },
  { type: 'wall', x: 42, z: 15, w: 1.0, d: 4.4, label: 'Pilar de Report' },

  // Caixas para carregar Super, sem fechar demais o mapa
  { type: 'crate', x: 14, z: 11, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 46, z: 11, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 14, z: 29, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 46, z: 29, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 24, z: 20, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 36, z: 20, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 30, z: 15.8, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 30, z: 24.2, w: 1.15, d: 1.15, hp: 3, label: 'Caixa de Briefing' },

  // Moitas maiores e mais úteis para emboscada/rotação
  { type: 'bush', x: 5.0, z: 20.0, w: 7.0, d: 5.4, label: 'Zona de Baixo CTR' },
  { type: 'bush', x: 55.0, z: 20.0, w: 7.0, d: 5.4, label: 'Zona de Baixo CTR' },
  { type: 'bush', x: 30.0, z: 4.0, w: 8.0, d: 3.5, label: 'Zona de Baixo CTR' },
  { type: 'bush', x: 30.0, z: 36.0, w: 8.0, d: 3.5, label: 'Zona de Baixo CTR' },
  { type: 'bush', x: 16.0, z: 20.0, w: 4.4, d: 6.5, label: 'Zona de Baixo CTR' },
  { type: 'bush', x: 44.0, z: 20.0, w: 4.4, d: 6.5, label: 'Zona de Baixo CTR' }
];
