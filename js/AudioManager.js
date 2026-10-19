export default class AudioManager {
  constructor() {
    this.enabled = true;
    this.volume = 0.32;
    this.context = null;
  }

  unlock() {
    if (!this.enabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.context) this.context = new AudioContextClass();
      if (this.context.state === 'suspended') this.context.resume();
    } catch { /* Audio is optional; gameplay must continue without it. */ }
  }

  tone(frequency, duration, type = 'square', gain = 0.2, slide = 0) {
    if (!this.enabled) return;
    try {
      this.unlock();
      if (!this.context) return;
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const now = this.context.currentTime;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (slide) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(30, frequency + slide), now + duration);
      }
      gainNode.gain.setValueAtTime(Math.max(0.001, gain * this.volume), now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);
      oscillator.start();
      oscillator.stop(now + duration);
    } catch { /* Ignore unavailable or blocked audio. */ }
  }

  slice() {
    this.tone(560, 0.08, 'square', 0.16, 500);
    this.tone(900, 0.05, 'triangle', 0.1, -220);
  }

  bomb() {
    this.tone(150, 0.38, 'sawtooth', 0.35, -110);
    this.tone(65, 0.45, 'triangle', 0.3, -25);
  }

  over() {
    this.tone(320, 0.18, 'square', 0.2, -80);
    setTimeout(() => this.tone(220, 0.3, 'square', 0.18, -90), 130);
  }

  combo(count) {
    this.tone(500 + count * 70, 0.12, 'triangle', 0.17, 220);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}
