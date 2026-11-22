// shots.js — the staged states behind the screenshots in shots.json.
// Each one is a real state of the simulation: the watchers are run
// forward with the game's own step, the thief is put where a player
// could stand, the alarm is set to a value it reaches in play, and a
// grab is left half done with its progress ring showing. The heist
// shot is the one frame the bounty asks for: the thief crossing the
// room, guard cones, a camera cone, the prize and the alarm meter,
// all at once.

export function stageShot(game, params) {
  const shot = params.get('shot');
  if (!shot) return false;

  if (shot === 'title') {
    game.phase = 'title';
    game.fastForward(5);
    return true;
  }

  if (shot === 'heist') {
    game.start();
    game.fastForward(6.5);
    game.thief.x = 520;
    game.thief.y = 330;
    game.thief.angle = 0.15;
    game.alarm = 42;
    game.notice = 'Cross to the sapphire — mind the crossing patrol.';
    return true;
  }

  if (shot === 'grab') {
    game.start();
    game.loadRoom(1);
    game.phase = 'play';
    game.fastForward(9);
    // Beside the Golden Ledger, holding still while it is bagged.
    game.thief.x = 640;
    game.thief.y = 480;
    game.thief.angle = -Math.PI / 2;
    const prize = game.loots.find((loot) => loot.prize);
    prize.progress = 0.62;
    game.alarm = 67;
    game.bagged = 1;
    game.score = 150;
    game.notice = 'Bagging the Golden Ledger… hold still.';
    return true;
  }

  if (shot === 'win') {
    game.start();
    game.fastForward(4);
    const prize = game.loots.find((loot) => loot.prize);
    prize.taken = true;
    game.bagged = 3;
    game.score = 950;
    game.phase = 'won';
    game.notice = '';
    return true;
  }

  return false;
}
