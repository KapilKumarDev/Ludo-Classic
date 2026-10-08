// board.js — the board: its cells, yards, centre, and the pieces standing on it.
// Every cell is derived from the tables in constants.js (PATH, START_INDEX, SAFE_INDICES, homeColumnCell), so what is
// drawn is exactly what the rules walk on. Styling lives in game.css; this file only picks classes and hands
// positions to CSS as custom properties (--x / --y, in cell units) so a piece can slide between cells.

Ludo.pieceEls = new Map(); // piece -> its button, rebuilt with the board

// "row,col" -> what that cell is. Only cells of the cross appear; the four corner yards are not cells.
Ludo.cellKinds = function () {
  const kinds = new Map();
  Ludo.PATH.forEach(([row, col], i) => kinds.set(`${row},${col}`, { kind: 'ring', safe: Ludo.SAFE_INDICES.has(i) }));
  Ludo.SLOTS.forEach(slot => {
    const [startRow, startCol] = Ludo.PATH[Ludo.START_INDEX[slot]];
    kinds.get(`${startRow},${startCol}`).start = slot;
    for (let hp = 0; hp < Ludo.HOME_LANE_LEN; hp++) {
      const [row, col] = Ludo.homeColumnCell(slot, hp);
      kinds.set(`${row},${col}`, { kind: 'lane', slot });
    }
  });
  return kinds;
};

// Class that gives an element its player's colour, or 'idle' for a corner nobody sits in.
Ludo.toneClass = function (slot) {
  const player = Ludo.playerInSlot(slot);
  return player ? 'tone-' + player.color : 'idle';
};

Ludo.buildBoardDOM = function () {
  const board = document.getElementById('board');
  board.replaceChildren();
  board.style.setProperty('--grid', Ludo.GRID_SIZE);
  board.style.setProperty('--yard', Ludo.YARD_SIZE);
  board.style.setProperty('--court', Ludo.COURT_SIZE);
  board.style.setProperty('--core', Ludo.CORE_SIZE);
  board.style.setProperty('--core-at', Ludo.YARD_SIZE + 1); // CSS grid lines count from 1

  // Yards are placed on the grid by CSS; the cross cells that follow fill the remaining squares in row-major
  // order, so cells are appended in exactly that order.
  Ludo.SLOTS.forEach(slot => board.appendChild(Ludo.buildYard(slot)));

  const kinds = Ludo.cellKinds();
  for (let row = 0; row < Ludo.GRID_SIZE; row++) {
    for (let col = 0; col < Ludo.GRID_SIZE; col++) {
      const info = kinds.get(`${row},${col}`);
      if (info) board.appendChild(Ludo.buildCell(info));
    }
  }
  board.appendChild(Ludo.buildCore());

  Ludo.pieceEls = new Map();
  Ludo.state.players.forEach(player => player.pieces.forEach(piece => {
    const el = Ludo.buildPiece(player, piece);
    Ludo.pieceEls.set(piece, el);
    board.appendChild(el);
  }));
  Ludo.placePieces();
};

Ludo.buildYard = function (slot) {
  const yard = document.createElement('div');
  yard.className = `yard ${slot} ${Ludo.toneClass(slot)}`;
  // The colour of the whole quarter of the board, reaching under the cross to the centre.
  const quarter = document.createElement('div');
  quarter.className = 'quarter';
  yard.appendChild(quarter);
  if (Ludo.playerInSlot(slot)) {
    const court = document.createElement('div');
    court.className = 'courtyard';
    for (let i = 0; i < Ludo.PIECES_PER_PLAYER; i++) {
      const socket = document.createElement('span');
      socket.className = 'socket';
      court.appendChild(socket);
    }
    yard.appendChild(court);
  }
  return yard;
};

Ludo.buildCell = function ({ kind, safe, start, slot }) {
  const cell = document.createElement('div');
  cell.className = 'cell ' + kind;
  if (safe) cell.classList.add('safe');
  if (start && Ludo.playerInSlot(start)) cell.classList.add('start', Ludo.toneClass(start));
  if (kind === 'lane') cell.classList.add(Ludo.toneClass(slot));
  return cell;
};

// The centre: the CORE_SIZE square, cut into one wedge per corner, each facing the lane that feeds it. It is never
// a cell, so nothing a piece walks on is covered.
Ludo.buildCore = function () {
  const core = document.createElement('div');
  core.className = 'core';
  Ludo.SLOTS.forEach(slot => {
    const wedge = document.createElement('div');
    wedge.className = `wedge ${slot} ${Ludo.toneClass(slot)}`;
    core.appendChild(wedge);
  });
  return core;
};

// A piece is a button so it can be reached and used from the keyboard; it is enabled only while it can move.
Ludo.buildPiece = function (player, piece) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'piece tone-' + player.color;
  el.disabled = true;
  el.setAttribute('aria-label', `${player.name}, piece ${piece.id + 1}`);
  const token = document.createElement('span');
  token.className = 'token ' + Ludo.settings.pieceStyle;
  el.appendChild(token);
  el.addEventListener('click', () => Ludo.onPieceClick(player, piece));
  return el;
};

// [row, col] of the cell a piece stands on after `steps` steps. Only for pieces out in play: one still in its yard
// or already home stands on no cell.
Ludo.cellAtSteps = function (player, steps) {
  return steps < Ludo.HOME_ENTRY_STEP
    ? Ludo.PATH[Ludo.ringIndexAt(player, steps)]
    : Ludo.homeColumnCell(player.slot, steps - Ludo.HOME_ENTRY_STEP);
};

// Offsets (in cells) that lay n pieces out on a small grid centred on the cell they share.
Ludo.fanOffsets = function (n) {
  const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols), gap = Math.min(0.4, 0.84 / cols);
  return Array.from({ length: n }, (_, i) => ({
    dx: (i % cols - (cols - 1) / 2) * gap,
    dy: (Math.floor(i / cols) - (rows - 1) / 2) * gap
  }));
};

// Where every piece should stand: Map(piece -> {x, y, stacked?, done?}), in cell units measured from the board's
// top-left corner (cell (row, col) is centred on col + .5, row + .5).
Ludo.pieceSpots = function () {
  const spots = new Map(), shared = new Map(), finished = new Map();
  const socketStep = Ludo.COURT_SIZE / 2; // sockets sit on a 2 x 2 grid inside the courtyard

  Ludo.state.players.forEach(player => player.pieces.forEach(piece => {
    if (piece.steps === Ludo.IN_YARD) {
      const box = Ludo.CORNER_BOX[player.slot];
      spots.set(piece, {
        x: box.c + 1 + socketStep * (0.5 + piece.id % 2),
        y: box.r + 1 + socketStep * (0.5 + Math.floor(piece.id / 2))
      });
    } else if (piece.steps === Ludo.FINISH_STEPS) {
      if (!finished.has(player)) finished.set(player, []);
      finished.get(player).push(piece);
    } else {
      const cell = Ludo.cellAtSteps(player, piece.steps), key = cell.join(',');
      if (!shared.has(key)) shared.set(key, { cell, pieces: [] });
      shared.get(key).pieces.push(piece);
    }
  }));

  shared.forEach(({ cell: [row, col], pieces }) => {
    const fan = Ludo.fanOffsets(pieces.length);
    pieces.forEach((piece, i) => spots.set(piece, {
      x: col + 0.5 + fan[i].dx, y: row + 0.5 + fan[i].dy, stacked: pieces.length > 1
    }));
  });

  // Finished pieces rest in their colour's wedge of the centre, huddled toward the lane they came home through.
  const mid = Ludo.GRID_SIZE / 2, rest = 0.85; // rest: how far from the middle, in cells
  finished.forEach((pieces, player) => {
    const [laneRow, laneCol] = Ludo.homeColumnCell(player.slot, Ludo.HOME_LANE_LEN - 1);
    const ux = Math.sign(laneCol - Ludo.MID), uy = Math.sign(laneRow - Ludo.MID);
    pieces.forEach((piece, i) => {
      const along = (i - (pieces.length - 1) / 2) * 0.17;
      spots.set(piece, { x: mid + ux * rest + Math.abs(uy) * along, y: mid + uy * rest + Math.abs(ux) * along, done: true });
    });
  });
  return spots;
};

Ludo.placePieces = function () {
  const spots = Ludo.pieceSpots();
  Ludo.pieceEls.forEach((el, piece) => {
    if (el.classList.contains('moving')) return; // a piece mid-walk is placed by Ludo.walkPiece
    const spot = spots.get(piece);
    el.style.setProperty('--x', +spot.x.toFixed(3));
    el.style.setProperty('--y', +spot.y.toFixed(3));
    el.classList.toggle('stacked', !!spot.stacked);
    el.classList.toggle('done', !!spot.done);
  });
};

Ludo.wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Shows a piece getting from `from` steps to where the state now has it (piece.steps): it stands on each cell it
// passes for one step's time, then the board settles it on its final spot (fanned out, or in the centre if home).
// The game state is already final; this only moves the piece on screen.
Ludo.walkPiece = async function (player, piece, from) {
  const el = Ludo.pieceEls.get(piece);
  el.style.setProperty('--move', Ludo.TIMING.step + 'ms');
  el.classList.add('moving');
  Ludo.placePieces(); // everything else settles now; the walker is skipped
  for (let steps = from + 1; steps < piece.steps; steps++) {
    const [row, col] = Ludo.cellAtSteps(player, steps);
    el.style.setProperty('--x', col + 0.5);
    el.style.setProperty('--y', row + 0.5);
    await Ludo.wait(Ludo.TIMING.step);
  }
  el.classList.remove('moving');
  Ludo.placePieces(); // the last step
  await Ludo.wait(Ludo.TIMING.step); // let it finish gliding before the move time reverts
  el.style.removeProperty('--move');
};

Ludo.clearMovable = function () {
  Ludo.pieceEls.forEach(el => {
    el.classList.remove('movable');
    el.disabled = true;
  });
};

// Rings the pieces that can use the roll. Only a person's pieces can be clicked; the computer's are rung to show
// what it may choose from.
Ludo.highlightMovable = function (player, movable) {
  Ludo.clearMovable();
  movable.forEach(piece => {
    const el = Ludo.pieceEls.get(piece);
    el.classList.add('movable');
    el.disabled = player.isComputer;
  });
};