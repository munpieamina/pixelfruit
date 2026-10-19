import Fruit, { HalfFruit, fruitImages, loadSprites } from './Fruit.js';
import InputHandler from './InputHandler.js';
import { segmentCircle, comboBonus } from './Collision.js';
import AudioManager from './AudioManager.js';
import { saveRecord, bestScore } from './Storage.js';

export default class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.audio = new AudioManager();
    this.sprites = loadSprites();
    this.input = new InputHandler(canvas, (start, end) => this.sliceCheck(start, end));

    this.state = 'menu';
    this.running = false;
    this.raf = 0;
    this.last = 0;
    this.width = 800;
    this.height = 500;
    this.score = 0;
    this.lives = 3;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.bonusTime = 0;
    this.shakeTime = 0;
    this.shakeStrength = 0;
    this.entities = [];
    this.halves = [];
    this.particles = [];
    this.trail = [];
    this.comboText = [];
    this.slicedThisSwipe = new Set();

    this.resize = () => this.resizeCanvas();
    window.addEventListener('resize', this.resize);
    this.resizeCanvas();
    this.loop = this.loop.bind(this);
    this.startLoop();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.pause();
    });
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(320, rect.width);
    this.height = Math.max(320, rect.height);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas._gameWidth = this.width;
    this.canvas._gameHeight = this.height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  startLoop() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.loop);
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.033, Math.max(0, (now - this.last) / 1000 || 0));
    this.last = now;
    if (this.state === 'playing') this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  }

  begin() {
    this.audio.unlock();
    this.score = 0;
    this.lives = 3;
    this.elapsed = 0;
    this.spawnTimer = 0.35;
    this.bonusTime = 0;
    this.shakeTime = 0;
    this.shakeStrength = 0;
    this.entities = [];
    this.halves = [];
    this.particles = [];
    this.trail = [];
    this.comboText = [];
    this.slicedThisSwipe.clear();
    this.state = 'playing';
    this.ui.show('game');
    this.ui.updateHud(this);
    this.last = performance.now();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.ui.show('pause');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.last = performance.now();
    this.ui.show('game');
  }

  end() {
    if (this.state !== 'playing') return;
    this.state = 'over';
    this.audio.over();
    const saved = saveRecord(this.score);
    this.ui.showOver(this.score, bestScore(), saved.isBest);
  }

  exit() {
    this.state = 'menu';
    this.ui.show('menu');
  }

  update(dt) {
    this.elapsed += dt;
    if (this.bonusTime > 0) this.bonusTime = Math.max(0, this.bonusTime - dt);
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);

    const difficulty = Math.min(12, this.elapsed / 12);
    this.spawnTimer -= dt;
    const maxObjects = Math.min(13, 4 + Math.floor(difficulty * 0.65));
    if (this.spawnTimer <= 0 && this.entities.length < maxObjects) {
      this.entities.push(Fruit.spawn(this.width, this.height, difficulty));
      this.spawnTimer = Math.max(0.28, 1.05 - difficulty * 0.055) * (0.7 + Math.random() * 0.55);
    }

    for (const entity of this.entities) entity.update(dt);
    this.entities = this.entities.filter((entity) => !entity.dead);
    for (const half of this.halves) half.update(dt);
    this.halves = this.halves.filter((half) => !half.dead);

    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0).slice(-300);
    for (const segment of this.trail) segment.life -= dt;
    this.trail = this.trail.filter((segment) => segment.life > 0);
    for (const text of this.comboText) {
      text.y -= 34 * dt;
      text.life -= dt;
    }
    this.comboText = this.comboText.filter((text) => text.life > 0);
    this.ui.updateHud(this);
  }

  sliceCheck(start, end) {
    if (this.state !== 'playing') return;
    this.trail.push({ x1: start.x, y1: start.y, x2: end.x, y2: end.y, life: 0.23 });
    this.burst(end.x, end.y, 'spark', 4);
    const hits = [];

    for (const entity of this.entities) {
      if (entity.dead || entity.sliced) continue;
      if (!segmentCircle(start.x, start.y, end.x, end.y, entity.x, entity.y, entity.radius * 0.9)) continue;

      entity.sliced = true;
      entity.dead = true;
      if (entity.type === 'bomb') {
        this.lives = Math.max(0, this.lives - 1);
        this.score -= 100;
        this.burst(entity.x, entity.y, 'bomb', 38);
        this.shakeTime = 0.28;
        this.shakeStrength = 8;
        this.audio.bomb();
        this.ui.updateHud(this);
        if (this.lives <= 0) this.end();
        return;
      }

      if (entity.type === 'bonus') {
        this.bonusTime = 5;
        this.burst(entity.x, entity.y, 'bonus', 28);
        this.comboText.push({ x: entity.x, y: entity.y, text: '×2 SCORE!', life: 1.1, color: '#ffef70' });
        this.audio.combo(2);
        hits.push({ bonus: true, entity });
      } else {
        this.score += entity.data.points * (this.bonusTime > 0 ? 2 : 1);
        this.halves.push(new HalfFruit(entity, 'left'), new HalfFruit(entity, 'right'));
        this.burst(entity.x, entity.y, entity.data.key, 20);
        hits.push({ entity });
      }
    }

    const fruitHits = hits.filter((hit) => !hit.bonus).length;
    if (fruitHits) {
      this.audio.slice();
      if (fruitHits >= 2) {
        const bonus = comboBonus(fruitHits);
        this.score += bonus;
        this.comboText.push({ x: end.x, y: end.y - 16, text: `COMBO ×${fruitHits}`, life: 1.15, color: '#ffe46c' });
        this.comboText.push({ x: end.x, y: end.y + 15, text: `+${bonus} BONUS`, life: 0.95, color: '#ff9cc5' });
        this.burst(end.x, end.y, 'combo', 16);
        this.audio.combo(fruitHits);
      }
    }
    this.ui.updateHud(this);
  }

  burst(x, y, kind, count) {
    const palettes = {
      bomb: ['#ffdf65', '#ff5a4d', '#e9c3ff', '#fff2bc'],
      bonus: ['#ffef70', '#c88bff', '#ffffff'],
      watermelon: ['#ff6b7a', '#55d87b', '#f5e8a0'],
      combo: ['#ffdf65', '#ff6b9b', '#8be9ff', '#ffffff'],
      spark: ['#ffffff', '#8be9ff', '#ffdf65'],
    };
    const palette = palettes[kind] || ['#ffcf63', '#ff6d7f', '#fff0a0', '#a5e85d'];

    for (let i = 0; i < count && this.particles.length < 300; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * (kind === 'bomb' ? 270 : 190);
      const life = 0.3 + Math.random() * 0.65;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 45,
        gravity: 260,
        life,
        max: life,
        size: 2 + Math.floor(Math.random() * 5),
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }
  }

  render() {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    if (this.shakeTime > 0) {
      const strength = this.shakeStrength * (this.shakeTime / 0.28);
      ctx.translate((Math.random() - 0.5) * strength, (Math.random() - 0.5) * strength);
    }

    const wood = fruitImages.wood;
    if (wood?.complete && wood.naturalWidth) {
      ctx.globalAlpha = 0.98;
      ctx.fillStyle = ctx.createPattern(wood, 'repeat') || '#2a1b1b';
      ctx.fillRect(-10, -10, width + 20, height + 20);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#2a1b1b';
      ctx.fillRect(0, 0, width, height);
    }

    // Soft colored pools of light make the wooden scene feel less flat.
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.55, 20, width * 0.5, height * 0.55, height * 0.8);
    glow.addColorStop(0, '#ffb84a0b');
    glow.addColorStop(1, '#09061155');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff08';
    for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);
    for (const entity of this.entities) entity.draw(ctx);
    for (const half of this.halves) half.draw(ctx);

    for (const particle of this.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, particle.life / particle.max));
      ctx.fillStyle = particle.color;
      ctx.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
      // Tiny highlights trail behind the brighter particles.
      if (particle.size >= 5) {
        ctx.globalAlpha *= 0.45;
        ctx.fillRect(Math.round(particle.x - 3), Math.round(particle.y - 3), 2, 2);
      }
    }
    ctx.globalAlpha = 1;

    for (const segment of this.trail) {
      ctx.globalAlpha = Math.min(1, segment.life / 0.23);
      ctx.strokeStyle = '#65eaff';
      ctx.lineWidth = 11;
      ctx.lineCap = 'square';
      ctx.shadowColor = '#73e9ff';
      ctx.shadowBlur = 17;
      ctx.beginPath();
      ctx.moveTo(segment.x1, segment.y1);
      ctx.lineTo(segment.x2, segment.y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(segment.x1, segment.y1);
      ctx.lineTo(segment.x2, segment.y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const text of this.comboText) {
      ctx.globalAlpha = Math.min(1, text.life);
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#3b173e';
      ctx.strokeText(text.text, text.x, text.y);
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    if (this.state === 'menu' || this.state === 'records') {
      ctx.fillStyle = '#0002';
      ctx.fillRect(0, 0, width, height);
    }
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.destroy();
    window.removeEventListener('resize', this.resize);
  }
}
