const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const state = {
  time: 0,
  phaseShift: 0,
  rotation: 0,
  idleTime: 0,
  isIdle: false,
  showControls: true,
  rotationEnabled: true,
  controlsVisible: true,
};

const config = {
  speed: 0.5,
  amplitude: 200,
  trailLength: 0.7,
  glowStrength: 15,
  lineThickness: 2,
  colorMode: 'rainbow',
  freqX: 3,
  freqY: 2,
  rotationSpeed: 0.02,
};

let W = 0;
let H = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
}

function getColor(t, mode, time) {
  const angle = ((t / (Math.PI * 2)) % 1 + 1) % 1;
  const ht = time % 360;
  let h, s, l;
  switch (mode) {
    case 'rainbow':
      h = ((angle * 360 + ht * 20) % 360 + 360) % 360;
      s = 100;
      l = 55 + 20 * Math.sin(t * 3 + time * 0.5);
      break;
    case 'ocean':
      h = ((190 + 50 * Math.sin(angle * Math.PI * 2 + ht * 0.04)) % 360 + 360) % 360;
      s = 75 + 25 * Math.sin(t * 1.5 + ht * 0.08);
      l = 40 + 30 * Math.sin(t * 2 + ht * 0.06);
      break;
    case 'sunset':
      h = ((340 + 40 * Math.sin(angle * Math.PI * 2 + ht * 0.03)) % 360 + 360) % 360;
      s = 85 + 15 * Math.sin(t + ht * 0.04);
      l = 50 + 25 * Math.sin(t * 1.5 + ht * 0.05);
      break;
    case 'monochrome':
      h = 210;
      s = 80;
      l = 20 + 60 * Math.sin(angle * Math.PI * 2 + ht * 0.04);
      break;
  }
  return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}

function createCurveGradient(amp, time) {
  let grad;
  if (typeof ctx.createConicGradient === 'function') {
    grad = ctx.createConicGradient(0, 0, 0);
  } else {
    grad = ctx.createLinearGradient(-amp, 0, amp, 0);
  }
  for (let i = 0; i <= 12; i++) {
    const t = (i / 12) * Math.PI * 2;
    grad.addColorStop(i / 12, getColor(t, config.colorMode, time));
  }
  return grad;
}

function draw() {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const amp = config.amplitude * (1 + 0.06 * Math.sin(state.time * 0.08));
  const trailAlpha = 0.35 - config.trailLength * 0.33;

  ctx.fillStyle = 'rgba(0,0,0,' + Math.max(0.01, trailAlpha) + ')';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W / 2, H / 2);

  const breath = 1 + 0.015 * Math.sin(state.time * 0.05);
  ctx.scale(breath, breath);
  ctx.rotate(state.rotation);

  const steps = 2000;
  const path = new Path2D();
  path.moveTo(
    amp * Math.sin(config.freqX * 0 + state.phaseShift),
    amp * Math.sin(config.freqY * 0)
  );
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    path.lineTo(
      amp * Math.sin(config.freqX * t + state.phaseShift),
      amp * Math.sin(config.freqY * t)
    );
  }

  const mainColor = getColor(state.time * 0.5, config.colorMode, state.time);
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = config.glowStrength * 3;
  ctx.lineWidth = config.lineThickness * 2.5;
  ctx.strokeStyle = mainColor;
  ctx.globalAlpha = 0.15 + config.glowStrength * 0.005;
  ctx.stroke(path);

  ctx.shadowBlur = config.glowStrength * 0.5;
  ctx.lineWidth = config.lineThickness;
  ctx.globalAlpha = 1;
  ctx.strokeStyle = createCurveGradient(amp, state.time);
  ctx.stroke(path);

  const headT = (state.time * 0.7) % (Math.PI * 2);
  const headX = amp * Math.sin(config.freqX * headT + state.phaseShift);
  const headY = amp * Math.sin(config.freqY * headT);
  ctx.shadowBlur = config.glowStrength * 2;
  ctx.shadowColor = mainColor;
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.arc(headX, headY, config.lineThickness * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function update(dt) {
  state.time += dt * config.speed;
  state.phaseShift = state.time * 0.7;

  if (state.isIdle) {
    config.freqX += 0.00005 * Math.sin(state.time * 0.005 + 1.2) * dt * 60;
    config.freqY += 0.00005 * Math.sin(state.time * 0.007 + 2.3) * dt * 60;
    config.speed += 0.00001 * Math.sin(state.time * 0.002 + 4.5) * dt * 60;
    config.amplitude += 0.01 * Math.sin(state.time * 0.003 + 3.4) * dt * 60;
    config.trailLength = Math.max(0.1, Math.min(0.95,
      config.trailLength + 0.00003 * Math.sin(state.time * 0.004 + 5.6) * dt * 60
    ));
    config.freqX = Math.max(0.5, Math.min(10, config.freqX));
    config.freqY = Math.max(0.5, Math.min(10, config.freqY));
    config.amplitude = Math.max(50, Math.min(350, config.amplitude));
    config.speed = Math.max(0.05, Math.min(2, config.speed));
  }

  if (state.rotationEnabled) {
    state.rotation += config.rotationSpeed * dt * config.speed * 0.1;
  }

  state.idleTime += dt;
  if (state.idleTime > 30 && !state.isIdle) {
    state.isIdle = true;
  }
}

let lastTime = 0;

function animate(timestamp) {
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 1 / 60;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(animate);
}

function generateRandomHarmony() {
  const ratios = [
    [3, 2], [4, 3], [5, 3], [5, 4], [7, 5],
    [8, 5], [8, 7], [5, 6], [7, 6], [9, 5],
    [7, 4], [9, 8], [11, 7], [13, 8],
  ];
  const [a, b] = ratios[Math.floor(Math.random() * ratios.length)];
  config.freqX = a + (Math.random() - 0.5) * 0.3;
  config.freqY = b + (Math.random() - 0.5) * 0.3;
  config.speed = 0.15 + Math.random() * 0.7;
  config.amplitude = 120 + Math.random() * 130;
  config.trailLength = 0.4 + Math.random() * 0.4;
  config.glowStrength = 8 + Math.random() * 22;
  config.lineThickness = 1 + Math.random() * 2.5;
  config.rotationSpeed = (0.005 + Math.random() * 0.04) * (Math.random() > 0.5 ? 1 : -1);

  const modes = ['rainbow', 'ocean', 'sunset', 'monochrome'];
  config.colorMode = modes[Math.floor(Math.random() * modes.length)];
  state.rotationEnabled = Math.random() > 0.2;
  state.idleTime = 0;
  state.isIdle = false;
  syncUI();
}

function syncUI() {
  document.getElementById('speed').value = config.speed;
  document.getElementById('amplitude').value = config.amplitude;
  document.getElementById('trail').value = config.trailLength;
  document.getElementById('glow').value = config.glowStrength;
  document.getElementById('thickness').value = config.lineThickness;

  document.querySelectorAll('.color-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.mode === config.colorMode);
  });

  var rotBtn = document.getElementById('toggle-rotation');
  if (rotBtn) rotBtn.textContent = state.rotationEnabled ? 'Rotation: ON' : 'Rotation: OFF';
}

function setupControls() {
  var toggleBtn = document.getElementById('toggle-controls');
  var panel = document.getElementById('controls-panel');
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', function () {
      state.controlsVisible = !state.controlsVisible;
      panel.classList.toggle('hidden', !state.controlsVisible);
      toggleBtn.textContent = state.controlsVisible ? '\u2715' : '\u2726';
    });
  }

  document.querySelectorAll('.color-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.color-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      config.colorMode = btn.dataset.mode;
      state.idleTime = 0;
      state.isIdle = false;
    });
  });

  var sliderMap = {
    speed: 'speed',
    amplitude: 'amplitude',
    trail: 'trailLength',
    glow: 'glowStrength',
    thickness: 'lineThickness',
  };

  Object.keys(sliderMap).forEach(function (id) {
    var slider = document.getElementById(id);
    var key = sliderMap[id];
    if (slider) {
      slider.addEventListener('input', function () {
        config[key] = parseFloat(slider.value);
        state.idleTime = 0;
        state.isIdle = false;
      });
    }
  });

  var rotBtn = document.getElementById('toggle-rotation');
  if (rotBtn) {
    rotBtn.addEventListener('click', function () {
      state.rotationEnabled = !state.rotationEnabled;
      rotBtn.textContent = state.rotationEnabled ? 'Rotation: ON' : 'Rotation: OFF';
      state.idleTime = 0;
    });
  }

  var randBtn = document.getElementById('random-harmony');
  if (randBtn) randBtn.addEventListener('click', generateRandomHarmony);

  var idleReset = function () {
    state.idleTime = 0;
    state.isIdle = false;
  };
  document.addEventListener('mousemove', idleReset);
  document.addEventListener('touchstart', idleReset);
  document.addEventListener('keydown', idleReset);
}

window.addEventListener('resize', resize);
resize();
setupControls();

setTimeout(generateRandomHarmony, 100);
animate(0);
