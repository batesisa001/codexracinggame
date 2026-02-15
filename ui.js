(() => {
  const fmt = (s) => { if (s == null) return '--'; const m = Math.floor(s / 60).toString().padStart(2, '0'); const sec = (s % 60).toFixed(3).padStart(6, '0'); return `${m}:${sec}`; };
  class UI {
    constructor() {
      this.el = { title: document.getElementById('title-screen'), pause: document.getElementById('pause-screen'), results: document.getElementById('results-screen'), resultsBody: document.getElementById('results-body'), hud: document.getElementById('hud'), countdown: document.getElementById('countdown'), speed: document.getElementById('speed'), gear: document.getElementById('gear'), lap: document.getElementById('lap'), position: document.getElementById('position'), timer: document.getElementById('timer'), lastLap: document.getElementById('last-lap'), bestLap: document.getElementById('best-lap'), minimap: document.getElementById('minimap') };
      this.ctx = this.el.minimap.getContext('2d');
    }
    setScreen(name) { ['title', 'pause', 'results'].forEach((k) => this.el[k].classList.remove('visible')); this.el.hud.classList.add('hidden'); if (name === 'race') this.el.hud.classList.remove('hidden'); else if (name && this.el[name]) this.el[name].classList.add('visible'); }
    setCountdown(v = '') { this.el.countdown.textContent = v; }
    updateHUD(data) {
      this.el.speed.textContent = `${Math.max(0, Math.round(data.speed * 2.23694))} mph`;
      this.el.gear.textContent = `Gear ${data.speed < 1 ? 'N' : data.speed < 15 ? '1' : data.speed < 30 ? '2' : '3'}`;
      this.el.lap.textContent = `Lap ${Math.min(data.lap, data.totalLaps)} / ${data.totalLaps}`;
      this.el.position.textContent = `${data.position} / ${data.totalCars}`;
      this.el.timer.textContent = fmt(data.raceTime); this.el.lastLap.textContent = `Last: ${fmt(data.lastLap)}`; this.el.bestLap.textContent = `Best: ${fmt(data.bestLap)}`;
    }
    drawMinimap(trackPts, cars) {
      const c = this.ctx, w = c.canvas.width, h = c.canvas.height; c.clearRect(0, 0, w, h); c.save(); c.translate(w / 2, h / 2); c.scale(0.65, 0.65);
      c.strokeStyle = '#6b91bc'; c.lineWidth = 4; c.beginPath(); trackPts.forEach((p, i) => (i ? c.lineTo(p.x, p.z) : c.moveTo(p.x, p.z))); c.closePath(); c.stroke();
      cars.forEach((car, i) => { c.fillStyle = i === 0 ? '#ff4f6d' : '#e6f0ff'; c.beginPath(); c.arc(car.x, car.z, i === 0 ? 4 : 3, 0, Math.PI * 2); c.fill(); }); c.restore();
    }
    showResults(rows) { this.el.resultsBody.innerHTML = rows.map((r, i) => `<div>${i + 1}. ${r.name} - ${fmt(r.time)}</div>`).join(''); this.setScreen('results'); }
  }
  window.Racing = window.Racing || {};
  window.Racing.UI = UI;
})();
