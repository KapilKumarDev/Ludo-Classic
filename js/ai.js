// ai.js — heuristic move choice for computer-controlled players
Ludo.aiPickMove = function(p, movable, val){
  let best = null, bestScore = -1;
  movable.forEach(pc=>{
    let score = 1;
    const dest = pc.steps===-1 ? 0 : pc.steps+val;
    if(dest===Ludo.FINISH_STEPS) score = 100;
    else if(pc.steps===-1) score = 40;
    else {
      const abs = (Ludo.START_INDEX[p.slot] + dest) % Ludo.RING_LENGTH;
      const wouldKill = Ludo.state.players.some(op =>
        op!==p && (!op.team || op.team!==p.team) &&
        op.pieces.some(opc => opc.steps>=0 && opc.steps<Ludo.HOME_ENTRY_STEP && Ludo.absIndexOf(op,opc)===abs) &&
        !Ludo.SAFE_INDICES.has(abs)
      );
      score = wouldKill ? 80 : 20 + pc.steps*0.3;
    }
    if(score > bestScore){ bestScore = score; best = pc; }
  });
  return best;
};