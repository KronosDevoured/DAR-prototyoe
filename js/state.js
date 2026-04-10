// js/state.js — single shared mutable game state object
// All modules read/write properties on this object instead of using globals.

export const state = {
  // Input
  airRoll:    +1,
  invertUD:   false,
  joyActive:  false,
  joyVec:     null,
  relocating: false,
  gpActive:   false,
  smJoy:      { x: 0, y: 0 },

  // Render positions (set in main setup)
  center:     null,
  JOY_CENTER: null,

  // Arrow / spin tracking
  arrowAngleRender: 0,
  currentSpinAngle: 0,
  lastFrameT:       0,

  // App
  level: 1,

  // Cached DOM refs (populated in setupUI)
  _dom: {},
  _goalPrevFocus: null,

  // Score — written by level1, read by updateScore in ui
  scoreHits:  0,
  scoreTotal: 0,
  target:     null,
};
