import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const CAR_PRESETS = {
  sport: { maxSpeed: 62, accel: 29, brake: 35, steer: 2.8, grip: 8.5, drag: 0.7 },
  drift: { maxSpeed: 58, accel: 27, brake: 31, steer: 3.1, grip: 5.4, drag: 0.63 }
};

export class Vehicle {
  constructor(mesh, preset = 'sport', color = 0x3377ff) {
    this.mesh = mesh;
    this.mesh.traverse((n) => { if (n.isMesh) n.castShadow = true; });
    this.preset = { ...CAR_PRESETS[preset] };
    this.heading = 0;
    this.speed = 0;
    this.steer = 0;
    this.controls = { throttle: 0, brake: 0, steer: 0, handbrake: false };
    this.lastCheckpoint = { pos: new THREE.Vector3(), heading: 0 };
    this.smokeCooldown = 0;
    this.color = color;
  }

  setTransform(pos, heading) {
    this.mesh.position.copy(pos);
    this.heading = heading;
    this.mesh.rotation.set(0, -heading, 0);
  }

  resetToCheckpoint() { this.setTransform(this.lastCheckpoint.pos, this.lastCheckpoint.heading); this.speed = 0; }

  update(dt, track) {
    const p = this.preset;
    this.steer = THREE.MathUtils.lerp(this.steer, this.controls.steer, clamp(dt * 8, 0, 1));
    const steerFactor = (1 - clamp(Math.abs(this.speed) / p.maxSpeed, 0, 0.75));
    this.heading += this.steer * p.steer * steerFactor * dt;

    const fwd = new THREE.Vector2(Math.sin(this.heading), Math.cos(this.heading));
    const throttleAcc = this.controls.throttle * p.accel;
    const brakeAcc = this.controls.brake * p.brake * Math.sign(this.speed || 1);
    this.speed += (throttleAcc - brakeAcc) * dt;

    const grip = this.controls.handbrake ? p.grip * 0.35 : p.grip;
    this.speed -= this.speed * (p.drag + (1 / (grip + 0.1))) * dt * 0.35;
    this.speed = clamp(this.speed, -12, p.maxSpeed);

    this.mesh.position.x += fwd.x * this.speed * dt;
    this.mesh.position.z += fwd.y * this.speed * dt;

    const surface = track.constrainToRoad(this.mesh.position);
    if (surface.collided) this.speed *= 0.4;
    this.mesh.position.y = surface.y;
    this.mesh.rotation.set(0, -this.heading, this.steer * 0.08);

    this.smokeCooldown -= dt;
  }
}

export function createCarMesh(color = 0xff3333) {
  const car = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.55, 3.2),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.25 })
  );
  body.position.y = 0.55;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.5, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xd8eefc, roughness: 0.12, metalness: 0.3 })
  );
  cabin.position.set(0, 1, -0.1);
  car.add(body, cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.28, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const wheelPositions = [[-0.76, 0.33, 1.1], [0.76, 0.33, 1.1], [-0.76, 0.33, -1.1], [0.76, 0.33, -1.1]];
  wheelPositions.forEach((p) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(...p);
    car.add(w);
  });
  return car;
}
