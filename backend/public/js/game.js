// Core game state machine: a small Space-Invaders-style wave shooter.

const CANVAS_WIDTH = 224;
const CANVAS_HEIGHT = 256;
const PIXEL = 2;

function aabb(a, b) {
  return (
    a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y
  );
}

class Bullet {
  constructor(x, y, vy, owner) {
    this.x = x;
    this.y = y;
    this.vy = vy;
    this.owner = owner; // 'player' | 'enemy'
    const shape = owner === 'player' ? BULLET_PLAYER : BULLET_ENEMY;
    this.width = gridWidth(shape, PIXEL);
    this.height = gridHeight(shape, PIXEL);
    this.dead = false;
  }

  update(dt) {
    this.y += this.vy * dt;
    if (this.y < -this.height || this.y > CANVAS_HEIGHT + this.height) this.dead = true;
  }

  draw(ctx) {
    const rows = this.owner === 'player' ? BULLET_PLAYER : BULLET_ENEMY;
    const palette = this.owner === 'player' ? PALETTE.bulletPlayer : PALETTE.bulletEnemy;
    drawGrid(ctx, rows, palette, Math.round(this.x), Math.round(this.y), PIXEL);
  }
}

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.timer = 0;
    this.frameDuration = 0.09;
    this.dead = false;
  }

  update(dt) {
    this.timer += dt;
    if (this.timer >= this.frameDuration) {
      this.timer = 0;
      this.frame += 1;
      if (this.frame >= EXPLOSION_FRAMES.length) this.dead = true;
    }
  }

  draw(ctx) {
    if (this.dead) return;
    drawGrid(ctx, EXPLOSION_FRAMES[this.frame], PALETTE.explosion, Math.round(this.x), Math.round(this.y), 3);
  }
}

class Enemy {
  constructor(x, y, shape, palette, points) {
    this.x = x;
    this.y = y;
    this.shape = shape;
    this.palette = palette;
    this.points = points;
    this.width = gridWidth(shape, PIXEL);
    this.height = gridHeight(shape, PIXEL);
    this.alive = true;
  }

  draw(ctx) {
    drawGrid(ctx, this.shape, this.palette, Math.round(this.x), Math.round(this.y), PIXEL);
  }
}

class Game {
  constructor(ctx, ui) {
    this.ctx = ctx;
    this.ui = ui;
    this.state = 'start'; // start | playing | paused | gameover
    this.lastTime = 0;
    this.reset();
    requestAnimationFrame((t) => this.loop(t));
  }

  reset() {
    this.player = {
      x: CANVAS_WIDTH / 2 - gridWidth(PLAYER_SHIP, PIXEL) / 2,
      y: CANVAS_HEIGHT - 30,
      width: gridWidth(PLAYER_SHIP, PIXEL),
      height: gridHeight(PLAYER_SHIP, PIXEL),
      speed: 130,
      cooldown: 0,
      lives: 3,
      invuln: 0,
    };
    this.bullets = [];
    this.explosions = [];
    this.enemies = [];
    this.score = 0;
    this.level = 1;
    this.enemyDir = 1;
    this.enemyShootTimer = 1;
    this.waveBanner = 0;
    this.totalEnemiesThisWave = 0;
    this.spawnWave();
  }

  spawnWave() {
    this.enemies = [];
    const rows = Math.min(3 + Math.floor(this.level / 2), 6);
    const cols = 8;
    const spacingX = 24;
    const spacingY = 18;
    const shapeWidth = gridWidth(ENEMY_SHAPE_A, PIXEL);
    const startX = (CANVAS_WIDTH - cols * spacingX) / 2 + (spacingX - shapeWidth) / 2;
    const startY = 28;
    const rowPalettes = [
      PALETTE.enemy1, PALETTE.enemy1, PALETTE.enemy2, PALETTE.enemy2, PALETTE.enemy3, PALETTE.enemy3,
    ];
    const rowPoints = [40, 40, 20, 20, 10, 10];

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const shape = r % 2 === 0 ? ENEMY_SHAPE_A : ENEMY_SHAPE_B;
        const palette = rowPalettes[r % rowPalettes.length];
        const points = rowPoints[r % rowPoints.length];
        this.enemies.push(new Enemy(startX + c * spacingX, startY + r * spacingY, shape, palette, points));
      }
    }

    this.totalEnemiesThisWave = this.enemies.length;
    this.enemyBaseSpeed = 16 + this.level * 3;
    this.enemyDir = 1;
    this.waveBanner = 1.4;
  }

  start() {
    Input.reset();
    this.reset();
    this.state = 'playing';
  }

  loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05) || 0;
    this.lastTime = time;

    if (this.state === 'playing') {
      if (Input.consumePause()) {
        this.state = 'paused';
      } else {
        this.update(dt);
      }
    } else if (this.state === 'paused' && Input.consumePause()) {
      this.state = 'playing';
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.updatePlayer(dt);
    this.updateBullets(dt);
    this.updateEnemies(dt);
    this.updateExplosions(dt);
    this.checkCollisions();

    if (this.waveBanner > 0) this.waveBanner -= dt;

    if (this.state === 'playing' && this.enemies.length === 0 && this.waveBanner <= 0) {
      this.level += 1;
      this.spawnWave();
    }
  }

  updatePlayer(dt) {
    const p = this.player;
    if (Input.isDown('left')) p.x -= p.speed * dt;
    if (Input.isDown('right')) p.x += p.speed * dt;
    p.x = Math.max(4, Math.min(CANVAS_WIDTH - p.width - 4, p.x));

    p.cooldown -= dt;
    if (Input.isDown('fire') && p.cooldown <= 0) {
      this.bullets.push(new Bullet(p.x + p.width / 2 - PIXEL / 2, p.y - 6, -180, 'player'));
      p.cooldown = 0.28;
    }

    if (p.invuln > 0) p.invuln -= dt;
  }

  updateBullets(dt) {
    for (const b of this.bullets) b.update(dt);
    this.bullets = this.bullets.filter((b) => !b.dead);
  }

  updateEnemies(dt) {
    if (this.enemies.length === 0) return;

    const aliveRatio = this.enemies.length / this.totalEnemiesThisWave;
    const speed = this.enemyBaseSpeed + (1 - aliveRatio) * 70;
    let hitEdge = false;

    for (const e of this.enemies) {
      e.x += this.enemyDir * speed * dt;
      if (e.x <= 4 || e.x + e.width >= CANVAS_WIDTH - 4) hitEdge = true;
    }

    if (hitEdge) {
      this.enemyDir *= -1;
      for (const e of this.enemies) e.y += 8;
    }

    for (const e of this.enemies) {
      if (e.y + e.height >= this.player.y) {
        this.triggerGameOver();
        return;
      }
    }

    this.enemyShootTimer -= dt;
    if (this.enemyShootTimer <= 0) {
      this.enemyShootTimer = Math.max(0.35, 1.1 - this.level * 0.05);
      const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
      if (shooter) {
        this.bullets.push(new Bullet(
          shooter.x + shooter.width / 2 - PIXEL / 2,
          shooter.y + shooter.height,
          100 + this.level * 4,
          'enemy',
        ));
      }
    }
  }

  updateExplosions(dt) {
    for (const ex of this.explosions) ex.update(dt);
    this.explosions = this.explosions.filter((ex) => !ex.dead);
  }

  checkCollisions() {
    for (const b of this.bullets) {
      if (b.owner !== 'player' || b.dead) continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (aabb(b, e)) {
          b.dead = true;
          e.alive = false;
          this.score += e.points;
          this.explosions.push(new Explosion(e.x - 4, e.y - 4));
        }
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive);
    this.bullets = this.bullets.filter((b) => !b.dead);

    if (this.player.invuln <= 0) {
      for (const b of this.bullets) {
        if (b.owner !== 'enemy') continue;
        if (aabb(b, this.player)) {
          b.dead = true;
          this.explosions.push(new Explosion(this.player.x, this.player.y - 4));
          this.player.lives -= 1;
          this.player.invuln = 1.5;
          if (this.player.lives <= 0) this.triggerGameOver();
        }
      }
      this.bullets = this.bullets.filter((b) => !b.dead);
    }
  }

  triggerGameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.ui.onGameOver(this.score);
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.state === 'start') return;

    for (const e of this.enemies) e.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    for (const ex of this.explosions) ex.draw(ctx);

    if (this.state !== 'gameover') {
      const flashHidden = this.player.invuln > 0 && Math.floor(this.player.invuln * 10) % 2 === 0;
      if (!flashHidden) {
        drawGrid(ctx, PLAYER_SHIP, PALETTE.player, Math.round(this.player.x), Math.round(this.player.y), PIXEL);
      }
    }

    this.drawHud(ctx);

    if (this.waveBanner > 0 && this.state === 'playing') {
      ctx.fillStyle = '#d7ffe8';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`WAVE ${this.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#58f6a8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }

  drawHud(ctx) {
    ctx.fillStyle = '#d7ffe8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${this.score}`, 6, 12);
    ctx.textAlign = 'right';
    ctx.fillText(`LIVES ${Math.max(this.player.lives, 0)}`, CANVAS_WIDTH - 6, 12);
    ctx.textAlign = 'center';
    ctx.fillText(`LV ${this.level}`, CANVAS_WIDTH / 2, 12);
  }
}
