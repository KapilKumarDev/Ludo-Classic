// game.js — the game screen: start or resume, leave, play again.
(function gameScreen() {
  // Draws the game in Ludo.state and carries on from wherever it stands.
  function enterGame() {
    Ludo.buildBoardDOM();
    Ludo.buildDice();
    Ludo.renderGame();
    if (Ludo.state.over) Ludo.showWinner(Ludo.state.winnerText);
    else if (Ludo.state.roll !== null) Ludo.resolveRoll(Ludo.currentPlayer());
    else Ludo.scheduleComputerTurn();
  }

  const saved = Ludo.loadState();
  if (!saved || !saved.state) { location.replace('index.html'); return; }
  Ludo.setupCfg = saved.setupCfg;
  Ludo.state = saved.state;

  const quitDialog = document.getElementById('quitDialog');
  document.getElementById('quitBtn').addEventListener('click', () => quitDialog.showModal());
  document.getElementById('stayBtn').addEventListener('click', () => quitDialog.close());
  document.getElementById('leaveBtn').addEventListener('click', () => {
    Ludo.clearState();
    location.href = 'index.html';
  });

  // Same players, same seats: a new game from the setup that started this one.
  document.getElementById('playAgainBtn').addEventListener('click', () => {
    Ludo.state = Ludo.newGame();
    Ludo.hideWinner();
    enterGame();
  });

  enterGame();
})();