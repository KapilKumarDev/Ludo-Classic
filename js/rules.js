// rules.js — pure game-rule logic, no DOM

Ludo.movablePieces = function(p, val){
  const out = [];
  p.pieces.forEach(pc=>{
    if(pc.steps===Ludo.FINISH_STEPS) return;
    if(pc.steps===-1){ if(val===6) out.push(pc); return; }
    const dest = pc.steps + val;
    if(dest <= Ludo.FINISH_STEPS) out.push(pc); // overshoot is invalid, even on a 6
  });
  return out;
};

// Index on the shared ring of the cell p stands on after `steps` steps from its start.
Ludo.ringIndexAt = function(p, steps){
  return (Ludo.START_INDEX[p.slot] + steps) % Ludo.RING_LENGTH;
};

Ludo.absIndexOf = function(p, pc){
  return Ludo.ringIndexAt(p, pc.steps);
};

Ludo.tryKill = function(p, absIndex){
  let killedAny = false;
  Ludo.state.players.forEach(op=>{
    if(op===p) return;
    if(op.team && op.team===p.team) return; // teammates never kill each other
    op.pieces.forEach(opc=>{
      if(opc.steps<0 || opc.steps>=Ludo.HOME_ENTRY_STEP) return;
      if(Ludo.absIndexOf(op,opc)===absIndex) { opc.steps=-1; killedAny=true; }
    });
  });
  return killedAny;
};

Ludo.checkWin = function(p){
  if(!Ludo.allFinished(p)) return null;
  if(!p.team) return { text:`${p.name} wins!`, winners:[p] };
  const mate = Ludo.teamMates(p)[0];
  if(mate && Ludo.allFinished(mate)) return { text:`Team ${p.team} — ${p.name} & ${mate.name} — wins!`, winners:[p,mate] };
  return null;
};