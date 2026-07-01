import * as THREE from 'three';
import { COLORS, ARENA_W, ARENA_D, SPAWN_POINTS, MATCH_DURATION } from './constants.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { RemotePlayer } from './remotePlayer.js';
import { Projectile } from './projectile.js';
import { ParticleSystem } from './particles.js';
import { Input } from './input.js';
import { Room, randomPin } from './network.js';
import { BRAWLERS, DEFAULT_BRAWLER_ID, getBrawler } from './brawlers.js';
import { ConeSlash, ImpactArea, ChainTrap, DashAttack, LeapAttack, HealTurret, SmokeCloud, PoisonPuddle } from './attackEffects.js';
import { clamp } from './utils.js';
import { HIT_TYPES, createCombatCounters, recordCounter, superGainCapForBrawler } from './combatTypes.js';

const canvasHolder = document.getElementById('canvas-holder');
const hudAmmoPips = document.querySelectorAll('#hud-ammo .pip');
const hudSuperBox = document.getElementById('hud-super');
const hudSuperFill = document.getElementById('hud-super-fill');
const hudPin = document.getElementById('hud-pin');
const hudRosterCount = document.getElementById('hud-roster-count');
const hudBrawler = document.getElementById('hud-brawler');
const hudAlive = document.getElementById('hud-alive');
const hudTimer = document.getElementById('hud-timer');
const hudToxic = document.getElementById('hud-toxic');
const hudKills = document.getElementById('hud-kills');
const hudCombat = document.getElementById('hud-combat');
const hudMode = document.getElementById('hud-mode');
const hudHealthFill = document.getElementById('hud-health-fill');
const hudHealthText = document.getElementById('hud-health-text');
const menuOverlay = document.getElementById('menu-overlay');
const nameInput = document.getElementById('name-input');
const pinInput = document.getElementById('pin-input');
const createBtn = document.getElementById('create-btn');
const joinBtn = document.getElementById('join-btn');
const roomStatus = document.getElementById('room-status');
const nameTagsContainer = document.getElementById('name-tags');
const combatTextsContainer = document.getElementById('combat-texts');
const brawlerGrid = document.getElementById('brawler-grid');
const brawlerSummary = document.getElementById('brawler-summary');
const modeBattleBtn = document.getElementById('mode-battle-btn');
const modeOpenBtn = document.getElementById('mode-open-btn');
const lobbyPanel = document.getElementById('lobby-panel');
const lobbyInfo = document.getElementById('lobby-info');
const startMatchBtn = document.getElementById('start-match-btn');
const brawlerDetail = document.getElementById('brawler-detail');
const brawlerDetailClose = document.getElementById('brawler-detail-close');
const brawlerDetailImg = document.getElementById('brawler-detail-img');
const brawlerDetailRole = document.getElementById('brawler-detail-role');
const brawlerDetailName = document.getElementById('brawler-detail-name');
const brawlerDetailTitle = document.getElementById('brawler-detail-title');
const brawlerDetailStats = document.getElementById('brawler-detail-stats');
const brawlerDetailAttack = document.getElementById('brawler-detail-attack');
const brawlerDetailSuper = document.getElementById('brawler-detail-super');
const brawlerDetailConfirm = document.getElementById('brawler-detail-confirm');
const switchPanel = document.getElementById('switch-panel');
const switchGrid = document.getElementById('switch-grid');
const switchClose = document.getElementById('switch-close');

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.sky);
scene.fog = new THREE.Fog(COLORS.fog, 70, 135);

const target = new THREE.Vector3(ARENA_W / 2, 0, ARENA_D / 2);
const ELEV = THREE.MathUtils.degToRad(55);
const AZ = THREE.MathUtils.degToRad(28);
const DIST = 32;

const PLAY_VIEW_SIZE = 16;
const SPECTATOR_VIEW_SIZE = 48;
let viewSize = PLAY_VIEW_SIZE;
let isSpectator = false;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.set(
  target.x + DIST * Math.cos(ELEV) * Math.sin(AZ),
  DIST * Math.sin(ELEV),
  target.z + DIST * Math.cos(ELEV) * Math.cos(AZ)
);
camera.lookAt(target);
const cameraFocus = target.clone();
const cameraOffset = new THREE.Vector3(
  DIST * Math.cos(ELEV) * Math.sin(AZ),
  DIST * Math.sin(ELEV),
  DIST * Math.cos(ELEV) * Math.cos(AZ)
);

function applyCameraProjection() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;
  camera.left = -viewSize * aspect;
  camera.right = viewSize * aspect;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
}

function updateCamera(dt) {
  const desiredView = isSpectator ? SPECTATOR_VIEW_SIZE : PLAY_VIEW_SIZE;
  if (Math.abs(viewSize - desiredView) > 0.01) {
    viewSize += (desiredView - viewSize) * (1 - Math.pow(0.0001, dt));
    applyCameraProjection();
  }
  const desired = isSpectator
    ? target
    : player
      ? new THREE.Vector3(
          clamp(player.x, viewSize * 0.7, ARENA_W - viewSize * 0.7),
          0,
          clamp(player.z, viewSize * 0.62, ARENA_D - viewSize * 0.62)
        )
      : target;
  cameraFocus.lerp(desired, 1 - Math.pow(0.00005, dt));
  camera.position.copy(cameraFocus).add(cameraOffset);
  camera.lookAt(cameraFocus);
  if (sun && sun.target) {
    sun.target.position.copy(cameraFocus);
    sun.position.set(cameraFocus.x + 12, 22, cameraFocus.z + 8);
  }
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
canvasHolder.appendChild(renderer.domElement);

function resize() {
  applyCameraProjection();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
}
window.addEventListener('resize', resize);
resize();

const ambient = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff3d6, 1.15);
sun.position.set(target.x + 10, 18, target.z + 6);
sun.target.position.copy(target);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 35;
sun.shadow.camera.bottom = -35;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 90;
sun.shadow.bias = -0.0015;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0xbcdcff, 0.3);
fill.position.set(target.x - 10, 8, target.z - 8);
scene.add(fill);

const world = buildWorld(scene);
world.scene = scene;
world.onCrateChange = (crate, point, result) => {
  room.sendWorld({
    type: 'crate_state',
    id: crate.id,
    hp: crate.hp,
    alive: crate.alive,
    respawnTimer: crate.respawnTimer,
    destroyed: !!result?.destroyed,
    hitX: point?.x ?? crate.bounds.x,
    hitY: point?.y ?? 0.45,
    hitZ: point?.z ?? crate.bounds.z
  });
};
const input = new Input(renderer.domElement, camera, world.groundMesh);
const ps = new ParticleSystem(scene);

const room = new Room();
const remotePlayers = new Map();
const nameTagPool = new Map();

let selectedBrawlerId = DEFAULT_BRAWLER_ID;
let pendingDetailBrawlerId = DEFAULT_BRAWLER_ID;
let selectedGameMode = 'battle';
let rosterEntries = [];
let isHost = false;
let matchStartAt = 0;
let countdownTimer = 0;
let openRespawnTimer = 0;
const playerStats = new Map();
const combatCounters = createCombatCounters();
let actionSeq = 0;
let player = null;
let projectiles = [];
let effects = [];
const previewGroup = new THREE.Group();
previewGroup.visible = false;
previewGroup.renderOrder = 1000;
scene.add(previewGroup);
let state = 'menu';
let shakeTimer = 0;
let netSendTimer = 0;
let started = false;
let matchElapsed = 0;
let toxicDamageTimer = 0;
let toxicVisualTimer = 0;
let regenBroadcastTimer = 0;
let toxicMesh = null;
let toxicRing = null;
let lastDownBroadcast = false;
const TOXIC_START_RADIUS = Math.hypot(ARENA_W, ARENA_D) * 0.62;
const TOXIC_END_RADIUS = 7.5;
const NET_SEND_INTERVAL = 0.09;

function setStatus(msg, kind) {
  roomStatus.textContent = msg;
  roomStatus.className = 'room-status' + (kind ? ' is-' + kind : '');
}

function hexColor(value) {
  return '#' + value.toString(16).padStart(6, '0');
}

function nextActionId(prefix = 'a') {
  actionSeq += 1;
  return `${room.myId || 'local'}-${prefix}-${Date.now().toString(36)}-${actionSeq}`;
}

function updateCombatHud() {
  if (!hudCombat) return;
  hudCombat.textContent = `DMG ${combatCounters.damageDealt} · TOMOU ${combatCounters.damageTaken} · CURA ${combatCounters.healingDone}`;
}

const floatingTexts = [];
function spawnFloatingText(label, x, z, kind = 'damage') {
  if (!combatTextsContainer || x === undefined || z === undefined) return;
  const el = document.createElement('div');
  el.className = `combat-text is-${kind}`;
  el.textContent = label;
  combatTextsContainer.appendChild(el);
  floatingTexts.push({ el, x, z, y: 1.65, life: 0.92, maxLife: 0.92, drift: (Math.random() - 0.5) * 0.25 });
}

function updateFloatingTexts(dt) {
  for (const ft of floatingTexts) {
    ft.life -= dt;
    ft.y += dt * 0.95;
    const p = new THREE.Vector3(ft.x + ft.drift * (1 - ft.life / ft.maxLife), ft.y, ft.z);
    p.project(camera);
    ft.el.style.left = ((p.x * 0.5 + 0.5) * window.innerWidth) + 'px';
    ft.el.style.top = ((-p.y * 0.5 + 0.5) * window.innerHeight) + 'px';
    ft.el.style.opacity = Math.max(0, ft.life / ft.maxLife).toFixed(3);
    ft.el.style.transform = `translate(-50%, -50%) scale(${1 + (1 - ft.life / ft.maxLife) * 0.18})`;
  }
  for (const ft of floatingTexts.filter(t => t.life <= 0)) ft.el.remove();
  for (let i = floatingTexts.length - 1; i >= 0; i--) if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
}

function recordDamageTaken(amount, point, event = {}) {
  recordCounter(combatCounters, 'taken', amount, event.hitType || HIT_TYPES.PROJECTILE, { super: event.actionKind === 'super', basic: event.actionKind !== 'super' });
  spawnFloatingText(`-${Math.round(amount || 0)}`, point?.x ?? player?.x, point?.z ?? player?.z, event.hitType === HIT_TYPES.POISON ? 'poison' : 'damage');
  updateCombatHud();
}

function recordDamageDealt(amount, point, event = {}) {
  recordCounter(combatCounters, 'dealt', amount, event.hitType || HIT_TYPES.PROJECTILE, { super: event.actionKind === 'super', basic: event.actionKind !== 'super' });
  spawnFloatingText(`-${Math.round(amount || 0)}`, point?.x, point?.z, event.hitType === HIT_TYPES.POISON ? 'poison' : 'damage');
  updateCombatHud();
}

function recordHealing(amount, point, kind = 'heal') {
  if (!amount || amount <= 0) return;
  recordCounter(combatCounters, 'healingDone', amount, HIT_TYPES.HEAL);
  recordCounter(combatCounters, 'healingReceived', amount, HIT_TYPES.HEAL);
  spawnFloatingText(`+${Math.round(amount)}`, point?.x ?? player?.x, point?.z ?? player?.z, kind);
  updateCombatHud();
}

function renderBrawlerCards() {
  brawlerGrid.innerHTML = '';
  for (const b of BRAWLERS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'brawler-card' + (b.id === selectedBrawlerId ? ' is-selected' : '');
    btn.dataset.brawlerId = b.id;
    btn.innerHTML = `
      <span class="brawler-portrait-wrap" style="background:linear-gradient(180deg, ${hexColor(b.accent)}, ${hexColor(b.color)})">
        <img class="brawler-portrait" src="${b.portrait}" alt="${b.name}">
      </span>
      <strong>${b.name}</strong>
      <small>${b.title}</small>
      <em>${b.hp} HP</em>
    `;
    btn.addEventListener('click', () => openBrawlerDetail(b.id));
    brawlerGrid.appendChild(btn);
  }
  updateBrawlerSummary();
}

function selectBrawler(id) {
  selectedBrawlerId = id;
  for (const card of brawlerGrid.querySelectorAll('.brawler-card')) {
    card.classList.toggle('is-selected', card.dataset.brawlerId === id);
  }
  updateBrawlerSummary();
}

function updateBrawlerSummary() {
  const b = getBrawler(selectedBrawlerId);
  brawlerSummary.textContent = `${b.name}: ${b.attack} · Super: ${b.super} · Vida ${b.hp}`;
}

function openBrawlerDetail(id) {
  const b = getBrawler(id);
  pendingDetailBrawlerId = b.id;
  brawlerDetailImg.src = b.concept || b.portrait;
  brawlerDetailImg.alt = b.name;
  brawlerDetailRole.textContent = b.role;
  brawlerDetailName.textContent = b.name;
  brawlerDetailTitle.textContent = b.title;
  brawlerDetailStats.innerHTML = `
    <span>${b.hp} HP</span>
    <span>Dano ${b.damage}</span>
    <span>Vel. ${b.speed.toFixed(1)}</span>
    <span>Recarga ${b.reloadTime.toFixed(2)}s</span>
  `;
  brawlerDetailAttack.textContent = `Ataque: ${b.attack}`;
  brawlerDetailSuper.textContent = `Super: ${b.super}`;
  brawlerDetail.classList.remove('hidden');
}

function closeBrawlerDetail() {
  brawlerDetail.classList.add('hidden');
}

brawlerDetailClose.addEventListener('click', closeBrawlerDetail);
brawlerDetail.addEventListener('click', e => { if (e.target === brawlerDetail) closeBrawlerDetail(); });
brawlerDetailConfirm.addEventListener('click', () => {
  selectBrawler(pendingDetailBrawlerId);
  closeBrawlerDetail();
});

function selectMode(mode) {
  selectedGameMode = mode;
  modeBattleBtn.classList.toggle('is-selected', mode === 'battle');
  modeOpenBtn.classList.toggle('is-selected', mode === 'open');
  updateModeHud();
}
modeBattleBtn.addEventListener('click', () => selectMode('battle'));
modeOpenBtn.addEventListener('click', () => selectMode('open'));

function updateModeHud() {
  if (hudMode) hudMode.textContent = selectedGameMode === 'battle' ? 'BR' : 'ABERTO';
}

renderBrawlerCards();

function renderSwitchGrid() {
  switchGrid.innerHTML = '';
  for (const b of BRAWLERS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'switch-brawler' + (b.id === selectedBrawlerId ? ' is-selected' : '');
    btn.dataset.brawlerId = b.id;
    btn.innerHTML = `<img src="${b.portrait}" alt="${b.name}"><strong>${b.name}</strong>`;
    btn.addEventListener('click', () => switchBrawlerInOpenMode(b.id));
    switchGrid.appendChild(btn);
  }
}

function toggleSwitchPanel(force) {
  if (selectedGameMode !== 'open' || state !== 'playing') return;
  renderSwitchGrid();
  const shouldShow = force === undefined ? switchPanel.classList.contains('hidden') : !!force;
  switchPanel.classList.toggle('hidden', !shouldShow);
}

switchClose.addEventListener('click', () => toggleSwitchPanel(false));

function switchBrawlerInOpenMode(id) {
  if (!player || selectedGameMode !== 'open') return;
  const x = player.x;
  const z = player.z;
  scene.remove(player.root);
  player.root.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
  selectedBrawlerId = id;
  room.myBrawlerId = id;
  room.setBrawler(id);
  player = new Player(x, z, id, room.mySlot);
  scene.add(player.root);
  openRespawnTimer = 0;
  regenBroadcastTimer = 0;
  lastDownBroadcast = false;
  updateHudStatic();
  renderSwitchGrid();
  room.sendCombat({ type: 'brawler_change', targetId: room.myId, brawlerId: id });
}

function spawnPointFor(slot) {
  return SPAWN_POINTS[slot % SPAWN_POINTS.length];
}

function aimTarget(maxRange) {
  const dx = input.aimX - player.x;
  const dz = input.aimZ - player.z;
  const dist = Math.hypot(dx, dz) || 1;
  const limited = Math.min(dist, maxRange);
  return {
    x: clamp(player.x + (dx / dist) * limited, 0.6, ARENA_W - 0.6),
    z: clamp(player.z + (dz / dist) * limited, 0.6, ARENA_D - 0.6)
  };
}

function clearPreview() {
  while (previewGroup.children.length) {
    const child = previewGroup.children.pop();
    child.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}

function previewMaterial(color, opacity = 0.25) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
}

function addCirclePreview(x, z, radius, color, opacity = 0.24) {
  const geo = new THREE.CircleGeometry(radius, 48);
  const mesh = new THREE.Mesh(geo, previewMaterial(color, opacity));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.06, z);
  mesh.renderOrder = 1000;
  previewGroup.add(mesh);

  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 64 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return new THREE.Vector3(x + Math.cos(a) * radius, 0.052, z + Math.sin(a) * radius);
    })),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false })
  );
  ring.renderOrder = 1001;
  previewGroup.add(ring);
}

function addConePreview(x, z, angle, range, arc, color) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const a = -arc / 2 + (arc * i) / steps;
    shape.lineTo(Math.sin(a) * range, -Math.cos(a) * range);
  }
  shape.lineTo(0, 0);
  const geo = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(geo, previewMaterial(color, 0.22));
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = -angle;
  mesh.position.set(x, 0.065, z);
  mesh.renderOrder = 1000;
  previewGroup.add(mesh);
}

function addLinePreview(x, z, angle, range, width, color) {
  const geo = new THREE.BoxGeometry(width, 0.02, range);
  const mesh = new THREE.Mesh(geo, previewMaterial(color, 0.23));
  mesh.position.set(
    x + Math.sin(angle) * range * 0.5,
    0.045,
    z + Math.cos(angle) * range * 0.5
  );
  mesh.rotation.y = angle;
  mesh.renderOrder = 1000;
  previewGroup.add(mesh);
}

function showAttackPreview(mode = 'basic') {
  if (!player || isSpectator || !input.keys.has('shift')) {
    previewGroup.visible = false;
    clearPreview();
    return;
  }

  clearPreview();
  previewGroup.visible = true;
  const b = player.brawler;
  const angle = player.aimAngle;
  const x = player.x;
  const z = player.z;
  const color = b.accent;

  if (mode === 'super') {
    if (b.id === 'joao') {
      const t = aimTarget(9.4);
      addCirclePreview(t.x, t.z, 1.95, color, 0.24);
    } else if (b.id === 'luan') {
      addLinePreview(x, z, angle, 4.3, 2.05, color);
      addCirclePreview(x + Math.sin(angle) * 4.3, z + Math.cos(angle) * 4.3, 1.05, color, 0.18);
    } else if (b.id === 'djonga') {
      const t = aimTarget(5.8);
      addCirclePreview(t.x, t.z, 1.9, color, 0.24);
    } else if (b.id === 'thomas') {
      addCirclePreview(x, z, 2.2, color, 0.2);
    } else if (b.id === 'gui') {
      addLinePreview(x, z, angle, 11.5, 0.9, color);
    } else if (b.id === 'lorenzo') {
      const t = aimTarget(5.4);
      addCirclePreview(t.x, t.z, 1.45, color, 0.24);
      addCirclePreview(t.x, t.z, 3.2, color, 0.1);
    } else if (b.id === 'ministro') {
      const t = aimTarget(8.8);
      addCirclePreview(t.x, t.z, 1.9, color, 0.24);
    }
    return;
  }

  if (b.id === 'joao') addLinePreview(x, z, angle, 8.4, 0.55, color);
  else if (b.id === 'luan') addConePreview(x, z, angle, 2.75, 1.38, color);
  else if (b.id === 'djonga') addConePreview(x, z, angle, 2.35, 1.12, color);
  else if (b.id === 'thomas') addConePreview(x, z, angle, 8.7, 0.58, color);
  else if (b.id === 'gui') {
    addLinePreview(x, z, angle, 6.5, 0.75, color);
    const splitX = x + Math.sin(angle) * 6.5;
    const splitZ = z + Math.cos(angle) * 6.5;
    addConePreview(splitX, splitZ, angle, 4.8, 0.92, color);
  } else if (b.id === 'lorenzo') addConePreview(x, z, angle, 7.9, 1.32, color);
  else if (b.id === 'ministro') addLinePreview(x, z, angle, 12.8, 0.5, color);
}


function safeRadius() {
  const t = Math.max(0, Math.min(1, matchElapsed / MATCH_DURATION));
  return TOXIC_START_RADIUS + (TOXIC_END_RADIUS - TOXIC_START_RADIUS) * t;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
}

function disposeObject(obj) {
  if (!obj) return;
  scene.remove(obj);
  obj.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
}

function rebuildToxicVisual(force = false) {
  if (!force && toxicVisualTimer > 0) return;
  toxicVisualTimer = 0.18;
  const r = safeRadius();
  disposeObject(toxicMesh);
  disposeObject(toxicRing);
  const outer = Math.hypot(ARENA_W, ARENA_D) * 0.76;
  const ringGeo = new THREE.RingGeometry(r, outer, 96, 1);
  const ringMat = new THREE.MeshBasicMaterial({
    color: COLORS.toxic,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  toxicMesh = new THREE.Mesh(ringGeo, ringMat);
  toxicMesh.rotation.x = -Math.PI / 2;
  toxicMesh.position.set(ARENA_W / 2, 0.09, ARENA_D / 2);
  toxicMesh.renderOrder = 700;
  scene.add(toxicMesh);

  const points = [];
  for (let i = 0; i < 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(ARENA_W / 2 + Math.cos(a) * r, 0.115, ARENA_D / 2 + Math.sin(a) * r));
  }
  toxicRing = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x79ff91, transparent: true, opacity: 0.95, depthTest: false })
  );
  toxicRing.renderOrder = 710;
  scene.add(toxicRing);
}

function isOutsideSafeZone(x, z) {
  return Math.hypot(x - ARENA_W / 2, z - ARENA_D / 2) > safeRadius();
}

function ensureStats(id, name = 'Jogador') {
  if (!id) return null;
  if (!playerStats.has(id)) playerStats.set(id, { kills: 0, deaths: 0, name });
  const s = playerStats.get(id);
  s.name = name || s.name;
  return s;
}

function getKills(id) {
  return playerStats.get(id)?.kills || 0;
}

function leaderId() {
  let best = null;
  let bestKills = 0;
  for (const [id, s] of playerStats.entries()) {
    if (s.kills > bestKills) {
      bestKills = s.kills;
      best = id;
    }
  }
  return bestKills > 0 ? best : null;
}

function registerKill(killerId, victimId) {
  if (!killerId || killerId === victimId) return;
  const killerName = killerId === room.myId ? room.myName : (remotePlayers.get(killerId)?.name || 'Jogador');
  const victimName = victimId === room.myId ? room.myName : (remotePlayers.get(victimId)?.name || 'Jogador');
  ensureStats(killerId, killerName).kills++;
  ensureStats(victimId, victimName).deaths++;
  if (killerId === room.myId) combatCounters.kills += 1;
  if (victimId === room.myId) combatCounters.deaths += 1;
  updateCombatHud();
}

function aliveCount() {
  let count = player && !player.isDown ? 1 : 0;
  for (const rp of remotePlayers.values()) {
    if (rp.hasData && !rp.isDown) count++;
  }
  return count;
}

function enterSpectator(reason = 'morreu') {
  if (isSpectator) return;
  isSpectator = true;
  clearPreview();
  if (player) {
    player.root.visible = false;
    player.hp = 0;
    player.isDown = true;
  }
  setStatus(`Você ${reason}. Agora está em modo espectador.`, 'error');
}

function applyToxicDamage(dt) {
  if (!player || player.isDown) return;
  if (!isOutsideSafeZone(player.x, player.z)) {
    toxicDamageTimer = 0;
    return;
  }
  toxicDamageTimer += dt;
  if (toxicDamageTimer >= 1) {
    toxicDamageTimer = 0;
    const t = Math.max(0, Math.min(1, matchElapsed / MATCH_DURATION));
    const damage = Math.round(7 + t * 11);
    const result = player.takeDamage(damage);
    if (result.changed) recordDamageTaken(damage, { x: player.x, z: player.z }, { hitType: HIT_TYPES.ENVIRONMENT, actionKind: 'environment' });
    ps.burst({ x: player.x, y: 0.55, z: player.z }, { count: result.downed ? 26 : 10, color: COLORS.toxic, speed: 2.8, life: 0.5, cube: result.downed });
    shakeTimer = Math.max(shakeTimer, result.downed ? 0.25 : 0.08);
    broadcastHealth(result.downed ? 'toxic-down' : 'toxic');
    if (result.downed) enterSpectator('morreu na névoa tóxica');
  }
}

function respawnOpenPlayer() {
  if (!player || selectedGameMode !== 'open') return;
  const sp = spawnPointFor((room.mySlot + Math.floor(Math.random() * 5)) % SPAWN_POINTS.length);
  player.x = sp.x;
  player.z = sp.z;
  player.hp = player.hpMax;
  player.isDown = false;
  player.invulnTimer = 1.5;
  player.root.visible = true;
  openRespawnTimer = 0;
  regenBroadcastTimer = 0;
  lastDownBroadcast = false;
  broadcastHealth('open-respawn');
}

function handleOpenRespawn(dt) {
  if (selectedGameMode !== 'open' || !player || !player.isDown) return;
  openRespawnTimer += dt;
  if (openRespawnTimer >= 3) respawnOpenPlayer();
}

function pointSegmentDistance(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lenSq));
  const x = ax + dx * t;
  const z = az + dz * t;
  return Math.hypot(px - x, pz - z);
}

function broadcastHealth(reason = 'state') {
  if (!player) return;
  room.sendCombat({
    type: 'health',
    targetId: room.myId,
    hp: player.hp,
    hpMax: player.hpMax,
    down: player.isDown,
    brawlerId: player.brawlerId,
    reason
  });
}

function applyIncomingDamage(amount, point, event = {}) {
  if (!player || player.isDown) return;

  if (event.pull && event.pullToX !== undefined && event.pullToZ !== undefined) {
    const dx = event.pullToX - player.x;
    const dz = event.pullToZ - player.z;
    const len = Math.hypot(dx, dz) || 1;
    const pullDist = Math.min(len, event.pullDistance || 2.8);
    player.tryMove(player.x + (dx / len) * pullDist, player.z + (dz / len) * pullDist, world);
    player.applyRoot(0.45);
  }

  const rootTime = event.kind === 'chain' ? 1.35 : 0;
  const result = player.takeDamage(amount || 0, { root: rootTime });
  if (!result.changed) return;
  recordDamageTaken(amount || 0, point, event);

  ps.burst({ x: point.x, y: point.y || 0.55, z: point.z }, {
    count: result.downed ? 28 : 12,
    color: result.downed ? COLORS.crimson : (event.color || COLORS.gold),
    speed: result.downed ? 4 : 2.6,
    life: result.downed ? 0.7 : 0.38,
    cube: result.downed
  });
  shakeTimer = Math.max(shakeTimer, result.downed ? 0.26 : 0.1);
  const attackerId = event.id || event.attackerId;
  const gainAmount = event.superGainOnPlayer ?? event.superGain ?? Math.max(3, Math.round((amount || 0) * 0.7));
  if (attackerId) {
    room.sendCombat({
      type: 'super_gain',
      targetId: attackerId,
      amount: gainAmount,
      actionId: event.actionId,
      superGainCap: event.superGainCap,
      actionKind: event.actionKind || 'basic',
      hitType: event.hitType || HIT_TYPES.PROJECTILE,
      damage: amount || 0,
      hitX: point?.x,
      hitZ: point?.z
    });
  }
  broadcastHealth(result.downed ? 'downed' : 'damage');
  if (result.downed) {
    const killerId = attackerId;
    if (killerId) {
      registerKill(killerId, room.myId);
      room.sendCombat({ type: 'kill', killerId, victimId: room.myId });
    }
    if (selectedGameMode === 'battle') enterSpectator('foi eliminado');
    else openRespawnTimer = 0;
  }
}

function incomingEffectOpts(event, ghost) {
  if (!ghost) return { ghost: false, delay: event.delay || 0 };
  return {
    ghost: true,
    delay: event.delay || 0,
    targetPlayer: player,
    onHitPlayer: (damage, point) => applyIncomingDamage(damage, point, event)
  };
}

function applyIncomingDash(event) {
  if (!player || player.isDown) return;
  const sx = event.x;
  const sz = event.z;
  const ex = sx + Math.sin(event.angle) * (event.distance || 3.2);
  const ez = sz + Math.cos(event.angle) * (event.distance || 3.2);
  const dist = pointSegmentDistance(player.x, player.z, sx, sz, ex, ez);
  if (dist <= (event.radius || 0.9) + player.radius * 0.72) {
    applyIncomingDamage(event.damage || 0, { x: player.x, y: 0.55, z: player.z }, event);
  }
}

function startGame() {
  const sp = spawnPointFor(room.mySlot);
  if (player) {
    scene.remove(player.root);
    player.root.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
  player = new Player(sp.x, sp.z, room.myBrawlerId || selectedBrawlerId, room.mySlot);
  scene.add(player.root);
  isSpectator = false;
  matchElapsed = 0;
  toxicDamageTimer = 0;
  toxicVisualTimer = 0;
  openRespawnTimer = 0;
  regenBroadcastTimer = 0;
  lastDownBroadcast = false;
  if (selectedGameMode === 'battle') rebuildToxicVisual(true);
  else {
    disposeObject(toxicMesh);
    disposeObject(toxicRing);
    toxicMesh = null;
    toxicRing = null;
  }
  state = 'playing';
  menuOverlay.classList.add('hidden');
  lobbyPanel.classList.add('hidden');
  switchPanel.classList.add('hidden');
  ensureStats(room.myId, room.myName);
  updateHudStatic();
}

function scheduleMatchStart(payload = {}) {
  matchStartAt = payload.startAt || (Date.now() + 2500);
  countdownTimer = Math.max(0, (matchStartAt - Date.now()) / 1000);
  state = 'countdown';
  started = true;
  lobbyPanel.classList.remove('hidden');
  startMatchBtn.disabled = true;
  setStatus('Partida sincronizada. Preparar...', 'ok');
}

function updateCountdown() {
  countdownTimer = Math.max(0, (matchStartAt - Date.now()) / 1000);
  lobbyInfo.textContent = `Iniciando em ${Math.ceil(countdownTimer)}s...`;
  if (countdownTimer <= 0) startGame();
}

function updateHudStatic() {
  if (!player) return;
  hudBrawler.textContent = `${player.brawler.name} · ${player.brawler.title}`;
  updateModeHud();
  if (hudKills) hudKills.textContent = `KILLS ${getKills(room.myId)}`;
}

function findDuplicateBrawler(entries, myId) {
  const me = entries.find(e => e.id === myId);
  if (!me) return null;
  return entries.find(e => e.id !== myId && e.brawlerId === me.brawlerId);
}

room.onRosterChange = (entries, myId) => {
  rosterEntries = entries;
  isHost = entries.length > 0 && entries[0].id === myId;
  entries.forEach(e => ensureStats(e.id, e.name));

  const duplicate = selectedGameMode === 'battle' && !started ? findDuplicateBrawler(entries, myId) : null;
  if (duplicate) {
    setStatus(`${getBrawler(room.myBrawlerId).name} já está escolhido nessa sala. Troca o brawler ou usa outro PIN.`, 'error');
    room.leave();
    createBtn.disabled = false;
    joinBtn.disabled = false;
    return;
  }

  const seen = new Set();
  entries.forEach(e => {
    seen.add(e.id);
    if (e.id === myId) return;
    if (!remotePlayers.has(e.id)) {
      const rp = new RemotePlayer(e.id, e.name, e.brawlerId, e.slot);
      scene.add(rp.root);
      remotePlayers.set(e.id, rp);
    } else {
      const rp = remotePlayers.get(e.id);
      rp.name = e.name;
      rp.setBrawler(e.brawlerId, scene);
    }
  });

  for (const [id, rp] of Array.from(remotePlayers.entries())) {
    if (!seen.has(id)) {
      rp.dispose(scene);
      remotePlayers.delete(id);
      removeNameTag(id);
      playerStats.delete(id);
    }
  }

  hudRosterCount.textContent = entries.length + (entries.length === 1 ? ' jogador' : ' jogadores');

  if (!started && selectedGameMode === 'open') {
    started = true;
    setStatus('Modo aberto: ranking por kills ativo. Aperte C para trocar personagem.', 'ok');
    startGame();
  } else if (!started && selectedGameMode === 'battle') {
    state = 'lobby';
    lobbyPanel.classList.remove('hidden');
    startMatchBtn.disabled = !isHost;
    lobbyInfo.textContent = isHost
      ? `${entries.length} jogador(es) no lobby. Você é o host: clique em iniciar quando todos estiverem prontos.`
      : `${entries.length} jogador(es) no lobby. Aguardando o host iniciar.`;
    setStatus(isHost ? 'Sala criada. Aguarde todo mundo entrar e inicie.' : 'Conectado. Aguardando início da partida.', 'ok');
  }
};

room.onPeerState = payload => {
  const rp = remotePlayers.get(payload.id);
  if (rp) rp.applyNetState(payload);
};

room.onPeerFire = payload => {
  spawnAttackFromNetwork(payload);
};

room.onWorldEvent = payload => {
  if (payload.type === 'crate_state') {
    world.applyCrateState(payload, ps);
  } else if (payload.type === 'world_reset') {
    world.reset();
  } else if (payload.type === 'match_start') {
    selectedGameMode = payload.mode || 'battle';
    scheduleMatchStart(payload);
  }
};

room.onCombatEvent = payload => {
  if (payload.type === 'health') {
    const rp = remotePlayers.get(payload.targetId || payload.id);
    if (rp) rp.applyHealth(payload.hp, payload.down);
  } else if (payload.type === 'super_gain') {
    if (payload.targetId === room.myId && player && !player.isDown) {
      const gained = player.gainSuper(payload.amount || 0, payload.actionId, payload.superGainCap ?? Infinity);
      if (payload.damage) recordDamageDealt(payload.damage, { x: payload.hitX, z: payload.hitZ }, payload);
      if (gained > 0 && payload.hitX !== undefined && payload.hitZ !== undefined) {
        spawnFloatingText(`+${Math.round(gained)} SUPER`, payload.hitX, payload.hitZ, 'heal');
      }
    }
  } else if (payload.type === 'kill') {
    registerKill(payload.killerId, payload.victimId);
  } else if (payload.type === 'brawler_change') {
    const rp = remotePlayers.get(payload.targetId || payload.id);
    if (rp) rp.setBrawler(payload.brawlerId, scene);
  }
};

function addProjectile(data, ghost = false) {
  projectiles.push(new Projectile(
    scene,
    data.x,
    data.y === undefined ? 0.55 : data.y,
    data.z,
    data.angle,
    data.speed,
    data.range,
    data.damage,
    !!data.big,
    ghost,
    {
      brawlerId: data.brawlerId,
      color: data.color,
      size: data.size,
      glowSize: data.glowSize,
      pierce: data.pierce,
      superGain: data.superGain,
      superGainOnPlayer: data.superGainOnPlayer,
      superGainCap: data.superGainCap,
      actionId: data.actionId,
      actionKind: data.actionKind,
      hitType: data.hitType,
      damageNear: data.damageNear,
      damageFar: data.damageFar,
      targetPlayer: ghost ? player : null,
      onHitPlayer: ghost ? ((damage, point) => applyIncomingDamage(damage, point, data)) : null,
      onExpire: (!ghost && data.split) ? ((point) => {
        const b = getBrawler(data.brawlerId);
        for (const off of [-0.46, -0.28, -0.12, 0.12, 0.28, 0.46]) {
          fireEvent({
            kind: 'projectile',
            brawlerId: data.brawlerId,
            x: point.x,
            y: point.y,
            z: point.z,
            angle: data.angle + off,
            color: data.splitColor || b.accent,
            speed: data.splitSpeed || 12,
            range: data.splitRange || 4.8,
            damage: data.splitDamage || 4,
            size: data.splitSize || 0.06,
            glowSize: data.splitGlowSize || 0.14,
            superGain: data.splitSuperGain || 4,
            superGainOnPlayer: data.splitSuperGainOnPlayer || data.splitSuperGain || 3,
            superGainCap: data.superGainCap,
            actionId: data.actionId,
            actionKind: data.actionKind || 'basic',
            hitType: data.hitType || HIT_TYPES.PROJECTILE
          });
        }
      }) : null
    }
  ));
}

function projectileAtTip(angle, brawler, params = {}) {
  const tip = player.gunTipWorld;
  return {
    kind: 'projectile',
    brawlerId: brawler.id,
    x: tip.x,
    y: tip.y,
    z: tip.z,
    angle,
    color: params.color ?? brawler.accent,
    speed: params.speed ?? 13,
    range: params.range ?? 8,
    damage: params.damage ?? brawler.damage,
    damageNear: params.damageNear,
    damageFar: params.damageFar,
    size: params.size ?? 0.1,
    glowSize: params.glowSize ?? 0.2,
    big: !!params.big,
    pierce: !!params.pierce,
    superGain: params.superGain,
    superGainOnPlayer: params.superGainOnPlayer ?? params.superGain,
    superGainCap: params.superGainCap ?? superGainCapForBrawler(brawler.id, params.actionKind || 'basic'),
    actionId: params.actionId || nextActionId(brawler.id),
    actionKind: params.actionKind || 'basic',
    hitType: params.hitType || HIT_TYPES.PROJECTILE,
    pull: !!params.pull,
    pullToX: params.pullToX,
    pullToZ: params.pullToZ,
    pullDistance: params.pullDistance,
    split: !!params.split,
    splitDamage: params.splitDamage,
    splitRange: params.splitRange,
    splitSpeed: params.splitSpeed,
    splitColor: params.splitColor,
    splitSize: params.splitSize,
    splitGlowSize: params.splitGlowSize,
    splitSuperGain: params.splitSuperGain,
    splitSuperGainOnPlayer: params.splitSuperGainOnPlayer,
    delay: params.delay || 0
  };
}

function fireEvent(event, local = true) {
  if (event.delay && event.delay > 0) {
    const delayed = { ...event, delay: 0 };
    window.setTimeout(() => fireEvent(delayed, local), event.delay * 1000);
    return;
  }
  if (local) room.sendFire(event);
  spawnAttack(event, !local);
}

function spawnAttackFromNetwork(event) {
  spawnAttack(event, true);
}

function spawnAttack(event, ghost = false) {
  if (event.delay && event.delay > 0) {
    const delayed = { ...event, delay: 0 };
    window.setTimeout(() => spawnAttack(delayed, ghost), event.delay * 1000);
    return;
  }
  const b = getBrawler(event.brawlerId);

  if (event.kind === 'projectile') {
    addProjectile(event, ghost);
    const isPhysicalShot = b.id === 'thomas' || b.id === 'lorenzo';
    ps.burst({ x: event.x, y: event.y || 0.55, z: event.z }, {
      count: event.big ? 14 : isPhysicalShot ? 1 : (b.id === 'joao' ? 7 : 4),
      color: isPhysicalShot ? 0xd8e4e7 : (event.color || b.accent),
      speed: event.big ? 2.5 : isPhysicalShot ? 0.45 : (b.id === 'joao' ? 1.4 : 0.95),
      life: event.big ? 0.34 : isPhysicalShot ? 0.08 : (b.id === 'joao' ? 0.2 : 0.13),
      cube: b.id === 'lorenzo'
    });
    return;
  }

  if (event.kind === 'cone') {
    effects.push(new ConeSlash(scene, event.x, event.z, event.angle, event.range, event.arc, event.damage, event.color || b.accent, { ...incomingEffectOpts(event, ghost), style: b.id, superGain: event.superGain }));
    return;
  }

  if (event.kind === 'area') {
    if (b.id === 'ministro') {
      effects.push(new PoisonPuddle(scene, event.x, event.z, event.radius, event.damage, event.color || b.accent, incomingEffectOpts(event, ghost)));
    } else {
      effects.push(new ImpactArea(scene, event.x, event.z, event.radius, event.damage, event.color || b.accent, incomingEffectOpts(event, ghost)));
    }
    return;
  }

  if (event.kind === 'chain') {
    effects.push(new ChainTrap(scene, event.x, event.z, event.radius, event.damage, event.color || b.accent, { ...incomingEffectOpts(event, ghost), chainColor: COLORS.outline }));
    return;
  }

  if (event.kind === 'dash' && player && !ghost) {
    effects.push(new DashAttack(scene, player, event.angle, event.color || b.accent, { damage: event.damage, distance: event.distance, radius: event.radius, duration: event.duration }));
    return;
  }

  if (event.kind === 'dash') {
    effects.push(new ImpactArea(scene, event.x, event.z, event.radius || 1, 0, event.color || b.accent, { ghost: true, life: 0.35 }));
    if (ghost) applyIncomingDash(event);
    return;
  }

  if (event.kind === 'leap' && player && !ghost) {
    effects.push(new LeapAttack(scene, player, event.x, event.z, event.color || b.accent, { damage: event.damage, radius: event.radius }));
    return;
  }

  if (event.kind === 'leap') {
    effects.push(new ImpactArea(scene, event.x, event.z, event.radius || 1.2, event.damage || 0, event.color || b.accent, { ...incomingEffectOpts(event, ghost), life: 0.6 }));
    return;
  }

  if (event.kind === 'turret') {
    effects.push(new HealTurret(scene, event.x, event.z, event.color || b.accent));
    return;
  }

  if (event.kind === 'stealth') {
    effects.push(new SmokeCloud(scene, event.x, event.z, event.color || b.accent, { life: 1.25 }));
    ps.burst({ x: event.x, y: 0.55, z: event.z }, { count: 30, color: event.color || b.accent, speed: 3.2, life: 0.55 });
  }
}

function launchBasic() {
  const b = player.brawler;
  const baseAngle = player.aimAngle;
  const actionId = nextActionId(`${b.id}-basic`);
  const cap = superGainCapForBrawler(b.id, 'basic');

  if (b.id === 'joao') {
    fireEvent(projectileAtTip(baseAngle, b, {
      actionId, actionKind: 'basic', hitType: HIT_TYPES.PROJECTILE,
      range: 8.4, damage: 25, speed: 13.2, color: 0x48b6ff,
      size: 0.12, glowSize: 0.28,
      superGain: b.superGainBasic, superGainOnPlayer: b.superGainBasic, superGainCap: cap
    }));
    return;
  }

  if (b.id === 'luan') {
    const origin = { x: player.x, z: player.z };
    fireEvent({
      kind: 'cone', brawlerId: b.id, x: origin.x, z: origin.z, angle: player.aimAngle,
      range: 2.75, arc: 1.38, damage: 16, color: b.accent,
      actionId, actionKind: 'basic', hitType: HIT_TYPES.MELEE,
      superGain: b.superGainBasic, superGainOnPlayer: b.superGainBasic, superGainCap: cap
    });
    return;
  }

  if (b.id === 'djonga') {
    // Cada soco recalcula posição/mira local para o combo não bater no vazio se o jogador andar.
    for (let i = 0; i < 3; i++) {
      window.setTimeout(() => {
        if (!player || player.isDown) return;
        fireEvent({
          kind: 'cone', brawlerId: b.id, x: player.x, z: player.z, angle: player.aimAngle,
          range: 2.35, arc: 1.12, damage: 8, color: i === 1 ? 0x2764c8 : b.accent,
          comboIndex: i,
          actionId, actionKind: 'basic', hitType: HIT_TYPES.MELEE,
          superGain: b.superGainBasic, superGainOnPlayer: b.superGainBasic, superGainCap: cap
        });
      }, i * 115);
    }
    return;
  }

  if (b.id === 'thomas') {
    // Lâminas físicas, sem rastro mágico exagerado.
    const offsets = [-0.27, -0.09, 0.09, 0.27];
    offsets.forEach((off, i) => {
      fireEvent(projectileAtTip(baseAngle + off, b, {
        actionId, actionKind: 'basic', hitType: HIT_TYPES.PROJECTILE,
        range: 8.7, damage: 6, damageNear: 9, damageFar: 3,
        speed: 14.7, color: 0xd7edf5, size: 0.074, glowSize: 0.08,
        delay: i * 0.022,
        superGain: b.superGainBasic, superGainOnPlayer: b.superGainBasic, superGainCap: cap
      }));
    });
    return;
  }

  if (b.id === 'gui') {
    fireEvent(projectileAtTip(baseAngle, b, {
      actionId, actionKind: 'basic', hitType: HIT_TYPES.PROJECTILE,
      range: 6.5, damage: 18, speed: 11.8, color: b.accent,
      size: 0.16, glowSize: 0.34, big: true,
      split: true, splitDamage: 4, splitRange: 4.8, splitSpeed: 12.2,
      splitColor: 0xff8de8, splitSize: 0.065, splitGlowSize: 0.14,
      splitSuperGain: 3, splitSuperGainOnPlayer: 3,
      superGain: b.superGainBasic, superGainOnPlayer: b.superGainBasic, superGainCap: cap
    }));
    return;
  }

  if (b.id === 'lorenzo') {
    // Rajada tipo sucata: física, larga e com pellets sem brilho mágico.
    const volley = [-0.62, -0.44, -0.27, -0.09, 0.09, 0.27, 0.44, 0.62, 0];
    volley.forEach((off, i) => {
      fireEvent(projectileAtTip(baseAngle + off, b, {
        actionId, actionKind: 'basic', hitType: HIT_TYPES.PROJECTILE,
        range: 7.9, damage: 6, speed: 13.1, color: 0xbfc6c7,
        size: 0.072, glowSize: 0.05, delay: i * 0.022,
        superGain: b.superGainBasic, superGainOnPlayer: b.superGainBasic, superGainCap: cap
      }));
    });
    return;
  }

  if (b.id === 'ministro') {
    fireEvent(projectileAtTip(baseAngle, b, {
      actionId, actionKind: 'basic', hitType: HIT_TYPES.PROJECTILE,
      range: 12.8, damage: 30, speed: 13.4, color: b.accent,
      size: 0.095, glowSize: 0.2, pierce: true,
      superGain: b.superGainBasic, superGainOnPlayer: b.superGainBasic, superGainCap: cap
    }));
  }
}

function launchSuper() {
  const b = player.brawler;
  const angle = player.aimAngle;
  const actionId = nextActionId(`${b.id}-super`);
  const common = { actionId, actionKind: 'super', superGainCap: superGainCapForBrawler(b.id, 'super') };

  if (b.id === 'joao') {
    const target = aimTarget(9.6);
    fireEvent({
      kind: 'chain', brawlerId: b.id, x: target.x, z: target.z,
      radius: 1.95, damage: 25, color: b.accent,
      hitType: HIT_TYPES.CONTROL, ...common
    });
    player.useSuper();
    shakeTimer = 0.18;
    return;
  }

  if (b.id === 'luan') {
    fireEvent({
      kind: 'dash', brawlerId: b.id, x: player.x, z: player.z, angle,
      radius: 1.18, distance: 4.3, duration: 0.46, damage: 16, color: b.accent,
      hitType: HIT_TYPES.MELEE, ...common
    });
    player.useSuper();
    shakeTimer = 0.2;
    return;
  }

  if (b.id === 'djonga') {
    const target = aimTarget(6.0);
    fireEvent({
      kind: 'leap', brawlerId: b.id, x: target.x, z: target.z,
      radius: 1.9, damage: 22, color: b.accent,
      hitType: HIT_TYPES.AREA, ...common
    });
    player.useSuper();
    shakeTimer = 0.24;
    return;
  }

  if (b.id === 'thomas') {
    player.startStealth(4.4);
    fireEvent({
      kind: 'stealth', brawlerId: b.id, x: player.x, z: player.z,
      color: b.accent, hitType: HIT_TYPES.CONTROL, ...common
    });
    player.useSuper();
    return;
  }

  if (b.id === 'gui') {
    fireEvent(projectileAtTip(angle, b, {
      actionId, actionKind: 'super', hitType: HIT_TYPES.CONTROL,
      range: 11.8, damage: 8, speed: 15, color: b.accent,
      size: 0.22, glowSize: 0.45, big: true, pierce: true,
      pull: true, pullToX: player.x, pullToZ: player.z, pullDistance: 3.2,
      superGain: 0, superGainOnPlayer: 0, superGainCap: 0
    }));
    player.useSuper();
    shakeTimer = 0.12;
    return;
  }

  if (b.id === 'lorenzo') {
    const target = aimTarget(5.6);
    fireEvent({
      kind: 'turret', brawlerId: b.id, x: target.x, z: target.z,
      color: b.accent, hitType: HIT_TYPES.HEAL, ...common
    });
    player.useSuper();
    return;
  }

  if (b.id === 'ministro') {
    const target = aimTarget(9.0);
    fireEvent({
      kind: 'area', brawlerId: b.id, x: target.x, z: target.z,
      radius: 2.0, damage: 30, color: b.accent,
      hitType: HIT_TYPES.POISON, ...common
    });
    player.useSuper();
    shakeTimer = 0.16;
  }
}

async function attemptJoin() {
  const pin = pinInput.value.trim();
  if (!pin) {
    setStatus('Digita um PIN ou clica em Criar Sala.', 'error');
    return;
  }
  const name = nameInput.value.trim() || 'Jogador';
  createBtn.disabled = true;
  joinBtn.disabled = true;
  setStatus('Conectando...', null);
  try {
    await room.join(pin, name, selectedBrawlerId, selectedGameMode);
    setStatus('Conectado!', 'ok');
    hudPin.textContent = pin;
  } catch (err) {
    setStatus('Não consegui conectar. Confere sua internet e tenta de novo.', 'error');
    createBtn.disabled = false;
    joinBtn.disabled = false;
  }
}

createBtn.addEventListener('click', () => {
  pinInput.value = randomPin();
  attemptJoin();
});
joinBtn.addEventListener('click', () => attemptJoin());
startMatchBtn.addEventListener('click', () => {
  if (!isHost || selectedGameMode !== 'battle' || started) return;
  const startAt = Date.now() + 3000;
  room.sendWorld({ type: 'match_start', startAt, mode: 'battle' });
  scheduleMatchStart({ startAt });
});
pinInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') attemptJoin();
});
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') attemptJoin();
});

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'r' && state === 'playing') resetArena();
  if (k === 'c' && state === 'playing' && selectedGameMode === 'open') toggleSwitchPanel();
});

function resetArena() {
  const sp = spawnPointFor(room.mySlot);
  scene.remove(player.root);
  player = new Player(sp.x, sp.z, room.myBrawlerId || selectedBrawlerId, room.mySlot);
  scene.add(player.root);
  isSpectator = false;
  matchElapsed = 0;
  toxicDamageTimer = 0;
  toxicVisualTimer = 0;
  lastDownBroadcast = false;
  rebuildToxicVisual(true);
  for (const p of projectiles) p._removeFrom(scene);
  for (const fx of effects) if (fx.kill) fx.kill();
  projectiles = [];
  effects = [];
  world.reset();
  room.sendWorld({ type: 'world_reset' });
  updateHudStatic();
}

function ensureNameTag(id) {
  let el = nameTagPool.get(id);
  if (!el) {
    el = document.createElement('div');
    el.className = 'name-tag';
    el.innerHTML = `
      <div class="name-tag-line"></div>
      <div class="name-tag-hp"><span></span></div>
    `;
    nameTagsContainer.appendChild(el);
    nameTagPool.set(id, el);
  }
  return el;
}

function updateNameTag(el, label, hp, hpMax, down) {
  const line = el.querySelector('.name-tag-line');
  const fill = el.querySelector('.name-tag-hp span');
  const ratio = hpMax > 0 ? Math.max(0, Math.min(1, hp / hpMax)) : 0;
  line.textContent = label;
  fill.style.width = `${ratio * 100}%`;
  fill.classList.toggle('is-low', ratio <= 0.35);
  fill.classList.toggle('is-down', !!down);
  el.classList.toggle('is-down', !!down);
}

function removeNameTag(id) {
  const el = nameTagPool.get(id);
  if (el) {
    el.remove();
    nameTagPool.delete(id);
  }
}

function positionTag(el, x, z) {
  const p = new THREE.Vector3(x, 2.65, z);
  p.project(camera);
  el.style.left = ((p.x * 0.5 + 0.5) * window.innerWidth) + 'px';
  el.style.top = ((-p.y * 0.5 + 0.5) * window.innerHeight) + 'px';
}


function sameBushAsLocal(rp) {
  if (!player || !rp) return false;
  return world.bushes.some(b =>
    world.circleOverlapsBush(player.x, player.z, player.radius * 0.72, b) &&
    world.circleOverlapsBush(rp.x, rp.z, 0.45, b)
  );
}

function remoteVisibilityOpacity(rp) {
  if (!rp) return 0;
  if (isSpectator) return rp.isDown ? 0.28 : 1;
  if (rp.isDown) return 0.28;
  if (rp.stealth) return 0;
  if (rp.inBush && !sameBushAsLocal(rp)) return 0;
  return 1;
}

function applyRemoteVisibility() {
  for (const rp of remotePlayers.values()) {
    rp.setVisibilityOpacity(remoteVisibilityOpacity(rp));
  }
}

function updateNameTags() {
  const crown = selectedGameMode === 'open' ? leaderId() : null;
  if (player) {
    const tag = ensureNameTag('__me');
    const crownTxt = crown === room.myId ? '👑 ' : '';
    const killTxt = selectedGameMode === 'open' ? ` · ${getKills(room.myId)}K` : '';
    updateNameTag(tag, `${crownTxt}${room.myName} · ${player.brawler.name}${killTxt} · ${Math.round(player.hp)}/${player.hpMax}${player.isDown ? ' · CAÍDO' : ''}`, player.hp, player.hpMax, player.isDown);
    positionTag(tag, player.x, player.z);
  }
  for (const [id, rp] of remotePlayers) {
    const tag = ensureNameTag(id);
    const visibleOpacity = remoteVisibilityOpacity(rp);
    tag.style.display = visibleOpacity > 0.01 ? 'block' : 'none';
    if (visibleOpacity <= 0.01) continue;
    const crownTxt = crown === id ? '👑 ' : '';
    const killTxt = selectedGameMode === 'open' ? ` · ${getKills(id)}K` : '';
    updateNameTag(tag, `${crownTxt}${rp.name} · ${rp.brawler.name}${killTxt} · ${Math.round(rp.hp)}/${rp.hpMax}${rp.isDown ? ' · CAÍDO' : ''}`, rp.hp, rp.hpMax, rp.isDown);
    positionTag(tag, rp.x, rp.z);
  }
}

function update(dt) {
  if (selectedGameMode === 'battle') {
    matchElapsed = Math.min(MATCH_DURATION, matchElapsed + dt);
    toxicVisualTimer -= dt;
    rebuildToxicVisual(false);
  }

  const hpBeforeUpdate = player.hp;
  player.update(dt, input, world);
  if (player.hp > hpBeforeUpdate + 0.01) {
    const healed = player.hp - hpBeforeUpdate;
    recordHealing(healed, { x: player.x, z: player.z }, 'heal');
    regenBroadcastTimer -= dt;
    if (regenBroadcastTimer <= 0 || player.hp >= player.hpMax) {
      regenBroadcastTimer = 0.35;
      broadcastHealth('regen');
    }
  } else {
    regenBroadcastTimer = Math.min(regenBroadcastTimer, 0.2);
  }
  if (selectedGameMode === 'battle') applyToxicDamage(dt);
  else handleOpenRespawn(dt);

  const shiftAiming = input.keys.has('shift');
  const superPressed = input.consumeSuperPress();

  if (!isSpectator && input.firing && !shiftAiming && player.canFire()) {
    player.fire();
    launchBasic();
  }

  if (!isSpectator && superPressed && !shiftAiming && player.canSuper()) {
    launchSuper();
    ps.burst({ x: player.x, y: 0.6, z: player.z }, { count: 22, color: player.brawler.accent, speed: 3.2, life: 0.5 });
  }

  showAttackPreview(!isSpectator && shiftAiming && input.keys.has('q') ? 'super' : 'basic');

  for (const p of projectiles) p.update(dt, world, ps, player);
  projectiles = projectiles.filter(p => !p.dead);

  const hpBeforeEffects = player.hp;
  for (const fx of effects) fx.update(dt, world, ps, player);
  effects = effects.filter(fx => !fx.dead);
  if (player.hp > hpBeforeEffects + 0.01) {
    const healed = player.hp - hpBeforeEffects;
    recordHealing(healed, { x: player.x, z: player.z }, 'heal');
    regenBroadcastTimer -= dt;
    if (regenBroadcastTimer <= 0 || player.hp >= player.hpMax) {
      regenBroadcastTimer = 0.35;
      broadcastHealth('heal-effect');
    }
  }

  world.update(dt);
  ps.update(dt);

  for (const rp of remotePlayers.values()) rp.update(dt);
  applyRemoteVisibility();

  if (player.isDown && !lastDownBroadcast) {
    lastDownBroadcast = true;
    broadcastHealth('downed');
    if (selectedGameMode === 'battle') enterSpectator('foi eliminado');
    else openRespawnTimer = 0;
  }

  netSendTimer += dt;
  if (netSendTimer >= NET_SEND_INTERVAL) {
    netSendTimer = 0;
    room.sendState(player.netState());
  }

  if (shakeTimer > 0) shakeTimer -= dt;

  hudAmmoPips.forEach((el, i) => el.classList.toggle('filled', i < player.ammo));
  hudSuperFill.style.width = player.superCharge + '%';
  hudSuperBox.classList.toggle('is-ready', player.superCharge >= player.superMax);
  hudHealthFill.style.width = `${Math.max(0, Math.min(100, (player.hp / player.hpMax) * 100))}%`;
  hudHealthText.textContent = player.isDown ? 'ELIMINADO' : `${Math.round(player.hp)} / ${player.hpMax}`;
  if (hudAlive) hudAlive.textContent = selectedGameMode === 'battle' ? `VIVOS ${aliveCount()}` : `ONLINE ${aliveCount()}`;
  if (hudTimer) hudTimer.textContent = selectedGameMode === 'battle' ? formatTime(MATCH_DURATION - matchElapsed) : 'ABERTO';
  if (hudToxic) hudToxic.textContent = selectedGameMode === 'battle' ? `NÉVOA ${Math.max(0, Math.round((safeRadius() / TOXIC_START_RADIUS) * 100))}%` : `LÍDER ${leaderId() ? (playerStats.get(leaderId())?.kills || 0) : 0}`;
  if (hudKills) hudKills.textContent = `KILLS ${getKills(room.myId)}`;
  updateCombatHud();
  if (hudMode) hudMode.textContent = selectedGameMode === 'battle' ? 'BR' : 'ABERTO';

  updateFloatingTexts(dt);
  updateNameTags();
}

let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 1 / 30);

  if (state === 'countdown') updateCountdown();
  if (state === 'playing') update(dt);

  updateCamera(dt);

  if (shakeTimer > 0) {
    camera.position.x += (Math.random() - 0.5) * shakeTimer * 0.045;
    camera.position.y += (Math.random() - 0.5) * shakeTimer * 0.045;
  }

  renderer.render(scene, camera);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('beforeunload', () => room.leave());
