// js/levels/level2/level2.js — Level 2: Match the Spin
// All L2-specific constants, state, and logic live here.
// Tweak values in this file without risk of affecting L1 or L3.

import { millis, random, degrees, noStroke, fill, circle } from '../../helpers.js';
import { state } from '../../state.js';
import { ARROW_TAU_MS, STICK_MIN_MAG } from '../../constants.js';
import { emaAlpha, angleLerp, mirrorY, fitTargetAtAngle } from '../../math.js';
import { drawSquareColored, drawArrowWorld, arrowColorFor } from '../../render.js';
import { updateScore } from '../../ui.js';

// ===== L2 tuning =====
let L2_SPIN_PERIOD_MS = 1150;
export const ROUND_MS  = 10000;

// Difficulty tables (d=1 easiest, d=5 hardest)
const _radTable  = [0, 80, 60, 40, 30, 20]; // px (target circle radius)
const _holdTable = [0, 1500, 3000, 5000, 6500, 8000]; // ms cumulative

let L2_TOL_DEG     = 0; // derived from radius in applyDifficulty
let L2_TARGET_R    = _radTable[3];
let L2_HOLD_MS     = _holdTable[3];

export function applyDifficulty(d, tag) {
  L2_TARGET_R = _radTable[d];
  L2_HOLD_MS  = _holdTable[d];
  L2_TOL_DEG  = Math.atan(L2_TARGET_R / 260) * (180 / Math.PI) + 6;
  if(tag) tag.textContent = `Tol ${L2_TOL_DEG.toFixed(1)}° • Radius ${L2_TARGET_R} • Hold ${(L2_HOLD_MS/1000).toFixed(1)}s`;
}

export function getSpinPeriod()   { return L2_SPIN_PERIOD_MS; }
export function setSpinPeriod(ms) { L2_SPIN_PERIOD_MS = ms; }

// ===== L2 private state =====
let l2StartMs     = 0;
let l2TargetAngle = 0;
let l2TargetR     = 260;
let l2HoldMs      = 0;
let l2ArrowActive = false;

// ===== Resize =====
export function onResize() {
  const fit = fitTargetAtAngle(l2TargetAngle, l2TargetR, 24);
  l2TargetR = fit.r;
}

// ===== Restart =====
export function restart() {
  state.scoreHits = 0; state.scoreTotal = 0;
  l2StartMs = millis(); l2HoldMs = 0; l2ArrowActive = false;
  l2TargetAngle = random(-Math.PI, Math.PI);
  const fit = fitTargetAtAngle(l2TargetAngle, 260, L2_TARGET_R + 4); l2TargetR = fit.r;
  if(state._dom.aimTag) state._dom.aimTag.textContent = 'Aim \u2014';
  updateScore();
}

// ===== Run (called every frame) =====
export function run(dt) {
  const t   = millis(), dir = (state.airRoll > 0) ? +1 : -1;
  const omega = dir * (Math.PI*2) / L2_SPIN_PERIOD_MS;
  const spin  = omega * (t - l2StartMs);
  state.currentSpinAngle = spin;

  const mag = Math.hypot(state.smJoy.x, state.smJoy.y), active = mag > STICK_MIN_MAG;
  drawSquareColored(state.center, spin);

  // Target dot
  const tx = state.center.x + Math.cos(l2TargetAngle)*l2TargetR;
  const ty = state.center.y + Math.sin(l2TargetAngle)*l2TargetR;
  noStroke(); fill('#ffd166'); circle(tx, ty, L2_TARGET_R*2);

  if(active) {
    const thStick  = Math.atan2(state.invertUD ? state.smJoy.y : -state.smJoy.y, state.smJoy.x);
    const thTarget = spin + mirrorY(thStick);
    if(!l2ArrowActive) { state.arrowAngleRender = thTarget; l2ArrowActive = true; }
    const a = emaAlpha(dt, ARROW_TAU_MS);
    state.arrowAngleRender = angleLerp(state.arrowAngleRender, thTarget, a);
    drawArrowWorld(state.center, state.arrowAngleRender, arrowColorFor(state.arrowAngleRender, spin));

    let err = state.arrowAngleRender - l2TargetAngle;
    while(err >  Math.PI) err -= 2*Math.PI;
    while(err < -Math.PI) err += 2*Math.PI;
    const errDeg = Math.abs(degrees(err));
    if(state._dom.aimTag) state._dom.aimTag.textContent = `Aim ${errDeg.toFixed(0)}\u00b0`;
    if(errDeg <= L2_TOL_DEG) l2HoldMs += dt;
    // hold time accumulates; no reset when arrow drifts out
  } else {
    l2ArrowActive = false;
    if(state._dom.aimTag) state._dom.aimTag.textContent = 'Aim \u2014';
  }

  if(l2HoldMs >= L2_HOLD_MS) {
    state.scoreHits++; state.scoreTotal++;
    updateScore({ text: 'Locked!', good: true });
    l2StartMs = millis(); l2HoldMs = 0;
    l2TargetAngle = random(-Math.PI, Math.PI);
    const fit = fitTargetAtAngle(l2TargetAngle, 260, L2_TARGET_R + 4); l2TargetR = fit.r;
  } else if(t - l2StartMs > ROUND_MS) {
    state.scoreTotal++;
    updateScore();
    l2StartMs = millis(); l2HoldMs = 0;
    l2TargetAngle = random(-Math.PI, Math.PI);
    const fit2 = fitTargetAtAngle(l2TargetAngle, 260, L2_TARGET_R + 4); l2TargetR = fit2.r;
  }
}
