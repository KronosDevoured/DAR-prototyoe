// js/math.js — math helpers and shared geometry utilities

import { width, height } from './helpers.js';
import { state } from './state.js';

export function emaAlpha(dt, tau) { return 1 - Math.exp(-dt / Math.max(1, tau)); }

export function angleLerp(cur, tgt, a) {
  let d = tgt - cur;
  while(d >  Math.PI) d -= 2*Math.PI;
  while(d < -Math.PI) d += 2*Math.PI;
  return cur + d * a;
}

export function normPi(a) {
  while(a >  Math.PI) a -= 2*Math.PI;
  while(a < -Math.PI) a += 2*Math.PI;
  return a;
}

// Maps a screen-space angle to a square-relative angle (flips the Y axis).
export function mirrorY(a) { return Math.PI - a; }

// Returns a point on the given radial that fits within screen bounds with `margin` padding.
export function fitTargetAtAngle(angle, desiredR, margin) {
  const cx = state.center.x, cy = state.center.y;
  const c = Math.cos(angle), s = Math.sin(angle);
  const cand = [];
  if(Math.abs(c) > 1e-6) {
    const rL = (margin - cx) / c,  rR = (width  - margin - cx) / c;
    if(rL > 0) cand.push(rL);
    if(rR > 0) cand.push(rR);
  }
  if(Math.abs(s) > 1e-6) {
    const rT = (margin - cy) / s,  rB = (height - margin - cy) / s;
    if(rT > 0) cand.push(rT);
    if(rB > 0) cand.push(rB);
  }
  const valid = cand.filter(Number.isFinite);
  const maxR  = valid.length ? Math.min(...valid) : desiredR;
  const rUsed = Math.max(0, Math.min(desiredR, maxR));
  return { r: rUsed, x: cx + rUsed*c, y: cy + rUsed*s };
}
