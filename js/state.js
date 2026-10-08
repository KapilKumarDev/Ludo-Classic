// state.js — the setup configuration (before a game exists) and how it becomes a game.
// Queries over a running game are in game-state.js.

Ludo.state = null;    // the game in play, from Ludo.newGame(); null on the screens before one starts
Ludo.setupCfg = null; // set by the home screen, or read back from storage by the screens after it

Ludo.defaultSetup = mode => ({ mode, count: 4, team: false, myColor: 'red', names: {} });

Ludo.vsComputer = () => Ludo.setupCfg.mode === 'computer';

// Colours of all four seats, in play order. Against the computer, yours comes first.
Ludo.seatColors = function () {
  const { myColor } = Ludo.setupCfg;
  return Ludo.vsComputer()
    ? [myColor, ...Ludo.COLORS.filter(color => color !== myColor)]
    : Ludo.COLORS.slice();
};

Ludo.defaultName = function (seat) {
  return Ludo.vsComputer() && seat > 0 ? `Computer ${seat}` : `Player ${seat + 1}`;
};

// Teams exist only for the counts listed here: seats 0 and 2 against 1 and 3.
Ludo.teamCapable = count => count === 4;

Ludo.teamOf = function (seat) {
  const { team, count } = Ludo.setupCfg;
  return team && Ludo.teamCapable(count) ? (seat % 2 === 0 ? 'A' : 'B') : null;
};

// A fresh game for the current setup. `roll` is null until the mover rolls; `sixes` counts sixes in a row.
Ludo.newGame = function () {
  const cfg = Ludo.setupCfg, corners = Ludo.SEATING[cfg.count];
  const players = Ludo.seatColors().slice(0, cfg.count).map((color, seat) => ({
    color,
    slot: corners[seat],
    name: (cfg.names[seat] || '').trim() || Ludo.defaultName(seat),
    isComputer: Ludo.vsComputer() && seat > 0,
    team: Ludo.teamOf(seat),
    pieces: Array.from({ length: Ludo.PIECES_PER_PLAYER }, (_, id) => ({ id, steps: Ludo.IN_YARD }))
  }));
  return { players, turn: 0, roll: null, sixes: 0, over: false, winnerText: '' };
};