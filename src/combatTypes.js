export const HIT_TYPES = Object.freeze({
  PROJECTILE: 'projectile',
  MELEE: 'melee',
  AREA: 'area',
  POISON: 'poison',
  HEAL: 'heal',
  CONTROL: 'control',
  ENVIRONMENT: 'environment'
});

export function createCombatCounters() {
  return {
    damageDealt: 0,
    damageTaken: 0,
    healingDone: 0,
    healingReceived: 0,
    basicHits: 0,
    superHits: 0,
    kills: 0,
    deaths: 0,
    byType: {
      [HIT_TYPES.PROJECTILE]: 0,
      [HIT_TYPES.MELEE]: 0,
      [HIT_TYPES.AREA]: 0,
      [HIT_TYPES.POISON]: 0,
      [HIT_TYPES.HEAL]: 0,
      [HIT_TYPES.CONTROL]: 0,
      [HIT_TYPES.ENVIRONMENT]: 0
    }
  };
}

export function normalizeHitType(type) {
  return Object.values(HIT_TYPES).includes(type) ? type : HIT_TYPES.PROJECTILE;
}

export function recordCounter(counters, direction, amount = 0, hitType = HIT_TYPES.PROJECTILE, opts = {}) {
  if (!counters) return;
  const v = Math.max(0, Math.round(amount || 0));
  const type = normalizeHitType(hitType);
  counters.byType[type] = (counters.byType[type] || 0) + 1;
  if (direction === 'dealt') counters.damageDealt += v;
  if (direction === 'taken') counters.damageTaken += v;
  if (direction === 'healingDone') counters.healingDone += v;
  if (direction === 'healingReceived') counters.healingReceived += v;
  if (opts.basic) counters.basicHits += 1;
  if (opts.super) counters.superHits += 1;
}

export function superGainCapForBrawler(brawlerId, actionKind = 'basic') {
  const caps = {
    joao: { basic: 24, super: 0 },
    luan: { basic: 28, super: 0 },
    djonga: { basic: 34, super: 0 },
    thomas: { basic: 18, super: 0 },
    gui: { basic: 28, super: 0 },
    lorenzo: { basic: 20, super: 0 },
    ministro: { basic: 24, super: 0 }
  };
  return caps[brawlerId]?.[actionKind] ?? 24;
}

export function labelForHitType(type) {
  return ({
    [HIT_TYPES.PROJECTILE]: 'projétil',
    [HIT_TYPES.MELEE]: 'corpo a corpo',
    [HIT_TYPES.AREA]: 'área',
    [HIT_TYPES.POISON]: 'veneno',
    [HIT_TYPES.HEAL]: 'cura',
    [HIT_TYPES.CONTROL]: 'controle',
    [HIT_TYPES.ENVIRONMENT]: 'ambiente'
  })[normalizeHitType(type)];
}
