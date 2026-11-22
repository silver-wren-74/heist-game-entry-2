// input.js — the controls: WASD and the arrow keys steer the thief,
// Enter starts and steps past the overlays, R restarts the room, and
// a click or tap does what Enter does. The held keys live on
// game.keys, which the simulation reads every step.

const DIRECTIONS = [
  ['ArrowLeft', 'left'],
  ['KeyA', 'left'],
  ['ArrowRight', 'right'],
  ['KeyD', 'right'],
  ['ArrowUp', 'up'],
  ['KeyW', 'up'],
  ['ArrowDown', 'down'],
  ['KeyS', 'down'],
];

const KEY_FOR_CODE = Object.fromEntries(DIRECTIONS);

export function attachControls(canvas, game) {
  window.addEventListener('keydown', (evt) => {
    const dir = KEY_FOR_CODE[evt.code];
    if (dir) {
      game.keys[dir] = true;
      evt.preventDefault();
      return;
    }
    if (evt.code === 'Enter' || evt.code === 'Space') {
      if (game.phase !== 'play') game.advance();
      evt.preventDefault();
    } else if (evt.code === 'KeyR') {
      if (game.phase === 'play' || game.phase === 'caught') {
        game.loadRoom(game.roomIndex);
        game.phase = 'play';
      }
    }
  });
  window.addEventListener('keyup', (evt) => {
    const dir = KEY_FOR_CODE[evt.code];
    if (dir) {
      game.keys[dir] = false;
      evt.preventDefault();
    }
  });
  canvas.addEventListener('pointerdown', () => {
    if (game.phase !== 'play') game.advance();
  });
}
