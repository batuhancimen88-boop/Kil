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
const keys = new Set();
let highScore = 0;
try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0); } catch (_) { /* storage disabled */ }

const state = { score: 0, timeLeft: 45, playing: false, started: false, lastTime: 0, enemyTimer: 1.5 };
const player = { x: canvas.width / 2, y: canvas.height / 2, radius: 18, speed: 250 };
const stars = [];
const enemies = [];
const particles = [];

function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
function updateHud() {
  scoreEl.textContent = state.score;
  timeEl.textContent = Math.ceil(state.timeLeft);
  highScoreEl.textContent = highScore;
  menuHighScoreEl.textContent = highScore;
}
function saveHighScore() {
  if (state.score > highScore) {
    highScore = state.score;
    try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (_) { /* storage disabled */ }
  }
  updateHud();
}
function playTone(frequency, duration = 0.1, type = 'sine') {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const audio = new AudioContextClass();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.035, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  oscillator.connect(gain); gain.connect(audio.destination);
  oscillator.start(); oscillator.stop(audio.currentTime + duration);
  oscillator.onended = () => audio.close();
}
function spawnStar() {
  stars.push({ x: 30 + Math.random() * (canvas.width - 60), y: 30 + Math.random() * (canvas.height - 60), radius: 8,
    color: ['#facc15', '#f9a8d4', '#c4b5fd', '#67e8f9'][Math.floor(Math.random() * 4)] });
}
function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  const enemy = { radius: 17, speed: 75 + Math.random() * 35, color: '#f87171' };
  if (side === 0) { enemy.x = -20; enemy.y = Math.random() * canvas.height; }
  if (side === 1) { enemy.x = canvas.width + 20; enemy.y = Math.random() * canvas.height; }
  if (side === 2) { enemy.x = Math.random() * canvas.width; enemy.y = -20; }
  if (side === 3) { enemy.x = Math.random() * canvas.width; enemy.y = canvas.height + 20; }
  enemies.push(enemy);
}
function setStatus(message, color = '#34d399') {
  statusEl.textContent = message;
  statusEl.style.color = color;
  statusEl.style.borderColor = color;
  statusEl.style.background = `${color}1f`;
}
function startGame() {
  player.x = canvas.width / 2; player.y = canvas.height / 2;
  stars.length = 0; enemies.length = 0; particles.length = 0;
  state.score = 0; state.timeLeft = 45; state.enemyTimer = 1.5;
  state.playing = true; state.started = true; state.lastTime = 0;
  keys.clear(); menu.classList.add('hidden'); gameWrap.classList.remove('hidden');
  setStatus('Yıldızları topla, düşmanlardan kaç!');
  for (let i = 0; i < 10; i++) spawnStar();
  updateHud(); playTone(520);
}
function finishGame(message, color) {
  state.playing = false;
  setStatus(`${message} Skorun: ${state.score}. Başlat ile tekrar oyna.`, color);
  saveHighScore();
  playTone(message === 'Oyun bitti!' ? 170 : 740, 0.2, message === 'Oyun bitti!' ? 'sawtooth' : 'triangle');
}
function addParticles(x, y, color) {
  for (let i = 0; i < 12; i++) particles.push({ x, y, vx: (Math.random() - .5) * 180, vy: (Math.random() - .5) * 180, life: .45, color });
}
function update(dt) {
  if (!state.playing) return;
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) { state.timeLeft = 0; finishGame('Süre doldu!', '#facc15'); return; }
  let dx = 0; let dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx--;
  if (keys.has('arrowright') || keys.has('d')) dx++;
  if (keys.has('arrowup') || keys.has('w')) dy--;
  if (keys.has('arrowdown') || keys.has('s')) dy++;
  const length = Math.hypot(dx, dy) || 1;
  player.x = clamp(player.x + dx / length * player.speed * dt, player.radius, canvas.width - player.radius);
  player.y = clamp(player.y + dy / length * player.speed * dt, player.radius, canvas.height - player.radius);

  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    if (Math.hypot(player.x - star.x, player.y - star.y) < player.radius + star.radius) {
      stars.splice(i, 1); spawnStar(); state.score += 10; addParticles(star.x, star.y, star.color); playTone(880, .08, 'triangle'); saveHighScore();
    }
  }
  state.enemyTimer -= dt;
  if (state.enemyTimer <= 0) { spawnEnemy(); state.enemyTimer = Math.max(.65, 1.8 - state.score / 250); }
  for (const enemy of enemies) {
    const ex = player.x - enemy.x; const ey = player.y - enemy.y; const distance = Math.hypot(ex, ey) || 1;
    enemy.x += ex / distance * enemy.speed * dt; enemy.y += ey / distance * enemy.speed * dt;
    if (distance < player.radius + enemy.radius) { finishGame('Oyun bitti!', '#f87171'); return; }
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  updateHud();
}
function draw() {
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#020617'); bg.addColorStop(1, '#111827'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 90; i++) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect((i * 79) % canvas.width, (i * 137) % canvas.height, 2, 2); }
  for (const star of stars) {
    ctx.beginPath(); ctx.fillStyle = star.color; ctx.shadowColor = star.color; ctx.shadowBlur = 16; ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); ctx.fill();
  }
  for (const enemy of enemies) {
    ctx.beginPath(); ctx.fillStyle = enemy.color; ctx.shadowColor = enemy.color; ctx.shadowBlur = 18; ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2); ctx.fill();
  }
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / .45); ctx.beginPath(); ctx.fillStyle = p.color; ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 20; ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.beginPath(); ctx.fillStyle = '#e0f2fe'; ctx.arc(player.x + 5, player.y - 5, 4, 0, Math.PI * 2); ctx.fill();
}
function loop(timestamp) {
  const dt = state.lastTime ? Math.min((timestamp - state.lastTime) / 1000, .05) : 0;
  state.lastTime = timestamp;
  if (state.started) { update(dt); draw(); }
  requestAnimationFrame(loop);
}

startBtn.addEventListener('click', startGame);
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  keys.add(key);
});
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
document.querySelectorAll('.control-btn').forEach((button) => {
  const key = button.dataset.key;
  const press = (event) => { event.preventDefault(); keys.add(key); button.classList.add('pressed'); };
  const release = (event) => { event.preventDefault(); keys.delete(key); button.classList.remove('pressed'); };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('pointerleave', (event) => { if (event.buttons === 0) release(event); });
});

updateHud();
requestAnimationFrame(loop);
