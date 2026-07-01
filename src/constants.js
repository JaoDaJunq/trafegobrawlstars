export const ARENA_W = 100;
export const ARENA_D = 80;
export const MATCH_DURATION = 300;

export const SPAWN_POINTS = [
  { x: 7, z: 7 },
  { x: 93, z: 73 },
  { x: 93, z: 7 },
  { x: 7, z: 73 },
  { x: 50, z: 7 },
  { x: 50, z: 73 },
  { x: 7, z: 40 },
  { x: 93, z: 40 },
  { x: 24, z: 14 },
  { x: 76, z: 66 },
  { x: 76, z: 14 },
  { x: 24, z: 66 }
];

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

  toxic: 0x45d86b,
  toxicDark: 0x0b5f35,
  gold: 0xf4b740,
  crimson: 0xe5484d,
  outline: 0x0c1420
};

export const OBSTACLES = [
  // Paredes / blocos principais, espelhados para todo mundo ver exatamente o mesmo mapa
  { type: 'wall', x: 18, z: 12, w: 8.0, d: 1.2, label: 'Pilar de Report' },
  { type: 'wall', x: 82, z: 12, w: 8.0, d: 1.2, label: 'Pilar de Report' },
  { type: 'wall', x: 18, z: 68, w: 8.0, d: 1.2, label: 'Pilar de Report' },
  { type: 'wall', x: 82, z: 68, w: 8.0, d: 1.2, label: 'Pilar de Report' },

  { type: 'wall', x: 50, z: 40, w: 1.4, d: 11.0, label: 'Pilar de Report' },
  { type: 'wall', x: 50, z: 24, w: 11.0, d: 1.4, label: 'Pilar de Report' },
  { type: 'wall', x: 50, z: 56, w: 11.0, d: 1.4, label: 'Pilar de Report' },

  { type: 'wall', x: 30, z: 31, w: 7.5, d: 1.1, label: 'Pilar de Report' },
  { type: 'wall', x: 70, z: 49, w: 7.5, d: 1.1, label: 'Pilar de Report' },
  { type: 'wall', x: 30, z: 49, w: 1.1, d: 7.5, label: 'Pilar de Report' },
  { type: 'wall', x: 70, z: 31, w: 1.1, d: 7.5, label: 'Pilar de Report' },

  { type: 'wall', x: 15, z: 40, w: 1.2, d: 10.0, label: 'Pilar de Report' },
  { type: 'wall', x: 85, z: 40, w: 1.2, d: 10.0, label: 'Pilar de Report' },

  // Caixas espalhadas para carregar Super sem juntar todo mundo no mesmo ponto
  { type: 'crate', x: 22, z: 20, w: 1.25, d: 1.25, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 78, z: 20, w: 1.25, d: 1.25, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 22, z: 60, w: 1.25, d: 1.25, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 78, z: 60, w: 1.25, d: 1.25, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 40, z: 32, w: 1.25, d: 1.25, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 60, z: 48, w: 1.25, d: 1.25, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 40, z: 48, w: 1.25, d: 1.25, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 60, z: 32, w: 1.25, d: 1.25, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 50, z: 18, w: 1.25, d: 1.25, hp: 3, label: 'Caixa de Briefing' },
  { type: 'crate', x: 50, z: 62, w: 1.25, d: 1.25, hp: 3, label: 'Caixa de Briefing' },

  // Moitas grandes e fixas: o desenho agora é determinístico para aparecer igual em todos os clientes
  { type: 'bush', id: 'bush-left', x: 9, z: 40, w: 10, d: 16, label: 'Zona de Baixo CTR' },
  { type: 'bush', id: 'bush-right', x: 91, z: 40, w: 10, d: 16, label: 'Zona de Baixo CTR' },
  { type: 'bush', id: 'bush-top', x: 50, z: 10, w: 16, d: 8, label: 'Zona de Baixo CTR' },
  { type: 'bush', id: 'bush-bottom', x: 50, z: 70, w: 16, d: 8, label: 'Zona de Baixo CTR' },
  { type: 'bush', id: 'bush-mid-left', x: 30, z: 40, w: 8, d: 14, label: 'Zona de Baixo CTR' },
  { type: 'bush', id: 'bush-mid-right', x: 70, z: 40, w: 8, d: 14, label: 'Zona de Baixo CTR' },
  { type: 'bush', id: 'bush-diag-a', x: 22, z: 28, w: 8, d: 7, label: 'Zona de Baixo CTR' },
  { type: 'bush', id: 'bush-diag-b', x: 78, z: 52, w: 8, d: 7, label: 'Zona de Baixo CTR' }
];
