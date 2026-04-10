// js/levels/level2/level2.js — Level 2: Match the Spin
// All L2-specific constants, state, and logic live here.
// Tweak values in this file without risk of affecting L1 or L3.

import { millis, random, degrees, noStroke, fill, circle } from '../../helpers.js';
import { state } from '../../state.js';
import { ARROW_TAU_MS, STICK_MIN_MAG } from '../../constants.js';
import { emaAlpha, angleLerp, mirrorY, fitTargetAtAngle } from '../../math.js';
import { drawSquareColored, drawArrowWorld, arrowColorFor } from '../../render.js';

// ===== L2 tuning =====
let L2_SPIN_PERIOD_MS = 1150;
export const L2_TOL_DEG = 10;
export const L2_HOLD_MS = 1500;
export const ROUND_MS   = 10000;

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
  l2StartMs = millis(); l2HoldMs = 0; l2ArrowActive = false;
  l2TargetAngle = random(-Math.PI, Math.PI);
  const fit = fitTargetAtAngle(l2TargetAngle, 260, 24); l2TargetR = fit.r;
  if(state._dom.aimTag) state._dom.aimTag.textContent = 'Aim \u2014';
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
  noStroke(); fill('#ffd166'); circle(tx, ty, 40);

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
    if(errDeg <= L2_TOL_DEG) l2HoldMs += dt; else l2HoldMs = 0;
  } else {
    l2HoldMs = 0; l2ArrowActive = false;
    if(state._dom.aimTag) state._dom.aimTag.textContent = 'Aim \u2014';
  }

  if(l2HoldMs >= L2_HOLD_MS || (t - l2StartMs > ROUND_MS)) {
    l2StartMs = millis(); l2HoldMs = 0;
    l2TargetAngle = random(-Math.PI, Math.PI);
    const fit = fitTargetAtAngle(l2TargetAngle, 260, 24); l2TargetR = fit.r;
  }
}
