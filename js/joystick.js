// js/joystick.js — on-screen touch joystick input handling

import { canvas, createVector } from './helpers.js';
import { JOY_BASE_R, JOY_LONGPRESS_MS } from './constants.js';
import { state } from './state.js';

export function inJoyLoose(x, y) {
  const dx = x - state.JOY_CENTER.x, dy = y - state.JOY_CENTER.y;
  const r2 = dx*dx + dy*dy, loose = JOY_BASE_R + 28;
  return (r2 <= loose*loose) || (Math.abs(dx) <= JOY_BASE_R && Math.abs(dy) <= JOY_BASE_R+40);
}

export function vecFromJoyPx(x, y) {
  let dx = x - state.JOY_CENTER.x, dy = y - state.JOY_CENTER.y;
  const m = Math.hypot(dx, dy);
  if(m > JOY_BASE_R) { const k = JOY_BASE_R / (m || 1); dx *= k; dy *= k; }
  return createVector(dx, dy);
}

export function attachCanvasJoystickHandlers() {
  let activeId = null, pressT = 0;

  canvas.addEventListener('pointerdown', e => {
    pressT = performance.now();
    try { e.target.setPointerCapture(e.pointerId); } catch(_) {}
    if(inJoyLoose(e.clientX, e.clientY)) {
      activeId = e.pointerId; state.joyActive = true; state.joyVec = vecFromJoyPx(e.clientX, e.clientY);
    } else {
      activeId = e.pointerId; state.relocating = true;
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('pointermove', e => {
    if(activeId !== e.pointerId) return;
    if(state.relocating) {
      if(performance.now() - pressT >= JOY_LONGPRESS_MS) {
        state.JOY_CENTER = createVector(e.clientX, e.clientY);
        state.relocating = false;
      }
    } else if(state.joyActive) {
      state.joyVec = vecFromJoyPx(e.clientX, e.clientY);
    }
    e.preventDefault();
  }, { passive: false });

  function endPtr(e) {
    if(activeId !== e.pointerId) return;
    try { canvas.releasePointerCapture(e.pointerId); } catch(_) {}
    if(state.joyActive) { state.joyActive = false; state.joyVec = null; }
    state.relocating = false; activeId = null; e.preventDefault();
  }
  canvas.addEventListener('pointerup',     endPtr, { passive: false });
  canvas.addEventListener('pointercancel', endPtr, { passive: false });
}
