// turn.js — a turn from roll to move to the next player: roll -> (move) -> end turn.

Ludo.randomFace = () => 1 + Math.floor(Math.random() * Ludo.DICE_MAX);

// Whether `player` is a person whose input the game is waiting on right now.
Ludo.isHumanTurn = player => !Ludo.busy && !Ludo.state.over && !player.isComputer && Ludo.currentPlayer() === player;

Ludo.onDiceClick = function (player) {
  if (Ludo.isHumanTurn(player) && Ludo.state.roll === null) Ludo.rollDice(player);
};

Ludo.onPieceClick = function (player, piece) {
  const { roll } = Ludo.state;
  if (!Ludo.isHumanTurn(player) || roll === null) return;
  if (Ludo.movablePieces(player, roll).includes(piece)) Ludo.movePiece(player, piece, roll);
};

Ludo.rollDice = function (player) {
  const state = Ludo.state, die = Ludo.diceEls[player.color];
  Ludo.busy = true;
  Ludo.syncDice();
  die.classList.add('rolling');
  // The die cycles through faces while it tumbles, so the roll reads as random rather than instant.
  const tumble = setInterval(() => Ludo.paintDie(player, Ludo.randomFace()), Ludo.TIMING.faceSwap);

  setTimeout(() => {
    clearInterval(tumble);
    die.classList.remove('rolling');
    let roll = Ludo.randomFace();
    if (roll === Ludo.DICE_MAX) {
      state.sixes++;
      if (state.sixes === Ludo.MAX_SIXES) roll = 0; // a third six in a row forfeits the turn
    } else {
      state.sixes = 0;
    }
    state.roll = roll;
    Ludo.busy = false;
    Ludo.syncDice();
    Ludo.saveState();
    Ludo.resolveRoll(player);
  }, Ludo.TIMING.rollSpin);
};

// What follows a roll that is on the table: a roll nobody can use (no legal move, or a forfeited third six) ends the
// turn; a live one waits for a move, which the computer picks for itself. A saved game resumes through here too,
// since a refresh lands between the roll and whatever would have followed it.
Ludo.resolveRoll = function (player) {
  const { roll } = Ludo.state;
  Ludo.paintDie(player, Ludo.faceFor(roll));
  const movable = Ludo.movablePieces(player, roll);
  if (movable.length === 0) {
    setTimeout(() => Ludo.endTurn(roll === Ludo.DICE_MAX), Ludo.TIMING.deadRoll);
    return;
  }
  Ludo.highlightMovable(player, movable);
  if (player.isComputer) {
    setTimeout(() => Ludo.movePiece(player, Ludo.pickComputerMove(player, movable, roll), roll), Ludo.TIMING.computerThink);
  }
};

// Applies the move to the state at once, then shows it. Input stays shut (busy) until the turn has passed or the
// game is won.
Ludo.movePiece = async function (player, piece, roll) {
  const state = Ludo.state, from = piece.steps;
  Ludo.busy = true;
  Ludo.clearMovable();
  piece.steps = Ludo.landingSteps(piece, roll);
  let extraTurn = roll === Ludo.DICE_MAX || piece.steps === Ludo.FINISH_STEPS;
  await Ludo.walkPiece(player, piece, from);

  if (Ludo.isOnRing(piece) && Ludo.capturePiecesAt(player, Ludo.ringIndexOf(player, piece))) {
    extraTurn = true;
    Ludo.placePieces();
  }

  const win = Ludo.checkWin(player);
  if (win) {
    state.over = true;
    state.winnerText = win.text;
    Ludo.busy = false;
    Ludo.showWinner(win.text);
    Ludo.saveState();
    return;
  }
  await Ludo.wait(Ludo.TIMING.afterMove);
  Ludo.endTurn(extraTurn);
};

Ludo.endTurn = function (extraTurn) {
  const state = Ludo.state;
  Ludo.busy = false;
  state.roll = null;
  if (!extraTurn) {
    state.sixes = 0;
    state.turn = (state.turn + 1) % state.players.length;
  }
  Ludo.renderGame();
  Ludo.scheduleComputerTurn();
};

Ludo.scheduleComputerTurn = function () {
  const player = Ludo.currentPlayer();
  if (player.isComputer && !Ludo.state.over) setTimeout(() => Ludo.rollDice(player), Ludo.TIMING.computerRoll);
};