// js/render.js — shared drawing functions used by all levels

import { ctx, width, height, stroke, noStroke, fill, noFill, strokeWeight, line, circle, arc, push, pop, translate, rotate, radians, Vector } from './helpers.js';
import { SQUARE_HALF, ARROW_LEN, JOY_BASE_R, JOY_KNOB_R, COL_UP, COL_RIGHT, COL_DOWN, COL_LEFT } from './constants.js';
import { state } from './state.js';
import { normPi } from './math.js';

export function drawGrid() {
  stroke('#282a30'); strokeWeight(1);
  for(let x = 0; x < width;  x += 40) line(x, 0, x, height);
  for(let y = 0; y < height; y += 40) line(0, y, width, y);
}

export function drawSquareColored(pos, angle) {
  const H  = SQUARE_HALF;
  const edgeW = 4;

  push(); translate(pos.x, pos.y); rotate(angle);

  // Subtle dark-grey fill so the box reads as solid against the grid
  noStroke();
  ctx.fillStyle = '#23252e';
  ctx.beginPath(); ctx.rect(-H, -H, H*2, H*2); ctx.fill();

  // Use filled edge strips instead of strokes to reduce alias shimmer while rotating.
  ctx.fillStyle = COL_UP;
  ctx.fillRect(-H, -H, H*2, edgeW);
  ctx.fillStyle = COL_LEFT;
  ctx.fillRect(H-edgeW, -H, edgeW, H*2);
  ctx.fillStyle = COL_DOWN;
  ctx.fillRect(-H, H-edgeW, H*2, edgeW);
  ctx.fillStyle = COL_RIGHT;
  ctx.fillRect(-H, -H, edgeW, H*2);

  // Orientation notch — short outward tick at the green (bottom) edge centre
  // Replaces the old center-to-tip line that visually "jutted through" the box
  ctx.fillStyle = '#53d769';
  ctx.beginPath();
  ctx.roundRect(-1.5, H-1, 3, 12, 1.5);
  ctx.fill();

  pop();
}

export function drawArrowWorld(origin, angle, color) {
  const shaftLen = ARROW_LEN - 14;
  const shaftW   = 6;
  push(); translate(origin.x, origin.y); rotate(angle); noStroke();
  // Use filled geometry instead of strokes for smoother rotational rendering.
  ctx.fillStyle = color;
  ctx.fillRect(0, -shaftW/2, shaftLen, shaftW);
  ctx.beginPath();
  ctx.moveTo(ARROW_LEN, 0);
  ctx.lineTo(shaftLen, -8);
  ctx.lineTo(shaftLen, 8);
  ctx.closePath();
  ctx.fill();
  pop();
}

export function drawJoystick() {
  const cx = state.JOY_CENTER.x, cy = state.JOY_CENTER.y, r = JOY_BASE_R;
  noFill(); strokeWeight(10);
  stroke(COL_RIGHT); arc(cx, cy, r*2, r*2, radians(-45),  radians(45));   // right (blue)
  stroke(COL_UP);    arc(cx, cy, r*2, r*2, radians(45),   radians(135));  // up    (red)
  stroke(COL_LEFT);  arc(cx, cy, r*2, r*2, radians(135),  radians(225));  // left  (yellow)
  stroke(COL_DOWN);  arc(cx, cy, r*2, r*2, radians(225),  radians(315));  // down  (green)
  noFill(); stroke('#2d2d2d'); strokeWeight(2); circle(cx, cy, (r-22)*2);
  stroke('#373737'); line(cx-r+10, cy, cx+r-10, cy); line(cx, cy-r+10, cx, cy+r-10);
  const knob = state.joyVec ? Vector.add(state.JOY_CENTER, state.joyVec) : state.JOY_CENTER.copy();
  fill('#1e2127'); stroke('#4c8dff'); strokeWeight(3); circle(knob.x, knob.y, JOY_KNOB_R*2);
}

// Returns the display color for an arrow based on which face of the square it points toward.
export function arrowColorFor(thWorld, spin) {
  const rel = normPi(thWorld - spin);
  if(rel >  -Math.PI/4 && rel <=  Math.PI/4)  return COL_LEFT;  // right (yellow)
  if(rel >   Math.PI/4 && rel <=  3*Math.PI/4) return COL_DOWN;  // bottom (green)
  if(rel <= -Math.PI/4 && rel >  -3*Math.PI/4) return COL_UP;    // top   (red)
  return COL_RIGHT;                                               // left  (blue)
}
