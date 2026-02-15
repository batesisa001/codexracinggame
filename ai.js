import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const DIFF = {
  easy: { speed: 0.72, reaction: 0.65 },
  medium: { speed: 0.86, reaction: 0.8 },
  hard: { speed: 1.0, reaction: 1.0 }
};

export class AIController {
  constructor(vehicle, track, difficulty = 'medium') {
    this.vehicle = vehicle;
    this.track = track;
    this.config = DIFF[difficulty] || DIFF.medium;
    this.target = 8;
  }

  update(dt, cars) {
    const wp = this.track.waypoints;
    const pos = this.vehicle.mesh.position;
    const tgt = wp[this.target % wp.length];
    if (pos.distanceToSquared(tgt) < 120) this.target += 2;

    const desired = tgt.clone().sub(pos).setY(0).normalize();
    const forward = new THREE.Vector3(Math.sin(this.vehicle.heading), 0, Math.cos(this.vehicle.heading));
    const cross = forward.x * desired.z - forward.z * desired.x;
    const dot = THREE.MathUtils.clamp(forward.dot(desired), -1, 1);
    const steer = THREE.MathUtils.clamp(Math.atan2(cross, dot) * this.config.reaction, -1, 1);

    let throttle = 1;
    const next = wp[(this.target + 5) % wp.length].clone().sub(tgt).setY(0).normalize();
    const turn = 1 - Math.abs(desired.dot(next));
    const targetSpeed = this.vehicle.preset.maxSpeed * (this.config.speed - turn * 0.45);
    if (this.vehicle.speed > targetSpeed) throttle = 0.15;

    let sep = 0;
    cars.forEach((c) => {
      if (c === this.vehicle) return;
      const delta = pos.clone().sub(c.mesh.position).setY(0);
      const d = delta.length();
      if (d < 4 && d > 0.001) sep += delta.normalize().dot(new THREE.Vector3(forward.z, 0, -forward.x)) * (4 - d) * 0.22;
    });

    this.vehicle.controls.throttle = throttle;
    this.vehicle.controls.brake = throttle < 0.25 ? 0.55 : 0;
    this.vehicle.controls.steer = THREE.MathUtils.clamp(steer + sep, -1, 1);
    this.vehicle.controls.handbrake = turn > 0.62 && this.vehicle.speed > 24;
  }
}
