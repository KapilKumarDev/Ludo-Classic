// render.js — HUD and dice: turn title, dice faces and the winner overlay. The board itself lives in board.js.

Ludo.buildDice = function(){
  Ludo.state.players.forEach(p=>{
    const slotEl = document.querySelector(`.dice-slot.${p.slot}`);
    slotEl.innerHTML = '';
    const cube = document.createElement('div');
    cube.className = 'dice-cube tone-'+p.color;
    cube.id = 'dice-'+p.color;
    for(let i=0;i<9;i++){ const pip=document.createElement('div'); pip.className='pip'; cube.appendChild(pip); }
    cube.addEventListener('click', ()=> Ludo.onDiceClick(p));
    slotEl.appendChild(cube);
    Ludo.paintDicePips(p.color, Ludo.state.rolled && Ludo.state.dice ? Ludo.state.dice : Ludo.DEFAULT_DICE_FACE, false);
  });
};

Ludo.DEFAULT_DICE_FACE = 1;

Ludo.PIP_PATTERNS = { 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };

Ludo.paintDicePips = function(color,val,forfeited){
  const cube = document.getElementById('dice-'+color);
  const pattern = Ludo.PIP_PATTERNS[val] || [];
  [...cube.children].forEach((pip,i)=> pip.classList.toggle('on', !forfeited && pattern.includes(i)));
};

// The turn never passes once someone wins, so the current player is the winner and lends the field its colour.
Ludo.showWinner = function(text){
  const overlay = document.getElementById('winnerOverlay');
  Ludo.COLORS.forEach(c=> overlay.classList.toggle('tone-'+c, c===Ludo.currentPlayer().color));
  document.getElementById('winnerText').textContent = text;
  overlay.classList.add('active');
};

// Only the die of whoever is on the move is at full strength, and it invites a click only until it is rolled.
Ludo.syncDice = function(){
  const s = Ludo.state, cp = Ludo.currentPlayer();
  document.querySelectorAll('.dice-cube').forEach(d=>{
    const mine = d.id==='dice-'+cp.color;
    d.classList.toggle('turn', mine);
    d.classList.toggle('ready', mine && !s.rolled && !cp.isAI);
  });
};

Ludo.renderGame = function(){
  const s = Ludo.state, cp = Ludo.currentPlayer();
  document.getElementById('turnTitle').textContent = `${cp.name}'s turn`;
  const game = document.getElementById('game');
  Ludo.COLORS.forEach(c=> game.classList.toggle('tone-'+c, c===cp.color));

  Ludo.syncDice();

  Ludo.placePieces();
  Ludo.highlightMovable(cp, s.rolled ? Ludo.movablePieces(cp, s.dice) : []);
  Ludo.saveState();
};