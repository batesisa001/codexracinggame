(() => {
  class RacingGame {
    constructor(canvas) {
      this.canvas = canvas;
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      this.renderer.setSize(innerWidth, innerHeight); this.renderer.setPixelRatio(Math.min(2, devicePixelRatio)); this.renderer.shadowMap.enabled = true;
      this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x7b9ac4); this.scene.fog = new THREE.Fog(0x7b9ac4, 120, 390);
      this.camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 1000); this.clock = new THREE.Clock();
      this.ui = new Racing.UI(); this.audio = new Racing.AudioEngine(); this.keys = {}; this.state = 'title'; this.totalLaps = 3; this.useHoodCam = false;
      this.setupScene(); this.bind(); this.ui.setScreen('title');
    }
    setupScene() {
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const sun = new THREE.DirectionalLight(0xfff6d5, 1.15); sun.position.set(90, 160, -40); sun.castShadow = true; this.scene.add(sun);
      const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { top: { value: new THREE.Color(0x4f74aa) }, bot: { value: new THREE.Color(0xf9a35f) } }, vertexShader: 'varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ', fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vPos; void main(){ float h=normalize(vPos).y*0.5+0.5; gl_FragColor=vec4(mix(bot,top,h),1.0);} ' }));
      this.scene.add(sky);
    }
    bind() {
      addEventListener('resize', () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(innerWidth, innerHeight); });
      addEventListener('keydown', (e) => {
        this.keys[e.code] = true;
        if (e.code === 'KeyC') this.useHoodCam = !this.useHoodCam;
        if (e.code === 'Escape' && this.state === 'race') { this.state = 'pause'; this.ui.setScreen('pause'); }
        else if (e.code === 'Escape' && this.state === 'pause') { this.state = 'race'; this.ui.setScreen('race'); }
        if (e.code === 'KeyR' && this.player) this.player.resetToCheckpoint();
        this.audio.ensure();
      });
      addEventListener('keyup', (e) => { this.keys[e.code] = false; });
      document.getElementById('start-race').addEventListener('click', () => this.startFromMenu());
      document.getElementById('resume-race').addEventListener('click', () => { this.state = 'race'; this.ui.setScreen('race'); });
      document.getElementById('restart-race').addEventListener('click', () => this.startFromMenu());
      document.getElementById('results-restart').addEventListener('click', () => { this.state = 'title'; this.ui.setScreen('title'); });
    }
    startFromMenu() {
      const trackName = document.getElementById('track-select').value, carPreset = document.getElementById('car-select').value, difficulty = document.getElementById('difficulty-select').value;
      if (this.track) this.track.dispose(); this.track = new Racing.Track(this.scene, trackName);
      if (this.cars) this.cars.forEach((v) => this.scene.remove(v.mesh));
      this.player = new Racing.Vehicle(Racing.createCarMesh(0xff4d66), carPreset); this.scene.add(this.player.mesh); this.cars = [this.player];
      this.ais = [0x4f89ff, 0x8cf767, 0xf1de5a].map((c) => { const v = new Racing.Vehicle(Racing.createCarMesh(c), carPreset); this.scene.add(v.mesh); this.cars.push(v); return new Racing.AIController(v, this.track, difficulty); });
      this.racers = this.cars.map((_, i) => ({ name: i === 0 ? 'You' : `AI ${i}`, lap: 1, cp: 0, progress: 0, done: false, finishTime: null, raceTime: 0, best: null, lastLapStart: 0, lastLap: null }));
      this.cars.forEach((v, i) => { const t = this.track.getCheckpointTransform(0); const right = new THREE.Vector3(Math.cos(t.heading), 0, -Math.sin(t.heading)); const start = t.pos.clone().addScaledVector(right, (i - 1.5) * 2.5).addScaledVector(new THREE.Vector3(Math.sin(t.heading), 0, Math.cos(t.heading)), -4); v.setTransform(start, t.heading); v.lastCheckpoint = { pos: start.clone(), heading: t.heading }; });
      this.state = 'countdown'; this.ui.setScreen('race'); this.countdown = 3.2;
    }
    handlePlayerInput() {
      this.player.controls.throttle = this.keys.KeyW || this.keys.ArrowUp ? 1 : 0;
      this.player.controls.brake = this.keys.KeyS || this.keys.ArrowDown ? 1 : 0;
      this.player.controls.steer = (this.keys.KeyA || this.keys.ArrowLeft ? 1 : 0) - (this.keys.KeyD || this.keys.ArrowRight ? 1 : 0);
      this.player.controls.handbrake = !!this.keys.Space;
    }
    updateRaceProgress(dt) {
      this.cars.forEach((car, i) => {
        const r = this.racers[i]; if (r.done) return;
        const closest = this.track.getClosestPointData(car.mesh.position); r.progress = closest.t; r.raceTime += dt;
        const cpIdx = this.track.checkpoints[r.cp];
        if (Math.abs(closest.i - cpIdx) < 3) {
          r.cp = (r.cp + 1) % this.track.checkpoints.length; car.lastCheckpoint = { pos: car.mesh.position.clone(), heading: car.heading };
          if (r.cp === 0) { const lapTime = r.raceTime - r.lastLapStart; r.lastLapStart = r.raceTime; r.lastLap = lapTime; r.best = r.best == null ? lapTime : Math.min(r.best, lapTime); r.lap++; if (r.lap > this.totalLaps) { r.done = true; r.finishTime = r.raceTime; } }
        }
      });
      const sorted = this.racers.map((r, i) => ({ i, score: (r.lap - 1) * 2 + r.cp / this.track.checkpoints.length + r.progress })).sort((a, b) => b.score - a.score);
      this.playerPosition = sorted.findIndex((s) => s.i === 0) + 1;
      if (this.racers[0].done) { this.state = 'results'; this.ui.showResults(this.racers.map((r) => ({ name: r.name, time: r.finishTime || r.raceTime })).sort((a, b) => a.time - b.time)); }
    }
    updateCamera(dt) {
      const car = this.player.mesh, fwd = new THREE.Vector3(Math.sin(this.player.heading), 0, Math.cos(this.player.heading)), up = new THREE.Vector3(0, 1, 0);
      const targetPos = this.useHoodCam ? car.position.clone().addScaledVector(fwd, 1.8).addScaledVector(up, 1.2) : car.position.clone().addScaledVector(fwd, -7).addScaledVector(up, 4);
      const look = car.position.clone().addScaledVector(fwd, this.useHoodCam ? 20 : 8).addScaledVector(up, 1.2);
      this.camera.position.lerp(targetPos, 1 - Math.exp(-dt * 6)); this.camera.lookAt(look);
    }
    loop = () => {
      requestAnimationFrame(this.loop);
      const dt = Math.min(0.033, this.clock.getDelta());
      if (!this.player) return this.renderer.render(this.scene, this.camera);
      if (this.state === 'countdown') { this.countdown -= dt; const n = Math.ceil(this.countdown); this.ui.setCountdown(this.countdown > 0 ? `${n}` : 'GO!'); if (this.countdown <= -0.6) { this.state = 'race'; this.ui.setCountdown(''); } }
      if (this.state === 'race' || this.state === 'countdown') {
        this.handlePlayerInput(); this.ais.forEach((ai) => ai.update(this.cars)); this.cars.forEach((c) => c.update(dt, this.track)); if (this.state === 'race') this.updateRaceProgress(dt);
        this.audio.update(Math.abs(this.player.speed), this.player.controls.throttle);
        this.ui.updateHUD({ speed: Math.abs(this.player.speed), lap: this.racers[0].lap, totalLaps: this.totalLaps, position: this.playerPosition || 1, totalCars: this.cars.length, raceTime: this.racers[0].raceTime, lastLap: this.racers[0].lastLap, bestLap: this.racers[0].best });
        this.ui.drawMinimap(this.track.waypoints, this.cars.map((c) => c.mesh.position));
      }
      this.updateCamera(dt); this.renderer.render(this.scene, this.camera);
    }
  }
  window.Racing = window.Racing || {};
  window.Racing.RacingGame = RacingGame;
})();
