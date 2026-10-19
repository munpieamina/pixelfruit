export default class InputHandler {
  constructor(canvas, onSwipe) {
    this.canvas = canvas;
    this.onSwipe = onSwipe;
    this.active = false;
    this.last = null;
    this.points = [];

    this.down = (event) => this.pointerDown(event);
    this.move = (event) => this.pointerMove(event);
    this.up = () => this.pointerUp();
    this.contextMenu = (event) => event.preventDefault();

    canvas.addEventListener('pointerdown', this.down);
    canvas.addEventListener('pointermove', this.move);
    canvas.addEventListener('pointerup', this.up);
    canvas.addEventListener('pointercancel', this.up);
    canvas.addEventListener('contextmenu', this.contextMenu);
  }

  position(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (this.canvas._gameWidth || this.canvas.width) / rect.width,
      y: (event.clientY - rect.top) * (this.canvas._gameHeight || this.canvas.height) / rect.height,
      time: performance.now(),
    };
  }

  pointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.active = true;
    try { this.canvas.setPointerCapture(event.pointerId); } catch { /* Capture is optional. */ }
    this.last = this.position(event);
    this.points = [this.last];
  }

  pointerMove(event) {
    if (!this.active) return;
    const point = this.position(event);
    if (this.last) {
      this.onSwipe(this.last, point);
      this.points.push(point);
      if (this.points.length > 14) this.points.shift();
    }
    this.last = point;
  }

  pointerUp() {
    this.active = false;
    this.last = null;
    this.points = [];
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this.down);
    this.canvas.removeEventListener('pointermove', this.move);
    this.canvas.removeEventListener('pointerup', this.up);
    this.canvas.removeEventListener('pointercancel', this.up);
    this.canvas.removeEventListener('contextmenu', this.contextMenu);
  }
}
