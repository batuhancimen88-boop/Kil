const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const statusEl = document.getElementById('status');

const keys = {};
const targetScore = 10;

const player = {
  x: 90,
  y: 90,
  radius: 16,
  speed: 3.2,
  color: '#38bdf8'
};

const enemy = {
  x: 680,
  y: 330,
  radius: 18,
  speed: 1.6,
  color: '#f87171',
  patrolDir: 1,
  patrolRange: 110
};

const state = {
  score: 0,
  timeLeft: 30,
  playing: true,
  gameOver: false,
  win: false
};

const coins = [];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateCoins() {
  coins.length = 0;
  for (let i = 0; i < 10; i++) {
    coins.push({
      x: randomBetween(40, canvas.width - 40),
      y: randomBetween(40, canvas.height - 40),
      radius: 8,
      color: '#facc15'
    });
  }
}

function resetGame() {
  player.x = 90;
  player.y = 90;
  enemy.x = 680;
  enemy.y = 330;
  enemy.patrolDir = 1;
  state.score = 0;
  state.timeLeft = 30;
  state.playing = true;
  state.gameOver = false;
  state.win = false;
  statusEl.textContent = 'Oyna!';
  generateCoins();
  updateHud();
}

function updateHud() {
  scoreEl.textContent = state.score;
  timeEl.textContent = Math.max(0, Math.ceil(state.timeLeft));
}

function handleInput() {
  let moveX = 0;
  let moveY = 0;

  if (keys['ArrowLeft'] || keys['a']) moveX -= 1;
  if (keys['ArrowRight'] || keys['d']) moveX += 1;
  if (keys['ArrowUp'] || keys['w']) moveY -= 1;
  if (keys['ArrowDown'] || keys['s']) moveY += 1;

  const magnitude = Math.hypot(moveX, moveY) || 1;
  const stepX = (moveX / magnitude) * player.speed;
  const stepY = (moveY / magnitude) * player.speed;

  player.x += stepX;
  player.y += stepY;

  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
}

function updateEnemy() {
  if (!state.playing) return;

  const distX = player.x - enemy.x;
  const distY = player.y - enemy.y;
  const distance = Math.hypot(distX, distY);

  if (distance < 220) {
    const dirX = distX / (distance || 1);
    const dirY = distY / (distance || 1);
    enemy.x += dirX * enemy.speed;
    enemy.y += dirY * enemy.speed;
  } else {
    enemy.x += enemy.patrolDir * enemy.speed;
    if (enemy.x > canvas.width - 80 || enemy.x < 80) {
      enemy.patrolDir *= -1;
    }
  }

  const collisionDistance = player.radius + enemy.radius;
  if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < collisionDistance) {
    state.playing = false;
    state.gameOver = true;
    statusEl.textContent = 'Kaybettin! Space ile yeniden başla';
  }
}

function updateCoins() {
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    const distance = Math.hypot(player.x - coin.x, player.y - coin.y);

    if (distance < player.radius + coin.radius + 2) {
      coins.splice(i, 1);
      state.score += 1;
      if (state.score >= targetScore) {
        state.playing = false;
        state.win = true;
        statusEl.textContent = 'Kazandın! Space ile tekrar oyna';
      }
    }
  }
}

function updateTime(delta) {
  if (!state.playing) return;

  state.timeLeft -= delta;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.playing = false;
    state.gameOver = true;
    statusEl.textContent = 'Süre doldu! Space ile yeniden başla';
  }
}

function drawBackground() {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.beginPath();
  ctx.fillStyle = player.color;
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = '#e0f2fe';
  ctx.arc(player.x + 5, player.y - 4, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy() {
  ctx.beginPath();
  ctx.fillStyle = enemy.color;
  ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCoins() {
  coins.forEach((coin) => {
    ctx.beginPath();
    ctx.fillStyle = coin.color;
    ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 2;
    ctx.arc(coin.x, coin.y, coin.radius - 2, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawOverlay() {
  if (state.playing) return;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(state.win ? 'KAZANDIN!' : 'OYUN BİTTİ', canvas.width / 2, canvas.height / 2 - 10);

  ctx.font = '22px Arial';
  ctx.fillText('Space tuşu ile yeniden başla', canvas.width / 2, canvas.height / 2 + 30);
}

function update() {
  if (state.playing) {
    handleInput();
    updateEnemy();
    updateCoins();
    updateTime(1 / 60);
  }
  updateHud();
}

function render() {
  drawBackground();
  drawCoins();
  drawEnemy();
  drawPlayer();
  drawOverlay();
}

let lastTime = 0;
function gameLoop(timestamp) {
  const delta = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;

  update();
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  keys[event.key.toLowerCase()] = true;

  if (event.code === 'Space' && !state.playing) {
    resetGame();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

resetGame();
requestAnimationFrame(gameLoop);
