// js/gamepad.js — Gamepad API polling
// Supports PS4/PS5 DualShock/DualSense, Xbox One/Series, and generic controllers.
// Uses the W3C standard mapping: axes[0]=LX, axes[1]=LY.

import { createVector } from './helpers.js';
import { JOY_BASE_R } from './constants.js';
import { state } from './state.js';

const GP_DEAD = 0.10; // dead zone radius (0..1)

export function pollGamepad() {
  if(state.joyActive) { state.gpActive = false; return; } // touch input takes priority

  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = null;
  for(let i = 0; i < pads.length; i++) { if(pads[i] && pads[i].connected) { gp = pads[i]; break; } }

  if(!gp) {
    if(state.gpActive) { state.gpActive = false; state.joyVec = null; }
    return;
  }

  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  const m  = Math.hypot(ax, ay);

  if(m < GP_DEAD) {
    if(state.gpActive) { state.gpActive = false; state.joyVec = null; }
    return;
  }

  // Rescale [dead..1] → [0..1] then map to joystick pixel radius
  const norm = Math.min((m - GP_DEAD) / (1 - GP_DEAD), 1);
  state.joyVec  = createVector((ax/m)*norm*JOY_BASE_R, (ay/m)*norm*JOY_BASE_R);
  state.gpActive = true;
}
