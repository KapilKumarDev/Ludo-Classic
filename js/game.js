// game.js — board screen: boot/resume, quit, play again

(function init(){
  const saved = Ludo.loadState();
  if(!saved || !saved.state){ location.href = 'index.html'; return; }
  Ludo.setupCfg = saved.setupCfg;
  Ludo.state = saved.state;

  Ludo.buildBoardDOM();
  Ludo.buildDice();
  Ludo.renderGame();

  if(Ludo.state.over){
    Ludo.showWinner(Ludo.state.winnerText);
  } else if(Ludo.state.rolled){
    Ludo.resolveRoll(Ludo.currentPlayer());
  } else {
    Ludo.scheduleAITurnIfNeeded();
  }
})();

document.getElementById('quitBtn').addEventListener('click', ()=>{
  Ludo.clearState();
  location.href = 'index.html';
});

document.getElementById('playAgainBtn').addEventListener('click', ()=>{
  Ludo.clearState();
  location.href = 'index.html';
});