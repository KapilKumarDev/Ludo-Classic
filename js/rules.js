// rules.js — the game rules as pure logic over Ludo.state. No DOM.

// Whether `piece` may use `roll`. A roll of 0 (a forfeited third six) moves nothing; one that would overshoot the
// centre is no use, even a six.
Ludo.canMove = function (piece, roll) {
  if (roll < 1) return false;
  if (piece.steps === Ludo.IN_YARD) return roll === Ludo.DICE_MAX;
  return piece.steps + roll <= Ludo.FINISH_STEPS;
};

Ludo.movablePieces = (player, roll) => player.pieces.filter(piece => Ludo.canMove(piece, roll));

// Where a piece ends up after using `roll`: a piece leaving its yard lands on its start cell, whatever the roll.
Ludo.landingSteps = (piece, roll) => piece.steps === Ludo.IN_YARD ? 0 : piece.steps + roll;

Ludo.isOnRing = piece => piece.steps >= 0 && piece.steps < Ludo.HOME_ENTRY_STEP;

// Index on the shared ring of the cell `player` stands on after `steps` steps from their start.
Ludo.ringIndexAt = (player, steps) => (Ludo.START_INDEX[player.slot] + steps) % Ludo.RING_LENGTH;

Ludo.ringIndexOf = (player, piece) => Ludo.ringIndexAt(player, piece.steps);

// Teammates never capture each other.
Ludo.isOpponent = (player, other) => other !== player && !(other.team && other.team === player.team);

// The opposing pieces `player` would send home by landing on `ringIndex`. A safe square protects whoever stands there.
Ludo.victimsAt = function (player, ringIndex) {
  if (Ludo.SAFE_INDICES.has(ringIndex)) return [];
  return Ludo.state.players
    .filter(other => Ludo.isOpponent(player, other))
    .flatMap(other => other.pieces.filter(piece => Ludo.isOnRing(piece) && Ludo.ringIndexOf(other, piece) === ringIndex));
};

// Sends those pieces back to their yards. True if there were any.
Ludo.capturePiecesAt = function (player, ringIndex) {
  const victims = Ludo.victimsAt(player, ringIndex);
  victims.forEach(piece => { piece.steps = Ludo.IN_YARD; });
  return victims.length > 0;
};

// { text } once `player` has won, otherwise null. A team wins when both its players have finished.
Ludo.checkWin = function (player) {
  if (!Ludo.allFinished(player)) return null;
  if (!player.team) return { text: `${player.name} wins!` };
  const [mate] = Ludo.teamMates(player);
  return Ludo.allFinished(mate) ? { text: `Team ${player.team} — ${player.name} & ${mate.name} — wins!` } : null;
};