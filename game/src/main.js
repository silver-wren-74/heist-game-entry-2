// main.js — the bootstrap: sizes the canvas, wires the controls, runs
// the frame loop and plays the sounds the game reports. In screenshot
// mode (?shot=…) a staged state is drawn and the simulation is held
// still, so the shot is the same on every render.

import { Game } from './game.js';
import { draw, VIEW_W, VIEW_H } from './render.js';
import { attachControls } from './input.js';
import { stageShot } from './shots.js';
import { playAlarm, playEscape, playGrab, playLaser } from './audio.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

const game = new Game();
attachControls(canvas, game);

const query = new URLSearchParams(window.location.search);
const staged = stageShot(game, query);

const status = document.getElementById('status');
const SOUND_FOR_EVENT = { grab: playGrab, laser: playLaser, alarm: playAlarm, escape: playEscape };
let previous = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  if (!staged) {
    game.tick(dt);
    for (const event of game.events) {
      const sound = SOUND_FOR_EVENT[event];
      if (sound) sound();
    }
    game.events.length = 0;
    status.textContent = game.phase === 'play'
      ? `${game.room.name}: alarm ${Math.floor(game.alarm)} percent, ${game.loots.filter((l) => !l.taken).length} pieces of loot left.`
      : game.notice;
  }
  draw(ctx, game, now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
