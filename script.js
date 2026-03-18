// ─── Config & State ───────────────────────────────────────────────
let algebraConfig = {};
let generatedSteps = [];

// ─── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  document.getElementById('problem-type').addEventListener('change', onTypeChange);
  document.getElementById('btn-generate').addEventListener('click', onGenerate);
});

async function loadConfig() {
  try {
    const res = await fetch('./data/algebra.json');
    algebraConfig = await res.json();
    populateDropdown();
  } catch (e) {
    console.error('Failed to load algebra.json:', e);
    // Fallback inline config
    algebraConfig = {
      linear_equations: {
        description: "Solve simple linear equations where x is unknown, for example equations like ax + b = c.",
        min: 1, max: 20
      },
      simple_inequalities: {
        description: "Solve basic inequalities using integers between 1 and 20, for example ax + b > c.",
        min: 1, max: 20
      },
      two_step_equations: {
        description: "Solve two-step equations requiring two operations to isolate x, for example ax - b = c.",
        min: 1, max: 20
      },
      multiplication_equations: {
        description: "Solve equations where x is multiplied by a constant, for example ax = b.",
        min: 1, max: 20
      },
      subtraction_equations: {
        description: "Solve equations involving subtraction where x is unknown, for example x - a = b.",
        min: 1, max: 20
      }
    };
    populateDropdown();
  }
}

function populateDropdown() {
  const select = document.getElementById('problem-type');
  select.innerHTML = '';
  for (const [key, val] of Object.entries(algebraConfig)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = formatTypeName(key);
    select.appendChild(opt);
  }
  onTypeChange();
}

function formatTypeName(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function onTypeChange() {
  const key = document.getElementById('problem-type').value;
  const desc = algebraConfig[key]?.description || '';
  document.getElementById('type-desc').textContent = desc;
}

// ─── Problem Generators ────────────────────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem(type, config) {
  const { min, max } = config;

  switch (type) {
    case 'linear_equations': {
      // 5x + 5 = 10 -> 5x = 10 - 5 -> 5x = 5 -> 5x/5 = 5/5 -> x = 1
      const a = randInt(2, Math.min(max, 10));
      const x = randInt(min, max);
      const b = randInt(min, max);
      const c = a * x + b;
      const diff = c - b;
      return {
        question: `${a}x + ${b} = ${c}`,
        steps: [
          { math: `${a}x + ${b} = ${c}` },
          { math: `${a}x = ${c} - ${b}` },
          { math: `${a}x = ${diff}` },
          { math: `${a}x/${a} = ${diff}/${a}` },
          { math: `x = ${x}` },
        ]
      };
    }

    case 'simple_inequalities': {
      // 5x + 5 > 10 -> 5x > 10 - 5 -> 5x > 5 -> 5x/5 > 5/5 -> x > 1
      const a = randInt(2, Math.min(max, 8));
      const x = randInt(min, max);
      const b = randInt(min, max);
      const c = a * x + b - randInt(1, 5);
      const symbols = ['>', '<', '≥', '≤'];
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const diff = c - b;
      const solveStr = Number.isInteger(diff / a) ? `${diff / a}` : `${diff}/${a}`;
      return {
        question: `${a}x + ${b} ${sym} ${c}`,
        steps: [
          { math: `${a}x + ${b} ${sym} ${c}` },
          { math: `${a}x ${sym} ${c} - ${b}` },
          { math: `${a}x ${sym} ${diff}` },
          { math: `${a}x/${a} ${sym} ${diff}/${a}` },
          { math: `x ${sym} ${solveStr}` },
        ]
      };
    }

    case 'two_step_equations': {
      // 5x - 5 = 10 -> 5x = 10 + 5 -> 5x = 15 -> 5x/5 = 15/5 -> x = 3
      const a = randInt(2, Math.min(max, 10));
      const x = randInt(min, max);
      const b = randInt(min, max);
      const c = a * x - b;
      const sum = c + b;
      return {
        question: `${a}x - ${b} = ${c}`,
        steps: [
          { math: `${a}x - ${b} = ${c}` },
          { math: `${a}x = ${c} + ${b}` },
          { math: `${a}x = ${sum}` },
          { math: `${a}x/${a} = ${sum}/${a}` },
          { math: `x = ${x}` },
        ]
      };
    }

    case 'multiplication_equations': {
      // 4x = 20 -> 4x/4 = 20/4 -> x = 5
      const a = randInt(2, Math.min(max, 10));
      const x = randInt(min, max);
      const b = a * x;
      return {
        question: `${a}x = ${b}`,
        steps: [
          { math: `${a}x = ${b}` },
          { math: `${a}x/${a} = ${b}/${a}` },
          { math: `x = ${x}` },
        ]
      };
    }

    case 'subtraction_equations': {
      // x - 4 = 9 -> x = 9 + 4 -> x = 13
      const a = randInt(min, max);
      const b = randInt(min, max);
      const x = a + b;
      return {
        question: `x - ${a} = ${b}`,
        steps: [
          { math: `x - ${a} = ${b}` },
          { math: `x = ${b} + ${a}` },
          { math: `x = ${x}` },
        ]
      };
    }

    default:
      return generateProblem('linear_equations', config);
  }
}

// ─── Canvas Image Generator ────────────────────────────────────────
const IMG_W = 600;
const IMG_H = 300;

function getStepColors(label) {
  return { bg: '#000000', accent: '#ffffff', text: '#ffffff', sub: '#888888' };
}

function createStepCanvas(stepIndex, stepData, totalSteps) {
  const canvas = document.createElement('canvas');
  canvas.width = IMG_W;
  canvas.height = IMG_H;
  const ctx = canvas.getContext('2d');
  const { label, math, note } = stepData;
  const colors = getStepColors(label);

  // Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, IMG_W, IMG_H);

  // Main math expression
  ctx.font = `500 ${math.length > 16 ? 40 : 52}px "DM Mono", monospace`;
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(math, IMG_W / 2, IMG_H / 2 + 10);

  // Note text
  if (note) {
    ctx.font = 'italic 14px "DM Sans", sans-serif';
    ctx.fillStyle = colors.sub;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(note, IMG_W / 2, IMG_H - 22);
  }

  // Bottom accent bar
  ctx.fillStyle = colors.accent;
  ctx.globalAlpha = label === 'Question' || label === 'Answer' ? 0.6 : 0.25;
  ctx.fillRect(0, IMG_H - 4, IMG_W, 4);
  ctx.globalAlpha = 1;

  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

// ─── Main Handler ──────────────────────────────────────────────────
function onGenerate() {
  const type = document.getElementById('problem-type').value;
  const config = algebraConfig[type];
  if (!config) return;

  const btn = document.getElementById('btn-generate');
  btn.disabled = true;
  btn.textContent = 'Generating…';

  setTimeout(() => {
    const problem = generateProblem(type, config);
    generatedSteps = problem.steps;

    renderTextSteps(problem.steps);
    renderDownloadThumbs(problem.steps);

    // Auto-download all images
    autoDownloadAll(problem.steps, type);

    const container = document.getElementById('steps-container');
    container.classList.add('visible');

    btn.disabled = false;
    btn.textContent = 'Generate Question';

    showToast(`✓ ${problem.steps.length} images downloaded`);
  }, 80);
}

function renderTextSteps(steps) {
  const list = document.getElementById('steps-list');
  const badge = document.getElementById('steps-badge');
  list.innerHTML = '';
  badge.textContent = `${steps.length} steps`;

  steps.forEach((step, i) => {
    const item = document.createElement('div');
    item.className = 'step-item';
    item.style.animationDelay = `${i * 0.07}s`;

    const isLast = i === steps.length - 1;
    const isFirst = i === 0;
    const numClass = isFirst ? 'question-num' : isLast ? 'answer-num' : '';
    const numContent = isLast ? '✓' : (i + 1);

    item.innerHTML = `
      <div class="step-num ${numClass}">${numContent}</div>
      <div class="step-content">
        <div class="step-math">${step.math}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

function renderDownloadThumbs(steps) {
  const grid = document.getElementById('download-grid');
  grid.innerHTML = '';

  steps.forEach((step, i) => {
    const canvas = createStepCanvas(i, step, steps.length);
    canvas.style.imageRendering = 'auto';

    const wrap = document.createElement('div');
    wrap.className = 'dl-thumb';
    wrap.style.animationDelay = `${i * 0.07 + 0.1}s`;
    const thumbLabel = i === 0 ? 'Question' : i === steps.length - 1 ? 'Answer' : `Step ${i}`;
    wrap.title = `Download ${thumbLabel}`;

    const lbl = document.createElement('div');
    lbl.className = 'dl-thumb-label';
    lbl.textContent = thumbLabel;

    wrap.appendChild(canvas);
    wrap.appendChild(lbl);

    wrap.addEventListener('click', () => {
      downloadCanvas(canvas, `step_${i + 1}`);
      showToast(`Downloaded step ${i + 1}`);
    });

    grid.appendChild(wrap);
  });
}

function autoDownloadAll(steps, type) {
  steps.forEach((step, i) => {
    const canvas = createStepCanvas(i, step, steps.length);
    const name = `${type}_step${i + 1}`;
    // Stagger downloads slightly to avoid browser blocking
    setTimeout(() => downloadCanvas(canvas, name), i * 150);
  });
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

document.getElementById('btn-download-all').addEventListener('click', () => {
  if (!generatedSteps.length) return;
  const type = document.getElementById('problem-type').value;
  generatedSteps.forEach((step, i) => {
    const canvas = createStepCanvas(i, step, generatedSteps.length);
    const name = `${type}_step${i + 1}`;
    setTimeout(() => downloadCanvas(canvas, name), i * 150);
  });
  showToast(`Re-downloading ${generatedSteps.length} images…`);
});

// ─── Toast ─────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
