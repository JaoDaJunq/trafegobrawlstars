import * as THREE from 'three';
import { toonMaterial, withOutline } from './toon.js';
import { COLORS } from './constants.js';
import { getBrawler } from './brawlers.js';

export const BODY_HEIGHT = 0.9;
export const GUN_TIP_LOCAL = new THREE.Vector3(0, 0.06, 1.22);
export const PLAYER_RADIUS = 0.58;

const VISUALS = {
  joao: {
    scale: [0.9, 1.06, 0.9], skin: 0xd8aa8d, hair: 0x171214, hairLight: 0x3a2925,
    shirt: 0xf4f0ec, jacket: 0x7b2237, sleeve: 0xead8bf, pants: 0x171a22,
    shoe: 0xf3eee8, shoeAccent: 0x7b2237, accent: 0x48b6ff,
    style: 'joao', weapon: 'rose'
  },
  luan: {
    scale: [1.18, 1.08, 1.08], skin: 0xd7a17f, hair: 0x171212, hairLight: 0x3a211d,
    shirt: 0x0d0e12, jacket: 0x0d0e12, sleeve: 0xd7a17f, pants: 0x0e1015,
    shoe: 0x121217, shoeAccent: 0xe5484d, accent: 0xe5484d,
    style: 'luan', weapon: 'sword'
  },
  djonga: {
    scale: [1.12, 1.02, 1.0], skin: 0xc98761, hair: 0x17100c, hairLight: 0x3a2418,
    shirt: null, jacket: null, sleeve: 0xc98761, pants: 0x16161b,
    shoe: 0xc98761, shoeAccent: 0xe5484d, accent: 0xe5484d,
    style: 'djonga', weapon: 'fists'
  },
  thomas: {
    scale: [0.86, 1.12, 0.88], skin: 0xe1b08e, hair: 0x8b7458, hairLight: 0xd6c39d,
    shirt: 0x0f2446, jacket: 0x0f2446, sleeve: 0xe1b08e, pants: 0x0c1320,
    shoe: 0x0c172d, shoeAccent: 0x74d8ff, accent: 0x74d8ff,
    style: 'thomas', weapon: 'blades'
  },
  gui: {
    scale: [1.08, 1.13, 1.0], skin: 0xd8aa8d, hair: 0x241b18, hairLight: 0x6f5a46,
    shirt: 0x141419, jacket: 0x141419, sleeve: 0xd8aa8d, pants: 0x15151d,
    shoe: 0x10111a, shoeAccent: 0x9b5cff, accent: 0x9b5cff,
    style: 'gui', weapon: 'orb'
  },
  lorenzo: {
    scale: [1.05, 1.05, 1.14], skin: 0xd9ad8e, hair: 0x7a654f, hairLight: 0xc9b48b,
    shirt: 0x0b0d11, jacket: 0x0b0d11, sleeve: 0x0b0d11, pants: 0x12151b,
    shoe: 0x0d1116, shoeAccent: 0x00d7c7, accent: 0x00d7c7,
    style: 'lorenzo', weapon: 'cannon'
  },
  ministro: {
    scale: [0.98, 1.18, 1.03], skin: 0xd4a587, hair: 0x1b1412, hairLight: 0x4b3427,
    shirt: 0x0d0f12, jacket: 0x14191f, sleeve: 0x14191f, pants: 0x15171c,
    shoe: 0xf0e7d8, shoeAccent: 0x0b5b45, accent: 0x39d98a,
    style: 'ministro', weapon: 'dart'
  }
};

function v3(x, y, z) { return new THREE.Vector3(x, y, z); }

function addOutlined(group, mesh, outline = 0.04) {
  mesh.castShadow = true;
  group.add(withOutline(mesh, outline, COLORS.outline));
  return mesh;
}

function box(group, size, pos, color, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), toonMaterial(color));
  mesh.position.copy(pos);
  if (opts.rot) mesh.rotation.set(opts.rot.x || 0, opts.rot.y || 0, opts.rot.z || 0);
  if (opts.scale) mesh.scale.copy(opts.scale);
  return addOutlined(group, mesh, opts.outline ?? 0.04);
}

function sphere(group, radius, pos, color, scale = v3(1, 1, 1), opts = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, opts.w || 18, opts.h || 12), toonMaterial(color));
  mesh.position.copy(pos);
  mesh.scale.copy(scale);
  if (opts.rot) mesh.rotation.set(opts.rot.x || 0, opts.rot.y || 0, opts.rot.z || 0);
  return addOutlined(group, mesh, opts.outline ?? 0.04);
}

function cyl(group, rt, rb, h, pos, color, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, opts.radial || 16), toonMaterial(color));
  mesh.position.copy(pos);
  if (opts.rot) mesh.rotation.set(opts.rot.x || 0, opts.rot.y || 0, opts.rot.z || 0);
  if (opts.scale) mesh.scale.copy(opts.scale);
  return addOutlined(group, mesh, opts.outline ?? 0.035);
}

function plainBox(group, size, pos, color, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial({ color }));
  mesh.position.copy(pos);
  if (opts.rot) mesh.rotation.set(opts.rot.x || 0, opts.rot.y || 0, opts.rot.z || 0);
  group.add(mesh);
  return mesh;
}

function plainCircle(group, r, pos, color, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, opts.segments || 16), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  mesh.position.copy(pos);
  if (opts.rot) mesh.rotation.set(opts.rot.x || 0, opts.rot.y || 0, opts.rot.z || 0);
  group.add(mesh);
  return mesh;
}

function addEyes(group, y = 0.68, color = 0x101010) {
  plainCircle(group, 0.033, v3(-0.082, y, 0.272), color, { rot: { y: Math.PI } });
  plainCircle(group, 0.033, v3(0.082, y, 0.272), color, { rot: { y: Math.PI } });
}

function addHead(group, v) {
  sphere(group, 0.28, v3(0, 0.66, 0.02), v.skin, v3(0.92, 1.05, 0.88), { outline: 0.05 });
  addEyes(group, 0.69);
  if (v.style === 'joao' || v.style === 'gui') {
    for (const x of [-0.085, 0.085]) box(group, v3(0.13, 0.05, 0.018), v3(x, 0.69, 0.29), 0x111111, { outline: 0.012 });
    plainBox(group, v3(0.055, 0.018, 0.018), v3(0, 0.69, 0.293), 0x111111);
  }
  if (v.style === 'thomas') sphere(group, 0.032, v3(0.255, 0.67, 0.02), 0xcde9ff, v3(0.65, 1, 0.65), { outline: 0.012 });
  if (v.style === 'lorenzo') {
    sphere(group, 0.035, v3(-0.255, 0.67, 0.02), 0xffffff, v3(0.65, 1, 0.65), { outline: 0.012 });
    sphere(group, 0.035, v3(0.255, 0.67, 0.02), 0xffffff, v3(0.65, 1, 0.65), { outline: 0.012 });
  }
  if (v.style === 'joao' || v.style === 'luan' || v.style === 'gui' || v.style === 'ministro') {
    plainBox(group, v3(0.1, 0.025, 0.018), v3(0, 0.56, 0.292), 0x2c1d19);
    plainBox(group, v3(0.12, 0.022, 0.018), v3(0, 0.49, 0.275), 0x2c1d19);
  }
}

function addHair(group, v) {
  const baseY = 0.88;
  const color = v.hair;
  if (v.style === 'ministro') {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = 0.2 + (i % 2) * 0.05;
      sphere(group, 0.095, v3(Math.cos(a) * r, baseY + Math.sin(i) * 0.025, Math.sin(a) * 0.15), i % 2 ? v.hairLight : color, v3(1.05, 1, 1.05), { outline: 0.026, w: 10, h: 8 });
    }
    sphere(group, 0.19, v3(0, baseY + 0.035, -0.02), color, v3(1.25, 0.78, 1.1), { outline: 0.035 });
    return;
  }
  sphere(group, 0.22, v3(0, baseY, -0.02), color, v3(1.25, 0.72, 1.05), { outline: 0.035 });
  const tufts = v.style === 'thomas' || v.style === 'lorenzo' ? 9 : v.style === 'gui' ? 12 : 8;
  for (let i = 0; i < tufts; i++) {
    const x = -0.2 + (i / Math.max(1, tufts - 1)) * 0.4;
    const y = baseY + 0.04 + Math.sin(i * 1.7) * 0.05;
    const z = 0.07 + Math.cos(i * 0.8) * 0.05;
    const c = i % 3 === 0 && v.hairLight ? v.hairLight : color;
    sphere(group, 0.085, v3(x, y, z), c, v3(1.25, 0.62, 0.9), { outline: 0.025, w: 10, h: 7, rot: { z: x * 2.5 } });
  }
}

function addTorso(group, v) {
  if (v.style === 'djonga') {
    sphere(group, 0.38, v3(0, 0.16, 0.02), v.skin, v3(1.02, 1.22, 0.8), { outline: 0.055 });
    plainBox(group, v3(0.12, 0.02, 0.02), v3(-0.11, 0.28, 0.31), 0x7b4d38);
    plainBox(group, v3(0.12, 0.02, 0.02), v3(0.11, 0.28, 0.31), 0x7b4d38);
    return;
  }
  const wide = v.style === 'luan' ? 0.68 : v.style === 'lorenzo' || v.style === 'ministro' ? 0.62 : 0.54;
  const depth = v.style === 'lorenzo' || v.style === 'ministro' ? 0.44 : 0.36;
  box(group, v3(wide, 0.6, depth), v3(0, 0.14, 0), v.jacket, { outline: 0.055 });
  box(group, v3(wide * 0.58, 0.45, depth + 0.03), v3(0, 0.11, 0.045), v.shirt, { outline: 0.035 });

  if (v.style === 'joao') {
    box(group, v3(0.14, 0.5, depth + 0.05), v3(-wide * 0.35, 0.14, 0.06), v.sleeve, { outline: 0.035 });
    box(group, v3(0.14, 0.5, depth + 0.05), v3(wide * 0.35, 0.14, 0.06), v.sleeve, { outline: 0.035 });
    box(group, v3(0.46, 0.16, 0.22), v3(0, 0.46, -0.04), 0xf4f0ec, { outline: 0.03 });
  }
  if (v.style === 'ministro') {
    for (let i = 0; i < 5; i++) plainBox(group, v3(wide * 0.9, 0.02, depth + 0.08), v3(0, -0.12 + i * 0.12, 0.12), 0x28323d);
    box(group, v3(0.44, 0.16, 0.22), v3(0, 0.48, -0.02), 0x242a32, { outline: 0.03 });
  }
  if (v.style === 'gui') {
    box(group, v3(0.13, 0.76, depth + 0.08), v3(-0.12, 0.12, 0.09), 0x4e2a72, { outline: 0.03, rot: { z: -0.45 } });
    plainCircle(group, 0.08, v3(0.18, 0.17, 0.28), v.accent, { rot: { y: Math.PI }, segments: 18 });
  }
  if (v.style === 'lorenzo') {
    box(group, v3(0.11, 0.65, depth + 0.16), v3(-wide * 0.42, 0.12, 0.12), 0x303640, { outline: 0.025 });
    box(group, v3(0.11, 0.65, depth + 0.16), v3(wide * 0.42, 0.12, 0.12), 0x303640, { outline: 0.025 });
    plainBox(group, v3(0.13, 0.13, 0.035), v3(0.25, 0.12, 0.3), v.accent);
  }
  if (v.style === 'luan') {
    plainBox(group, v3(0.17, 0.09, 0.03), v3(0.2, 0.2, 0.27), v.accent);
    plainBox(group, v3(0.09, 0.25, 0.03), v3(-0.2, 0.14, 0.27), v.accent);
  }
}

function addArms(group, v) {
  const skin = v.sleeve ?? v.skin;
  const shoulder = v.style === 'luan' || v.style === 'djonga' ? 0.43 : 0.35;
  for (const side of [-1, 1]) {
    const upperColor = v.style === 'joao' ? v.sleeve : v.style === 'djonga' ? v.skin : v.jacket;
    cyl(group, 0.055, 0.07, 0.42, v3(side * shoulder, 0.16, 0.02), upperColor, { outline: 0.03, rot: { z: side * 0.2 } });
    cyl(group, 0.05, 0.055, 0.36, v3(side * (shoulder + 0.04), -0.12, 0.09), skin, { outline: 0.028, rot: { z: side * 0.15 } });
  }
  if (v.style === 'djonga') {
    sphere(group, 0.17, v3(-0.52, -0.02, 0.22), 0x111111, v3(1.15, 0.9, 1.25), { outline: 0.055 });
    sphere(group, 0.17, v3(0.52, -0.02, 0.22), 0x111111, v3(1.15, 0.9, 1.25), { outline: 0.055 });
    plainBox(group, v3(0.2, 0.04, 0.12), v3(-0.52, 0.08, 0.25), 0xd62d2d);
    plainBox(group, v3(0.2, 0.04, 0.12), v3(0.52, 0.08, 0.25), 0x2764c8);
  }
}

function addLegs(group, v) {
  if (v.style === 'djonga') {
    box(group, v3(0.52, 0.2, 0.28), v3(0, -0.28, 0.03), v.pants, { outline: 0.045 });
    plainBox(group, v3(0.22, 0.19, 0.03), v3(-0.14, -0.25, 0.2), 0xd62d2d);
    plainBox(group, v3(0.22, 0.19, 0.03), v3(0.14, -0.25, 0.2), 0x2764c8);
    cyl(group, 0.06, 0.075, 0.44, v3(-0.16, -0.58, 0.02), v.skin, { outline: 0.035 });
    cyl(group, 0.06, 0.075, 0.44, v3(0.16, -0.58, 0.02), v.skin, { outline: 0.035 });
    return;
  }
  for (const x of [-0.16, 0.16]) {
    box(group, v3(0.2, 0.48, 0.2), v3(x, -0.44, 0), v.pants, { outline: 0.04 });
    box(group, v3(0.24, 0.13, 0.38), v3(x, -0.78, 0.12), v.shoe, { outline: 0.035 });
    plainBox(group, v3(0.18, 0.025, 0.2), v3(x, -0.71, 0.18), v.shoeAccent);
  }
  if (v.style === 'lorenzo') {
    plainBox(group, v3(0.16, 0.14, 0.04), v3(-0.31, -0.43, 0.15), 0x222831);
    plainBox(group, v3(0.16, 0.14, 0.04), v3(0.31, -0.43, 0.15), 0x222831);
  }
}

function addAccessories(group, v) {
  if (v.style !== 'djonga') {
    plainBox(group, v3(0.018, 0.28, 0.018), v3(-0.06, 0.25, 0.28), 0xd8d8d8, { rot: { z: -0.25 } });
    plainBox(group, v3(0.018, 0.28, 0.018), v3(0.06, 0.25, 0.28), 0xd8d8d8, { rot: { z: 0.25 } });
    sphere(group, 0.035, v3(0, 0.1, 0.3), 0xe9e2d0, v3(0.75, 1, 0.75), { outline: 0.015 });
  }
  if (v.style === 'luan') {
    for (let i = 0; i < 7; i++) box(group, v3(0.045, 0.035, 0.03), v3(0.22 + i * 0.045, -0.22 - i * 0.026, 0.24), 0xc6c6c6, { outline: 0.014, rot: { z: 0.5 } });
  }
  if (v.style === 'ministro') {
    for (const [x, color] of [[-0.3, 0x39d98a], [0.31, 0xe0b169], [0.05, 0x6dffe0]]) {
      cyl(group, 0.035, 0.05, 0.22, v3(x, -0.22, 0.24), color, { outline: 0.015 });
    }
  }
}

function addRoseWeapon(g) {
  cyl(g, 0.028, 0.035, 0.9, v3(0, -0.02, 0.78), 0x15273c, { outline: 0.025, rot: { x: Math.PI / 2 } });
  sphere(g, 0.15, v3(0, 0.06, 1.28), 0x30a8ff, v3(1, 0.85, 1), { outline: 0.04 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    sphere(g, 0.08, v3(Math.cos(a) * 0.09, 0.06 + Math.sin(a) * 0.03, 1.28 + Math.sin(a) * 0.07), i % 2 ? 0x85ddff : 0x1978ff, v3(1.25, 0.5, 0.75), { outline: 0.022 });
  }
}

function addSword(g, accent) {
  box(g, v3(0.2, 0.16, 0.38), v3(0, -0.04, 0.36), 0x121318, { outline: 0.055 });
  box(g, v3(0.62, 0.08, 0.12), v3(0, 0.015, 0.56), 0x0a0b0f, { outline: 0.04 });
  box(g, v3(0.19, 0.075, 1.8), v3(0, 0, 1.24), 0x23252b, { outline: 0.06 });
  box(g, v3(0.055, 0.105, 1.68), v3(0, 0.025, 1.26), accent, { outline: 0.018 });
  box(g, v3(0.22, 0.035, 0.18), v3(0, 0.01, 2.17), 0xf0f0f0, { outline: 0.022 });
}

function addBlades(g, accent) {
  for (const x of [-0.24, 0.24]) {
    box(g, v3(0.08, 0.045, 1.08), v3(x, 0, 0.86), 0xd7edf5, { outline: 0.04, rot: { z: x < 0 ? 0.28 : -0.28 } });
    box(g, v3(0.035, 0.062, 0.9), v3(x + (x < 0 ? -0.028 : 0.028), 0.01, 0.93), accent, { outline: 0.014, rot: { z: x < 0 ? 0.28 : -0.28 } });
    box(g, v3(0.12, 0.085, 0.26), v3(x, -0.02, 0.36), 0x0a1324, { outline: 0.04 });
  }
}

function addOrb(g, accent) {
  sphere(g, 0.29, v3(0, 0.04, 0.8), accent, v3(1, 1, 1), { outline: 0.08 });
  sphere(g, 0.13, v3(0, 0.04, 0.8), 0xe8d08a, v3(1, 0.85, 1), { outline: 0.025 });
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    sphere(g, 0.055, v3(Math.cos(a) * 0.33, Math.sin(a) * 0.16, 0.8 + Math.sin(a) * 0.18), 0xb985ff, v3(1, 1, 1), { outline: 0.018 });
  }
}

function addCannon(g, accent) {
  cyl(g, 0.38, 0.25, 0.98, v3(0, 0, 0.78), 0x10171d, { outline: 0.095, rot: { x: Math.PI / 2 }, radial: 22 });
  cyl(g, 0.3, 0.3, 0.2, v3(0, 0, 1.3), 0x263640, { outline: 0.065, rot: { x: Math.PI / 2 }, radial: 22 });
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9;
    cyl(g, 0.036, 0.04, 0.42, v3(Math.cos(a) * 0.16, Math.sin(a) * 0.12, 1.5), i % 2 ? accent : 0xbfc6c7, { outline: 0.014, rot: { x: Math.PI / 2 }, radial: 8 });
  }
  box(g, v3(0.28, 0.14, 0.4), v3(0, -0.22, 0.54), 0x00a79c, { outline: 0.028 });
  box(g, v3(0.42, 0.08, 0.18), v3(0, 0.25, 0.66), 0x303840, { outline: 0.02 });
}

function addDart(g, accent) {
  box(g, v3(0.1, 0.1, 1.02), v3(0, 0, 0.78), 0x18201d, { outline: 0.045 });
  box(g, v3(0.56, 0.065, 0.1), v3(0, 0.02, 0.63), 0x9b7b3a, { outline: 0.025 });
  cyl(g, 0.038, 0.072, 0.55, v3(0, 0, 1.48), accent, { outline: 0.03, rot: { x: Math.PI / 2 }, radial: 12 });
  cyl(g, 0.06, 0.06, 0.24, v3(0, -0.11, 0.44), accent, { outline: 0.025 });
  sphere(g, 0.075, v3(0, -0.11, 0.56), 0xd8ffe2, v3(0.85, 1.2, 0.85), { outline: 0.018 });
}

function addFists(g) {
  sphere(g, 0.28, v3(-0.25, 0, 0.62), 0x111111, v3(1.18, 0.92, 1.35), { outline: 0.08 });
  sphere(g, 0.28, v3(0.25, 0, 0.62), 0x111111, v3(1.18, 0.92, 1.35), { outline: 0.08 });
  plainBox(g, v3(0.23, 0.045, 0.16), v3(-0.25, 0.13, 0.62), 0xd62d2d);
  plainBox(g, v3(0.23, 0.045, 0.16), v3(0.25, 0.13, 0.62), 0x2764c8);
}

function buildWeapon(g, v) {
  if (v.weapon === 'rose') return addRoseWeapon(g);
  if (v.weapon === 'sword') return addSword(g, v.accent);
  if (v.weapon === 'fists') return addFists(g);
  if (v.weapon === 'blades') return addBlades(g, v.accent);
  if (v.weapon === 'orb') return addOrb(g, v.accent);
  if (v.weapon === 'cannon') return addCannon(g, v.accent);
  if (v.weapon === 'dart') return addDart(g, v.accent);
}

export function buildBrawlerMesh(bodyColor, brawlerId = 'joao') {
  const brawler = getBrawler(brawlerId);
  const v = VISUALS[brawler.id] || VISUALS.joao;
  const root = new THREE.Object3D();
  root.userData.brawlerId = brawler.id;

  const bodyPivot = new THREE.Object3D();
  bodyPivot.position.set(0, BODY_HEIGHT, 0);
  bodyPivot.scale.set(v.scale[0], v.scale[1], v.scale[2]);
  root.add(bodyPivot);

  addLegs(bodyPivot, v);
  addTorso(bodyPivot, v);
  addArms(bodyPivot, v);
  addHead(bodyPivot, v);
  addHair(bodyPivot, v);
  addAccessories(bodyPivot, v);

  const gunPivot = new THREE.Object3D();
  gunPivot.position.set(0, BODY_HEIGHT + 0.02, 0.04);
  gunPivot.scale.setScalar(v.weapon === 'cannon' ? 1.25 : v.weapon === 'sword' ? 1.18 : v.weapon === 'fists' ? 1.12 : 1);
  root.add(gunPivot);
  buildWeapon(gunPivot, v);

  const shadowGeo = new THREE.CircleGeometry(PLAYER_RADIUS * 0.95, 24);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  return { root, bodyPivot, gunPivot, shadowMesh };
}

export function setMeshOpacity(root, shadowMesh, opacity) {
  root.traverse(obj => {
    if (obj.isMesh && obj.material && obj !== shadowMesh) {
      obj.material.transparent = opacity < 0.99;
      obj.material.opacity = opacity;
    }
  });
}

const NAME_COLORS = [0x22e0c2, 0xf4b740, 0xe5484d, 0x8a6de0, 0xff8a4c, 0x4ca8ff, 0x7fd93b, 0xff5fa8];

export function colorForSlot(slot) {
  return NAME_COLORS[slot % NAME_COLORS.length];
}
