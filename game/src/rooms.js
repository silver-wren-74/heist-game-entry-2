// rooms.js — the Aurelia Grand as data: three rooms the thief must
// empty, one after another. Each room lists the furniture that blocks
// feet and eyesight, the guards' patrol routes, the cameras that sweep
// it, the laser lines strung across it, the loot on its floor (one
// prize per room — the van driver will not leave without it), where the
// thief slips in and where the van waits. All positions are field
// coordinates: the field is 1280 wide and 708 tall and sits under the
// 92-pixel header bar.

export const FIELD_W = 1280;
export const FIELD_H = 708;

export const ROOMS = [
  {
    name: 'Gallery Floor',
    seed: 5101,
    start: [70, 636],
    exit: { w: 120, h: 60, x: 1150, y: 640 },
    walls: [
      { kind: 'case', x: 200, y: 140, w: 170, h: 60 },
      { kind: 'case', x: 560, y: 140, w: 170, h: 60 },
      { kind: 'case', x: 920, y: 140, w: 170, h: 60 },
      { kind: 'case', x: 200, y: 470, w: 170, h: 60 },
      { kind: 'case', x: 560, y: 470, w: 170, h: 60 },
      { kind: 'case', x: 920, y: 470, w: 170, h: 60 },
      { kind: 'pillar', x: 622, y: 300, w: 36, h: 96 },
    ],
    guards: [
      { speed: 68, pause: 1.0, path: [[110, 330], [1170, 330]] },
      { speed: 55, pause: 1.3, path: [[390, 84], [390, 616]] },
    ],
    cameras: [
      { x: 66, y: 66, range: 245, base: 0.6, sweep: 0.7, speed: 0.5 },
      { x: 1214, y: 66, range: 245, base: Math.PI - 0.6, sweep: 0.7, speed: 0.42 },
    ],
    lasers: [],
    loots: [
      { kind: 'gem', name: 'Star Sapphire', prize: true, value: 500, x: 645, y: 104 },
      { kind: 'painting', name: 'Portrait in Ochre', prize: false, value: 150, x: 285, y: 104 },
      { kind: 'cash', name: 'Bond Stack', prize: false, value: 150, x: 1005, y: 104 },
      { kind: 'cash', name: 'Bond Stack', prize: false, value: 150, x: 285, y: 566 },
      { kind: 'gem', name: 'Teardrop Emerald', prize: false, value: 150, x: 1005, y: 566 },
      { kind: 'painting', name: 'Seascape in Grey', prize: false, value: 150, x: 645, y: 566 },
    ],
  },
  {
    name: 'Banking Hall',
    seed: 5202,
    start: [70, 60],
    exit: { w: 120, h: 60, x: 1150, y: 10 },
    walls: [
      { kind: 'counter', x: 150, y: 200, w: 300, h: 54 },
      { kind: 'counter', x: 830, y: 200, w: 300, h: 54 },
      { kind: 'counter', x: 150, y: 470, w: 300, h: 54 },
      { kind: 'counter', x: 830, y: 470, w: 300, h: 54 },
      { kind: 'vault', x: 540, y: 300, w: 200, h: 110 },
      { kind: 'pillar', x: 614, y: 118, w: 36, h: 36 },
      { kind: 'pillar', x: 614, y: 548, w: 36, h: 36 },
    ],
    guards: [
      { speed: 78, pause: 0.8, path: [[90, 122], [1190, 122]] },
      { speed: 82, pause: 0.8, path: [[1190, 606], [90, 606]] },
      { speed: 62, pause: 1.0, path: [[92, 336], [492, 336]] },
      { speed: 62, pause: 1.0, path: [[1188, 336], [788, 336]] },
    ],
    cameras: [
      { x: 640, y: 44, range: 260, base: Math.PI / 2, sweep: 0.8, speed: 0.45 },
      { x: 66, y: 662, range: 240, base: -0.6, sweep: 0.65, speed: 0.5 },
      { x: 1214, y: 662, range: 240, base: Math.PI + 0.6, sweep: 0.65, speed: 0.38 },
    ],
    lasers: [
      { from: [520, 448], to: [520, 648] },
      { from: [760, 60], to: [760, 262] },
    ],
    loots: [
      { kind: 'ledger', name: 'Golden Ledger', prize: true, value: 500, x: 640, y: 448 },
      { kind: 'cash', name: 'Teller Drawer', prize: false, value: 150, x: 300, y: 138 },
      { kind: 'cash', name: 'Teller Drawer', prize: false, value: 150, x: 980, y: 138 },
      { kind: 'gem', name: 'Vault Ruby', prize: false, value: 150, x: 300, y: 566 },
      { kind: 'painting', name: 'Founder Portrait', prize: false, value: 150, x: 980, y: 566 },
    ],
  },
  {
    name: 'Vault Antechamber',
    seed: 5303,
    start: [70, 636],
    exit: { w: 120, h: 60, x: 1150, y: 640 },
    walls: [
      { kind: 'vault', x: 240, y: 240, w: 220, h: 150 },
      { kind: 'vault', x: 820, y: 240, w: 220, h: 150 },
      { kind: 'case', x: 540, y: 110, w: 200, h: 54 },
      { kind: 'case', x: 540, y: 520, w: 200, h: 54 },
      { kind: 'pillar', x: 120, y: 330, w: 36, h: 36 },
      { kind: 'pillar', x: 1124, y: 330, w: 36, h: 36 },
      { kind: 'pillar', x: 632, y: 322, w: 16, h: 16 },
    ],
    guards: [
      { speed: 74, pause: 0.6, path: [[480, 170], [800, 170], [800, 510], [480, 510]] },
      { speed: 84, pause: 0.7, path: [[90, 92], [1190, 92]] },
      { speed: 88, pause: 0.7, path: [[1190, 622], [90, 622]] },
    ],
    cameras: [
      { x: 640, y: 330, range: 250, base: 0, sweep: Math.PI, speed: 0.35, rotate: true },
      { x: 44, y: 44, range: 235, base: 0.7, sweep: 0.6, speed: 0.5 },
      { x: 1236, y: 44, range: 235, base: Math.PI - 0.7, sweep: 0.6, speed: 0.44 },
    ],
    lasers: [
      { from: [60, 205], to: [400, 205] },
      { from: [880, 475], to: [1220, 475] },
      { from: [640, 548], to: [640, 688] },
    ],
    loots: [
      { kind: 'crown', name: 'Crown of Aurelia', prize: true, value: 500, x: 640, y: 300 },
      { kind: 'gem', name: 'Moonstone', prize: false, value: 150, x: 350, y: 172 },
      { kind: 'gem', name: 'Sunstone', prize: false, value: 150, x: 930, y: 172 },
      { kind: 'painting', name: 'The Vault Keeper', prize: false, value: 150, x: 350, y: 452 },
      { kind: 'cash', name: 'Reserve Notes', prize: false, value: 150, x: 930, y: 452 },
    ],
  },
];
