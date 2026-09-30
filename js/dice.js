// dice.js — roll animation + the roll -> move -> end-turn sequence

Ludo.onDiceClick = function(p){
  const s = Ludo.state;
  if(s.animating || s.over) return;
  if(p.isAI) return;
  if(Ludo.currentPlayer()!==p) return;
  if(s.rolled) return;
  Ludo.rollDice(p);
};

Ludo.rollDice = function(p){
  const s = Ludo.state;
  s.animating = true;
  const cube = document.getElementById('dice-'+p.color);
  cube.classList.add('rolling');
  const finalVal = 1 + Math.floor(Math.random()*6);

  // visible face-cycling while "rolling" so the dice reads as random, not instant
  let ticks = 0;
  const cycle = setInterval(()=>{
    Ludo.paintDicePips(p.color, 1+Math.floor(Math.random()*6));
    ticks++;
    if(ticks>=7){ clearInterval(cycle); }
  }, 130);

  setTimeout(()=>{
    cube.classList.remove('rolling');
    let val = finalVal;
    if(val===6){
      s.consecSix++;
      if(s.consecSix===3) val=0;
    } else s.consecSix = 0;

    s.dice = val; s.rolled = true; s.animating = false;
    Ludo.syncDice();
    Ludo.saveState();
    Ludo.resolveRoll(p);
  }, 950);
};

// What follows a roll that is on the table: a dead roll (no legal move, or a third six) ends the turn, a live one
// waits for a move, which the computer picks for itself. A saved game resumes through here too, since a refresh
// lands between the roll and whatever would have followed it.
Ludo.resolveRoll = function(p){
  const s = Ludo.state, val = s.dice;
  Ludo.paintDicePips(p.color, val||6); // a 0 is a third six: the die shows the six it was
  if(val===0){ setTimeout(()=>Ludo.endTurn(false), 900); return; }

  const movable = Ludo.movablePieces(p, val);
  if(movable.length===0){
    setTimeout(()=>Ludo.endTurn(val===6), 900);
    return;
  }
  Ludo.highlightMovable(p, movable);
  if(p.isAI){ setTimeout(()=>{
    const choice = Ludo.aiPickMove(p, movable, val);
    if(choice) Ludo.movePiece(p, choice, val);
  }, 850); }
};

Ludo.onPieceClick = function(p, pc){
  const s = Ludo.state;
  if(s.animating || s.over) return;
  if(Ludo.currentPlayer()!==p) return;
  if(!s.rolled) return;
  const movable = Ludo.movablePieces(p, s.dice);
  if(!movable.includes(pc)) return;
  Ludo.movePiece(p, pc, s.dice);
};

Ludo.movePiece = async function(p, pc, val){
  const s = Ludo.state;
  s.animating = true;
  document.querySelectorAll('.piece').forEach(el=>el.classList.remove('movable'));

  const from = pc.steps;
  let bonus = false;
  if(from===-1) pc.steps = 0;
  else {
    pc.steps += val;
    if(pc.steps===Ludo.FINISH_STEPS) bonus = true;
  }
  await Ludo.walkPiece(p, pc, from);

  if(pc.steps>=0 && pc.steps<Ludo.HOME_ENTRY_STEP){
    const abs = Ludo.absIndexOf(p,pc);
    if(!Ludo.SAFE_INDICES.has(abs)){
      const killed = Ludo.tryKill(p, abs);
      if(killed){ bonus = true; Ludo.renderGame(); }
    }
  }
  if(val===6) bonus = true;

  const win = Ludo.checkWin(p);
  if(win){
    s.over = true; s.animating = false; s.winnerText = win.text;
    Ludo.showWinner(win.text);
    Ludo.saveState();
    return;
  }
  s.animating = false;
  setTimeout(()=>Ludo.endTurn(bonus), 500);
};

Ludo.endTurn = function(giveExtra){
  const s = Ludo.state;
  s.rolled = false; s.dice = 0;
  document.querySelectorAll('.piece').forEach(el=>el.classList.remove('movable'));
  if(giveExtra){
    Ludo.renderGame();
    Ludo.scheduleAITurnIfNeeded();
    return;
  }
  s.consecSix = 0;
  s.turn = (s.turn+1) % s.players.length;
  Ludo.renderGame();
  Ludo.scheduleAITurnIfNeeded();
};

Ludo.scheduleAITurnIfNeeded = function(){
  const p = Ludo.currentPlayer();
  if(p.isAI && !Ludo.state.over){
    setTimeout(()=>{ if(Ludo.currentPlayer()===p && !Ludo.state.rolled) Ludo.rollDice(p); }, 700);
  }
};