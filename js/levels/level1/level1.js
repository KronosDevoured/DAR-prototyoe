// js/levels/level1/level1.js — Level 1: Quick Aim
// All L1-specific constants, state, and logic live here.
// Tweak values in this file without risk of affecting L2 or L3.

import { millis, random, degrees, noStroke, noFill, fill, circle, stroke, strokeWeight, line } from '../../helpers.js';
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
  // d=1 easiest → d=5 hardest
  // Easy end is ~3× more forgiving than the old maximum easy values
  const tolTable = [0, 42, 34, 24, 14,  6];
  const radTable = [0, 60, 44, 30, 22, 16];
  const winTable = [0, 480, 360, 240, 120, 60];
  const tol = tolTable[d];
  const rad = radTable[d];
  const win = winTable[d];
  L1_TOL_DEG = tol; L1_TARGET_RADIUS = rad; HOLD_TO_ARC_MS = win;
  diffTag.textContent = `Tol ${tol}° • Radius ${rad} • Window ${win}ms`;
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
  _prevJoyActive = false; _joyStartMs = 0; _lastAngle = null;
  _lastDotX = null; _lastDotY = null;
  _lastTargetX = null; _lastTargetY = null; _lastTargetR = null;
  spawnTarget(); l1StartMs = millis();
  updateScore();
}

// ===== Hit-detection state =====
let _prevJoyActive = false;
let _joyStartMs    = 0;
let _lastAngle     = null;
let _lastDotX      = null;
let _lastDotY      = null;
let _lastTargetX   = null;
let _lastTargetY   = null;
let _lastTargetR   = null;

// ===== Run (called every frame) =====
export function run(dt) {
  const spin = l1CurrentSpinAngle();
  drawSquareColored(state.center, spin);

  if(state.target) {
    noStroke(); fill('#ffd166'); circle(state.target.x, state.target.y, L1_TARGET_RADIUS*2);
    stroke('#5a5a5a'); strokeWeight(2); line(state.center.x, state.center.y, state.target.x, state.target.y);
  }

  // Last-attempt ghost: target outline + flick dot
  if(_lastTargetX !== null) {
    noFill(); stroke('rgba(255,209,102,0.4)'); strokeWeight(2);
    circle(_lastTargetX, _lastTargetY, _lastTargetR * 2);
  }
  if(_lastDotX !== null) {
    noStroke(); fill('rgba(255,255,255,0.55)');
    circle(_lastDotX, _lastDotY, 20);
  }

  const joyNow = state.joyActive || state.gpActive;

  // Track flick start
  if(joyNow && !_prevJoyActive) { _joyStartMs = millis(); _lastAngle = null; }

  if(joyNow && state.joyVec) {
    const raw    = Math.atan2(state.invertUD ? state.smJoy.y : -state.smJoy.y, state.smJoy.x);
    const thWorld = spin + mirrorY(raw);
    _lastAngle = thWorld;
    drawArrowWorld(state.center, thWorld, arrowColorFor(thWorld, spin));
  }

  // Flick released — evaluate
  if(!joyNow && _prevJoyActive && state.target) {
    const held = millis() - _joyStartMs;
    state.scoreTotal++;
    if(held <= HOLD_TO_ARC_MS && _lastAngle !== null) {
      // Store dot and ghost target
      _lastDotX = state.center.x + Math.cos(_lastAngle) * TARGET_DIST;
      _lastDotY = state.center.y + Math.sin(_lastAngle) * TARGET_DIST;
      _lastTargetX = state.target.x; _lastTargetY = state.target.y; _lastTargetR = L1_TARGET_RADIUS;
      let err = _lastAngle - state.target.angle;
      while(err >  Math.PI) err -= 2*Math.PI;
      while(err < -Math.PI) err += 2*Math.PI;
      if(Math.abs(degrees(err)) <= L1_TOL_DEG) {
        state.scoreHits++;
        updateScore({ text: 'Hit!', good: true });
      } else {
        updateScore({ text: 'Miss', good: false });
      }
    } else {
      _lastDotX = null; _lastDotY = null;
      _lastTargetX = null; _lastTargetY = null; _lastTargetR = null;
      updateScore({ text: 'Too slow', good: false });
    }
    spawnTarget();
  }

  _prevJoyActive = joyNow;
}
