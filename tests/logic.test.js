// Rules, AI, setup and saved-game checks. They run the game's own scripts, unchanged, in a bare context with no
// browser. No dependencies:  node --test "tests/*.test.js"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// A Map-backed stand-in for the browser's storage.
function fakeStorage() {
  const items = new Map();
  return { items, setItem: (key, value) => items.set(key, value), getItem: key => items.get(key) ?? null, removeItem: key => items.delete(key) };
}

function loadLudo(...extra) {
  const storage = fakeStorage();
  const context = { console, Math, sessionStorage: storage, localStorage: storage };
  context.window = context;
  vm.createContext(context);
  for (const name of ['constants', 'storage', 'state', 'game-state', 'rules', 'ai', ...extra]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', name + '.js'), 'utf8'), context, { filename: name + '.js' });
  }
  context.Ludo.storage = storage;
  return context.Ludo;
}

// Arrays made inside the game's context are not reference-equal to ours; compare plain copies.
const plain = value => JSON.parse(JSON.stringify(value));

// A fresh two-player game against the computer: Ludo.state.players = [you (bl), computer (tr)].
function newGame(Ludo, overrides = {}) {
  Ludo.setupCfg = { ...Ludo.defaultSetup('computer'), count: 2, ...overrides };
  Ludo.state = Ludo.newGame();
  return Ludo.state.players;
}

// Steps at which `other` stands on the ring cell `player` reaches after `steps`.
const stepsToMeet = (Ludo, player, steps, other) =>
  (Ludo.ringIndexAt(player, steps) - Ludo.START_INDEX[other.slot] + Ludo.RING_LENGTH) % Ludo.RING_LENGTH;

test('board geometry: a 52-cell ring, five-cell lanes, no cell used twice', () => {
  const Ludo = loadLudo();
  const key = ([row, col]) => `${row},${col}`;
  assert.equal(Ludo.RING_LENGTH, 52);
  assert.equal(Ludo.FINISH_STEPS, 56);
  assert.equal(new Set(Ludo.PATH.map(key)).size, 52);
  const lanes = Ludo.SLOTS.flatMap(slot => Array.from({ length: Ludo.HOME_LANE_LEN }, (_, hp) => Ludo.homeColumnCell(slot, hp)));
  assert.equal(new Set([...Ludo.PATH, ...lanes].map(key)).size, 52 + 4 * 5);
  assert.deepEqual(plain(Object.values(Ludo.START_INDEX)), [0, 13, 26, 39]);
  assert.equal(Ludo.SAFE_INDICES.size, 8);
});

test('rules: leaving the yard takes a six, overshooting the centre is refused, a forfeited roll moves nothing', () => {
  const Ludo = loadLudo();
  const [me] = newGame(Ludo);
  const [inYard, onRing, nearHome, home] = me.pieces;
  onRing.steps = 10; nearHome.steps = 54; home.steps = Ludo.FINISH_STEPS;
  assert.deepEqual(plain(Ludo.movablePieces(me, 6).map(p => p.id)), [0, 1]);   // yard piece, ring piece; not 54 + 6, not the finished one
  assert.deepEqual(plain(Ludo.movablePieces(me, 2).map(p => p.id)), [1, 2]);   // 54 + 2 is exactly the centre
  assert.equal(Ludo.movablePieces(me, 0).length, 0);
  assert.equal(Ludo.landingSteps(inYard, 6), 0);
  assert.equal(Ludo.landingSteps(onRing, 4), 14);
});

test('capture: an opponent on an unsafe ring cell goes home; safe squares and teammates are left alone', () => {
  const Ludo = loadLudo();
  const [me, other] = newGame(Ludo);
  const target = 30; // a ring index that is not safe
  assert.ok(!Ludo.SAFE_INDICES.has(target));
  other.pieces[0].steps = (target - Ludo.START_INDEX[other.slot] + Ludo.RING_LENGTH) % Ludo.RING_LENGTH;
  assert.equal(Ludo.capturePiecesAt(me, target), true);
  assert.equal(other.pieces[0].steps, Ludo.IN_YARD);

  const safe = Ludo.START_INDEX.tl;
  other.pieces[1].steps = (safe - Ludo.START_INDEX[other.slot] + Ludo.RING_LENGTH) % Ludo.RING_LENGTH;
  assert.equal(Ludo.capturePiecesAt(me, safe), false);
  assert.ok(other.pieces[1].steps >= 0);

  me.team = other.team = 'A';
  other.pieces[2].steps = (target - Ludo.START_INDEX[other.slot] + Ludo.RING_LENGTH) % Ludo.RING_LENGTH;
  assert.equal(Ludo.capturePiecesAt(me, target), false);
});

test('win: solo needs four home; a team needs both players home', () => {
  const Ludo = loadLudo();
  const players = newGame(Ludo, { count: 4, mode: 'local', team: true });
  const finish = player => player.pieces.forEach(piece => { piece.steps = Ludo.FINISH_STEPS; });
  finish(players[0]);
  assert.equal(Ludo.checkWin(players[0]), null);
  finish(players[2]);
  assert.match(Ludo.checkWin(players[0]).text, /^Team A/);
  Ludo.setupCfg.team = false;
  assert.equal(Ludo.newGame().players[0].team, null);
});

test('computer: finishes before capturing, captures before leaving the yard, leaves before advancing', () => {
  const Ludo = loadLudo();
  const [me, other] = newGame(Ludo);
  const [a, b, c, d] = me.pieces;
  const targetSteps = 20 + 4;
  other.pieces[0].steps = stepsToMeet(Ludo, me, targetSteps, other);

  a.steps = 52; b.steps = 20; c.steps = Ludo.IN_YARD; d.steps = 5;
  assert.equal(Ludo.pickComputerMove(me, [a, b, d], 4), a, 'finish (52 + 4 = 56)');
  assert.equal(Ludo.pickComputerMove(me, [b, d], 4), b, 'capture');
  other.pieces[0].steps = Ludo.IN_YARD;
  assert.equal(Ludo.pickComputerMove(me, [c, d], 6), c, 'leave the yard');
  assert.equal(Ludo.pickComputerMove(me, [b, d], 3), b, 'advance the furthest');
});

test('computer: a step into the home lane is not mistaken for a capture', () => {
  const Ludo = loadLudo();
  const [me, other] = newGame(Ludo);
  const [intoLane, realCapture] = me.pieces;
  intoLane.steps = 47;     // + 4 = 51: the first lane cell. Taken as a ring cell it would wrap to a cell the opponent holds.
  realCapture.steps = 20;  // + 4 = 24: a true capture
  const wrapped = stepsToMeet(Ludo, me, 51, other);
  other.pieces[0].steps = wrapped;
  other.pieces[1].steps = stepsToMeet(Ludo, me, 24, other);
  assert.ok(!Ludo.SAFE_INDICES.has(Ludo.ringIndexAt(me, 51)) && !Ludo.SAFE_INDICES.has(Ludo.ringIndexAt(me, 24)));
  assert.equal(Ludo.pickComputerMove(me, [intoLane, realCapture], 4), realCapture);
});

test('200 computer-played games, solo and in teams, all reach a winner', () => {
  const Ludo = loadLudo();
  for (let game = 0; game < 200; game++) {
    newGame(Ludo, { count: 4, team: game % 2 === 0 });
    let win = null;
    for (let turns = 0; !win && turns < 20000; turns++) {
      const player = Ludo.currentPlayer(), roll = 1 + Math.floor(Math.random() * Ludo.DICE_MAX);
      const movable = Ludo.movablePieces(player, roll);
      let extraTurn = roll === Ludo.DICE_MAX;
      if (movable.length) {
        const piece = Ludo.pickComputerMove(player, movable, roll);
        piece.steps = Ludo.landingSteps(piece, roll);
        if (piece.steps === Ludo.FINISH_STEPS) extraTurn = true;
        if (Ludo.isOnRing(piece) && Ludo.capturePiecesAt(player, Ludo.ringIndexOf(player, piece))) extraTurn = true;
        win = Ludo.checkWin(player);
      }
      if (!extraTurn) Ludo.state.turn = (Ludo.state.turn + 1) % Ludo.state.players.length;
    }
    assert.ok(win, `game ${game} finished`);
  }
});

test('setup: seats follow play order, names default sensibly, teams only at four', () => {
  const Ludo = loadLudo();
  Ludo.setupCfg = { ...Ludo.defaultSetup('computer'), myColor: 'blue', count: 3, names: { 0: '  Ada  ' } };
  assert.deepEqual(plain(Ludo.seatColors()), ['blue', 'red', 'green', 'yellow']);
  const players = Ludo.newGame().players;
  assert.deepEqual(plain(players.map(p => p.slot)), ['bl', 'tl', 'tr']);
  assert.deepEqual(plain(players.map(p => p.name)), ['Ada', 'Computer 1', 'Computer 2']);
  assert.deepEqual(plain(players.map(p => p.isComputer)), [false, true, true]);
  assert.equal(Ludo.teamCapable(3), false);
});

test('saved games: a good save loads; a malformed or outdated one is refused instead of crashing the game', () => {
  const Ludo = loadLudo();
  Ludo.setupCfg = { ...Ludo.defaultSetup('local'), count: 3 };
  Ludo.state = Ludo.newGame();
  Ludo.saveState();
  assert.equal(Ludo.loadState().state.players.length, 3);

  const corrupt = mutate => {
    const saved = JSON.parse(Ludo.storage.items.get(Ludo.STATE_KEY));
    mutate(saved);
    Ludo.storage.items.set(Ludo.STATE_KEY, JSON.stringify(saved));
    return Ludo.loadState();
  };
  assert.equal(corrupt(saved => { saved.state.players[0].pieces[0].steps = 99; }).state, null);
  assert.equal(corrupt(saved => { saved.state.turn = 7; }).state, null);
  assert.equal(corrupt(saved => { saved.setupCfg.count = 9; }), null);
  Ludo.storage.items.set(Ludo.STATE_KEY, '{not json');
  assert.equal(Ludo.loadState(), null);
});