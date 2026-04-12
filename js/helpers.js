// js/helpers.js — canvas API wrappers, Vector class, and utility functions

export let canvas, ctx, width, height;

let _renderScale = 1;
const MAX_INTERNAL_PIXELS = 2600000; // ~2.6 MP target for smoother performance on high-res displays
const MIN_RENDER_SCALE = 0.65;

function computeRenderScale(w, h) {
  const dynamic = Math.min(1, Math.sqrt(MAX_INTERNAL_PIXELS / Math.max(1, w*h)));
  return Math.max(MIN_RENDER_SCALE, dynamic);
}

function applyCanvasSizing(w, h) {
  _renderScale = computeRenderScale(w, h);
  canvas.width = Math.max(1, Math.round(w * _renderScale));
  canvas.height = Math.max(1, Math.round(h * _renderScale));
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  width = w;
  height = h;
  // Keep drawing API in CSS-pixel space; scaling happens in the backing canvas only.
  ctx.setTransform(_renderScale, 0, 0, _renderScale, 0, 0);
}

const _state = { strokeStyle: '#fff', fillStyle: '#fff', lineWidth: 1, doStroke: true, doFill: true };
function _apply() { ctx.strokeStyle = _state.strokeStyle; ctx.fillStyle = _state.fillStyle; ctx.lineWidth = _state.lineWidth; }

export function createCanvas(w, h) {
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  canvas.style.touchAction = 'none';
  document.body.appendChild(canvas);
  applyCanvasSizing(w, h);
  return { elt: canvas };
}
export function resizeCanvas(w, h) { applyCanvasSizing(w, h); }
export function background(c) {
  ctx.save();
  ctx.setTransform(_renderScale, 0, 0, _renderScale, 0, 0);
  ctx.fillStyle = c;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function stroke(c)      { _state.doStroke = true;  _state.strokeStyle = c; }
export function noStroke()     { _state.doStroke = false; }
export function fill(c)        { _state.doFill   = true;  _state.fillStyle   = c; }
export function noFill()       { _state.doFill   = false; }
export function strokeWeight(w){ _state.lineWidth = w; }

export function line(x1,y1,x2,y2) { _apply(); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); if(_state.doStroke) ctx.stroke(); }
export function circle(x,y,d)      { _apply(); ctx.beginPath(); ctx.arc(x,y,d/2,0,Math.PI*2); if(_state.doFill) ctx.fill(); if(_state.doStroke) ctx.stroke(); }
export function arc(x,y,w,h,a1,a2) { _apply(); ctx.beginPath(); ctx.ellipse(x,y,w/2,h/2,0,a1,a2); if(_state.doStroke) ctx.stroke(); }

export function push()           { ctx.save(); }
export function pop()            { ctx.restore(); }
export function translate(x,y)   { ctx.translate(x,y); }
export function rotate(a)        { ctx.rotate(a); }
export function radians(d)       { return d * Math.PI / 180; }
export function degrees(r)       { return r * 180 / Math.PI; }
export function millis()         { return performance.now(); }
export function random(a,b)      { if(a===undefined) return Math.random(); if(b===undefined) return Math.random()*a; return a+Math.random()*(b-a); }
export function dist(x1,y1,x2,y2){ return Math.hypot(x2-x1, y2-y1); }

export class Vector {
  constructor(x=0, y=0) { this.x=x; this.y=y; }
  copy()    { return new Vector(this.x, this.y); }
  mag()     { return Math.hypot(this.x, this.y); }
  setMag(m) { const c=this.mag(); if(c>0){this.x*=m/c; this.y*=m/c;} return this; }
  mult(s)   { this.x*=s; this.y*=s; return this; }
  static add(a,b) { return new Vector(a.x+b.x, a.y+b.y); }
}
export function createVector(x,y) { return new Vector(x,y); }
