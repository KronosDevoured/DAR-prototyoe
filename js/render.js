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
  push(); translate(pos.x, pos.y); rotate(angle); noFill(); strokeWeight(4);
  stroke(COL_UP);    line(-SQUARE_HALF,-SQUARE_HALF,  SQUARE_HALF,-SQUARE_HALF); // top    (red)
  stroke(COL_LEFT);  line( SQUARE_HALF,-SQUARE_HALF,  SQUARE_HALF, SQUARE_HALF); // right  (yellow)
  stroke(COL_DOWN);  line( SQUARE_HALF, SQUARE_HALF, -SQUARE_HALF, SQUARE_HALF); // bottom (green)
  stroke(COL_RIGHT); line(-SQUARE_HALF, SQUARE_HALF, -SQUARE_HALF,-SQUARE_HALF); // left   (blue)
  stroke('#53d769'); strokeWeight(4); line(0, 0, 0, SQUARE_HALF+16);             // position indicator
  pop();
}

export function drawArrowWorld(origin, angle, color) {
  const ax = origin.x + Math.cos(angle)*ARROW_LEN;
  const ay = origin.y + Math.sin(angle)*ARROW_LEN;
  stroke(color); strokeWeight(6); line(origin.x, origin.y, ax, ay);
  push(); translate(ax, ay); rotate(angle); fill(color); noStroke();
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-14,-8); ctx.lineTo(-14,8); ctx.closePath(); ctx.fill();
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
