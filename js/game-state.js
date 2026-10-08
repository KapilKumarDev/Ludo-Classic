// game-state.js — queries over the running game (Ludo.state), used only during play.

Ludo.busy = false; // true while a roll or a move plays out; input is ignored meanwhile. Never saved.

Ludo.currentPlayer = () => Ludo.state.players[Ludo.state.turn];

// The player seated in a corner, or undefined when that corner is empty.
Ludo.playerInSlot = slot => Ludo.state.players.find(player => player.slot === slot);

Ludo.teamMates = player => Ludo.state.players.filter(other => other !== player && other.team && other.team === player.team);

Ludo.allFinished = player => player.pieces.every(piece => piece.steps === Ludo.FINISH_STEPS);