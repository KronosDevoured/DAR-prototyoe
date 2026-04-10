// js/main.js — entry point: draw loop, level coordinator, restart dispatcher, boot

import { createCanvas, resizeCanvas, background, millis, createVector, width, height } from './helpers.js';
import { STICK_TAU_MS } from './constants.js';
import { state } from './state.js';
import { emaAlpha } from './math.js';
import { drawGrid, drawJoystick } from './render.js';
import { attachCanvasJoystickHandlers } from './joystick.js';
import { pollGamepad } from './gamepad.js';
import { setupUI, showGoal, updateTempoTag } from './ui.js';
import * as L1 from './levels/level1/level1.js';
import * as L2 from './levels/level2/level2.js';
import * as L3 from './levels/level3/level3.js';

// ===== Restart dispatcher =====
export function restart() {
  state.joyActive = false; state.joyVec = null;
  state.smJoy.x = 0; state.smJoy.y = 0;
  state.arrowAngleRender = 0;
  const res = document.getElementById('result'); if(res) res.style.display = 'none';
  if(state.level === 1)      L1.restart();
  else if(state.level === 2) L2.restart();
  else                       L3.restart();
}

// ===== Level switching =====
export function setLevel(n) {
  state.level = n;
  document.getElementById('level1').classList.toggle('active', n===1);
  document.getElementById('level2').classList.toggle('active', n===2);
  document.getElementById('level3').classList.toggle('active', n===3);
  document.getElementById('level2hud').style.display    = (n===2) ? 'flex' : 'none';
  document.getElementById('level3hud').style.display    = (n===3) ? 'flex' : 'none';
  document.getElementById('spinControls').style.display = (n===2||n===3) ? 'flex' : 'none';
  document.getElementById('l1Diff').style.display       = (n===1) ? 'flex' : 'none';
  const l1spin = document.getElementById('l1SpinContainer');
  const chromeShown = !document.getElementById('menuBtn').classList.contains('active');
  if(l1spin) l1spin.style.display = (n===1 && chromeShown) ? 'flex' : 'none';
  // Sync spin slider to the current level's period
  const spinRange      = document.getElementById('spinRange');
  const spinValue      = document.getElementById('spinValue');
  const spinLabelPrefix = document.getElementById('spinLabelPrefix');
  if(spinRange && spinValue) {
    const val = (n===2 ? L2.getSpinPeriod() : L3.getSpinPeriod()) / 1000;
    spinRange.value = (4.15 - val).toFixed(2); spinValue.textContent = val.toFixed(2) + ' s/rot';
    spinLabelPrefix.textContent = (n===2 ? 'L2 Spin' : 'L3 Spin');
  }
  updateTempoTag(L2.getSpinPeriod(), L3.getSpinPeriod());
  restart(); showGoal();
}

// ===== Roll direction =====
function setRoll(dir) {
  state.airRoll = dir;
  document.getElementById('rollL').classList.toggle('active', dir < 0);
  document.getElementById('rollR').classList.toggle('active', dir > 0);
}

// ===== Window resize =====
function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  state.center = createVector(width/2, height/2);
  if(!state.relocating) state.JOY_CENTER = createVector(110, Math.max(140, height-170));
  if(state.level === 1)      L1.onResize();
  else if(state.level === 2) L2.onResize();
  else                       L3.onResize();
}

// ===== Draw loop =====
function draw(dt) {
  pollGamepad();
  const a  = emaAlpha(dt, STICK_TAU_MS);
  const tx = state.joyVec ? state.joyVec.x : 0;
  const ty = state.joyVec ? state.joyVec.y : 0;
  state.smJoy.x += (tx - state.smJoy.x) * a;
  state.smJoy.y += (ty - state.smJoy.y) * a;
  background('#0e0f12'); drawGrid();
  if(state.level === 1)      L1.run(dt);
  else if(state.level === 2) L2.run(dt);
  else                       L3.run(dt);
  drawJoystick();
}

// ===== Boot =====
function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  state.center    = createVector(width/2, height/2);
  state.JOY_CENTER = createVector(110, Math.max(140, height-170));

  // Give level3 a reference to the global restart to break the circular dep
  L3.init({ restart });

  setupUI({
    setLevel,
    setRoll,
    restart,
    onSpinChange: (s) => {
      if(state.level === 2) L2.setSpinPeriod(s * 1000);
      else if(state.level === 3) L3.setSpinPeriod(s * 1000);
      updateTempoTag(L2.getSpinPeriod(), L3.getSpinPeriod());
    },
    onL1DiffChange:  (d, diffTag) => L1.applyDifficulty(d, diffTag),
    onL1SpinSlider:  (val, label) => L1.applySpinSlider(val, label),
  });

  attachCanvasJoystickHandlers();
  window.addEventListener('resize', windowResized);

  setRoll(+1);
  setLevel(1); // calls restart() + showGoal() inside

  state.lastFrameT = millis();
  (function loop() {
    const t  = millis();
    const dt = Math.max(1, t - state.lastFrameT);
    state.lastFrameT = t;
    draw(dt);
    requestAnimationFrame(loop);
  })();
}

setup();
