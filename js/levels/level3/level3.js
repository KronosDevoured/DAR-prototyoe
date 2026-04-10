// js/levels/level3/level3.js — Level 3: Navigate the Course
// All L3-specific constants, state, and logic live here.
// Tweak values in this file without risk of affecting L1 or L2.

import { millis, dist, createVector, noStroke, fill, noFill, circle, stroke, strokeWeight, width, height } from '../../helpers.js';
import { state } from '../../state.js';
import { SQUARE_HALF, ARROW_TAU_MS, STICK_MIN_MAG } from '../../constants.js';
import { emaAlpha, angleLerp, mirrorY } from '../../math.js';
import { drawSquareColored, drawArrowWorld, arrowColorFor } from '../../render.js';
import { updateScore } from '../../ui.js';

// ===== L3 tuning =====
let L3_SPIN_PERIOD_MS = 1150;
export const L3_GOAL_R      = 32;
export const L3_LIVES_START = 3;
export const L3_OBS_COUNT   = 5;
export const L3_OBS_R_MIN   = 26;
export const L3_OBS_R_MAX   = 48;
export const L3_MARGIN      = 40;
export const L3_MIN_GAP     = 140;
export let   L3_MAX_SPEED   = 220;
export let   L3_ACCEL       = 520;
export let   L3_DAMPING_S   = 1.6;

export function getSpinPeriod()   { return L3_SPIN_PERIOD_MS; }
export function setSpinPeriod(ms) { L3_SPIN_PERIOD_MS = ms; }

// ===== L3 private state =====
let l3Pos, l3Goal, l3Vel;
let l3Obstacles   = [];
let l3Lives       = L3_LIVES_START;
let l3Dist        = 0;
let l3ArrowActive = false;
let l3StartMs     = 0;

// Dirty-check cache to avoid redundant HUD DOM writes
const _hudCache = { speed: null, dist: null, lives: null };

// Callback to main's full restart (set via init to avoid circular deps)
let _globalRestart = null;
let _preserveScore = false;
let _freeplay      = false;
export function isFreeplay() { return _freeplay; }
export function setFreeplay(val) { _freeplay = val; }
export function init({ restart }) { _globalRestart = restart; }
function autoRestart() { _preserveScore = true; if(_globalRestart) { _globalRestart(); } else { restart(); } }

// ===== Course generation =====
function randRange(a, b) { return a + Math.random()*(b-a); }
function farEnough(x, y, list, r) {
  for(const it of list) { if(dist(x,y,it.x,it.y) - (r + it.r) < L3_MIN_GAP) return false; }
  return true;
}

export function clampCourseForScreen() {
  for(const o of l3Obstacles) {
    o.x = Math.max(L3_MARGIN+o.r, Math.min(width -L3_MARGIN-o.r, o.x));
    o.y = Math.max(L3_MARGIN+o.r, Math.min(height-L3_MARGIN-o.r, o.y));
  }
  if(l3Goal) {
    l3Goal.x = Math.max(L3_MARGIN+l3Goal.r, Math.min(width -L3_MARGIN-l3Goal.r, l3Goal.x));
    l3Goal.y = Math.max(L3_MARGIN+l3Goal.r, Math.min(height-L3_MARGIN-l3Goal.r, l3Goal.y));
  }
  if(l3Pos) {
    l3Pos.x = Math.max(SQUARE_HALF+4, Math.min(width -(SQUARE_HALF+4), l3Pos.x));
    l3Pos.y = Math.max(SQUARE_HALF+4, Math.min(height-(SQUARE_HALF+4), l3Pos.y));
  }
}

function generateCourse() {
  l3Goal = { x: width*.5, y: L3_MARGIN+70, r: L3_GOAL_R };
  l3Obstacles = [];
  let tries = 0;
  while(l3Obstacles.length < L3_OBS_COUNT && tries < 1000) {
    tries++;
    const r = randRange(L3_OBS_R_MIN, L3_OBS_R_MAX);
    const x = randRange(L3_MARGIN+r, width -L3_MARGIN-r);
    const y = randRange(L3_MARGIN+r+40, height-L3_MARGIN-r-120);
    if(dist(x,y,l3Pos.x,l3Pos.y) < (r+160)) continue;
    if(dist(x,y,l3Goal.x,l3Goal.y) < (r+160)) continue;
    if(!farEnough(x, y, l3Obstacles, r)) continue;
    l3Obstacles.push({ x, y, r });
  }
  clampCourseForScreen();
}

// ===== HUD =====
function updateL3Hud() {
  const sp = state._dom.speedTag;
  if(sp) { const cur = Math.round(l3Vel ? l3Vel.mag() : 0); if(_hudCache.speed !== cur) { sp.textContent = `Speed ${cur} px/s`; _hudCache.speed = cur; } }
  const dt = state._dom.distTag;
  if(dt) { const d = (l3Dist/100).toFixed(1); if(_hudCache.dist !== d) { dt.textContent = `Dist ${d} m`; _hudCache.dist = d; } }
  const lv = state._dom.livesTag;
  if(lv) { if(_hudCache.lives !== l3Lives) { lv.textContent = `Lives ${l3Lives}`; _hudCache.lives = l3Lives; } }
}

// ===== Crash / Win =====
function handleL3Crash() {
  l3Lives--;
  _hudCache.lives = null; updateL3Hud();
  const r = document.getElementById('result');
  if(r) { r.textContent = 'Crash!'; r.className = 'tag bad'; r.style.display = 'inline-block'; }
  if(l3Lives <= 0) {
    state.scoreTotal++;
    updateScore();
    setTimeout(() => { autoRestart(); }, 650);
  } else {
    setTimeout(() => {
      l3Pos = createVector(width*.5, height*.75); l3Vel = createVector(0,0);
      const r = document.getElementById('result'); if(r) r.style.display = 'none';
    }, 650);
  }
}

function handleL3Win() {
  state.scoreHits++; state.scoreTotal++;
  updateScore();
  const r = document.getElementById('result');
  if(r) { r.textContent = 'Goal!'; r.className = 'tag good'; r.style.display = 'inline-block'; }
  setTimeout(() => { autoRestart(); }, 800);
}

// ===== Resize =====
export function onResize() { clampCourseForScreen(); }

// ===== Restart =====
export function restart() {
  if(!_preserveScore) { state.scoreHits = 0; state.scoreTotal = 0; updateScore(); }
  _preserveScore = false;
  l3Dist = 0; l3Lives = L3_LIVES_START; l3ArrowActive = false;
  _hudCache.speed = null; _hudCache.dist = null; _hudCache.lives = null;
  l3Pos = createVector(width*.5, height*.75); l3Vel = createVector(0,0);
  l3StartMs = millis();
  generateCourse(); updateL3Hud();
}

// ===== Run (called every frame) =====
export function run(dt) {
  updateL3Hud();
  if(!l3Pos) { l3Pos = createVector(width*.5, height*.75); l3Vel = createVector(0,0); }

  const t = millis(), dir = (state.airRoll > 0) ? +1 : -1;
  const omega = (Math.PI*2) / L3_SPIN_PERIOD_MS * dir;
  const spin  = omega * (t - l3StartMs);
  state.currentSpinAngle = spin;

  let head = null;
  const mag = Math.hypot(state.smJoy.x, state.smJoy.y);
  if(mag > STICK_MIN_MAG) {
    const thStick = Math.atan2(state.invertUD ? state.smJoy.y : -state.smJoy.y, state.smJoy.x);
    head = spin + mirrorY(thStick);
    if(!l3ArrowActive) { state.arrowAngleRender = head; l3ArrowActive = true; }
    const a = emaAlpha(dt, ARROW_TAU_MS);
    state.arrowAngleRender = angleLerp(state.arrowAngleRender, head, a);
  } else { l3ArrowActive = false; }

  // Physics
  const dtSec = dt / 1000;
  if(head != null) {
    l3Vel.x += Math.cos(head) * L3_ACCEL * dtSec;
    l3Vel.y += Math.sin(head) * L3_ACCEL * dtSec;
    const sp = l3Vel.mag(); if(sp > L3_MAX_SPEED) l3Vel.mult(L3_MAX_SPEED / sp);
  } else {
    l3Vel.x = 0; l3Vel.y = 0;
  }
  l3Pos.x += l3Vel.x * dtSec; l3Pos.y += l3Vel.y * dtSec;
  l3Dist  += l3Vel.mag() * dtSec;
  clampCourseForScreen();

  // Draw
  if(!_freeplay) {
    noStroke(); fill('#7bd88f'); circle(l3Goal.x, l3Goal.y, l3Goal.r*2);
    noFill(); stroke('#ff9472'); strokeWeight(3);
    for(const o of l3Obstacles) circle(o.x, o.y, o.r*2);
  }
  drawSquareColored(l3Pos, spin);
  if(head != null) drawArrowWorld(l3Pos, state.arrowAngleRender, arrowColorFor(state.arrowAngleRender, spin));

  // Collisions (skipped in freeplay)
  if(!_freeplay) {
    for(const o of l3Obstacles) {
      if(dist(l3Pos.x, l3Pos.y, o.x, o.y) < (SQUARE_HALF+4+o.r)) { handleL3Crash(); return; }
    }
    if(dist(l3Pos.x, l3Pos.y, l3Goal.x, l3Goal.y) < (SQUARE_HALF+4+l3Goal.r)) { handleL3Win(); return; }
  }
}
