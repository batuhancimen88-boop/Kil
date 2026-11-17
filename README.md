const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const gameWrap = document.getElementById('gameWrap');
const startBtn = document.getElementById('startBtn');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const highScoreEl = document.getElementById('highScore');
const menuHighScoreEl = document.getElementById('menuHighScore');
const statusEl = document.getElementById('statusBar');

const HIGH_SCORE_KEY = 'neon-runner-high-score';
const keys = {};

const state = {
  score: 0,
  highScore: Number(localStorage.getItem(HIGH_SCORE_KEY) || 0),
  timeLeft: 45,
  playing: false,
  gameOver: false,
  started: false,
  lastTime: 0,
};

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 18,
  speed: 4.1,
  color: '#38bdf8',
};

const stars = [];
const enemies = [];
const particles = [];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setHighScore(value) {
  state.highScore = value;
  localStorage.setItem(HIGH_SCORE_KEY, String(value));
  highScoreEl.textContent = state.highScore;
  menuHighScoreEl.textContent = state.highScore;
}

function playTone(frequency, duration = 0.08, type = 'square', volume = 0.04) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const audioCtx = new AudioCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);

  setTimeout(() => audioCtx.close(), duration * 1000 + 40);
}

function spawnStars() {
  while (stars.length < 11) {
    stars.push({
      x: 40 + Math.random() * (canvas.width - 80),
      y: 40 + Math.random() * (canvas.height - 80),
      radius: 7 + Math.random() * 4,
      color: ['#facc15', '#f9a8d4', '#c4b5fd', '#67e8f9'][Math.floor(Math.random() * 4)],
    });
  }
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = -20;
    y = Math.random() * canvas.height;
  } else if (side === 1) {
    x = canvas.width + 20;
    y = Math.random() * canvas.height;
  } else if (side === 2) {
    x = Math.random() * canvas.width;
    y = -20;
  } else {
    x = Math.random() * canvas.width;
    y = canvas.height + 20;
  }

  enemies.push({
    x,
    y,
    radius: 16 + Math.random() * 10,
    speed: 1.1 + Math.random() * 1.2,
    color: '#f87171',
  });
}

function resetGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  stars.length = 0;
  enemies.length = 0;
  particles.length = 0;
  state.score = 0;
  state.timeLeft = 45;
  state.playing = true;
  state.gameOver = false;
  state.started = true;
  statusEl.textContent = 'Oyun Başladı!';
  statusEl.style.background = 'rgba(52, 211, 153, 0.12)';
  statusEl.style.borderColor = 'rgba(52, 211, 153, 0.4)';
  statusEl.style.color = '#34d399';
  spawnStars();
  updateHud();
}

function updateHud() {
  scoreEl.textContent = state.score;
  timeEl.textContent = Math.max(0, Math.ceil(state.timeLeft));
  highScoreEl.textContent = state.highScore;
}

function createParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      radius: 2 + Math.random() * 3,
      color,
      life: 25 + Math.random() * 18,
    });
  }
}

function handleInput() {
  let moveX = 0;
  let moveY = 0;

  if (keys['arrowleft'] || keys['a']) moveX -= 1;
  if (keys['arrowright'] || keys['d']) moveX += 1;
  if (keys['arrowup'] || keys['w']) moveY -= 1;
  if (keys['arrowdown'] || keys['s']) moveY += 1;

  const len = Math.hypot(moveX, moveY) || 1;
  player.x += (moveX / len) * player.speed;
  player.y += (moveY / len) * player.speed;

  player.x = clamp(player.x, player.radius, canvas.width - player.radius);
  player.y = clamp(player.y, player.radius, canvas.height - player.radius);
}

function updateStars() {
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    const d = Math.hypot(player.x - star.x, player.y - star.y);
    if (d < player.radius + star.radius + 4) {
      stars.splice(i, 1);
      state.score += 10;
      createParticles(star.x, star.y, star.color, 16);
      playTone(880, 0.08, 'triangle', 0.05);

      if (state.score > state.highScore) {
        setHighScore(state.score);
      }

      if (stars.length < 7) spawnStars();
    }
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / dist) * enemy.speed;
    enemy.y += (dy / dist) * enemy.speed;

    if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius) {
      state.playing = false;
      state.gameOver = true;
      statusEl.textContent = 'Oyun Bitti! Başlat butonuna basıp tekrar dene.';
      statusEl.style.background = 'rgba(248, 113, 113, 0.12)';
      statusEl.style.borderColor = 'rgba(248, 113, 113, 0.4)';
      statusEl.style.color = '#f87171';
      playTone(180, 0.2, 'sawtooth', 0.05);
      if (state.score > state.highScore) {
        setHighScore(state.score);
      }
      return;
    }
  }

  if (Math.random() < 0.02) spawnEnemy();
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateGame(delta) {
  if (!state.playing) return;

  state.timeLeft -= delta;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.playing = false;
    state.gameOver = true;
    statusEl.textContent = 'Süre doldu! Tebrikler!';
    statusEl.style.background = 'rgba(250, 204, 21, 0.12)';
    statusEl.style.borderColor = 'rgba(250, 204, 21, 0.4)';
    statusEl.style.color = '#facc15';
    playTone(520, 0.12, 'triangle', 0.05);
    if (state.score > state.highScore) {
      setHighScore(state.score);
    }
  }

  handleInput();
  updateStars();
  updateEnemies();
  updateParticles();
  updateHud();
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#020617');
  bg.addColorStop(0.35, '#0b1220');
  bg.addColorStop(1, '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 90; i++) {
    const x = (i * 79) % canvas.width;
    const y = (i * 137) % canvas.height;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawStars() {
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.fillStyle = star.color;
    ctx.shadowColor = star.color;
    ctx.shadowBlur = 16;
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawPlayer() {
  ctx.beginPath();
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 20;
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.fillStyle = '#e0f2fe';
  ctx.arc(player.x + 5, player.y - 5, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies() {
  enemies.forEach((enemy) => {
    ctx.beginPath();
    ctx.fillStyle = enemy.color;
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 18;
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / 30);
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function draw() {
  drawBackground();
  drawStars();
  drawParticles();
  drawEnemies();
  drawPlayer();
}

function loop(timestamp) {
  const delta = (timestamp - state.lastTime) / 1000 || 0;
  state.lastTime = timestamp;

  if (state.started) {
    updateGame(delta);
    draw();
  }

  requestAnimationFrame(loop);
}

function openGame() {
  menu.classList.add('hidden');
  gameWrap.classList.remove('hidden');
  resetGame();
  state.started = true;
  playTone(500, 0.08, 'square', 0.03);
}

startBtn.addEventListener('click', openGame);

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (event.code === 'Space' && !state.playing) {
    openGame();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

setHighScore(state.highScore);
updateHud();
requestAnimationFrame(loop);
