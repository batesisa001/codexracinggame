import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const TRACKS = {
  'sunset-loop': [
    [0, 0], [45, 10], [85, 45], [70, 95], [20, 115], [-45, 95], [-75, 50], [-60, 0], [-25, -35]
  ],
  'pine-ring': [
    [0, 0], [55, -20], [100, 15], [95, 75], [35, 120], [-40, 110], [-95, 55], [-105, -10], [-50, -65]
  ]
};

export class Track {
  constructor(scene, name = 'sunset-loop') {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.roadHalfWidth = 8;
    this.checkpoints = [];
    this.waypoints = [];
    this.name = name;
    this.build(name);
  }

  dispose() { this.scene.remove(this.group); }

  build(name) {
    this.group.clear();
    const points = TRACKS[name].map(([x, z]) => new THREE.Vector3(x, 0, z));
    this.curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.18);
    const samples = 260;
    const roadPts = [];
    this.waypoints = [];

    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const p = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      const left = new THREE.Vector3(-tangent.z, 0, tangent.x);
      roadPts.push({ center: p, left: p.clone().addScaledVector(left, this.roadHalfWidth), right: p.clone().addScaledVector(left, -this.roadHalfWidth), tangent });
      this.waypoints.push(p.clone());
    }

    const roadGeo = new THREE.BufferGeometry();
    const verts = [];
    const uvs = [];
    for (let i = 0; i < samples; i++) {
      const a = roadPts[i];
      const b = roadPts[(i + 1) % samples];
      verts.push(a.left.x, 0.02, a.left.z, a.right.x, 0.02, a.right.z, b.left.x, 0.02, b.left.z);
      verts.push(a.right.x, 0.02, a.right.z, b.right.x, 0.02, b.right.z, b.left.x, 0.02, b.left.z);
      uvs.push(0, i / 8, 1, i / 8, 0, (i + 1) / 8, 1, i / 8, 1, (i + 1) / 8, 0, (i + 1) / 8);
    }
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.computeVertexNormals();

    const road = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ color: 0x2b2f37, roughness: 0.92 }));
    road.receiveShadow = true;
    this.group.add(road);

    const railMat = new THREE.MeshStandardMaterial({ color: 0xa8a8aa, metalness: 0.55, roughness: 0.4 });
    const railGeo = new THREE.BoxGeometry(0.7, 0.7, 2);
    for (let i = 0; i < samples; i += 3) {
      const p = roadPts[i];
      ['left', 'right'].forEach((side) => {
        const r = new THREE.Mesh(railGeo, railMat);
        r.position.copy(p[side]);
        r.position.y = 0.35;
        r.lookAt(p[side].clone().add(p.tangent));
        r.castShadow = true;
        this.group.add(r);
      });
    }

    const ground = new THREE.Mesh(new THREE.CircleGeometry(260, 48), new THREE.MeshStandardMaterial({ color: 0x2d4d2b, roughness: 1 }));
    ground.rotateX(-Math.PI / 2);
    ground.receiveShadow = true;
    this.group.add(ground);

    for (let i = 0; i < 130; i++) {
      const t = Math.random();
      const c = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const dist = 13 + Math.random() * 35;
      const s = Math.random() > 0.5 ? 1 : -1;
      const pos = c.clone().addScaledVector(normal, dist * s);
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2), new THREE.MeshStandardMaterial({ color: 0x5a4029 }));
      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.6, 8), new THREE.MeshStandardMaterial({ color: 0x2c6d31 }));
      trunk.position.y = 1.1; crown.position.y = 3.2;
      tree.add(trunk, crown); tree.position.copy(pos); tree.castShadow = true;
      this.group.add(tree);
    }

    this.checkpoints = [];
    for (let i = 0; i < 12; i++) this.checkpoints.push(Math.floor((i / 12) * this.waypoints.length));
    this.startIndex = this.checkpoints[0];
  }

  constrainToRoad(pos) {
    const data = this.getClosestPointData(pos);
    const away = pos.clone().sub(data.point); away.y = 0;
    const d = away.length();
    let collided = false;
    if (d > this.roadHalfWidth - 0.8) {
      away.normalize();
      pos.copy(data.point.clone().addScaledVector(away, this.roadHalfWidth - 0.8));
      collided = true;
    }
    return { y: 0.35, collided, progress: data.t };
  }

  getClosestPointData(pos) {
    let best = { dist: Infinity, i: 0, point: this.waypoints[0], t: 0 };
    this.waypoints.forEach((p, i) => {
      const d = p.distanceToSquared(pos);
      if (d < best.dist) best = { dist: d, i, point: p, t: i / this.waypoints.length };
    });
    return best;
  }

  getCheckpointTransform(i) {
    const idx = this.checkpoints[i % this.checkpoints.length];
    const pos = this.waypoints[idx].clone();
    const f = this.curve.getTangentAt(idx / this.waypoints.length);
    return { pos: pos.setY(0.35), heading: Math.atan2(f.x, f.z) };
  }
}
