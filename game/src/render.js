// render.js — the heist from above: quiet marble floors and red
// carpets, the cases and counters, loot on its plinths with the prize
// ringed in gold, guard cones in warm amber and camera cones in cold
// blue, the laser lines, the thief with a sack that swells as it
// fills, the getaway van, and the header with its ALARM meter. All
// drawing is in field coordinates, shifted down past the header.

import { ROOMS, FIELD_W, FIELD_H } from './rooms.js';
import { makeRng } from './rng.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 92;

const FAMILY = 'system-ui, sans-serif';

/** Fill a polygon given as [x, y] points. */
function fillPoly(ctx, points, style) {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function setFont(ctx, weight, size) {
  ctx.font = `${weight} ${size}px ${FAMILY}`;
}

/** One watcher's cone, painted in the given colour. */
function fillCone(ctx, watcher, walls, bounds, style) {
  fillPoly(ctx, watcher.cone(walls, bounds), style);
}

function paintFloor(ctx) {
  // A marble checkerboard, kept quiet so the cones read clearly.
  const tile = 64;
  const cols = FIELD_W / tile;
  const rows = FIELD_H / tile;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 ? '#bcc5cd' : '#c7cfd6';
      ctx.fillRect(c * tile, r * tile, tile, tile);
    }
  }
  // The red carpet cross the guests are meant to walk.
  ctx.fillStyle = 'rgba(146, 42, 54, 0.5)';
  ctx.fillRect(0, FIELD_H / 2 - 34, FIELD_W, 68);
  ctx.fillRect(FIELD_W / 2 - 34, 0, 68, FIELD_H);
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, FIELD_H / 2 - 32, FIELD_W - 4, 64);
  ctx.strokeRect(FIELD_W / 2 - 32, 2, 64, FIELD_H - 4);
}

function paintWall(ctx, w, index) {
  if (w.kind === 'case') {
    ctx.fillStyle = '#5d4028';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(200, 228, 238, 0.9)';
    ctx.fillRect(w.x + 7, w.y + 7, w.w - 14, w.h - 14);
    ctx.fillStyle = ['#8e44ad', '#2471a3', '#b7950b'][index % 3];
    ctx.beginPath();
    ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#37414d';
    ctx.fillRect(w.x + w.w / 2 - 13, w.y + w.h - 16, 26, 5);
  } else if (w.kind === 'counter') {
    ctx.fillStyle = '#2e5d50';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(w.x, w.y + 6, w.w, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    for (let x = w.x + 18; x < w.x + w.w - 10; x += 36) {
      ctx.fillRect(x, w.y + 16, 20, w.h - 26);
    }
  } else if (w.kind === 'vault') {
    const cx = w.x + w.w / 2;
    const cy = w.y + w.h / 2;
    const dial = Math.min(40, w.h / 2 - 14);
    ctx.fillStyle = '#39424f';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.strokeRect(w.x + 6, w.y + 6, w.w - 12, w.h - 12);
    ctx.fillStyle = '#232a34';
    ctx.beginPath();
    ctx.arc(cx, cy, dial, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, dial, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // pillar
    ctx.fillStyle = '#98a2ad';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#7d8794';
    ctx.fillRect(w.x, w.y, w.w, 6);
    ctx.fillRect(w.x, w.y + w.h - 6, w.w, 6);
  }
}

function paintLoot(ctx, loot) {
  const { x, y } = loot;
  // The plinth the piece sits on; an empty plinth stays behind.
  ctx.fillStyle = loot.taken ? '#4c4438' : '#2f2a33';
  ctx.fillRect(x - 17, y + 8, 34, 12);
  if (loot.taken) return;
  if (loot.kind === 'gem') {
    fillPoly(ctx, [[x, y - 13], [x + 10, y - 2], [x, y + 10], [x - 10, y - 2]], '#39c2d7');
    fillPoly(ctx, [[x, y - 13], [x + 5, y - 2], [x - 5, y - 2]], 'rgba(255,255,255,0.65)');
  } else if (loot.kind === 'painting') {
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(x - 13, y - 12, 26, 20);
    ctx.fillStyle = '#7a4a7e';
    ctx.fillRect(x - 10, y - 9, 20, 14);
    ctx.fillStyle = '#e8b4b8';
    ctx.beginPath();
    ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (loot.kind === 'cash') {
    ctx.fillStyle = '#2e7d4f';
    ctx.fillRect(x - 12, y - 6, 24, 13);
    ctx.fillStyle = '#43aa6d';
    ctx.fillRect(x - 12, y - 11, 24, 6);
    ctx.fillStyle = '#d9f2e2';
    ctx.fillRect(x - 3, y - 4, 6, 6);
  } else if (loot.kind === 'ledger') {
    ctx.fillStyle = '#7a3b2e';
    ctx.fillRect(x - 11, y - 13, 22, 24);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(x - 11, y - 3, 22, 4);
  } else {
    // crown
    fillPoly(ctx, [
      [x - 13, y + 8], [x - 13, y - 8], [x - 6, y - 1], [x, y - 11],
      [x + 6, y - 1], [x + 13, y - 8], [x + 13, y + 8],
    ], '#f2c230');
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(x, y + 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintGuard(ctx, guard) {
  const fx = Math.cos(guard.angle);
  const fy = Math.sin(guard.angle);
  ctx.fillStyle = '#5d2a35';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#743847';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b1218';
  ctx.beginPath();
  ctx.arc(guard.x + fx * 7, guard.y + fy * 7, 6, 0, Math.PI * 2);
  ctx.fill();
  // The torch, a warm dot at the end of the guard's arm.
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath();
  ctx.arc(guard.x + fx * 17, guard.y + fy * 17, 4, 0, Math.PI * 2);
  ctx.fill();
  if (guard.seeing) {
    ctx.fillStyle = '#e03131';
    ctx.beginPath();
    ctx.arc(guard.x + 15, guard.y - 19, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    setFont(ctx, 800, 14);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', guard.x + 15, guard.y - 18);
  }
}

function paintCamera(ctx, camera) {
  ctx.fillStyle = '#20242c';
  ctx.fillRect(camera.x - 8, camera.y - 8, 16, 16);
  ctx.fillStyle = '#e03131';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 3.4, 0, Math.PI * 2);
  ctx.fill();
}

function paintThief(ctx, game) {
  const p = game.thief;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // The sack on the thief's back, swelling with every piece bagged.
  ctx.fillStyle = '#8a6d3b';
  ctx.beginPath();
  ctx.arc(-13, 6, 7 + game.bagged * 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Body in black, head and white eyes at the front.
  ctx.fillStyle = '#17181c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#23242a';
  ctx.beginPath();
  ctx.arc(8, 0, 6.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(9, -4.4, 5.4, 2.2);
  ctx.fillRect(9, 2.2, 5.4, 2.2);
  ctx.restore();
  // The grab progress ring around the loot being bagged.
  const busy = game.loots.find((l) => !l.taken && l.progress > 0);
  if (busy) {
    ctx.strokeStyle = 'rgba(20,20,30,0.5)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(busy.x, busy.y, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#f2c230';
    ctx.beginPath();
    ctx.arc(busy.x, busy.y, 24, -Math.PI / 2, -Math.PI / 2 + busy.progress * Math.PI * 2);
    ctx.stroke();
  }
}

function paintVan(ctx, exit, ready) {
  ctx.fillStyle = '#263238';
  ctx.beginPath();
  ctx.roundRect(exit.x, exit.y, exit.w, exit.h, 8);
  ctx.fill();
  ctx.fillStyle = '#9fc4d8';
  ctx.fillRect(exit.x + exit.w - 34, exit.y + 10, 22, exit.h - 20);
  ctx.fillStyle = ready ? '#39c26d' : '#e8b93c';
  ctx.fillRect(exit.x + 8, exit.y + 8, 10, exit.h - 16);
  ctx.fillStyle = '#ffffff';
  setFont(ctx, 700, 13);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VAN', exit.x + exit.w / 2 - 8, exit.y + exit.h / 2);
}

/** The ALARM meter in the header: the number the whole job hangs on. */
function paintAlarmMeter(ctx, game) {
  const alarm = game.alarm;
  ctx.fillStyle = '#ffffff';
  setFont(ctx, 700, 20);
  ctx.textAlign = 'right';
  ctx.fillText('ALARM', 1006, 33);
  ctx.fillStyle = '#2c2622';
  ctx.fillRect(1024, 18, 232, 28);
  ctx.fillStyle = alarm > 70 ? '#e03131' : alarm > 40 ? '#ff8f2e' : '#39c26d';
  ctx.fillRect(1027, 21, 226 * (alarm / 100), 22);
  ctx.fillStyle = '#ffffff';
  setFont(ctx, 800, 22);
  ctx.fillText(`${Math.floor(alarm)}%`, 1256, 68);
  ctx.fillStyle = '#b8a894';
  setFont(ctx, 500, 15);
  ctx.fillText('WASD or arrows to move · stand still by loot to bag it', 1256, 84);
}

function paintNotice(ctx, game) {
  if (!game.notice || game.phase !== 'play') return;
  setFont(ctx, 600, 19);
  const width = ctx.measureText(game.notice).width + 36;
  ctx.fillStyle = 'rgba(16, 12, 10, 0.85)';
  ctx.beginPath();
  ctx.roundRect((VIEW_W - width) / 2, HUD_H + FIELD_H - 46, width, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#f5ead6';
  ctx.textAlign = 'center';
  ctx.fillText(game.notice, VIEW_W / 2, HUD_H + FIELD_H - 28);
}

function paintHud(ctx, game, now) {
  ctx.fillStyle = '#14100e';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#f2c230';
  setFont(ctx, 800, 32);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('THE AURELIA HEIST', 24, 33);
  ctx.fillStyle = '#e8ded2';
  setFont(ctx, 600, 19);
  ctx.fillText(`Room ${game.roomIndex + 1} of ${ROOMS.length} — ${game.room.name}`, 24, 67);
  ctx.fillText(`Loot ${game.bagged} · Score ${game.score}`, 470, 33);
  const prize = game.room.loots.find((l) => l.prize);
  ctx.fillStyle = game.hasPrize() ? '#39c26d' : '#e8b93c';
  ctx.fillText(game.hasPrize() ? 'Prize bagged — reach the van!' : `Prize inside: ${prize ? prize.name : ''}`, 470, 67);
  paintAlarmMeter(ctx, game);
  paintNotice(ctx, game);
  // A red pulse at the edges when the alarm is about to trip.
  if (game.phase === 'play' && game.alarm > 72 && Math.sin(now / 130) > -0.2) {
    ctx.strokeStyle = 'rgba(224, 49, 49, 0.5)';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, HUD_H + 5, VIEW_W - 10, FIELD_H - 10);
  }
}

function paintOverlay(ctx, title, lines, colour) {
  ctx.fillStyle = 'rgba(12, 9, 8, 0.8)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = colour;
  setFont(ctx, 800, 60);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, VIEW_W / 2, 262);
  ctx.fillStyle = '#ffffff';
  setFont(ctx, 600, 24);
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 338 + i * 38));
}

export function draw(ctx, game, now) {
  const room = game.room;
  const bounds = { w: FIELD_W, h: FIELD_H };
  ctx.fillStyle = '#14100e';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(0, HUD_H);
  paintFloor(ctx);
  // Cones first, under everything: guards warm amber, cameras cold blue.
  for (const guard of game.guards) {
    const style = guard.seeing ? 'rgba(255, 120, 60, 0.34)' : 'rgba(255, 214, 110, 0.20)';
    fillCone(ctx, guard, room.walls, bounds, style);
  }
  for (const camera of game.cameras) {
    const style = camera.seeing ? 'rgba(255, 90, 90, 0.30)' : 'rgba(150, 190, 255, 0.16)';
    fillCone(ctx, camera, room.walls, bounds, style);
  }
  room.walls.forEach((w, i) => paintWall(ctx, w, i));
  // Laser lines, with their emitter blocks at each end.
  for (const beam of game.lasers) {
    const [x1, y1] = beam.from;
    const [x2, y2] = beam.to;
    ctx.strokeStyle = beam.cool > 1.1 ? 'rgba(255,255,255,0.85)' : 'rgba(224, 49, 49, 0.28)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.fillStyle = '#20242c';
    ctx.fillRect(x1 - 5, y1 - 5, 10, 10);
    ctx.fillRect(x2 - 5, y2 - 5, 10, 10);
  }
  paintVan(ctx, room.exit, game.hasPrize());
  for (const loot of game.loots) {
    paintLoot(ctx, loot);
    if (loot.prize && !loot.taken) {
      const pulse = 1 + 0.15 * Math.sin(now / 240);
      ctx.strokeStyle = '#f2c230';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(loot.x, loot.y, 22 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#8a6d1d';
      setFont(ctx, 800, 12);
      ctx.textAlign = 'center';
      ctx.fillText('PRIZE', loot.x, loot.y - 32);
    }
  }
  for (const camera of game.cameras) paintCamera(ctx, camera);
  for (const guard of game.guards) paintGuard(ctx, guard);
  if (game.phase !== 'title') paintThief(ctx, game);
  ctx.restore();
  paintHud(ctx, game, now);

  if (game.phase === 'title') {
    paintOverlay(ctx, 'THE AURELIA HEIST', [
      'One thief, three rooms, and every eye in the house on you.',
      'Bag each room\'s prize — plus whatever else glitters — and reach the van.',
      'Guards and cameras feed the ALARM meter; at 100% the job is blown.',
      'Move with WASD or the arrow keys. Stand still beside loot to bag it.',
      'Press Enter to go in.',
    ], '#f2c230');
  } else if (game.phase === 'caught') {
    paintOverlay(ctx, 'THE ALARM TRIPS!', [
      'Lights up, sirens on, and the van is gone.',
      'Press Enter to try the room again.',
    ], '#e03131');
  } else if (game.phase === 'won') {
    paintOverlay(ctx, 'CLEAN GETAWAY', [
      `${room.name} is behind you. Score ${game.score}.`,
      'Press Enter for the next room.',
    ], '#39c26d');
  } else if (game.phase === 'clear') {
    paintOverlay(ctx, 'THE AURELIA JOB — DONE', [
      'Three rooms emptied and not one arrest.',
      `Final score ${game.score}.`,
      'Press Enter to run it again.',
    ], '#39c26d');
  }
}

// Kept so the seeded dressing in a room draws the same on every visit.
export const roomRng = (seed) => makeRng(seed);
