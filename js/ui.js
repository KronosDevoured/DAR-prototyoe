// js/ui.js — DOM chrome: hamburger, sliders, goal panel, score display
// Receives all level/restart hooks via a callbacks object from main.js to avoid circular deps.

import { state } from './state.js';

// ===== Goal panel =====
export let goalVisible = false;

export function goalTextFor(lv) {
  if(lv === 1) return { title: 'Level 1 — Quick Aim', text: 'A target spawns around the square. Flick the joystick toward it quickly and accurately. Only your initial flick counts; holding too long is a miss. Difficulty adjusts tolerance, target size, and how long that initial input window lasts.' };
  if(lv === 2) return { title: 'Level 2 — Match the Spin', text: 'The square spins. Use the joystick to aim your arrow at the yellow target. Hold on target long enough to lock it. The spin changes your aim — counter the rotation.' };
  return { title: 'Level 3 — Navigate the Course', text: 'Push the joystick to set a heading relative to the spinning square. Avoid obstacles and reach the green goal before you run out of lives.' };
}

export function showGoal() {
  const panel = document.getElementById('goalPanel');
  const { title, text } = goalTextFor(state.level);
  document.getElementById('goalTitle').textContent = title;
  document.getElementById('goalText').textContent  = text;
  state._goalPrevFocus = document.activeElement;
  panel.classList.remove('hidden');
  goalVisible = true;
  if(state._dom.goalClose) state._dom.goalClose.focus();
}

export function hideGoal() {
  document.getElementById('goalPanel').classList.add('hidden');
  goalVisible = false;
  if(state._goalPrevFocus && typeof state._goalPrevFocus.focus === 'function') state._goalPrevFocus.focus();
  state._goalPrevFocus = null;
}

export function toggleGoal() { if(goalVisible) hideGoal(); else showGoal(); }

// ===== Score / result =====
export function updateScore(msg) {
  const el = document.getElementById('score');
  if(el) el.textContent = `Score ${state.scoreHits} / ${state.scoreTotal}`;
  const r = document.getElementById('result'); if(!r) return;
  if(!msg) { r.style.display = 'none'; return; }
  r.textContent = msg.text; r.style.display = 'inline-block'; r.className = 'tag ' + (msg.good ? 'good' : 'bad');
}

// ===== Tempo HUD tag (L2/L3) =====
export function updateTempoTag(l2PeriodMs, l3PeriodMs) {
  const tempo = document.getElementById('tempoTag'); if(!tempo) return;
  const s = (state.level === 2 ? l2PeriodMs : l3PeriodMs) / 1000;
  tempo.textContent = `Tempo ${s.toFixed(2)} s/rot`;
}

// ===== Utility =====
export function bind(id, fn) {
  const el = document.getElementById(id);
  el.addEventListener('click', e => { e.stopPropagation(); fn(); });
  return el;
}

export function setChromeShown(show) {
  const menuBtn = document.getElementById('menuBtn');
  menuBtn.classList.toggle('active', !show);
  document.getElementById('ui').classList.toggle('hidden', !show);
  document.getElementById('hud').classList.toggle('hidden', !show);
  const l1spin = document.getElementById('l1SpinContainer');
  if(l1spin) l1spin.style.display = (state.level === 1 && show) ? 'flex' : 'none';
}

// ===== Main setup entry point =====
// callbacks: { setLevel, setRoll, restart, onSpinChange, onL1DiffChange, onL1SpinSlider }
export function setupUI(callbacks) {
  // Cache hot DOM refs
  state._dom.aimTag    = document.getElementById('aimTag');
  state._dom.speedTag  = document.getElementById('speedTag');
  state._dom.distTag   = document.getElementById('distTag');
  state._dom.livesTag  = document.getElementById('livesTag');
  state._dom.goalClose = document.getElementById('goalClose');
  state._dom.gamepadTag = document.getElementById('gamepadTag');

  // Hamburger toggle
  let chromeShown = true;
  document.getElementById('menuBtn').addEventListener('click', e => {
    e.stopPropagation(); chromeShown = !chromeShown; setChromeShown(chromeShown);
  });

  // Level / roll / util buttons
  bind('level1',  () => callbacks.setLevel(1));
  bind('level2',  () => callbacks.setLevel(2));
  bind('level3',  () => callbacks.setLevel(3));
  bind('rollL',   () => callbacks.setRoll(-1));
  bind('rollR',   () => callbacks.setRoll(+1));
  bind('clear',   () => {});
  bind('restart', () => callbacks.restart());

  // Swap U/D
  const swapBtn = document.getElementById('swapUD');
  swapBtn.addEventListener('click', e => {
    e.stopPropagation(); state.invertUD = !state.invertUD;
    swapBtn.classList.toggle('active', state.invertUD);
    swapBtn.textContent = state.invertUD ? 'Swap U/D: ON' : 'Swap U/D';
  });

  // L2/L3 spin slider
  const spinRange      = document.getElementById('spinRange');
  const spinValue      = document.getElementById('spinValue');
  const spinLabelPrefix = document.getElementById('spinLabelPrefix');
  if(spinRange) {
    spinRange.value = '1.15'; spinValue.textContent = '1.15 s/rot'; spinLabelPrefix.textContent = 'L2 Spin';
    spinRange.addEventListener('input', () => {
      const s = Math.max(1.15, Math.min(3.0, parseFloat(spinRange.value)));
      callbacks.onSpinChange(s);
      spinValue.textContent = s.toFixed(2) + ' s/rot';
    });
  }

  // L1 difficulty slider
  const diffRange = document.getElementById('diffRange');
  const diffTag   = document.getElementById('diffTag');
  if(diffRange) {
    const applyDiff = () => callbacks.onL1DiffChange(parseInt(diffRange.value, 10), diffTag);
    diffRange.addEventListener('input', applyDiff); applyDiff();
  }

  // L1 vertical spin slider
  const l1Slider = document.getElementById('l1SpinSlider');
  const l1Label  = document.getElementById('l1SpinLabel');
  if(l1Slider && l1Label) {
    const applyL1Spin = val => callbacks.onL1SpinSlider(val, l1Label);
    l1Slider.addEventListener('input', () => applyL1Spin(parseFloat(l1Slider.value) || 0));
    applyL1Spin(parseFloat(l1Slider.value) || 0);
  }

  // Gamepad connection events
  window.addEventListener('gamepadconnected', () => {
    if(state._dom.gamepadTag) state._dom.gamepadTag.classList.remove('hidden');
  });
  window.addEventListener('gamepaddisconnected', () => {
    state.gpActive = false;
    const remaining = navigator.getGamepads ? [...navigator.getGamepads()].filter(g => g && g.connected) : [];
    if(!remaining.length && state._dom.gamepadTag) state._dom.gamepadTag.classList.add('hidden');
  });

  // Goal panel close / backdrop / hint button
  document.getElementById('goalClose').addEventListener('click',  e => { e.stopPropagation(); hideGoal(); });
  document.getElementById('goalPanel').addEventListener('click',  e => { if(e.target.id === 'goalPanel') hideGoal(); });
  document.getElementById('hintBtn').addEventListener('click',    e => { e.stopPropagation(); toggleGoal(); });
}
