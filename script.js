const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const state = {
  time: 0,
  phaseShift: 0,
  rotation: 0,
  rotationEnabled: true,
  controlsVisible: true,
  isIdle: false,
  idleTime: 0,
};

const config = {
  speed: 0.5,
  amplitude: 200,
  trailLength: 0.7,
  glowStrength: 15,
  lineThickness: 2,
  colorMode: "rainbow",
  freqX: 3,
  freqY: 2,
  rotationSpeed: 0.02,
};

let W = 0;
let H = 0;
let lastTime = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;

  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getColor(mode, t, offset = 0) {
  if (mode === "ocean") {
    return `hsl(${190 + offset}, 95%, ${55 + 15 * Math.sin(t)}%)`;
  }

  if (mode === "sunset") {
    return `hsl(${20 + offset}, 100%, ${55 + 12 * Math.sin(t)}%)`;
  }

  if (mode === "monochrome") {
    const light = 65 + 25 * Math.sin(t + offset);
    return `hsl(0, 0%, ${light}%)`;
  }

  return `hsl(${(state.time * 80 + offset) % 360}, 100%, 60%)`;
}

function draw() {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const fade = 0.35 - config.trailLength * 0.33;
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.015, fade)})`;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W / 2, H / 2);

  if (state.rotationEnabled) {
    ctx.rotate(state.rotation);
  }

  const breathing = 1 + 0.04 * Math.sin(state.time * 0.9);
  ctx.scale(breathing, breathing);

  const amp = Math.min(config.amplitude, W * 0.42, H * 0.42);
  const steps = 1800;

  const path = new Path2D();

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;

    const x = amp * Math.sin(config.freqX * t + state.phaseShift);
    const y = amp * Math.sin(config.freqY * t);

    if (i === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }

  const mainColor = getColor(config.colorMode, state.time, 0);

  ctx.shadowColor = mainColor;
  ctx.shadowBlur = config.glowStrength * 3;
  ctx.lineWidth = config.lineThickness * 4;
  ctx.strokeStyle = mainColor;
  ctx.globalAlpha = 0.22;
  ctx.stroke(path);

  const gradient = ctx.createLinearGradient(-amp, -amp, amp, amp);
  gradient.addColorStop(0, getColor(config.colorMode, state.time, 0));
  gradient.addColorStop(0.5, getColor(config.colorMode, state.time, 120));
  gradient.addColorStop(1, getColor(config.colorMode, state.time, 240));

  ctx.shadowBlur = config.glowStrength;
  ctx.lineWidth = config.lineThickness;
  ctx.globalAlpha = 1;
  ctx.strokeStyle = gradient;
  ctx.stroke(path);

  ctx.restore();
}

function update(dt) {
  state.time += dt * config.speed;
  state.phaseShift += dt * config.speed * 1.4;

  config.freqX = config.freqX + Math.sin(state.time * 0.13) * 0.0008;
  config.freqY = config.freqY + Math.cos(state.time * 0.11) * 0.0008;

  config.freqX = Math.max(1, Math.min(12, config.freqX));
  config.freqY = Math.max(1, Math.min(12, config.freqY));

  if (state.rotationEnabled) {
    state.rotation += dt * config.rotationSpeed * config.speed;
  }

  state.idleTime += dt;

  if (state.idleTime > 25) {
    state.isIdle = true;
    config.speed += Math.sin(state.time * 0.08) * 0.0008;
    config.amplitude += Math.sin(state.time * 0.06) * 0.05;
    config.speed = Math.max(0.05, Math.min(2, config.speed));
    config.amplitude = Math.max(80, Math.min(350, config.amplitude));
    syncUI();
  }
}

function animate(timestamp) {
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 1 / 60;
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(animate);
}

function resetIdle() {
  state.idleTime = 0;
  state.isIdle = false;
}

function syncUI() {
  const speed = document.getElementById("speed");
  const amplitude = document.getElementById("amplitude");
  const trail = document.getElementById("trail");
  const glow = document.getElementById("glow");
  const thickness = document.getElementById("thickness");

  if (speed) speed.value = config.speed;
  if (amplitude) amplitude.value = config.amplitude;
  if (trail) trail.value = config.trailLength;
  if (glow) glow.value = config.glowStrength;
  if (thickness) thickness.value = config.lineThickness;

  document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === config.colorMode);
  });

  const rotationBtn = document.getElementById("toggle-rotation");
  if (rotationBtn) {
    rotationBtn.textContent = state.rotationEnabled ? "Rotation: ON" : "Rotation: OFF";
  }
}

function setupControls() {
  const sliders = {
    speed: "speed",
    amplitude: "amplitude",
    trail: "trailLength",
    glow: "glowStrength",
    thickness: "lineThickness",
  };

  Object.keys(sliders).forEach((id) => {
    const slider = document.getElementById(id);
    if (!slider) return;

    slider.addEventListener("input", () => {
      config[sliders[id]] = parseFloat(slider.value);
      resetIdle();
    });
  });

  document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      config.colorMode = btn.dataset.mode;

      document.querySelectorAll(".color-btn").forEach((b) => {
        b.classList.remove("active");
      });

      btn.classList.add("active");
      resetIdle();

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, W, H);
    });
  });

  const randomBtn = document.getElementById("random-harmony");
  if (randomBtn) {
    randomBtn.addEventListener("click", generateRandomHarmony);
  }

  const rotationBtn = document.getElementById("toggle-rotation");
  if (rotationBtn) {
    rotationBtn.addEventListener("click", () => {
      state.rotationEnabled = !state.rotationEnabled;
      syncUI();
      resetIdle();
    });
  }

  const toggleBtn = document.getElementById("toggle-controls");
  const panel = document.getElementById("controls-panel");

  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      state.controlsVisible = !state.controlsVisible;
      panel.classList.toggle("hidden", !state.controlsVisible);
      toggleBtn.textContent = state.controlsVisible ? "×" : "✦";
    });
  }

  document.addEventListener("mousemove", resetIdle);
  document.addEventListener("touchstart", resetIdle);
  document.addEventListener("keydown", resetIdle);
}

function generateRandomHarmony() {
  const ratios = [
    [3, 2],
    [4, 3],
    [5, 4],
    [5, 3],
    [7, 5],
    [8, 5],
    [9, 7],
    [11, 8],
    [13, 9],
  ];

  const pair = ratios[Math.floor(Math.random() * ratios.length)];

  config.freqX = pair[0] + (Math.random() - 0.5) * 0.4;
  config.freqY = pair[1] + (Math.random() - 0.5) * 0.4;

  config.speed = 0.15 + Math.random() * 0.85;
  config.amplitude = 120 + Math.random() * 180;
  config.trailLength = 0.45 + Math.random() * 0.45;
  config.glowStrength = 8 + Math.random() * 35;
  config.lineThickness = 1 + Math.random() * 3;

  const modes = ["rainbow", "ocean", "sunset", "monochrome"];
  config.colorMode = modes[Math.floor(Math.random() * modes.length)];

  config.rotationSpeed = (0.005 + Math.random() * 0.04) * (Math.random() > 0.5 ? 1 : -1);
  state.rotationEnabled = Math.random() > 0.2;

  resetIdle();
  syncUI();

  ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
  ctx.fillRect(0, 0, W, H);
}

window.addEventListener("resize", resize);

resize();
setupControls();
syncUI();
generateRandomHarmony();
animate(0);
