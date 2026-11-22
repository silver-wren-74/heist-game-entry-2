// watchers.js — the eyes of the building: guards who walk a patrol
// route with a torch, and cameras that sweep from the walls. Both share
// one sight test and one cone shape: a watcher spots the thief only
// when the thief stands inside its cone and no wall crosses the line
// between them, and the cone painted on the floor is cast with the
// same rays, so the lit floor is exactly the watched floor.

export const GUARD_SIGHT = 200;
export const GUARD_HALF_ANGLE = 0.44;
export const CAMERA_HALF_ANGLE = 0.33;

/** Keep an angle inside (-PI, PI]. */
export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a <= -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Where two segments cross, as the fraction along the first — or null
 * when they do not cross (parallel counts as no crossing).
 */
function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const den = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (den === 0) return null;
  const alongFirst = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / den;
  const alongSecond = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / den;
  if (alongFirst < 0 || alongFirst > 1 || alongSecond < 0 || alongSecond > 1) return null;
  return alongFirst;
}

/** True when any wall stands between the two points. */
export function sightBlocked(ax, ay, bx, by, walls) {
  for (const wall of walls) {
    const right = wall.x + wall.w;
    const bottom = wall.y + wall.h;
    if (segmentsCross(ax, ay, bx, by, wall.x, wall.y, right, wall.y) !== null) return true;
    if (segmentsCross(ax, ay, bx, by, right, wall.y, right, bottom) !== null) return true;
    if (segmentsCross(ax, ay, bx, by, right, bottom, wall.x, bottom) !== null) return true;
    if (segmentsCross(ax, ay, bx, by, wall.x, bottom, wall.x, wall.y) !== null) return true;
    // A target standing inside a wall is hidden behind it.
    if (bx > wall.x && bx < right && by > wall.y && by < bottom) return true;
  }
  return false;
}

/**
 * How far a ray from (x, y) at `angle` travels before a wall or the
 * room's edge stops it, at most `range`.
 */
function castRay(x, y, angle, range, walls, bounds) {
  const endX = x + Math.cos(angle) * range;
  const endY = y + Math.sin(angle) * range;
  let nearest = 1;
  const clip = (x1, y1, x2, y2) => {
    const hit = segmentsCross(x, y, endX, endY, x1, y1, x2, y2);
    if (hit !== null && hit < nearest) nearest = hit;
  };
  for (const wall of walls) {
    clip(wall.x, wall.y, wall.x + wall.w, wall.y);
    clip(wall.x + wall.w, wall.y, wall.x + wall.w, wall.y + wall.h);
    clip(wall.x + wall.w, wall.y + wall.h, wall.x, wall.y + wall.h);
    clip(wall.x, wall.y + wall.h, wall.x, wall.y);
  }
  clip(0, 0, bounds.w, 0);
  clip(bounds.w, 0, bounds.w, bounds.h);
  clip(bounds.w, bounds.h, 0, bounds.h);
  clip(0, bounds.h, 0, 0);
  return range * nearest;
}

/** One watcher: a position, a facing, a range and a cone half-angle. */
export class Watcher {
  constructor(x, y, range, halfAngle) {
    this.x = x;
    this.y = y;
    this.range = range;
    this.halfAngle = halfAngle;
    this.angle = 0;
    this.seeing = false;
  }

  /** Is the point (px, py) inside this watcher's cone, in the clear? */
  sees(px, py, walls) {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.range) return false;
    // Very close, the watcher feels the thief whatever way it faces.
    if (dist > 26) {
      const off = Math.abs(wrapAngle(Math.atan2(dy, dx) - this.angle));
      if (off > this.halfAngle) return false;
    }
    return !sightBlocked(this.x, this.y, px, py, walls);
  }

  /** The cone as a polygon, ray-cast against the walls. */
  cone(walls, bounds) {
    const rays = 24;
    const outline = [[this.x, this.y]];
    for (let i = 0; i <= rays; i++) {
      const a = this.angle - this.halfAngle + (2 * this.halfAngle * i) / rays;
      const reach = castRay(this.x, this.y, a, this.range, walls, bounds);
      outline.push([this.x + Math.cos(a) * reach, this.y + Math.sin(a) * reach]);
    }
    return outline;
  }
}

/** A guard walks its route, pausing at each corner to look around. */
export class Guard extends Watcher {
  constructor(spec, phase = 0) {
    super(spec.path[0][0], spec.path[0][1], GUARD_SIGHT, GUARD_HALF_ANGLE);
    this.route = spec.path;
    this.speed = spec.speed;
    this.hold = spec.pause;
    this.target = spec.path.length > 1 ? 1 : 0;
    this.waiting = 0;
    this.clock = phase;
    const [tx, ty] = this.route[this.target];
    this.angle = Math.atan2(ty - this.y, tx - this.x);
  }

  step(dt) {
    this.clock += dt;
    if (this.waiting > 0) {
      // Paused at a corner: scan a little, side to side.
      this.waiting -= dt;
      this.angle += Math.sin(this.clock * 1.6) * 0.0035;
      return;
    }
    const [tx, ty] = this.route[this.target];
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const stride = this.speed * dt;
    if (dist <= stride) {
      this.x = tx;
      this.y = ty;
      this.target = (this.target + 1) % this.route.length;
      this.waiting = this.hold;
    } else {
      this.x += (dx / dist) * stride;
      this.y += (dy / dist) * stride;
      const facing = Math.atan2(dy, dx);
      this.angle += wrapAngle(facing - this.angle) * Math.min(1, dt * 7);
    }
  }
}

/** A camera sits on the wall and sweeps — or, in the last room, turns forever. */
export class Camera extends Watcher {
  constructor(spec, phase = 0) {
    super(spec.x, spec.y, spec.range, CAMERA_HALF_ANGLE);
    this.spec = spec;
    this.clock = phase;
    this.angle = spec.base;
  }

  step(dt) {
    this.clock += dt;
    if (this.spec.rotate) {
      this.angle = this.spec.base + this.clock * this.spec.speed;
    } else {
      this.angle = this.spec.base + Math.sin(this.clock * this.spec.speed) * this.spec.sweep;
    }
  }
}
