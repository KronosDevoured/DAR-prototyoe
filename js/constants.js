// js/constants.js — shared immutable game constants

export const SQUARE_HALF    = 24;
export const CLEARANCE      = 4;
export const ARROW_LEN      = 110;

export const JOY_BASE_R     = 88;
export const JOY_KNOB_R     = 28;
export const JOY_LONGPRESS_MS = 1200;

export const STICK_TAU_MS   = 38;
export const ARROW_TAU_MS   = 55;
export const STICK_MIN_MAG  = 8;

// Color names reflect the INPUT DIRECTION on the joystick arc, not the on-screen square edge.
// e.g. COL_LEFT (yellow) lights the left joystick arc but paints the right side of the square.
export const COL_UP    = '#ff5c5c';
export const COL_RIGHT = '#4c8dff';
export const COL_DOWN  = '#53d769';
export const COL_LEFT  = '#ffd166';

export const GOAL_MS = 3000; // auto-hide delay for auto-shown goal hints (ms)
