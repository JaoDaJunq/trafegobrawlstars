import * as THREE from 'three';
import { pointInRectXZ } from './utils.js';
import { COLORS, ARENA_W, ARENA_D } from './constants.js';

function basicMat(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
}

function addProjectileGlow(group, color, size, opacity = 0.32) {
  const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), glowMat);
  group.add(glow);
}

function makeProjectileMesh(style, color, size, glowSize) {
  const group = new THREE.Group();
  group.userData.projectileStyle = style;

  if (style === 'joao') {
    // Blue rose: small glowing flower head with petal clusters.
    const core = new THREE.Mesh(new THREE.SphereGeometry(size * 0.95, 12, 8), basicMat(0x35b9ff));
    group.add(core);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(size * 0.62, 8, 6), basicMat(i % 2 ? 0x85ddff : 0x1978ff));
      petal.scale.set(1.35, 0.42, 0.72);
      petal.position.set(Math.cos(a) * size * 0.62, Math.sin(a) * size * 0.32, Math.sin(a) * size * 0.42);
      petal.rotation.z = a;
      group.add(petal);
    }
    addProjectileGlow(group, 0x48b6ff, glowSize * 1.25, 0.38);
    return group;
  }

  if (style === 'thomas') {
    // Leon-like blade: sharp blue dagger moving nose-first.
    const blade = new THREE.Mesh(new THREE.ConeGeometry(size * 0.62, size * 4.8, 4), basicMat(0xd7edf5));
    blade.rotation.x = Math.PI / 2;
    blade.position.z = size * 0.95;
    group.add(blade);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(size * 0.65, size * 0.42, size * 1.3), basicMat(0x0a1324));
    handle.position.z = -size * 0.7;
    group.add(handle);
    return group;
  }

  if (style === 'gui') {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(size * 1.15, 16, 12), basicMat(color));
    group.add(orb);
    const core = new THREE.Mesh(new THREE.SphereGeometry(size * 0.5, 10, 8), basicMat(0xf1c6ff));
    group.add(core);
    for (let i = 0; i < 4; i++) {
      const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(size * 0.48), basicMat(0xb985ff));
      const a = i * Math.PI / 2;
      shard.position.set(Math.cos(a) * size * 1.25, Math.sin(a) * size * 0.8, 0);
      group.add(shard);
    }
    addProjectileGlow(group, color, glowSize * 1.35, 0.34);
    return group;
  }

  if (style === 'lorenzo') {
    // Pam-like scrap pellet: small tech bolt/scrap instead of generic sphere.
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.36, size * 0.5, size * 2.5, 6), basicMat(0xbfc6c7));
    bolt.rotation.x = Math.PI / 2;
    group.add(bolt);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(size * 1.35, size * 0.32, size * 0.75), basicMat(0x303840));
    cap.position.z = size * 0.35;
    group.add(cap);
    return group;
  }

  if (style === 'ministro') {
    // Byron-like precision dart/elixir needle.
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.22, size * 0.22, size * 4.8, 8), basicMat(0xe8ffe8));
    shaft.rotation.x = Math.PI / 2;
    group.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(size * 0.5, size * 1.45, 10), basicMat(color));
    tip.rotation.x = Math.PI / 2;
    tip.position.z = size * 2.75;
    group.add(tip);
    const vial = new THREE.Mesh(new THREE.SphereGeometry(size * 0.52, 8, 6), basicMat(color, 0.85));
    vial.position.z = -size * 1.5;
    group.add(vial);
    for (const side of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(size * 0.18, size * 0.7, size * 0.9), basicMat(0x183b2e));
      fin.position.set(side * size * 0.38, 0, -size * 2.1);
      group.add(fin);
    }
    addProjectileGlow(group, color, glowSize, 0.25);
    return group;
  }

  const core = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), basicMat(color));
  group.add(core);
  addProjectileGlow(group, color, glowSize, 0.35);
  return group;
}


export class Projectile {
  constructor(scene, x, y, z, angle, speed, range, damage, big, ghost, opts = {}) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.angle = angle;
    this.vx = Math.sin(angle) * speed;
    this.vz = Math.cos(angle) * speed;
    this.traveled = 0;
    this.range = range;
    this.damage = damage;
    this.damageNear = opts.damageNear !== undefined ? opts.damageNear : damage;
    this.damageFar = opts.damageFar !== undefined ? opts.damageFar : damage;
    this.big = !!big;
    this.ghost = !!ghost;
    this.dead = false;
    this.color = opts.color !== undefined ? opts.color : (big ? COLORS.gold : COLORS.playerBody);
    this.size = opts.size || (big ? 0.14 : 0.09);
    this.glowSize = opts.glowSize || this.size * 1.75;
    this.brawlerId = opts.brawlerId || null;
    this.pierce = !!opts.pierce;
    this.superGain = opts.superGain || null;
    this.superGainOnPlayer = opts.superGainOnPlayer ?? opts.superGain ?? null;
    this.superGainCap = opts.superGainCap ?? null;
    this.actionId = opts.actionId || null;
    this.actionKind = opts.actionKind || 'basic';
    this.hitType = opts.hitType || 'projectile';
    this.onExpire = opts.onExpire || null;
    this.scene = scene;
    this.targetPlayer = opts.targetPlayer || null;
    this.onHitPlayer = opts.onHitPlayer || null;
    this.hitPlayer = false;
    this.trailTimer = 0;

    this.mesh = makeProjectileMesh(this.brawlerId, this.color, this.size, this.glowSize);
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.y = angle;
    scene.add(this.mesh);
  }

  currentDamage() {
    if (this.damageNear === this.damageFar) return this.damage;
    const t = Math.max(0, Math.min(1, this.traveled / Math.max(this.range, 0.001)));
    return Math.round(this.damageNear + (this.damageFar - this.damageNear) * t);
  }

  update(dt, world, ps, player) {
    this.trailTimer -= dt;
    const magicalTrail = this.brawlerId === 'joao' || this.brawlerId === 'gui' || this.brawlerId === 'ministro';
    if (magicalTrail && this.trailTimer <= 0 && ps) {
      this.trailTimer = this.brawlerId === 'gui' ? 0.04 : this.brawlerId === 'joao' ? 0.05 : 0.055;
      const trailColor = this.brawlerId === 'ministro' ? 0x39d98a : this.color;
      ps.burst({ x: this.x, y: this.y, z: this.z }, {
        color: trailColor,
        count: this.big ? 3 : 1,
        speed: this.big ? 0.75 : 0.42,
        life: this.big ? 0.24 : 0.14,
        cube: false
      });
    }
    for (let s = 0; s < 2; s++) {
      const dx = this.vx * dt * 0.5;
      const dz = this.vz * dt * 0.5;
      this.x += dx;
      this.z += dz;
      this.traveled += Math.hypot(dx, dz);

      if (this.x < 0 || this.x > ARENA_W || this.z < 0 || this.z > ARENA_D) {
        this.kill(world.scene);
        return;
      }

      if (this.ghost && this.targetPlayer && !this.hitPlayer && !this.targetPlayer.isDown) {
        const hitRadius = this.size + this.targetPlayer.radius * 0.72;
        if (Math.hypot(this.x - this.targetPlayer.x, this.z - this.targetPlayer.z) <= hitRadius) {
          this.hitPlayer = true;
          if (this.onHitPlayer) {
            this.onHitPlayer(this.currentDamage(), { x: this.x, y: this.y, z: this.z }, this);
          }
          if (!this.pierce) {
            this.kill(world.scene);
            return;
          }
        }
      }

      if (!this.ghost) {
        for (const o of world.blockers) {
          if (o.alive === false) continue;
          if (pointInRectXZ(this.x, this.z, o.bounds)) {
            const res = o.hit({ x: this.x, y: this.y, z: this.z }, ps, this.currentDamage());
            if (res && player) {
              player.gainSuper(this.superGain || res.superGain, this.actionId, this.superGainCap ?? Infinity);
              if (player.markCombat) player.markCombat();
            }
            if (!this.pierce) {
              this.kill(world.scene);
              return;
            }
          }
        }
      }

      if (this.traveled >= this.range) {
        if (this.onExpire && !this.ghost) this.onExpire({ x: this.x, y: this.y, z: this.z });
        this.kill(world.scene);
        return;
      }
    }

    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.y = this.angle;
  }

  kill(scene) {
    this.dead = true;
    this._removeFrom(scene);
  }

  _removeFrom(scene) {
    if (!this.mesh || !this.mesh.parent) return;
    scene.remove(this.mesh);
    this.mesh.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}
