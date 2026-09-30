// game-state.js — live game state + queries over it (used only during play)
Ludo.state = null;

Ludo.currentPlayer = function(){ return Ludo.state.players[Ludo.state.turn]; };
// The player seated in a corner ('tl'|'tr'|'bl'|'br'), or undefined when that corner is empty.
Ludo.playerInSlot = function(slot){ return Ludo.state.players.find(p => p.slot===slot); };
Ludo.teamMates = function(player){
  return Ludo.state.players.filter(p => p!==player && p.team && p.team===player.team);
};
Ludo.allFinished = function(player){
  return player.pieces.every(pc => pc.steps===Ludo.FINISH_STEPS);
};