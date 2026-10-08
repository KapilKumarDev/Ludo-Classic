// ai.js — how the computer chooses among its legal moves: finish a piece, else capture, else bring one out,
// else advance the piece that has gone furthest. It does not look ahead or weigh danger.
(function () {
  const SCORE = { finish: 100, capture: 80, leaveYard: 40, advance: 20 };
  const PROGRESS_WEIGHT = 0.3; // among plain advances, a piece further along scores a little higher

  function scoreMove(player, piece, roll) {
    const to = Ludo.landingSteps(piece, roll);
    if (to === Ludo.FINISH_STEPS) return SCORE.finish;
    if (piece.steps === Ludo.IN_YARD) return SCORE.leaveYard;
    // Only a landing on the shared ring can capture; a step into the home lane never does.
    const captures = to < Ludo.HOME_ENTRY_STEP && Ludo.victimsAt(player, Ludo.ringIndexAt(player, to)).length > 0;
    return captures ? SCORE.capture : SCORE.advance + piece.steps * PROGRESS_WEIGHT;
  }

  // The best of `movable` (never empty) for `roll`; the first of equals.
  Ludo.pickComputerMove = function (player, movable, roll) {
    let best = movable[0], bestScore = scoreMove(player, best, roll);
    for (const piece of movable.slice(1)) {
      const score = scoreMove(player, piece, roll);
      if (score > bestScore) { best = piece; bestScore = score; }
    }
    return best;
  };
})();