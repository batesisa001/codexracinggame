(() => {
  const TRACKS = {
    'sunset-loop': [[0, 0], [45, 10], [85, 45], [70, 95], [20, 115], [-45, 95], [-75, 50], [-60, 0], [-25, -35]],
    'pine-ring': [[0, 0], [55, -20], [100, 15], [95, 75], [35, 120], [-40, 110], [-95, 55], [-105, -10], [-50, -65]]
  };
  class Track {
    constructor(scene, name = 'sunset-loop') {
      this.scene = scene; this.group = new THREE.Group(); scene.add(this.group);
      this.roadHalfWidth = 8; this.checkpoints = []; this.waypoints = []; this.build(name);
    }
    dispose() { this.scene.remove(this.group); }
    build(name) {
      this.group.clear();
      const points = TRACKS[name].map(([x, z]) => new THREE.Vector3(x, 0, z));
      this.curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.18);
      const samples = 260, roadPts = []; this.waypoints = [];
      for (let i = 0; i < samples; i++) {
        const t = i / samples, p = this.curve.getPointAt(t), tangent = this.curve.getTangentAt(t).normalize();
        const left = new THREE.Vector3(-tangent.z, 0, tangent.x);
        roadPts.push({ left: p.clone().addScaledVector(left, this.roadHalfWidth), right: p.clone().addScaledVector(left, -this.roadHalfWidth), tangent });
        this.waypoints.push(p.clone());
      }
      const roadGeo = new THREE.BufferGeometry(); const verts = [];
      for (let i = 0; i < samples; i++) {
        const a = roadPts[i], b = roadPts[(i + 1) % samples];
        verts.push(a.left.x, 0.02, a.left.z, a.right.x, 0.02, a.right.z, b.left.x, 0.02, b.left.z);
        verts.push(a.right.x, 0.02, a.right.z, b.right.x, 0.02, b.right.z, b.left.x, 0.02, b.left.z);
      }
      roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); roadGeo.computeVertexNormals();
      const road = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ color: 0x2b2f37, roughness: 0.92 })); road.receiveShadow = true; this.group.add(road);
      const railGeo = new THREE.BoxGeometry(0.7, 0.7, 2), railMat = new THREE.MeshStandardMaterial({ color: 0xa8a8aa, metalness: 0.55, roughness: 0.4 });
      for (let i = 0; i < samples; i += 3) {
        const p = roadPts[i]; ['left', 'right'].forEach((side) => { const r = new THREE.Mesh(railGeo, railMat); r.position.copy(p[side]); r.position.y = 0.35; r.lookAt(p[side].clone().add(p.tangent)); r.castShadow = true; this.group.add(r); });
      }
      const ground = new THREE.Mesh(new THREE.CircleGeometry(260, 48), new THREE.MeshStandardMaterial({ color: 0x2d4d2b, roughness: 1 }));
      ground.rotateX(-Math.PI / 2); ground.receiveShadow = true; this.group.add(ground);
      for (let i = 0; i < 130; i++) {
        const t = Math.random(), c = this.curve.getPointAt(t), tangent = this.curve.getTangentAt(t), normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
        const pos = c.clone().addScaledVector(normal, (13 + Math.random() * 35) * (Math.random() > 0.5 ? 1 : -1));
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2), new THREE.MeshStandardMaterial({ color: 0x5a4029 })); trunk.position.y = 1.1;
        const crown = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.6, 8), new THREE.MeshStandardMaterial({ color: 0x2c6d31 })); crown.position.y = 3.2;
        const tree = new THREE.Group(); tree.add(trunk, crown); tree.position.copy(pos); this.group.add(tree);
      }
      this.checkpoints = Array.from({ length: 12 }, (_, i) => Math.floor((i / 12) * this.waypoints.length));
    }
    constrainToRoad(pos) {
      const data = this.getClosestPointData(pos), away = pos.clone().sub(data.point).setY(0); let collided = false;
      if (away.length() > this.roadHalfWidth - 0.8) { away.normalize(); pos.copy(data.point.clone().addScaledVector(away, this.roadHalfWidth - 0.8)); collided = true; }
      return { y: 0.35, collided, progress: data.t };
    }
    getClosestPointData(pos) {
      let best = { dist: Infinity, i: 0, point: this.waypoints[0], t: 0 };
      this.waypoints.forEach((p, i) => { const d = p.distanceToSquared(pos); if (d < best.dist) best = { dist: d, i, point: p, t: i / this.waypoints.length }; });
      return best;
    }
    getCheckpointTransform(i) {
      const idx = this.checkpoints[i % this.checkpoints.length], pos = this.waypoints[idx].clone(), f = this.curve.getTangentAt(idx / this.waypoints.length);
      return { pos: pos.setY(0.35), heading: Math.atan2(f.x, f.z) };
    }
  }
  window.Racing = window.Racing || {};
  window.Racing.Track = Track;
})();
