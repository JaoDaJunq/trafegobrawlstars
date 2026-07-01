import * as THREE from 'three';
import { clamp, circleRectOverlapXZ } from './utils.js';
import { ARENA_W, ARENA_D, COLORS } from './constants.js';

function dispose(scene, obj) {
  if (!obj) return;
  scene.remove(obj);
  obj.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
}

function mat(color, opacity = 0.36, opts = {}) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: opts.depthTest ?? false,
    side: opts.side ?? THREE.DoubleSide,
    blending: opts.blending ?? THREE.NormalBlending
  });
}

function lineMat(color, opacity = 0.72) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false });
}

function addRing(group, inner, outer, y, color, opacity = 0.35, segments = 64) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, segments), mat(color, opacity));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = y;
  group.add(ring);
  return ring;
}

function addDisc(group, radius, y, color, opacity = 0.25, segments = 64) {
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, segments), mat(color, opacity));
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = y;
  group.add(disc);
  return disc;
}

function addLine(group, points, color, opacity = 0.7) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geo, lineMat(color, opacity));
  group.add(line);
  return line;
}

function applyAreaDamage(world, ps, player, x, z, radius, damage, gain = 12, color = COLORS.gold) {
  if (!world || !world.blockers) return;
  let hit = false;
  for (const o of world.blockers) {
    if (o.alive === false) continue;
    if (circleRectOverlapXZ(x, z, radius, o.bounds)) {
      const res = o.hit({ x: o.bounds.x, y: 0.5, z: o.bounds.z }, ps, damage);
      if (player && res) player.gainSuper(gain || res.superGain);
      if (player && player.markCombat) player.markCombat();
      ps.burst({ x: o.bounds.x, y: 0.45, z: o.bounds.z }, { count: 10, color, speed: 2.6, life: 0.38 });
      hit = true;
    }
  }
  return hit;
}

function angleDiff(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function playerInArea(player, x, z, radius) {
  if (!player || player.isDown) return false;
  return Math.hypot(player.x - x, player.z - z) <= radius + player.radius * 0.72;
}

function playerInCone(player, x, z, angle, range, arc) {
  if (!player || player.isDown) return false;
  const dx = player.x - x;
  const dz = player.z - z;
  const dist = Math.hypot(dx, dz);
  if (dist > range + player.radius * 0.72) return false;
  const a = Math.atan2(dx, dz);
  return Math.abs(angleDiff(a, angle)) <= arc * 0.5;
}

function applyConeDamage(world, ps, player, x, z, angle, range, arc, damage, gain = 10, color = COLORS.gold) {
  let hit = false;
  for (const o of world.blockers) {
    if (o.alive === false) continue;
    const dx = o.bounds.x - x;
    const dz = o.bounds.z - z;
    const dist = Math.hypot(dx, dz);
    if (dist > range + Math.max(o.bounds.w, o.bounds.d) * 0.5) continue;
    const a = Math.atan2(dx, dz);
    if (Math.abs(angleDiff(a, angle)) <= arc * 0.5) {
      const res = o.hit({ x: o.bounds.x, y: 0.5, z: o.bounds.z }, ps, damage);
      if (player && res) player.gainSuper(gain || res.superGain);
      if (player && player.markCombat) player.markCombat();
      ps.burst({ x: o.bounds.x, y: 0.45, z: o.bounds.z }, { count: 8, color, speed: 2.7, life: 0.3 });
      hit = true;
    }
  }
  return hit;
}

function buildConeMesh(range, arc, color, style = 'default') {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const a = -arc / 2 + (arc * i) / steps;
    shape.lineTo(Math.sin(a) * range, Math.cos(a) * range);
  }
  shape.lineTo(0, 0);
  const group = new THREE.Group();
  const fillOpacity = style === 'luan' ? 0.08 : style === 'djonga' ? 0.06 : 0.2;
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat(color, fillOpacity));
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.035;
  group.add(fill);

  const outer = new THREE.Group();
  const left = -arc / 2;
  const right = arc / 2;
  const edgeOpacity = style === 'djonga' ? 0.35 : 0.78;
  addLine(outer, [new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(Math.sin(left) * range, 0.08, Math.cos(left) * range)], color, edgeOpacity);
  addLine(outer, [new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(Math.sin(right) * range, 0.08, Math.cos(right) * range)], color, edgeOpacity);
  const arcPts = [];
  for (let i = 0; i <= 24; i++) {
    const a = left + (right - left) * i / 24;
    arcPts.push(new THREE.Vector3(Math.sin(a) * range, 0.08, Math.cos(a) * range));
  }
  addLine(outer, arcPts, color, style === 'djonga' ? 0.42 : 0.8);
  group.add(outer);

  if (style === 'luan') {
    const slashGeo = new THREE.TorusGeometry(range * 0.47, 0.035, 6, 56, arc * 0.75);
    const slash = new THREE.Mesh(slashGeo, mat(0xfff0f0, 0.72));
    slash.rotation.x = -Math.PI / 2;
    slash.rotation.z = -arc * 0.37;
    slash.position.set(0, 0.105, range * 0.34);
    group.add(slash);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, range * 0.88), mat(color, 0.68));
    blade.position.set(Math.sin(arc * 0.22) * range * 0.34, 0.12, Math.cos(arc * 0.22) * range * 0.42);
    blade.rotation.y = arc * 0.22;
    group.add(blade);
  } else if (style === 'djonga') {
    for (let i = 0; i < 3; i++) {
      const a = (-0.22 + i * 0.22);
      const fist = new THREE.Mesh(new THREE.SphereGeometry(0.14 - i * 0.018, 10, 8), mat(0xffd1bd, 0.72));
      fist.position.set(Math.sin(a) * range * (0.55 + i * 0.13), 0.16, Math.cos(a) * range * (0.55 + i * 0.13));
      group.add(fist);
      const impact = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.22, 18), mat(color, 0.42));
      impact.rotation.x = -Math.PI / 2;
      impact.position.copy(fist.position);
      impact.position.y = 0.08;
      group.add(impact);
    }
  } else {
    const slashGeo = new THREE.TorusGeometry(range * 0.43, 0.025, 6, 48, arc * 0.72);
    const slash = new THREE.Mesh(slashGeo, mat(0xffffff, 0.55));
    slash.rotation.x = -Math.PI / 2;
    slash.rotation.z = -arc * 0.36;
    slash.position.set(0, 0.1, range * 0.33);
    group.add(slash);
  }

  return group;
}

export class ConeSlash {
  constructor(scene, x, z, angle, range, arc, damage, color, opts = {}) {
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.angle = angle;
    this.range = range;
    this.arc = arc;
    this.damage = damage;
    this.color = color;
    this.life = opts.life || 0.22;
    this.maxLife = this.life;
    this.delay = opts.delay || 0;
    this.hit = false;
    this.ghost = !!opts.ghost;
    this.superGain = opts.superGain || 10;
    this.style = opts.style || 'default';
    this.targetPlayer = opts.targetPlayer || null;
    this.onHitPlayer = opts.onHitPlayer || null;
    this.mesh = buildConeMesh(range, arc, color, this.style);
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = angle;
    this.mesh.visible = this.delay <= 0;
    this.mesh.renderOrder = 850;
    scene.add(this.mesh);
  }

  update(dt, world, ps, player) {
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay <= 0) this.mesh.visible = true;
      return;
    }
    if (!this.hit) {
      if (!this.ghost) {
        applyConeDamage(world, ps, player, this.x, this.z, this.angle, this.range, this.arc, this.damage, this.superGain, this.color);
      } else if (this.targetPlayer && playerInCone(this.targetPlayer, this.x, this.z, this.angle, this.range, this.arc)) {
        this.onHitPlayer && this.onHitPlayer(this.damage, { x: this.targetPlayer.x, y: 0.55, z: this.targetPlayer.z }, this);
      }
      this.hit = true;
      const burstCount = this.style === 'luan' ? 5 : this.style === 'djonga' ? 4 : 10;
      const burstLife = this.style === 'luan' || this.style === 'djonga' ? 0.13 : 0.2;
      ps.burst({ x: this.x + Math.sin(this.angle) * this.range * 0.55, y: 0.35, z: this.z + Math.cos(this.angle) * this.range * 0.55 }, { color: this.color, count: burstCount, speed: 1.45, life: burstLife, cube: this.style === 'djonga' });
    }
    this.life -= dt;
    const t = Math.max(0, this.life / this.maxLife);
    this.mesh.traverse(obj => {
      if (obj.material) obj.material.opacity *= 0.92;
    });
    this.mesh.scale.setScalar(1 + (1 - t) * 0.18);
    if (this.life <= 0) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.mesh);
  }
}

export class ImpactArea {
  constructor(scene, x, z, radius, damage, color, opts = {}) {
    this.scene = scene;
    this.x = clamp(x, radius * 0.35, ARENA_W - radius * 0.35);
    this.z = clamp(z, radius * 0.35, ARENA_D - radius * 0.35);
    this.radius = radius;
    this.damage = damage;
    this.color = color;
    this.life = opts.life || 0.55;
    this.maxLife = this.life;
    this.delay = opts.delay || 0;
    this.ghost = !!opts.ghost;
    this.superGain = opts.superGain || 18;
    this.targetPlayer = opts.targetPlayer || null;
    this.onHitPlayer = opts.onHitPlayer || null;
    this.hit = false;

    this.group = new THREE.Group();
    addDisc(this.group, radius, 0.045, color, opts.opacity || 0.22);
    addRing(this.group, radius * 0.72, radius, 0.07, color, 0.55);
    addRing(this.group, radius * 0.36, radius * 0.42, 0.09, 0xffffff, 0.23);
    this.group.position.set(this.x, 0, this.z);
    this.group.visible = this.delay <= 0;
    this.group.renderOrder = 820;
    scene.add(this.group);
    this.mesh = this.group;
  }

  update(dt, world, ps, player) {
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay <= 0) this.group.visible = true;
      return;
    }
    if (!this.hit) {
      if (!this.ghost) {
        applyAreaDamage(world, ps, player, this.x, this.z, this.radius, this.damage, this.superGain, this.color);
      } else if (this.targetPlayer && playerInArea(this.targetPlayer, this.x, this.z, this.radius)) {
        this.onHitPlayer && this.onHitPlayer(this.damage, { x: this.targetPlayer.x, y: 0.55, z: this.targetPlayer.z }, this);
      }
      this.hit = true;
      ps.burst({ x: this.x, y: 0.42, z: this.z }, { color: this.color, count: 20, speed: 2.6, life: 0.42, cube: false });
    }
    this.life -= dt;
    const t = Math.max(0, this.life / this.maxLife);
    this.group.rotation.y += dt * 0.8;
    this.group.scale.setScalar(0.82 + (1 - t) * 0.58);
    this.group.traverse(obj => {
      if (obj.material) obj.material.opacity = Math.min(obj.material.opacity, t * 0.7 + 0.02);
    });
    if (this.life <= 0) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.group);
  }
}

export class ChainTrap extends ImpactArea {
  constructor(scene, x, z, radius, damage, color, opts = {}) {
    super(scene, x, z, radius, damage, color, { ...opts, life: opts.life || 1.75, opacity: 0.18 });
    this.chainGroup = new THREE.Group();
    const chainColor = opts.chainColor || 0x0c1420;
    const blue = color || 0x48b6ff;

    addRing(this.chainGroup, radius * 0.88, radius * 1.03, 0.08, blue, 0.72, 72);
    addRing(this.chainGroup, radius * 0.48, radius * 0.56, 0.1, 0xffffff, 0.28, 56);
    addDisc(this.chainGroup, radius * 0.22, 0.11, blue, 0.28, 40);

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const sx = Math.sin(a);
      const cz = Math.cos(a);
      const anchor = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.25, 8), mat(chainColor, 0.9));
      anchor.position.set(sx * radius * 1.02, 0.16, cz * radius * 1.02);
      this.chainGroup.add(anchor);

      const pts = [];
      for (let p = 0; p <= 5; p++) {
        const t = p / 5;
        pts.push(new THREE.Vector3(
          sx * radius * (0.22 + 0.8 * t),
          0.12 + Math.sin(t * Math.PI) * (0.72 + (i % 2) * 0.18),
          cz * radius * (0.22 + 0.8 * t)
        ));
      }
      addLine(this.chainGroup, pts, i % 2 ? blue : chainColor, 0.88);

      for (let l = 1; l <= 4; l++) {
        const t = l / 5;
        const link = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 0.19), mat(i % 2 ? blue : chainColor, 0.82));
        link.position.set(sx * radius * (0.22 + 0.8 * t), 0.16 + Math.sin(t * Math.PI) * 0.62, cz * radius * (0.22 + 0.8 * t));
        link.rotation.y = a;
        link.rotation.x = Math.PI / 5;
        this.chainGroup.add(link);
      }
    }

    // Big blue rose seal in the center.
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), mat(0x72d6ff, 0.92));
    core.position.y = 0.38;
    this.chainGroup.add(core);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(i % 2 ? 0x1f8dff : 0x9ce8ff, 0.82));
      petal.scale.set(1.3, 0.32, 0.72);
      petal.position.set(Math.cos(a) * 0.2, 0.38, Math.sin(a) * 0.2);
      petal.rotation.y = a;
      this.chainGroup.add(petal);
    }

    this.chainGroup.position.set(this.x, 0, this.z);
    this.chainGroup.visible = this.delay <= 0;
    this.chainGroup.renderOrder = 860;
    scene.add(this.chainGroup);
  }

  update(dt, world, ps, player) {
    const wasDelay = this.delay;
    super.update(dt, world, ps, player);
    if (!this.dead) {
      if (wasDelay > 0 && this.delay <= 0) {
        this.chainGroup.visible = true;
        ps.burst({ x: this.x, y: 0.55, z: this.z }, { color: this.color, count: 34, speed: 3.3, life: 0.55 });
      }
      this.chainGroup.rotation.y += dt * 1.35;
      const t = Math.max(0, this.life / this.maxLife);
      this.chainGroup.scale.setScalar(0.92 + Math.sin((1 - t) * Math.PI) * 0.12);
      this.chainGroup.traverse(obj => {
        if (obj.material) obj.material.opacity = Math.min(obj.material.opacity, t * 0.95 + 0.04);
      });
    }
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.group);
    dispose(this.scene, this.chainGroup);
  }
}

export class DashAttack {
  constructor(scene, playerRef, angle, color, opts = {}) {
    this.scene = scene;
    this.playerRef = playerRef;
    this.angle = angle;
    this.color = color;
    this.duration = opts.duration || 0.48;
    this.life = this.duration;
    this.speed = (opts.distance || 4.2) / this.duration;
    this.radius = opts.radius || 1.05;
    this.damage = opts.damage || 15;
    this.tick = 0;
    this.ghost = !!opts.ghost;
    this.trailTimer = 0;
    this.active = true;

    this.group = new THREE.Group();
    addRing(this.group, 0.25, this.radius, 0.06, color, 0.6, 48);
    addRing(this.group, this.radius * 0.9, this.radius * 1.12, 0.08, 0xffd0d0, 0.38, 48);
    this.group.position.set(playerRef.x, 0, playerRef.z);
    scene.add(this.group);
    this.mesh = this.group;
  }

  addTrail(x, z) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(this.radius * 0.6, this.radius * 1.02, 36), mat(this.color, 0.34));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.045, z);
    ring.userData.life = 0.28;
    this.scene.add(ring);
    if (!this.trails) this.trails = [];
    this.trails.push(ring);
  }

  updateTrails(dt) {
    if (!this.trails) return;
    for (const t of this.trails) {
      t.userData.life -= dt;
      t.scale.multiplyScalar(1.04);
      t.material.opacity = Math.max(0, t.userData.life / 0.28) * 0.32;
    }
    const dead = this.trails.filter(t => t.userData.life <= 0);
    for (const t of dead) dispose(this.scene, t);
    this.trails = this.trails.filter(t => t.userData.life > 0);
  }

  update(dt, world, ps, player) {
    this.life -= dt;
    if (this.life <= 0) this.active = false;
    if (this.active && !this.ghost && this.playerRef) {
      this.playerRef.moveBy(Math.sin(this.angle) * this.speed * dt, Math.cos(this.angle) * this.speed * dt, world);
      this.playerRef.startSpin(0.14);
      this.tick -= dt;
      this.trailTimer -= dt;
      if (this.trailTimer <= 0) {
        this.trailTimer = 0.06;
        this.addTrail(this.playerRef.x, this.playerRef.z);
        ps.burst({ x: this.playerRef.x, y: 0.32, z: this.playerRef.z }, { color: this.color, count: 5, speed: 1.4, life: 0.2 });
      }
      if (this.tick <= 0) {
        this.tick = 0.08;
        applyAreaDamage(world, ps, player, this.playerRef.x, this.playerRef.z, this.radius, this.damage, 7, this.color);
      }
      this.group.position.set(this.playerRef.x, 0, this.playerRef.z);
    } else if (this.playerRef) {
      this.group.position.set(this.playerRef.x, 0, this.playerRef.z);
    }
    this.updateTrails(dt);
    this.group.rotation.y += dt * 12;
    const t = Math.max(0, this.life / this.duration);
    this.group.traverse(obj => { if (obj.material) obj.material.opacity = Math.min(obj.material.opacity, t * 0.7 + 0.02); });
    if (this.life <= 0 && this.group && this.group.parent) dispose(this.scene, this.group);
    if (this.life <= 0 && (!this.trails || !this.trails.length)) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.group);
    if (this.trails) for (const t of this.trails) dispose(this.scene, t);
  }
}

export class LeapAttack {
  constructor(scene, playerRef, targetX, targetZ, color, opts = {}) {
    this.scene = scene;
    this.playerRef = playerRef;
    this.startX = playerRef.x;
    this.startZ = playerRef.z;
    this.targetX = clamp(targetX, 0.6, ARENA_W - 0.6);
    this.targetZ = clamp(targetZ, 0.6, ARENA_D - 0.6);
    this.color = color;
    this.duration = opts.duration || 0.72;
    this.life = this.duration;
    this.radius = opts.radius || 1.6;
    this.damage = opts.damage || 22;
    this.ghost = !!opts.ghost;
    this.landed = false;
    this.craterLife = 0;

    this.targetGroup = new THREE.Group();
    addDisc(this.targetGroup, this.radius, 0.045, color, 0.14);
    addRing(this.targetGroup, this.radius * 0.65, this.radius, 0.07, color, 0.55);
    this.targetGroup.position.set(this.targetX, 0, this.targetZ);
    scene.add(this.targetGroup);
    this.mesh = this.targetGroup;
  }

  buildCrater() {
    this.craterGroup = new THREE.Group();
    addDisc(this.craterGroup, this.radius * 0.85, 0.035, 0x2c241d, 0.48, 42);
    addRing(this.craterGroup, this.radius * 0.78, this.radius * 1.1, 0.05, this.color, 0.45, 48);
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI * 2 / 10;
      const len = this.radius * (0.45 + (i % 3) * 0.18);
      addLine(this.craterGroup, [
        new THREE.Vector3(Math.sin(a) * 0.18, 0.08, Math.cos(a) * 0.18),
        new THREE.Vector3(Math.sin(a) * len, 0.08, Math.cos(a) * len)
      ], i % 2 ? 0x111111 : this.color, 0.65);
    }
    this.craterGroup.position.set(this.targetX, 0, this.targetZ);
    this.scene.add(this.craterGroup);
    this.craterLife = 1.15;
  }

  update(dt, world, ps, player) {
    if (!this.landed) {
      this.life -= dt;
      const p = 1 - Math.max(0, this.life / this.duration);
      if (!this.ghost && this.playerRef && p < 1) {
        const x = this.startX + (this.targetX - this.startX) * p;
        const z = this.startZ + (this.targetZ - this.startZ) * p;
        this.playerRef.x = x;
        this.playerRef.z = z;
        this.playerRef.root.position.y = Math.sin(p * Math.PI) * 1.55;
      }
      this.targetGroup.rotation.y += dt * 2;
      this.targetGroup.scale.setScalar(0.86 + Math.sin(p * Math.PI) * 0.18);
      this.targetGroup.traverse(obj => { if (obj.material) obj.material.opacity = Math.max(0.05, (1 - p) * 0.55); });
      if (this.life <= 0) {
        this.landed = true;
        if (!this.ghost && this.playerRef) {
          this.playerRef.tryMove(this.targetX, this.targetZ, world);
          this.playerRef.root.position.y = 0;
          applyAreaDamage(world, ps, player, this.playerRef.x, this.playerRef.z, this.radius, this.damage, 22, this.color);
          if (this.playerRef.startSpeedBoost) this.playerRef.startSpeedBoost(5, 1.55);
        }
        ps.burst({ x: this.targetX, y: 0.45, z: this.targetZ }, { color: this.color, count: 40, speed: 4.4, life: 0.65, cube: true });
        dispose(this.scene, this.targetGroup);
        this.buildCrater();
      }
      return;
    }

    this.craterLife -= dt;
    const t = Math.max(0, this.craterLife / 1.15);
    if (this.craterGroup) {
      this.craterGroup.scale.setScalar(1 + (1 - t) * 0.08);
      this.craterGroup.traverse(obj => { if (obj.material) obj.material.opacity = Math.min(obj.material.opacity, t * 0.7); });
    }
    if (this.craterLife <= 0) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.targetGroup);
    dispose(this.scene, this.craterGroup);
  }
}

export class SmokeCloud {
  constructor(scene, x, z, color, opts = {}) {
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.color = color;
    this.life = opts.life || 1.15;
    this.maxLife = this.life;
    this.group = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.15 + Math.random() * 0.9;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18 + Math.random() * 0.18, 10, 8), mat(i % 2 ? color : 0xdff7ff, 0.22 + Math.random() * 0.18));
      puff.position.set(Math.cos(a) * r, 0.25 + Math.random() * 0.8, Math.sin(a) * r);
      puff.userData.spin = (Math.random() - 0.5) * 1.5;
      this.group.add(puff);
    }
    addRing(this.group, 0.35, 1.05, 0.05, color, 0.34, 48);
    this.group.position.set(x, 0, z);
    scene.add(this.group);
  }

  update(dt) {
    this.life -= dt;
    const t = Math.max(0, this.life / this.maxLife);
    this.group.rotation.y += dt * 0.5;
    this.group.scale.setScalar(1 + (1 - t) * 0.55);
    this.group.traverse(obj => {
      if (obj.material) obj.material.opacity = Math.min(obj.material.opacity, t * 0.45);
      if (obj.userData && obj.userData.spin) obj.rotation.y += obj.userData.spin * dt;
    });
    if (this.life <= 0) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.group);
  }
}

export class PoisonPuddle {
  constructor(scene, x, z, radius, damage, color, opts = {}) {
    this.scene = scene;
    this.x = clamp(x, radius * 0.35, ARENA_W - radius * 0.35);
    this.z = clamp(z, radius * 0.35, ARENA_D - radius * 0.35);
    this.radius = radius;
    this.damage = damage;
    this.color = color;
    this.life = opts.life || 3.2;
    this.maxLife = this.life;
    this.delay = opts.delay || 0;
    this.ghost = !!opts.ghost;
    this.targetPlayer = opts.targetPlayer || null;
    this.onHitPlayer = opts.onHitPlayer || null;
    this.tick = 0;
    this.damageTick = 0;
    this.healTick = 0;
    this.visibleStarted = this.delay <= 0;

    this.group = new THREE.Group();
    addDisc(this.group, radius * 1.05, 0.04, 0x144b36, 0.28, 54);
    addRing(this.group, radius * 0.92, radius * 1.08, 0.06, color, 0.58, 64);
    addRing(this.group, radius * 0.36, radius * 0.5, 0.08, 0xd8ffe2, 0.24, 42);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rr = radius * (0.2 + (i % 5) * 0.14);
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.05 + (i % 3) * 0.018, 8, 6), mat(i % 2 ? color : 0xd8ffe2, 0.52));
      bubble.position.set(Math.cos(a) * rr, 0.12 + (i % 3) * 0.04, Math.sin(a) * rr);
      bubble.userData.baseY = bubble.position.y;
      bubble.userData.phase = i * 0.6;
      this.group.add(bubble);
    }
    this.group.position.set(this.x, 0, this.z);
    this.group.visible = this.visibleStarted;
    this.group.renderOrder = 830;
    scene.add(this.group);
    this.mesh = this.group;
  }

  update(dt, world, ps, player) {
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay <= 0) {
        this.group.visible = true;
        this.visibleStarted = true;
        ps.burst({ x: this.x, y: 0.3, z: this.z }, { color: this.color, count: 18, speed: 2.0, life: 0.35 });
      }
      return;
    }

    this.life -= dt;
    this.tick += dt;
    this.damageTick -= dt;
    this.healTick -= dt;

    if (!this.ghost && player && player.brawlerId === 'ministro' && !player.isDown && playerInArea(player, this.x, this.z, this.radius)) {
      if (player.heal(dt * 18)) {
        if (this.healTick <= 0) {
          this.healTick = 0.35;
          ps.burst({ x: player.x, y: 0.55, z: player.z }, { color: this.color, count: 3, speed: 0.7, life: 0.22 });
        }
      }
    }

    if (this.ghost && this.targetPlayer && !this.targetPlayer.isDown && playerInArea(this.targetPlayer, this.x, this.z, this.radius)) {
      if (this.damageTick <= 0) {
        this.damageTick = 0.45;
        this.onHitPlayer && this.onHitPlayer(6, { x: this.targetPlayer.x, y: 0.55, z: this.targetPlayer.z }, this);
      }
    }

    const t = Math.max(0, this.life / this.maxLife);
    this.group.rotation.y += dt * 0.16;
    this.group.scale.setScalar(0.96 + Math.sin(this.tick * 2.2) * 0.025);
    this.group.traverse(obj => {
      if (obj.material) obj.material.opacity = Math.min(obj.material.opacity, t * 0.72 + 0.03);
      if (obj.userData && obj.userData.baseY !== undefined) {
        obj.position.y = obj.userData.baseY + Math.sin(this.tick * 5 + obj.userData.phase) * 0.035;
      }
    });
    if (Math.floor(this.tick * 8) % 5 === 0) {
      ps.burst({ x: this.x, y: 0.2, z: this.z }, { color: this.color, count: 1, speed: 0.65, life: 0.18 });
    }
    if (this.life <= 0) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.group);
  }
}

export class HealTurret {
  constructor(scene, x, z, color, opts = {}) {
    this.scene = scene;
    this.x = clamp(x, 0.8, ARENA_W - 0.8);
    this.z = clamp(z, 0.8, ARENA_D - 0.8);
    this.color = color;
    this.life = opts.life || 8.5;
    this.maxLife = this.life;
    this.pulse = 0;

    this.group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.48, 0.55, 18), mat(0x17252a, 0.95));
    base.position.y = 0.28;
    this.group.add(base);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), mat(color, 0.95));
    core.position.y = 0.7;
    this.group.add(core);
    const crossA = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.08), mat(0xffffff, 0.85));
    crossA.position.y = 0.7;
    this.group.add(crossA);
    const crossB = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.58, 0.08), mat(0xffffff, 0.85));
    crossB.position.y = 0.7;
    this.group.add(crossB);
    const aura = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.48, 64), mat(color, 0.36));
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.04;
    this.aura = aura;
    this.group.add(aura);
    addRing(this.group, 0.55, 0.7, 0.08, 0xffffff, 0.18, 48);
    this.group.position.set(this.x, 0, this.z);
    scene.add(this.group);
  }

  update(dt, world, ps, player) {
    this.life -= dt;
    this.pulse += dt * 3;
    const t = Math.max(0, this.life / this.maxLife);
    this.aura.scale.setScalar(1 + Math.sin(this.pulse) * 0.1);
    this.group.rotation.y += dt * 0.24;
    this.group.traverse(obj => {
      if (obj.material) obj.material.opacity = Math.min(obj.material.opacity, t + 0.18);
    });
    if (player && Math.hypot(player.x - this.x, player.z - this.z) < 1.75) {
      player.hp = Math.min(player.hpMax, player.hp + dt * 20);
      if (Math.floor(this.pulse * 3) % 5 === 0) ps.burst({ x: player.x, y: 0.65, z: player.z }, { color: this.color, count: 2, speed: 0.7, life: 0.2 });
    }
    if (this.life <= 0) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.group);
  }
}
