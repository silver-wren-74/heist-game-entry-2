// game.js — the heist itself: the thief, one shared alarm meter, the
// bagging of loot and the laser lines. Every eye in the room feeds the
// same meter — a guard's stare feeds it faster than a camera's, the
// closer the thief the faster still — and at 100 the job is blown.
// Loot is bagged by standing close and still for a moment; the van
// only leaves once the room's prize is in the sack.

import { ROOMS, FIELD_W, FIELD_H } from './rooms.js';
import { Guard, Camera } from './watchers.js';

export const THIEF_R = 12;
const WALK_SPEED = 152;
const GRAB_DIST = 44;
const GRAB_TIME = 1.15;
const ALARM_DECAY = 10;
const LASER_HIT = 30;
const TOUCH_DIST = 23;
const GUARD_FEED = 30;
const CAMERA_FEED = 19;

/** Does the circle at (cx, cy) with radius r overlap rectangle w? */
function circleHitsRect(cx, cy, r, w) {
  const nearestX = Math.max(w.x, Math.min(cx, w.x + w.w));
  const nearestY = Math.max(w.y, Math.min(cy, w.y + w.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

/** Distance from a point to a line segment. */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export class Game {
  constructor() {
    this.phase = 'title'; // title | play | caught | won | clear
    this.roomIndex = 0;
    this.keys = {};
    // Events the frame loop turns into sounds: grab | laser | alarm | escape.
    this.events = [];
    this.score = 0;
    this.bagged = 0;
    this.elapsed = 0;
    this.notice = '';
    this.loadRoom(0);
  }

  get room() {
    return ROOMS[this.roomIndex];
  }

  loadRoom(index) {
    this.roomIndex = index;
    const spec = this.room;
    this.thief = { x: spec.start[0], y: spec.start[1], angle: 0, moving: false };
    this.guards = spec.guards.map((g, i) => new Guard(g, i * 1.61 + index * 2));
    this.cameras = spec.cameras.map((c, i) => new Camera(c, i * 2.13 + index));
    this.loots = spec.loots.map((l) => ({ ...l, taken: false, progress: 0 }));
    this.lasers = spec.lasers.map((l) => ({ ...l, cool: 0 }));
    this.alarm = 0;
    this.spotted = false;
  }

  start() {
    this.score = 0;
    this.bagged = 0;
    this.elapsed = 0;
    this.loadRoom(0);
    this.phase = 'play';
    this.notice = 'Bag the prize, then reach the van — and mind the alarm.';
  }

  hasPrize() {
    return this.loots.some((l) => l.prize && l.taken);
  }

  /** Would the thief at (x, y) stand inside a wall? */
  blockedAt(x, y) {
    return this.room.walls.some((w) => circleHitsRect(x, y, THIEF_R, w));
  }

  moveThief(dt) {
    const p = this.thief;
    const dx = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const dy = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
    p.moving = dx !== 0 || dy !== 0;
    if (!p.moving) return;
    const len = Math.hypot(dx, dy);
    const stepX = (dx / len) * WALK_SPEED * dt;
    const stepY = (dy / len) * WALK_SPEED * dt;
    p.angle = Math.atan2(dy, dx);
    // Slide along walls: each axis is tried on its own.
    if (!this.blockedAt(p.x + stepX, p.y)) p.x += stepX;
    if (!this.blockedAt(p.x, p.y + stepY)) p.y += stepY;
    p.x = Math.max(THIEF_R, Math.min(FIELD_W - THIEF_R, p.x));
    p.y = Math.max(THIEF_R, Math.min(FIELD_H - THIEF_R, p.y));
  }

  bagLoot(dt) {
    const p = this.thief;
    for (const loot of this.loots) {
      if (loot.taken) continue;
      const close = Math.hypot(loot.x - p.x, loot.y - p.y) < GRAB_DIST;
      if (close && !p.moving) {
        loot.progress += dt / GRAB_TIME;
        if (loot.progress >= 1) {
          loot.taken = true;
          this.bagged += 1;
          this.score += loot.value;
          this.events.push('grab');
          this.notice = loot.prize
            ? `${loot.name} is in the sack! Get to the van.`
            : `${loot.name} in the sack (+${loot.value}).`;
        }
      } else {
        loot.progress = Math.max(0, loot.progress - dt * 2.5);
      }
    }
  }

  tripLasers(dt) {
    const p = this.thief;
    for (const beam of this.lasers) {
      if (beam.cool > 0) {
        beam.cool -= dt;
        continue;
      }
      const d = distToSegment(p.x, p.y, beam.from[0], beam.from[1], beam.to[0], beam.to[1]);
      if (d < 11) {
        this.alarm = Math.min(100, this.alarm + LASER_HIT);
        beam.cool = 1.6;
        this.events.push('laser');
        this.notice = 'A laser beam snaps — the alarm jumps!';
      }
    }
  }

  /** What the guards add to the alarm this step; a touch ends the job. */
  watchGuards() {
    const p = this.thief;
    let feed = 0;
    for (const guard of this.guards) {
      const dist = Math.hypot(guard.x - p.x, guard.y - p.y);
      if (dist < TOUCH_DIST) {
        this.caught();
        return -1;
      }
      guard.seeing = guard.sees(p.x, p.y, this.room.walls);
      if (guard.seeing) {
        this.spotted = true;
        feed += GUARD_FEED * (1.15 - Math.min(1, dist / guard.range));
      }
    }
    return feed;
  }

  /** What the cameras add to the alarm this step. */
  watchCameras() {
    const p = this.thief;
    let feed = 0;
    for (const camera of this.cameras) {
      camera.seeing = camera.sees(p.x, p.y, this.room.walls);
      if (camera.seeing) {
        this.spotted = true;
        feed += CAMERA_FEED;
      }
    }
    return feed;
  }

  /** Every watcher that can see the thief feeds the alarm; else it drains. */
  feedAlarm(dt) {
    this.spotted = false;
    const guardFeed = this.watchGuards();
    if (guardFeed < 0) return; // caught by a guard's touch
    const feed = guardFeed + this.watchCameras();
    if (this.spotted) {
      this.alarm = Math.min(100, this.alarm + feed * dt);
    } else {
      this.alarm = Math.max(0, this.alarm - ALARM_DECAY * dt);
    }
    if (this.alarm >= 100) this.caught();
  }

  tryExit() {
    const p = this.thief;
    const e = this.room.exit;
    if (p.x < e.x || p.x > e.x + e.w || p.y < e.y || p.y > e.y + e.h) return;
    if (this.hasPrize()) {
      this.events.push('escape');
      this.phase = this.roomIndex === ROOMS.length - 1 ? 'clear' : 'won';
      this.notice = '';
    } else {
      this.notice = 'The driver waves you off — the prize is still inside.';
    }
  }

  tick(dt) {
    if (this.phase !== 'play') return;
    this.elapsed += dt;
    this.moveThief(dt);
    for (const guard of this.guards) guard.step(dt);
    for (const camera of this.cameras) camera.step(dt);
    this.bagLoot(dt);
    this.tripLasers(dt);
    this.feedAlarm(dt);
    if (this.phase !== 'play') return;
    this.tryExit();
  }

  caught() {
    this.events.push('alarm');
    this.phase = 'caught';
    this.notice = '';
  }

  advance() {
    if (this.phase === 'title') {
      this.start();
    } else if (this.phase === 'caught') {
      this.loadRoom(this.roomIndex);
      this.phase = 'play';
      this.notice = 'Again, quieter this time. The room has reset.';
    } else if (this.phase === 'won') {
      this.loadRoom(this.roomIndex + 1);
      this.phase = 'play';
      this.notice = `${this.room.name} — a new room, a new prize.`;
    } else if (this.phase === 'clear') {
      this.start();
    }
  }

  /** Run the watchers forward with no thief input, for staged screenshots. */
  fastForward(seconds) {
    const steps = Math.floor(seconds * 30);
    for (let i = 0; i < steps; i++) {
      for (const guard of this.guards) guard.step(1 / 30);
      for (const camera of this.cameras) camera.step(1 / 30);
    }
  }
}
