export const BRAWLERS = [
  {
    id: 'joao',
    name: 'João',
    title: 'Rosa Azul',
    role: 'Atirador de dano',
    color: 0x2f8cff,
    accent: 0x8fd6ff,
    hp: 250,
    speed: 5.4,
    reloadTime: 0.82,
    fireRate: 0.58,
    damage: 25,
    attack: 'Rosa azul de média distância',
    super: 'Prisão de correntes em área',
    portrait: 'assets/portraits/joao-chain-rose.png',
    concept: 'assets/concepts/joao-chain-rose.png',
    description: 'Atirador elegante: rosa azul de média distância e correntes que prendem a área.'
  },
  {
    id: 'luan',
    name: 'Luan',
    title: 'Lâmina em Cone',
    role: 'Lutador de curta distância',
    color: 0x111318,
    accent: 0xe5484d,
    hp: 350,
    speed: 5.8,
    reloadTime: 0.58,
    fireRate: 0.34,
    damage: 15,
    attack: 'Corte de espada em cone',
    super: 'Avanço giratório em área',
    portrait: 'assets/portraits/luan-blade-dash.png',
    concept: 'assets/concepts/luan-blade-dash.png',
    description: 'Duelista de curta distância: espada em cone e avanço giratório agressivo.'
  },
  {
    id: 'djonga',
    name: 'Djonga',
    title: 'Combo de Socos',
    role: 'Tanque agressivo',
    color: 0xe5484d,
    accent: 0xff9d8e,
    hp: 450,
    speed: 5.7,
    reloadTime: 0.52,
    fireRate: 0.28,
    damage: 8,
    attack: 'Sequência de 3 socos',
    super: 'Salto com impacto na aterrissagem',
    portrait: 'assets/portraits/djonga-combo-strike.png',
    concept: 'assets/concepts/djonga-combo-strike.png',
    description: 'Tanque de pressão: sequência de socos e salto com impacto.'
  },
  {
    id: 'thomas',
    name: 'Thomas',
    title: 'Estilo Leon',
    role: 'Assassino móvel',
    color: 0x0f2446,
    accent: 0x74d8ff,
    hp: 220,
    speed: 6.2,
    reloadTime: 0.68,
    fireRate: 0.33,
    damage: 6,
    attack: '4 lâminas em leque',
    super: 'Invisibilidade temporária',
    portrait: 'assets/portraits/thomas-phantom-stealth.png',
    concept: 'assets/concepts/thomas-phantom-stealth.png',
    description: 'Assassino furtivo: lâminas em leque e invisibilidade temporária.'
  },
  {
    id: 'gui',
    name: 'Gui',
    title: 'Estilo Eugênio',
    role: 'Controlador',
    color: 0x3f236b,
    accent: 0x9b5cff,
    hp: 280,
    speed: 5.4,
    reloadTime: 0.95,
    fireRate: 0.68,
    damage: 18,
    attack: 'Orbe mágico de longo alcance',
    super: 'Mão mágica de controle',
    portrait: 'assets/portraits/gui-arcane-control.png',
    concept: 'assets/concepts/gui-arcane-control.png',
    description: 'Controlador arcano: orbe que fragmenta e mão mágica que puxa.'
  },
  {
    id: 'lorenzo',
    name: 'Lorenzo',
    title: 'Estilo Pam',
    role: 'Suporte tanque',
    color: 0x101820,
    accent: 0x00d7c7,
    hp: 400,
    speed: 5.1,
    reloadTime: 0.68,
    fireRate: 0.36,
    damage: 6,
    attack: 'Rajada larga de 9 estilhaços',
    super: 'Torreta de cura em área',
    portrait: 'assets/portraits/lorenzo-field-support.png',
    concept: 'assets/concepts/lorenzo-field-support.png',
    description: 'Suporte tanque: rajada espalhada e torreta de cura em área.'
  },
  {
    id: 'ministro',
    name: 'Ministro',
    title: 'Estilo Byron',
    role: 'Suporte frágil',
    color: 0x0c2f28,
    accent: 0x39d98a,
    hp: 200,
    speed: 5.5,
    reloadTime: 0.68,
    fireRate: 0.36,
    damage: 30,
    attack: 'Dardo de longo alcance com efeito contínuo',
    super: 'Frasco lançado em área',
    portrait: 'assets/portraits/ministro-tactical-elixir.png',
    concept: 'assets/concepts/ministro-tactical-elixir.png',
    description: 'Suporte tático: dardos de elixir e frasco explosivo de área.'
  }
];

export const DEFAULT_BRAWLER_ID = BRAWLERS[0].id;

export function getBrawler(id) {
  return BRAWLERS.find(b => b.id === id) || BRAWLERS[0];
}

export function brawlerTaken(roster, brawlerId, myId) {
  return roster.some(entry => entry.id !== myId && entry.brawlerId === brawlerId);
}
