const FRUITS = [
  { name: 'Яблоко', key: 'apple', points: 50 },
  { name: 'Персик', key: 'peach', points: 60 },
  { name: 'Банан', key: 'banana', points: 70 },
  { name: 'Киви', key: 'kiwi', points: 80 },
  { name: 'Апельсин', key: 'orange', points: 90 },
  { name: 'Манго', key: 'mango', points: 100 },
  { name: 'Кокос', key: 'coconut', points: 110 },
  { name: 'Арбуз', key: 'watermelon', points: 120 },
];

export const fruitImages = {};

export function loadSprites() {
  for (const fruit of FRUITS) {
    for (const part of ['whole', 'left', 'right']) {
      const image = new Image();
      image.src = `assets/images/fruits/${fruit.key}_${part}.png`;
      fruitImages[`${fruit.key}_${part}`] = image;
    }
  }

  for (const [key, path] of Object.entries({
    bomb: 'assets/images/bombs/bomb.png',
    bonus: 'assets/images/bonuses/double.png',
    wood: 'assets/images/background/wood.png',
  })) {
    const image = new Image();
    image.src = path;
    fruitImages[key] = image;
  }

  return fruitImages;
}

export default class Fruit {
  constructor(width, height, difficulty = 0) {
    this.w = width;
    this.h = height;
    this.radius = 32;
    this.type = 'fruit';
    this.sliced = false;
    this.dead = false;
    this.rotation = Math.random() * Math.PI;
    this.spin = (Math.random() - 0.5) * 2.4;
    // Velocity is expressed in pixels per frame; the larger launch value
    // lets fruit travel well above the middle of the playfield.
    this.vy = -(Math.random() * 2.4 + 12.2 + difficulty * 0.18);
    this.vx = (Math.random() - 0.5) * 5.5;
    this.x = width * (0.16 + Math.random() * 0.68);
    this.y = height + 40;
    this.age = 0;
    this.gravity = 10.5;
    this.id = Math.random();
  }

  static spawn(width, height, difficulty = 0) {
    if (Math.random() < Math.min(0.16, 0.07 + difficulty * 0.003)) {
      return new Hazard(width, height, difficulty);
    }
    if (Math.random() < 0.075) return new Bonus(width, height, difficulty);

    const fruit = new Fruit(width, height, difficulty);
    fruit.data = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    fruit.radius = fruit.data.key === 'watermelon' ? 37 : 32;
    fruit.spriteKey = fruit.data.key;
    fruit.vy -= Math.random() * difficulty * 0.18;
    return fruit;
  }

  update(dt) {
    this.age += dt;
    this.x += this.vx * 60 * dt;
    this.y += this.vy * 60 * dt;
    this.vy += this.gravity * dt;
    this.rotation += this.spin * dt;

    if (this.y > this.h + 100 || this.x < -110 || this.x > this.w + 110) {
      this.dead = true;
    }
  }

  draw(ctx) {
    if (this.sliced || this.dead) return;
    const spriteKey = this.type === 'fruit'
      ? `${this.spriteKey}_whole`
      : this.type === 'bomb' ? 'bomb' : 'bonus';
    const image = fruitImages[spriteKey];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    if (image?.complete && image.naturalWidth) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
    } else {
      ctx.fillStyle = this.type === 'bomb' ? '#24202d' : '#e74b63';
      ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    }
    ctx.restore();
  }
}

class Hazard extends Fruit {
  constructor(width, height, difficulty) {
    super(width, height, difficulty);
    this.type = 'bomb';
    this.radius = 31;
    this.vy -= 1.1;
  }
}

class Bonus extends Fruit {
  constructor(width, height, difficulty) {
    super(width, height, difficulty);
    this.type = 'bonus';
    this.radius = 29;
    this.vy -= 0.7;
    this.gravity = 9.5;
  }
}

export class HalfFruit {
  constructor(source, side) {
    this.x = source.x + (side === 'left' ? -9 : 9);
    this.y = source.y;
    this.vx = source.vx + (side === 'left' ? -2.8 : 2.8);
    this.vy = source.vy - 1.1;
    this.gravity = 11.5;
    this.rotation = source.rotation;
    this.spin = (side === 'left' ? -1 : 1) * (1.5 + Math.random());
    this.radius = source.radius;
    this.key = source.spriteKey;
    this.side = side;
    this.life = 2.3;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * 60 * dt;
    this.y += this.vy * 60 * dt;
    this.vy += this.gravity * dt;
    this.rotation += this.spin * dt;
    this.life -= dt;
    if (this.life <= 0 || this.y > innerHeight + 120) this.dead = true;
  }

  draw(ctx) {
    const image = fruitImages[`${this.key}_${this.side}`];
    if (!image?.complete || !image.naturalWidth) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.min(1, this.life);
    ctx.drawImage(image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
    ctx.restore();
  }
}
