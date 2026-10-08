// constants.js — board geometry and static config, shared through the global `Ludo` namespace.
// Geometry is derived from YARD_SIZE and CORE_SIZE alone, so the drawn board and the walked path cannot
// drift apart. Cells are [row, col] pairs, 0-indexed.
window.Ludo = window.Ludo || {};

Ludo.COLORS = ['red', 'green', 'yellow', 'blue'];
Ludo.SLOTS = ['tl', 'tr', 'br', 'bl']; // corners, clockwise: a quarter-turn moves a slot to the next one
// The corner of each seat, in play order, by player count. Clockwise from the bottom left.
Ludo.SEATING = { 2: ['bl', 'tr'], 3: ['bl', 'tl', 'tr'], 4: ['bl', 'tl', 'tr', 'br'] };
Ludo.PIECES_PER_PLAYER = 4;
Ludo.MAX_NAME_LENGTH = 16;

Ludo.YARD_SIZE = 6;                       // a corner yard is YARD_SIZE x YARD_SIZE cells, and so is every arm of the cross
Ludo.CORE_SIZE = 3;                       // the centre square where the colours meet; never a cell, so nothing walks on it
Ludo.COURT_SIZE = Ludo.YARD_SIZE - 2;     // the square inside a yard that holds the four waiting pieces
Ludo.GRID_SIZE = 2 * Ludo.YARD_SIZE + Ludo.CORE_SIZE;
Ludo.MID = (Ludo.GRID_SIZE - 1) / 2;      // the middle row/column, where every home lane runs

Ludo.CORNER_BOX = (function () {
  const far = Ludo.GRID_SIZE - Ludo.YARD_SIZE;
  return { tl: { r: 0, c: 0 }, tr: { r: 0, c: far }, br: { r: far, c: far }, bl: { r: far, c: 0 } };
})();

// Turns a cell a quarter-turn clockwise about the board's centre, `turns` times. Every arm of the board is the
// same shape rotated, so one arm's cells describe all four.
Ludo.rotateCell = function ([row, col], turns) {
  for (let i = 0; i < turns; i++) [row, col] = [col, Ludo.GRID_SIZE - 1 - row];
  return [row, col];
};

// The shared ring, clockwise. One quarter is written out (from the tl colour's start cell up to the cell before the
// tr colour's start); the other three are that quarter rotated. The ring never enters the centre: it turns each of
// its corners diagonally, around the yard's corner.
Ludo.buildPath = function () {
  const quarter = [];
  for (let col = 1; col < Ludo.YARD_SIZE; col++) quarter.push([Ludo.MID - 1, col]);         // left arm, upper row, inwards
  for (let row = Ludo.YARD_SIZE - 1; row >= 0; row--) quarter.push([row, Ludo.MID - 1]);    // top arm, left column, outwards
  quarter.push([0, Ludo.MID], [0, Ludo.MID + 1]);                                           // across the top edge
  return Ludo.SLOTS.flatMap((_, turns) => quarter.map(cell => Ludo.rotateCell(cell, turns)));
};

Ludo.PATH = Ludo.buildPath();
Ludo.RING_LENGTH = Ludo.PATH.length;
Ludo.START_INDEX = Object.fromEntries(Ludo.SLOTS.map((slot, i) => [slot, i * Ludo.RING_LENGTH / Ludo.SLOTS.length]));
Ludo.HOME_ENTRY_STEP = Ludo.RING_LENGTH - 1;  // a piece with fewer steps is still on the shared ring
Ludo.HOME_LANE_LEN = Ludo.YARD_SIZE - 1;      // the arm minus its edge cell, which belongs to the ring
Ludo.FINISH_STEPS = Ludo.HOME_ENTRY_STEP + Ludo.HOME_LANE_LEN; // one step past the last lane cell: into the centre
Ludo.IN_YARD = -1;                            // a piece's `steps` while it waits in its yard

// Safe squares: each colour's start, and the star square STAR_OFFSET steps after it.
Ludo.STAR_OFFSET = 8;
Ludo.SAFE_INDICES = new Set(Ludo.SLOTS.flatMap(slot => [
  Ludo.START_INDEX[slot],
  Ludo.START_INDEX[slot] + Ludo.STAR_OFFSET
]));

// hp counts along a colour's home lane from 0 (next to the ring). The lane runs down the middle of its arm, so it
// is the tl lane rotated to the colour's corner.
Ludo.homeColumnCell = function (slot, hp) {
  return Ludo.rotateCell([Ludo.MID, hp + 1], Ludo.SLOTS.indexOf(slot));
};

Ludo.DICE_MAX = 6;       // the top face: it brings a piece out of its yard and earns another roll
Ludo.MAX_SIXES = 3;      // this many sixes in a row forfeit the turn
Ludo.RESTING_FACE = 1;   // what a die shows before it is rolled

// Milliseconds. `step` is also handed to the CSS as a walking piece's move time (see Ludo.walkPiece).
Ludo.TIMING = {
  step: 200,           // a piece walking one cell
  rollSpin: 950,       // a die tumbling before it settles
  faceSwap: 130,       // how often a tumbling die changes face
  deadRoll: 900,       // a roll nobody can use stays on the table this long
  computerRoll: 700,   // the computer waits this long before rolling
  computerThink: 850,  // ...and this long before moving
  afterMove: 500       // a finished move rests before the turn passes
};

// Player-adjustable settings: the piece styles on offer (id -> label) and what a fresh browser starts with.
// The keys of PIECE_STYLES are also the `pawn` / `disc` variant classes in base.css.
Ludo.PIECE_STYLES = { pawn: 'Pawn', disc: 'Disc' };
Ludo.DEFAULT_SETTINGS = { pieceStyle: 'pawn' };