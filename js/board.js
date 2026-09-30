// board.js — the board: its cells, yards, centre, and the pieces standing on it.
// Every cell is derived from the tables in constants.js (PATH, START_INDEX, SAFE_INDICES,
// homeColumnCell), so what is drawn is exactly what the rules walk on. Styling lives in
// style.css; this file only picks classes and hands positions to CSS as custom properties
// (--x / --y, in cell units) so a piece can slide between cells.

// "r,c" -> what that cell is. Only cells of the cross appear; the four corner yards are not cells.
Ludo.cellKinds = function(){
  const kinds = new Map();
  const key = (r,c) => r+','+c;
  Ludo.PATH.forEach(([r,c],i)=> kinds.set(key(r,c), { kind:'ring', safe:Ludo.SAFE_INDICES.has(i) }));
  Object.keys(Ludo.CORNER_BOX).forEach(slot=>{
    const [sr,sc] = Ludo.PATH[Ludo.START_INDEX[slot]];
    kinds.get(key(sr,sc)).start = slot;
    for(let hp=0; hp<Ludo.HOME_LANE_LEN; hp++){
      const [r,c] = Ludo.homeColumnCell(slot,hp);
      kinds.set(key(r,c), { kind:'lane', slot });
    }
  });
  return kinds;
};

// Class that gives an element its player's colour, or 'idle' for a corner nobody sits in.
Ludo.toneClass = function(slot){
  const p = Ludo.playerInSlot(slot);
  return p ? 'tone-'+p.color : 'idle';
};

Ludo.buildBoardDOM = function(){
  const board = document.getElementById('board');
  board.innerHTML = '';
  board.style.setProperty('--grid', Ludo.GRID_SIZE);
  board.style.setProperty('--yard', Ludo.YARD_SIZE);
  board.style.setProperty('--court', Ludo.YARD_SIZE - 2);
  board.style.setProperty('--core', Ludo.CORE_SIZE);
  board.style.setProperty('--core-at', Ludo.YARD_SIZE + 1);

  // Yards are placed on the grid by CSS; the cross cells that follow fill the remaining
  // squares in row-major order, so cells are appended in exactly that order.
  Object.keys(Ludo.CORNER_BOX).forEach(slot=> board.appendChild(Ludo.buildYard(slot)));

  const kinds = Ludo.cellKinds();
  for(let r=0; r<Ludo.GRID_SIZE; r++){
    for(let c=0; c<Ludo.GRID_SIZE; c++){
      const info = kinds.get(r+','+c);
      if(info) board.appendChild(Ludo.buildCell(r,c,info));
    }
  }
  board.appendChild(Ludo.buildCore());

  Ludo.state.players.forEach(p=> p.pieces.forEach(pc=> board.appendChild(Ludo.buildPiece(p,pc))));
  Ludo.placePieces();
};

Ludo.buildYard = function(slot){
  const yard = document.createElement('div');
  yard.className = `yard ${slot} ${Ludo.toneClass(slot)}`;
  // The colour of the whole quarter of the board, reaching under the cross to the centre.
  const quarter = document.createElement('div');
  quarter.className = 'quarter';
  yard.appendChild(quarter);
  if(Ludo.playerInSlot(slot)){
    const court = document.createElement('div');
    court.className = 'courtyard';
    for(let i=0;i<4;i++){
      const socket = document.createElement('span');
      socket.className = 'socket';
      court.appendChild(socket);
    }
    yard.appendChild(court);
  }
  return yard;
};

Ludo.buildCell = function(r,c,info){
  const cell = document.createElement('div');
  cell.className = 'cell '+info.kind;
  cell.dataset.r = r; cell.dataset.c = c;
  if(info.safe) cell.classList.add('safe');
  if(info.start && Ludo.playerInSlot(info.start)) cell.classList.add('start', Ludo.toneClass(info.start));
  if(info.kind==='lane') cell.classList.add(Ludo.toneClass(info.slot));
  return cell;
};

// The centre: the CORE_SIZE square, cut into one wedge per corner, each facing the lane that feeds it.
// It is never a cell, so nothing a piece walks on is covered.
Ludo.buildCore = function(){
  const core = document.createElement('div');
  core.className = 'core';
  Ludo.SLOTS.forEach(slot=>{
    const wedge = document.createElement('div');
    wedge.className = `wedge ${slot} ${Ludo.toneClass(slot)}`;
    core.appendChild(wedge);
  });
  return core;
};

Ludo.buildPiece = function(p,pc){
  const el = document.createElement('div');
  el.className = 'piece tone-'+p.color;
  el.id = `pc-${p.color}-${pc.id}`;
  const token = document.createElement('span');
  token.className = 'token '+Ludo.settings.pieceStyle;
  el.appendChild(token);
  el.addEventListener('click', ()=> Ludo.onPieceClick(p,pc));
  return el;
};

// [row, col] of the cell a piece stands on; null while it is still in its yard.
Ludo.cellOfPiece = function(p,pc){
  if(pc.steps===-1) return null;
  if(pc.steps<Ludo.HOME_ENTRY_STEP) return Ludo.PATH[Ludo.absIndexOf(p,pc)];
  return Ludo.homeColumnCell(p.slot, pc.steps-Ludo.HOME_ENTRY_STEP);
};

// Offsets (in cells) that lay n pieces out on a small grid centred on the cell they share.
Ludo.fanOffsets = function(n){
  const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n/cols), gap = Math.min(.4, .84/cols);
  return Array.from({length:n}, (_,i)=>({
    dx:(i%cols - (cols-1)/2)*gap,
    dy:(Math.floor(i/cols) - (rows-1)/2)*gap
  }));
};

// Where every piece should stand: Map(piece -> {x, y, stacked?, done?}), in cell units
// measured from the board's top-left corner (cell (r,c) is centred on c+.5, r+.5).
Ludo.pieceSpots = function(){
  const spots = new Map(), shared = new Map(), finished = new Map();
  const court = Ludo.YARD_SIZE-2, socketStep = court/2; // sockets sit in the (YARD_SIZE-2)-wide courtyard

  Ludo.state.players.forEach(p=> p.pieces.forEach(pc=>{
    if(pc.steps===-1){
      const box = Ludo.CORNER_BOX[p.slot];
      spots.set(pc, { x:box.c + 1 + socketStep*(.5 + pc.id%2), y:box.r + 1 + socketStep*(.5 + (pc.id>>1)) });
    } else if(pc.steps===Ludo.FINISH_STEPS){
      if(!finished.has(p)) finished.set(p, []);
      finished.get(p).push(pc);
    } else {
      const cell = Ludo.cellOfPiece(p,pc), key = cell.join(',');
      if(!shared.has(key)) shared.set(key, { cell, pieces:[] });
      shared.get(key).pieces.push(pc);
    }
  }));

  shared.forEach(({cell:[r,c], pieces})=>{
    const fan = Ludo.fanOffsets(pieces.length);
    pieces.forEach((pc,i)=> spots.set(pc, { x:c+.5+fan[i].dx, y:r+.5+fan[i].dy, stacked:pieces.length>1 }));
  });

  // Finished pieces rest in their colour's wedge of the centre, huddled toward the lane they came home through.
  const mid = Ludo.GRID_SIZE/2, rest = .85; // rest: how far from the middle, in cells
  finished.forEach((pieces,p)=>{
    const [lr,lc] = Ludo.homeColumnCell(p.slot, Ludo.HOME_LANE_LEN-1);
    const ux = Math.sign(lc-Ludo.MID), uy = Math.sign(lr-Ludo.MID);
    pieces.forEach((pc,i)=>{
      const along = (i-(pieces.length-1)/2)*.17;
      spots.set(pc, { x:mid+ux*rest+Math.abs(uy)*along, y:mid+uy*rest+Math.abs(ux)*along, done:true });
    });
  });
  return spots;
};

Ludo.placePieces = function(){
  const spots = Ludo.pieceSpots();
  Ludo.state.players.forEach(p=> p.pieces.forEach(pc=>{
    const el = document.getElementById(`pc-${p.color}-${pc.id}`), spot = spots.get(pc);
    el.style.setProperty('--x', +spot.x.toFixed(3));
    el.style.setProperty('--y', +spot.y.toFixed(3));
    el.classList.toggle('stacked', !!spot.stacked);
    el.classList.toggle('done', !!spot.done);
  }));
};

Ludo.highlightMovable = function(p, movable){
  document.querySelectorAll('.piece').forEach(el=>el.classList.remove('movable'));
  movable.forEach(pc=>{
    const el = document.getElementById(`pc-${p.color}-${pc.id}`);
    if(el) el.classList.add('movable');
  });
};