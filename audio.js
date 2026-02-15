export class AudioEngine {
  constructor() { this.ctx = null; this.osc = null; this.gain = null; this.ready = false; }

  ensure() {
    if (this.ready) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sawtooth';
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.gain = this.ctx.createGain();
    lfo.frequency.value = 11; lfoGain.gain.value = 7;
    this.osc.frequency.value = 80; this.gain.gain.value = 0.0001;
    lfo.connect(lfoGain).connect(this.osc.frequency);
    this.osc.connect(this.gain).connect(this.ctx.destination);
    this.osc.start(); lfo.start();
    this.ready = true;
  }

  update(speed, throttle) {
    if (!this.ready) return;
    const rpm = 80 + Math.abs(speed) * 8 + throttle * 60;
    this.osc.frequency.setTargetAtTime(rpm, this.ctx.currentTime, 0.05);
    this.gain.gain.setTargetAtTime(0.02 + throttle * 0.03, this.ctx.currentTime, 0.08);
  }
}
