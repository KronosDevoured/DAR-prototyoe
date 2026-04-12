// js/render.js — shared drawing functions used by all levels

import { ctx, width, height, stroke, noStroke, fill, noFill, strokeWeight, line, circle, arc, push, pop, translate, rotate, radians, Vector } from './helpers.js';
import { SQUARE_HALF, ARROW_LEN, JOY_BASE_R, JOY_KNOB_R, COL_UP, COL_RIGHT, COL_DOWN, COL_LEFT } from './constants.js';
import { state } from './state.js';
import { normPi } from './math.js';

let _boxSprite = null;
const _arrowSprites = new Map();

function getBoxSprite() {
  if(_boxSprite) return _boxSprite;
  const H = SQUARE_HALF;
  const edgeW = 4;
  const pad = 12;
  const size = H * 2 + pad * 2;
  const cx = size / 2;
  const cy = size / 2;
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const sctx = sprite.getContext('2d');

  sctx.fillStyle = '#23252e';
  sctx.fillRect(cx - H, cy - H, H * 2, H * 2);

  sctx.fillStyle = COL_UP;
  sctx.fillRect(cx - H, cy - H, H * 2, edgeW);
  sctx.fillStyle = COL_LEFT;
  sctx.fillRect(cx + H - edgeW, cy - H, edgeW, H * 2);
  sctx.fillStyle = COL_DOWN;
  sctx.fillRect(cx - H, cy + H - edgeW, H * 2, edgeW);
  sctx.fillStyle = COL_RIGHT;
  sctx.fillRect(cx - H, cy - H, edgeW, H * 2);

  sctx.fillStyle = '#53d769';
  sctx.fillRect(Math.round(cx - 1.5), cy + H - 1, 3, 12);

  _boxSprite = { canvas: sprite, size };
  return _boxSprite;
}

function getArrowSprite(color) {
  const cached = _arrowSprites.get(color);
  if(cached) return cached;

  const shaftLen = ARROW_LEN - 14;
  const shaftW = 6;
  const padX = 2;
  const padY = 10;
  const width = ARROW_LEN + padX * 2;
  const height = padY * 2 + 16;
  const midY = height / 2;
  const sprite = document.createElement('canvas');
  sprite.width = width;
  sprite.height = height;
  const sctx = sprite.getContext('2d');

  sctx.fillStyle = color;
  sctx.fillRect(padX, midY - shaftW / 2, shaftLen, shaftW);
  sctx.beginPath();
  sctx.moveTo(padX + ARROW_LEN, midY);
  sctx.lineTo(padX + shaftLen, midY - 8);
  sctx.lineTo(padX + shaftLen, midY + 8);
  sctx.closePath();
  sctx.fill();

  const result = { canvas: sprite, width, height, padX, midY };
  _arrowSprites.set(color, result);
  return result;
}

export function drawGrid() {
  stroke('#282a30'); strokeWeight(1);
  for(let x = 0; x < width;  x += 40) line(x, 0, x, height);
  for(let y = 0; y < height; y += 40) line(0, y, width, y);
}

export function drawSquareColored(pos, angle) {
  const sprite = getBoxSprite();
  push(); translate(pos.x, pos.y); rotate(angle);
  ctx.drawImage(sprite.canvas, -sprite.size / 2, -sprite.size / 2);
  pop();
}

export function drawArrowWorld(origin, angle, color) {
  const sprite = getArrowSprite(color);
  push(); translate(origin.x, origin.y); rotate(angle); noStroke();
  ctx.drawImage(sprite.canvas, -sprite.padX, -sprite.midY);
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
