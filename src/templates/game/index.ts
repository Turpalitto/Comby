import type { GameSpec } from '@/core/types';

export function buildGameHTML(spec: GameSpec): string {
  const { title, primaryColor, genre, player, difficulty } = spec;

  const speedMap: Record<typeof difficulty, number> = {
    easy:   2.5,
    medium: 4.0,
    hard:   6.0,
  };
  const enemySpeed = speedMap[difficulty];

  // Route to the right game loop by genre
  const gameScript =
    genre === 'platformer' ? buildPlatformer(primaryColor, player.movement, difficulty) :
    genre === 'shooter'    ? buildShooter(primaryColor, difficulty) :
    genre === 'puzzle'     ? buildPuzzle(primaryColor) :
                             buildDodger(primaryColor, enemySpeed);   // runner / arcade / default

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a0f; }
    canvas {
      display: block;
      margin: 0 auto;
      image-rendering: pixelated;
    }
    #ui {
      position: fixed; top: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: ${primaryColor};
      text-shadow: 0 0 8px ${primaryColor}88;
      pointer-events: none;
      z-index: 10;
    }
    #overlay {
      position: fixed; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: #0a0a0fcc;
      font-family: 'Courier New', monospace;
      color: white;
      text-align: center;
      z-index: 20;
    }
    #overlay h1 {
      font-size: 2.5rem; font-weight: bold;
      color: ${primaryColor};
      text-shadow: 0 0 20px ${primaryColor}88;
      margin-bottom: 8px;
    }
    #overlay p { color: #888; font-size: 0.85rem; margin-bottom: 24px; }
    #overlay button {
      padding: 10px 32px;
      border-radius: 8px;
      border: 1px solid ${primaryColor};
      background: ${primaryColor}22;
      color: ${primaryColor};
      font-family: inherit;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    #overlay button:hover { background: ${primaryColor}44; }
  </style>
</head>
<body>

  <div id="ui">
    <span>⬡ ${escHtml(title)}</span>
    <span>SCORE: <strong id="score">0</strong></span>
    <span>LIVES: <strong id="lives">3</strong></span>
  </div>

  <canvas id="canvas"></canvas>

  <div id="overlay">
    <h1>${escHtml(title)}</h1>
    <p>${escHtml(genre.charAt(0).toUpperCase() + genre.slice(1))} · ${escHtml(difficulty)} mode</p>
    <button id="startBtn">▶ START GAME</button>
  </div>

  <script>
    ${gameScript}
  </script>
</body>
</html>`;
}

// ─── DODGER (default, runner, arcade) ────────────────────────
function buildDodger(color: string, speed: number): string {
  return `
  const canvas  = document.getElementById('canvas');
  const ctx     = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');

  let W, H, raf;
  let player, enemies, score, lives, frame, running;
  const PLAYER_W = 36, PLAYER_H = 36;
  const ENEMY_W  = 28, ENEMY_H  = 28;
  const BASE_SPEED = ${speed};

  function resize() {
    W = canvas.width  = Math.min(window.innerWidth, 640);
    H = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    score  = 0;
    lives  = 3;
    frame  = 0;
    running = true;
    player = { x: W / 2 - PLAYER_W / 2, y: H - 80, vx: 0 };
    enemies = [];
    scoreEl.textContent = '0';
    livesEl.textContent = '3';
    overlay.style.display = 'none';
    cancelAnimationFrame(raf);
    loop();
  }

  function spawnEnemy() {
    const x = Math.random() * (W - ENEMY_W);
    const spd = BASE_SPEED + Math.random() * (BASE_SPEED * 0.5) + score / 400;
    enemies.push({ x, y: -ENEMY_H, spd });
  }

  // ── Input ──
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup',   e => { keys[e.key] = false; });

  // Touch / mouse drag
  let touchX = null;
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    touchX = e.touches[0].clientX;
  }, { passive: false });
  canvas.addEventListener('touchend', () => { touchX = null; });

  function update() {
    frame++;

    // Player move
    const spd = 5;
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.vx = -spd;
    else if (keys['ArrowRight'] || keys['d'] || keys['D']) player.vx = spd;
    else if (touchX !== null) {
      const center = player.x + PLAYER_W / 2;
      player.vx = touchX > center ? spd : -spd;
    } else {
      player.vx *= 0.7;
    }
    player.x = Math.max(0, Math.min(W - PLAYER_W, player.x + player.vx));

    // Spawn
    const interval = Math.max(20, 60 - Math.floor(score / 200));
    if (frame % interval === 0) spawnEnemy();

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += e.spd;

      // Hit player
      if (
        e.x < player.x + PLAYER_W && e.x + ENEMY_W > player.x &&
        e.y < player.y + PLAYER_H && e.y + ENEMY_H > player.y
      ) {
        enemies.splice(i, 1);
        lives--;
        livesEl.textContent = lives;
        if (lives <= 0) { gameOver(); return; }
        continue;
      }

      // Off screen
      if (e.y > H) {
        enemies.splice(i, 1);
        score += 10;
        scoreEl.textContent = score;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Grid BG
    ctx.strokeStyle = '#ffffff06';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Player
    ctx.save();
    ctx.shadowColor = '${color}';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = '${color}';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, PLAYER_W, PLAYER_H, 6);
    ctx.fill();
    ctx.restore();

    // Enemies
    enemies.forEach(e => {
      ctx.save();
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur  = 12;
      ctx.fillStyle   = '#f87171';
      ctx.beginPath();
      ctx.roundRect(e.x, e.y, ENEMY_W, ENEMY_H, 4);
      ctx.fill();
      ctx.restore();
    });
  }

  function loop() {
    update();
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    overlay.innerHTML = \`
      <h1>GAME OVER</h1>
      <p>Score: <strong style="color:${'${color}'}">\${score}</strong></p>
      <button id="startBtn" onclick="init()">↩ RETRY</button>
    \`;
    overlay.style.display = 'flex';
  }

  startBtn.addEventListener('click', init);
  window.addEventListener('resize', () => { resize(); });
  `;
}

// ─── PLATFORMER ───────────────────────────────────────────────
function buildPlatformer(color: string, _movement: string, difficulty: string): string {
  const gravity = difficulty === 'hard' ? 0.7 : difficulty === 'easy' ? 0.45 : 0.55;

  return `
  const canvas  = document.getElementById('canvas');
  const ctx     = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');

  let W, H, raf;
  let player, platforms, coins, score, lives, frame, running, cameraY;
  const GRAVITY = ${gravity};
  const JUMP_V  = -13;

  function resize() {
    W = canvas.width  = Math.min(window.innerWidth, 640);
    H = canvas.height = window.innerHeight;
  }

  function makePlatforms() {
    const plats = [{ x: W/2 - 60, y: H - 60, w: 120, h: 14 }];
    let y = H - 60;
    for (let i = 0; i < 30; i++) {
      y -= 90 + Math.random() * 60;
      const w = 60 + Math.random() * 100;
      const x = Math.random() * (W - w);
      plats.push({ x, y, w, h: 12 });
      // coin above
      coins.push({ x: x + w/2 - 8, y: y - 28, collected: false });
    }
    return plats;
  }

  function init() {
    resize();
    score = 0; lives = 3; frame = 0; running = true; cameraY = 0; coins = [];
    scoreEl.textContent = '0';
    livesEl.textContent = '3';
    platforms = makePlatforms();
    const start = platforms[0];
    player = {
      x: start.x + start.w/2 - 14, y: start.y - 32,
      w: 28, h: 32, vx: 0, vy: 0, onGround: false, facingRight: true,
    };
    overlay.style.display = 'none';
    cancelAnimationFrame(raf);
    loop();
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && player?.onGround) {
      player.vy = JUMP_V;
      player.onGround = false;
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update() {
    frame++;

    // Horizontal
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) { player.vx = -4; player.facingRight = false; }
    else if (keys['ArrowRight'] || keys['d'] || keys['D']) { player.vx = 4; player.facingRight = true; }
    else player.vx *= 0.6;

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;
    player.x = Math.max(0, Math.min(W - player.w, player.x));
    player.onGround = false;

    // Camera follows player up
    const targetCameraY = Math.min(0, player.y - H * 0.45);
    cameraY += (targetCameraY - cameraY) * 0.1;

    // Platform collisions
    for (const p of platforms) {
      const px = player.x, py = player.y - cameraY;
      if (
        player.vy >= 0 &&
        px + player.w > p.x && px < p.x + p.w &&
        py + player.h > p.y - cameraY && py + player.h < p.y - cameraY + player.vy + p.h + 2
      ) {
        player.y  = p.y + cameraY - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }

    // Fall death
    if (player.y - cameraY > H + 100) {
      lives--;
      livesEl.textContent = lives;
      if (lives <= 0) { gameOver(); return; }
      const start = platforms[0];
      player.x = start.x + start.w/2 - 14;
      player.y = start.y - 32 + cameraY;
      player.vy = 0;
    }

    // Coins
    coins.forEach(c => {
      if (!c.collected &&
        player.x < c.x + 16 && player.x + player.w > c.x &&
        player.y - cameraY < c.y - cameraY + 16 && player.y - cameraY + player.h > c.y - cameraY) {
        c.collected = true;
        score += 50;
        scoreEl.textContent = score;
      }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // BG
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#0a0a1f');
    grd.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    const cy = cameraY;

    // Platforms
    platforms.forEach(p => {
      ctx.save();
      ctx.shadowColor = '${color}';
      ctx.shadowBlur  = 8;
      ctx.fillStyle   = '${color}';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y - cy, p.w, p.h, 4);
      ctx.fill();
      ctx.restore();
    });

    // Coins
    coins.forEach(c => {
      if (c.collected) return;
      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur  = 10;
      ctx.fillStyle   = '#fbbf24';
      ctx.beginPath();
      ctx.arc(c.x + 8, c.y - cy + 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Player
    ctx.save();
    ctx.shadowColor = '${color}';
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = '${color}';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y - cy, player.w, player.h, 5);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#fff';
    const eyeX = player.facingRight ? player.x + 16 : player.x + 8;
    ctx.beginPath();
    ctx.arc(eyeX, player.y - cy + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    update();
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    overlay.innerHTML = \`
      <h1>GAME OVER</h1>
      <p>Score: <strong style="color:${'${color}'}">\${score}</strong></p>
      <button onclick="init()">↩ RETRY</button>
    \`;
    overlay.style.display = 'flex';
  }

  startBtn.addEventListener('click', init);
  window.addEventListener('resize', resize);
  `;
}

// ─── SHOOTER ─────────────────────────────────────────────────
function buildShooter(color: string, difficulty: string): string {
  const enemySpd = difficulty === 'hard' ? 2.5 : difficulty === 'easy' ? 1.2 : 1.8;

  return `
  const canvas  = document.getElementById('canvas');
  const ctx     = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');

  let W, H, raf;
  let player, bullets, enemies, score, lives, frame, running;
  const ENEMY_SPD = ${enemySpd};

  function resize() {
    W = canvas.width  = Math.min(window.innerWidth, 640);
    H = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    score = 0; lives = 3; frame = 0; running = true;
    player   = { x: W/2 - 16, y: H - 70, w: 32, h: 32, vx: 0 };
    bullets  = [];
    enemies  = [];
    scoreEl.textContent = '0';
    livesEl.textContent = '3';
    overlay.style.display = 'none';
    cancelAnimationFrame(raf);
    loop();
  }

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if ((e.key === ' ' || e.key === 'ArrowUp') && running) shoot();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  let lastShot = 0;
  function shoot() {
    const now = Date.now();
    if (now - lastShot < 250) return;
    lastShot = now;
    bullets.push({ x: player.x + player.w/2 - 3, y: player.y, w: 6, h: 14, vy: -11 });
  }

  function update() {
    frame++;

    // Player
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.vx = -5;
    else if (keys['ArrowRight'] || keys['d'] || keys['D']) player.vx = 5;
    else player.vx *= 0.6;
    player.x = Math.max(0, Math.min(W - player.w, player.x + player.vx));

    // Auto-fire on hold
    if (keys[' '] && frame % 8 === 0) shoot();

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y += bullets[i].vy;
      if (bullets[i].y < -20) bullets.splice(i, 1);
    }

    // Spawn enemies
    const interval = Math.max(25, 70 - Math.floor(score / 300));
    if (frame % interval === 0) {
      const x = Math.random() * (W - 30);
      const vx = (Math.random() - 0.5) * 2;
      enemies.push({ x, y: -30, w: 30, h: 30, vx, vy: ENEMY_SPD });
    }

    // Move enemies + collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.x += e.vx; e.y += e.vy;
      if (e.x < 0 || e.x + e.w > W) e.vx *= -1;

      // Bullet hit
      let hit = false;
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
          bullets.splice(j, 1);
          enemies.splice(i, 1);
          score += 100;
          scoreEl.textContent = score;
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // Player hit
      if (e.x < player.x + player.w && e.x + e.w > player.x &&
          e.y < player.y + player.h && e.y + e.h > player.y) {
        enemies.splice(i, 1);
        lives--;
        livesEl.textContent = lives;
        if (lives <= 0) { gameOver(); return; }
        continue;
      }

      if (e.y > H) enemies.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Stars BG
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    for (let s = 0; s < 60; s++) {
      const sx = (s * 137 + frame * 0.02) % W;
      const sy = (s * 97  + frame * 0.01) % H;
      ctx.globalAlpha = 0.3 + (s % 3) * 0.2;
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Player — ship shape
    ctx.save();
    ctx.shadowColor = '${color}';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = '${color}';
    const px = player.x, py = player.y, pw = player.w, ph = player.h;
    ctx.beginPath();
    ctx.moveTo(px + pw/2, py);
    ctx.lineTo(px + pw, py + ph);
    ctx.lineTo(px + pw*0.6, py + ph*0.75);
    ctx.lineTo(px + pw*0.4, py + ph*0.75);
    ctx.lineTo(px, py + ph);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Bullets
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = '#fbbf24';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 3);
      ctx.fill();
    });
    ctx.restore();

    // Enemies
    ctx.save();
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = '#f87171';
    enemies.forEach(e => {
      ctx.beginPath();
      // Diamond shape
      ctx.moveTo(e.x + e.w/2, e.y);
      ctx.lineTo(e.x + e.w, e.y + e.h/2);
      ctx.lineTo(e.x + e.w/2, e.y + e.h);
      ctx.lineTo(e.x, e.y + e.h/2);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  function loop() {
    update();
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    overlay.innerHTML = \`
      <h1>GAME OVER</h1>
      <p>Score: <strong style="color:${'${color}'}">\${score}</strong></p>
      <button onclick="init()">↩ RETRY</button>
    \`;
    overlay.style.display = 'flex';
  }

  startBtn.addEventListener('click', init);
  window.addEventListener('resize', resize);
  `;
}

// ─── PUZZLE (sliding tile) ─────────────────────────────────────
function buildPuzzle(color: string): string {
  return `
  const canvas  = document.getElementById('canvas');
  const ctx     = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');

  let W, H, raf;
  let grid, empty, moves, running, won;
  const N = 4;
  let TILE, OX, OY;

  function resize() {
    W = canvas.width  = Math.min(window.innerWidth, 640);
    H = canvas.height = window.innerHeight;
    const size = Math.min(W, H) - 100;
    TILE = size / N;
    OX   = (W - size) / 2;
    OY   = (H - size) / 2;
  }

  function init() {
    resize();
    moves = 0; running = true; won = false;
    scoreEl.textContent = '0';
    livesEl.textContent = '—';

    // Solved state
    grid = [];
    for (let i = 0; i < N * N; i++) grid.push(i);
    empty = N * N - 1;

    // Shuffle with valid moves
    for (let s = 0; s < 300; s++) {
      const neighbors = getNeighbors(empty);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      [grid[empty], grid[pick]] = [grid[pick], grid[empty]];
      empty = pick;
    }

    overlay.style.display = 'none';
    cancelAnimationFrame(raf);
    loop();
  }

  function getNeighbors(idx) {
    const row = Math.floor(idx / N), col = idx % N, nb = [];
    if (row > 0) nb.push(idx - N);
    if (row < N-1) nb.push(idx + N);
    if (col > 0) nb.push(idx - 1);
    if (col < N-1) nb.push(idx + 1);
    return nb;
  }

  canvas.addEventListener('click', e => {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - OX;
    const my = e.clientY - rect.top  - OY;
    const col = Math.floor(mx / TILE), row = Math.floor(my / TILE);
    if (col < 0 || col >= N || row < 0 || row >= N) return;
    const clicked = row * N + col;
    if (getNeighbors(empty).includes(clicked)) {
      [grid[empty], grid[clicked]] = [grid[clicked], grid[empty]];
      empty = clicked;
      moves++;
      scoreEl.textContent = moves;
      checkWin();
    }
  });

  function checkWin() {
    for (let i = 0; i < N * N - 1; i++) {
      if (grid[i] !== i) return;
    }
    won = true;
    overlay.innerHTML = \`
      <h1>SOLVED!</h1>
      <p>Moves: <strong style="color:${'${color}'}">\${moves}</strong></p>
      <button onclick="init()">↩ PLAY AGAIN</button>
    \`;
    overlay.style.display = 'flex';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < N * N; i++) {
      if (i === empty) continue;
      const val = grid[i];
      const row = Math.floor(i / N), col = i % N;
      const x = OX + col * TILE + 4;
      const y = OY + row * TILE + 4;
      const w = TILE - 8, h = TILE - 8;

      const isCorrect = (val === i);

      ctx.save();
      ctx.shadowColor = '${color}';
      ctx.shadowBlur  = isCorrect ? 12 : 4;
      ctx.fillStyle   = isCorrect ? '${color}' : '${color}44';
      ctx.strokeStyle = '${color}';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      if (!isCorrect) ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isCorrect ? '#fff' : '${color}';
      ctx.font      = \`bold \${Math.floor(TILE * 0.35)}px monospace\`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val + 1), x + w/2, y + h/2);
    }
  }

  function loop() {
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  startBtn.addEventListener('click', init);
  window.addEventListener('resize', () => { resize(); });
  `;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
