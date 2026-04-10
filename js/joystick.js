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
  let activeId = null, pressX = 0, pressY = 0, relocateTimer = null;

  function cancelRelocate() {
    if(relocateTimer) { clearTimeout(relocateTimer); relocateTimer = null; }
    state.relocating = false;
  }

  canvas.addEventListener('pointerdown', e => {
    try { e.target.setPointerCapture(e.pointerId); } catch(_) {}
    if(inJoyLoose(e.clientX, e.clientY)) {
      activeId = e.pointerId; state.joyActive = true; state.joyVec = vecFromJoyPx(e.clientX, e.clientY);
    } else {
      activeId = e.pointerId; pressX = e.clientX; pressY = e.clientY; state.relocating = true;
      relocateTimer = setTimeout(() => {
        if(state.relocating) {
          state.JOY_CENTER = createVector(pressX, pressY);
          state.relocating = false;
        }
        relocateTimer = null;
      }, JOY_LONGPRESS_MS);
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('pointermove', e => {
    if(activeId !== e.pointerId) return;
    if(state.joyActive) {
      state.joyVec = vecFromJoyPx(e.clientX, e.clientY);
    }
    e.preventDefault();
  }, { passive: false });

  function endPtr(e) {
    if(activeId !== e.pointerId) return;
    try { canvas.releasePointerCapture(e.pointerId); } catch(_) {}
    if(state.joyActive) { state.joyActive = false; state.joyVec = null; }
    cancelRelocate(); activeId = null; e.preventDefault();
  }
  canvas.addEventListener('pointerup',     endPtr, { passive: false });
  canvas.addEventListener('pointercancel', endPtr, { passive: false });
}
