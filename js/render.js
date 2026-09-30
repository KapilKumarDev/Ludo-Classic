// render.js — HUD and dice: turn banner, dice faces, log line. The board itself lives in board.js.

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

Ludo.renderGame = function(){
  const s = Ludo.state, cp = Ludo.currentPlayer();
  const banner = document.getElementById('turnBanner');
  banner.innerHTML = '';
  const dot = document.createElement('span'); dot.className = 'turn-dot tone-'+cp.color;
  banner.appendChild(dot);
  banner.appendChild(document.createTextNode(`${cp.name}'s turn`));

  document.querySelectorAll('.dice-cube').forEach(d=>{ d.classList.add('disabled'); d.classList.remove('active-glow'); });
  const activeDice = document.getElementById('dice-'+cp.color);
  if(activeDice && !s.rolled && !cp.isAI){ activeDice.classList.remove('disabled'); activeDice.classList.add('active-glow'); }

  Ludo.placePieces();
  Ludo.highlightMovable(cp, s.rolled ? Ludo.movablePieces(cp, s.dice) : []);
  Ludo.saveState();
};

Ludo.log = function(msg){ document.getElementById('logLine').textContent = msg; };