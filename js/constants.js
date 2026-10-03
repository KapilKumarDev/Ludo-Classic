// constants.js — board geometry & static config, shared globally via `Ludo` namespace.
// Everything below is derived from YARD_SIZE and CORE_SIZE, so the drawn board and the walked
// path can never drift apart. Cells are [row,col] pairs, 0-indexed.
window.Ludo = window.Ludo || {};

Ludo.COLORS = ['red','green','yellow','blue'];
Ludo.SLOTS = ['tl','tr','br','bl']; // corners in clockwise order; also the order a quarter-turn moves a slot on
Ludo.YARD_SIZE = 6;  // each corner yard is YARD_SIZE x YARD_SIZE cells, and every arm of the cross is that long
Ludo.CORE_SIZE = 3;  // the centre is a CORE_SIZE x CORE_SIZE square where the four colours meet; it is never a cell, so nothing walks on it
Ludo.GRID_SIZE = 2*Ludo.YARD_SIZE + Ludo.CORE_SIZE;   // the board is GRID_SIZE x GRID_SIZE cells
Ludo.MID = (Ludo.GRID_SIZE - 1) / 2;                  // the middle row/column, where every home lane runs

Ludo.CORNER_BOX = (function(){
  const far = Ludo.GRID_SIZE - Ludo.YARD_SIZE;
  return { tl:{r:0,c:0}, tr:{r:0,c:far}, br:{r:far,c:far}, bl:{r:far,c:0} };
})();

// Turns a cell a quarter-turn clockwise about the board's centre, `turns` times. Every arm of the
// board is the same shape rotated, so one arm's cells describe all four.
Ludo.rotateCell = function([r,c], turns){
  for(let i=0; i<turns; i++) [r,c] = [c, Ludo.GRID_SIZE-1-r];
  return [r,c];
};

// The shared ring, clockwise. One quarter is written out (from the tl colour's start cell up to the
// cell before the tr colour's start); the other three are that quarter rotated. The ring never enters
// the centre: it turns each corner of the centre diagonally, around the yard's corner.
Ludo.buildPath = function(){
  const quarter = [];
  for(let c=1; c<Ludo.YARD_SIZE; c++) quarter.push([Ludo.MID-1, c]);             // left arm, upper row, towards the centre
  for(let r=Ludo.YARD_SIZE-1; r>=0; r--) quarter.push([r, Ludo.MID-1]);          // top arm, left column, outwards
  quarter.push([0, Ludo.MID], [0, Ludo.MID+1]);                                  // across the top edge
  return Ludo.SLOTS.flatMap((_, turns) => quarter.map(cell => Ludo.rotateCell(cell, turns)));
};

Ludo.PATH = Ludo.buildPath();
Ludo.RING_LENGTH = Ludo.PATH.length; // 52
Ludo.START_INDEX = Object.fromEntries(Ludo.SLOTS.map((slot,i) => [slot, i * Ludo.RING_LENGTH / Ludo.SLOTS.length]));
Ludo.HOME_ENTRY_STEP = Ludo.RING_LENGTH - 1; // steps below this are still on the shared ring
Ludo.HOME_LANE_LEN = Ludo.YARD_SIZE - 1;     // the arm minus its edge cell, which belongs to the ring
Ludo.FINISH_STEPS = Ludo.HOME_ENTRY_STEP + Ludo.HOME_LANE_LEN; // one step past the last lane cell: into the centre

// How long a piece takes to walk one cell, in ms. Ludo.walkPiece also hands it to the CSS as the piece's move time.
Ludo.STEP_MS = 200;

// Player-adjustable settings: the piece styles on offer (id -> label) and the value a fresh browser starts with.
// The keys of PIECE_STYLES are also the `pawn` / `disc` variant classes in base.css.
Ludo.PIECE_STYLES = { pawn:'Pawn', disc:'Disc' };
Ludo.DEFAULT_SETTINGS = { pieceStyle:'pawn' };

// Safe squares: each colour's start, plus the star square STAR_OFFSET steps after it.
Ludo.STAR_OFFSET = 8;
Ludo.SAFE_INDICES = new Set(Ludo.SLOTS.flatMap(slot => [
  Ludo.START_INDEX[slot],
  Ludo.START_INDEX[slot] + Ludo.STAR_OFFSET
]));

// hp is 0..HOME_LANE_LEN-1 along a colour's home lane, starting next to the ring. The lane runs down
// the middle of its arm, so it is the tl lane rotated to the colour's corner.
Ludo.homeColumnCell = function(slot, hp){
  return Ludo.rotateCell([Ludo.MID, hp+1], Ludo.SLOTS.indexOf(slot));
};