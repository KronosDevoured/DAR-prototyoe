// js/levels/level1/level1.js — Level 1: Quick Aim
// All L1-specific constants, state, and logic live here.
// Tweak values in this file without risk of affecting L2 or L3.

import { millis, random, noStroke, fill, circle, stroke, strokeWeight, line } from '../../helpers.js';
import { state } from '../../state.js';
import { mirrorY, fitTargetAtAngle } from '../../math.js';
import { drawSquareColored, drawArrowWorld, arrowColorFor } from '../../render.js';
import { updateScore } from '../../ui.js';

// ===== L1 tuning =====
export let L1_TOL_DEG      = 10;
export let L1_TARGET_RADIUS = 22;
export let HOLD_TO_ARC_MS  = 100;
export const TARGET_DIST   = 220;

// ===== L1 private state =====
let L1_SPIN_PERIOD_MS = 0;
let l1StartMs         = 0;

// ===== Spin angle =====
export function l1CurrentSpinAngle() {
  if(L1_SPIN_PERIOD_MS <= 0) return Math.PI; // green-up (stationary)
  const dir = (state.airRoll > 0) ? +1 : -1;
  return Math.PI + dir * ((millis() - l1StartMs) * (2*Math.PI / L1_SPIN_PERIOD_MS));
}

// ===== Target spawning =====
export function spawnTarget() {
  const angle = random(-Math.PI, Math.PI);
  const fit   = fitTargetAtAngle(angle, TARGET_DIST, L1_TARGET_RADIUS + 8);
  state.target = { angle, x: fit.x, y: fit.y };
}

// ===== Slider callbacks (called via ui.js → main.js callbacks) =====
export function applyDifficulty(d, diffTag) {
  const tol = 14 - (d-1)*2;
  const rad = 28 - (d-1)*2.5;
  const win = [0, 160, 130, 100, 85, 70][d];
  L1_TOL_DEG = tol; L1_TARGET_RADIUS = Math.round(rad); HOLD_TO_ARC_MS = win;
  diffTag.textContent = `Tol ${tol}° • Radius ${Math.round(rad)} • Window ${win}ms`;
  if(state.level === 1 && state.target) {
    const fit = fitTargetAtAngle(state.target.angle, TARGET_DIST, L1_TARGET_RADIUS + 8);
    state.target.x = fit.x; state.target.y = fit.y;
  }
}

export function applySpinSlider(val, label) {
  if(val === 0) {
    label.textContent = 'Spin: 0 (stationary)'; L1_SPIN_PERIOD_MS = 0;
  } else {
    const s = 3.0 - (2.5 * val);
    label.textContent = `Spin: ${s.toFixed(2)} s/rot`; L1_SPIN_PERIOD_MS = s * 1000; l1StartMs = millis();
  }
}

// ===== Resize =====
export function onResize() {
  if(state.target) {
    const fit = fitTargetAtAngle(state.target.angle, TARGET_DIST, L1_TARGET_RADIUS + 8);
    state.target.x = fit.x; state.target.y = fit.y;
  }
}

// ===== Restart =====
export function restart() {
  state.scoreHits = 0; state.scoreTotal = 0; state.target = null;
  spawnTarget(); l1StartMs = millis();
  updateScore();
}

// ===== Run (called every frame) =====
export function run(dt) {
  const spin = l1CurrentSpinAngle();
  drawSquareColored(state.center, spin);

  if(state.target) {
    noStroke(); fill('#ffd166'); circle(state.target.x, state.target.y, L1_TARGET_RADIUS*2);
    stroke('#5a5a5a'); strokeWeight(2); line(state.center.x, state.center.y, state.target.x, state.target.y);
  }

  if((state.joyActive || state.gpActive) && state.joyVec) {
    const raw    = Math.atan2(state.invertUD ? state.smJoy.y : -state.smJoy.y, state.smJoy.x);
    const thWorld = spin + mirrorY(raw);
    drawArrowWorld(state.center, thWorld, arrowColorFor(thWorld, spin));
  }
}
