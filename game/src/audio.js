// audio.js — WebAudio sounds made from oscillators, no audio files:
// a sparkle when loot is bagged, a harsh blip when a laser breaks, a
// siren when the alarm trips, a pleased little run for the getaway.
// The audio context wakes on the first key or click; screenshot mode
// never calls any of this.

let sharedCtx = null;

function audioCtx() {
  if (sharedCtx === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    sharedCtx = new AC();
  }
  if (sharedCtx.state === 'suspended') sharedCtx.resume();
  return sharedCtx;
}

/** One oscillator note, starting `delay` seconds from now. */
function note(freq, delay, length, wave, volume, glideTo) {
  const ctx = audioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  const end = start + length;
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.05);
}

/** Loot bagged: a quick golden sparkle. */
export function playGrab() {
  note(1318, 0, 0.09, 'sine', 0.1);
  note(1760, 0.05, 0.14, 'sine', 0.1);
}

/** A laser tripped: a harsh blip. */
export function playLaser() {
  note(196, 0, 0.16, 'square', 0.12, 147);
}

/** The alarm trips: two siren falls. */
export function playAlarm() {
  note(880, 0, 0.34, 'sawtooth', 0.09, 440);
  note(880, 0.36, 0.34, 'sawtooth', 0.09, 440);
}

/** The van reached with the prize: a pleased little run. */
export function playEscape() {
  note(659, 0, 0.11, 'triangle', 0.11);
  note(880, 0.08, 0.11, 'triangle', 0.11);
  note(1108, 0.16, 0.22, 'triangle', 0.12);
}
