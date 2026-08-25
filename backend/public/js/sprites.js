// Procedural pixel-art sprites: each shape is a grid of characters mapped to
// palette colors, so no external image assets are needed.

const PALETTE = {
  player: { '#': '#58f6a8', '+': '#bdfff0' },
  enemy1: { '#': '#ff5d73', '+': '#ffd0d8' },
  enemy2: { '#': '#ffd23f', '+': '#fff2c2' },
  enemy3: { '#': '#5db8ff', '+': '#cfe9ff' },
  bulletPlayer: { '#': '#f7ff9e' },
  bulletEnemy: { '#': '#ff8b5d' },
  explosion: { '#': '#ffd23f', '+': '#ff5d73', o: '#ffffff' },
};

const PLAYER_SHIP = [
  '....##....',
  '....##....',
  '...####...',
  '...++++...',
  '..######..',
  '.########.',
  '##.####.##',
  '#..####..#',
];

const ENEMY_SHAPE_A = [
  '..#....#..',
  '...#..#...',
  '..######..',
  '.##.##.##.',
  '##########',
  '#.######.#',
  '#.#....#.#',
  '...#..#...',
];

const ENEMY_SHAPE_B = [
  '..#....#..',
  '#..#..#..#',
  '#.######.#',
  '###.##.###',
  '##########',
  '..######..',
  '.#.####.#.',
  '#........#',
];

const BULLET_PLAYER = ['#', '#', '#'];
const BULLET_ENEMY = ['#', '#', '#'];

const EXPLOSION_FRAMES = [
  [
    '..o..',
    '.+#+.',
    'o#.#o',
    '.+#+.',
    '..o..',
  ],
  [
    '+...+',
    '.o.o.',
    '..#..',
    '.o.o.',
    '+...+',
  ],
];

function drawGrid(ctx, rows, colorMap, x, y, pixelSize) {
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    for (let c = 0; c < row.length; c += 1) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
      const color = colorMap[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + c * pixelSize, y + r * pixelSize, pixelSize, pixelSize);
    }
  }
}

function gridWidth(rows, pixelSize) {
  return rows[0].length * pixelSize;
}

function gridHeight(rows, pixelSize) {
  return rows.length * pixelSize;
}
