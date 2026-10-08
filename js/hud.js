// hud.js — everything on the game screen except the board: turn title, dice, and the winner overlay.

Ludo.diceEls = {}; // colour -> its die button, rebuilt with the dice

Ludo.PIP_PATTERNS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }; // cells of a 3 x 3 grid

// The face a die shows for a roll: none yet, or a forfeited third six (0), which shows the six it was.
Ludo.faceFor = roll => roll === null ? Ludo.RESTING_FACE : roll || Ludo.DICE_MAX;

// Gives an element the colour of `color` and takes the other colours off it.
Ludo.setTone = function (el, color) {
  Ludo.COLORS.forEach(c => el.classList.toggle('tone-' + c, c === color));
};

Ludo.buildDice = function () {
  const state = Ludo.state, current = Ludo.currentPlayer();
  Ludo.diceEls = {};
  state.players.forEach(player => {
    const die = document.createElement('button');
    die.type = 'button';
    die.className = 'dice-cube tone-' + player.color;
    die.disabled = true;
    for (let i = 0; i < 9; i++) {
      const pip = document.createElement('div');
      pip.className = 'pip';
      die.appendChild(pip);
    }
    die.addEventListener('click', () => Ludo.onDiceClick(player));
    document.querySelector(`.dice-slot.${player.slot}`).replaceChildren(die);
    Ludo.diceEls[player.color] = die;
    Ludo.paintDie(player, player === current ? Ludo.faceFor(state.roll) : Ludo.RESTING_FACE);
  });
};

Ludo.paintDie = function (player, face) {
  const die = Ludo.diceEls[player.color], pattern = Ludo.PIP_PATTERNS[face];
  die.setAttribute('aria-label', `${player.name}'s die: ${face}`);
  [...die.children].forEach((pip, i) => pip.classList.toggle('on', pattern.includes(i)));
};

// Only the die of whoever is on the move is at full strength, and it invites a click only until it is rolled.
Ludo.syncDice = function () {
  const state = Ludo.state, current = Ludo.currentPlayer();
  state.players.forEach(player => {
    const die = Ludo.diceEls[player.color], mine = player === current;
    const ready = mine && !Ludo.busy && state.roll === null && !player.isComputer;
    die.classList.toggle('turn', mine);
    die.classList.toggle('ready', ready);
    die.disabled = !ready;
  });
};

// The turn never passes once someone wins, so the current player is the winner and lends the overlay their colour.
Ludo.showWinner = function (text) {
  const overlay = document.getElementById('winnerOverlay');
  Ludo.setTone(overlay, Ludo.currentPlayer().color);
  document.getElementById('winnerText').textContent = text;
  document.getElementById('game').inert = true;
  overlay.hidden = false;
  document.getElementById('playAgainBtn').focus();
};

Ludo.hideWinner = function () {
  document.getElementById('winnerOverlay').hidden = true;
  document.getElementById('game').inert = false;
};

// Brings the whole screen in line with the state, and saves it.
Ludo.renderGame = function () {
  const state = Ludo.state, player = Ludo.currentPlayer();
  document.getElementById('turnTitle').textContent = `${player.name}'s turn`;
  Ludo.setTone(document.getElementById('game'), player.color);
  Ludo.syncDice();
  Ludo.placePieces();
  Ludo.highlightMovable(player, state.roll !== null && !Ludo.busy ? Ludo.movablePieces(player, state.roll) : []);
  Ludo.saveState();
};