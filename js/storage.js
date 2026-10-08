// storage.js — the single owner of cross-page persistence.
// A game lives in sessionStorage: it survives a refresh and is gone when the tab closes or the game ends.
// Settings live in localStorage: they are the player's preferences and outlive any one game.
window.Ludo = window.Ludo || {};

// Change the suffix whenever the shape of a saved game changes, so an old save is ignored rather than misread.
Ludo.STATE_KEY = 'ludoState.v2';
Ludo.SETTINGS_KEY = 'ludoSettings';

(function () {
  const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;

  const validSetup = cfg => !!cfg
    && ['computer', 'local'].includes(cfg.mode)
    && isInt(cfg.count, 2, 4)
    && typeof cfg.team === 'boolean'
    && Ludo.COLORS.includes(cfg.myColor)
    && !!cfg.names && Object.values(cfg.names).every(name => typeof name === 'string');

  const validPlayer = player => !!player
    && Ludo.COLORS.includes(player.color)
    && Ludo.SLOTS.includes(player.slot)
    && typeof player.name === 'string'
    && typeof player.isComputer === 'boolean'
    && [null, 'A', 'B'].includes(player.team)
    && Array.isArray(player.pieces) && player.pieces.length === Ludo.PIECES_PER_PLAYER
    && player.pieces.every((piece, id) => piece.id === id && isInt(piece.steps, Ludo.IN_YARD, Ludo.FINISH_STEPS));

  const validState = state => !!state
    && Array.isArray(state.players) && isInt(state.players.length, 2, 4) && state.players.every(validPlayer)
    && isInt(state.turn, 0, state.players.length - 1)
    && (state.roll === null || isInt(state.roll, 0, Ludo.DICE_MAX))
    && isInt(state.sixes, 0, Ludo.MAX_SIXES - 1)
    && typeof state.over === 'boolean' && typeof state.winnerText === 'string';

  // No game is saved while a move plays out (callers save only between moves), so a refresh mid-move returns to the
  // last save, from before the move. The home and setup screens have no game: `state` is null there.
  Ludo.saveState = function () {
    try {
      sessionStorage.setItem(Ludo.STATE_KEY, JSON.stringify({ setupCfg: Ludo.setupCfg, state: Ludo.state }));
    } catch { /* storage unavailable (private mode, quota): the game still works, it just won't resume */ }
  };

  // { setupCfg, state } as saved, or null when nothing usable is there. `state` is null when no game has started.
  Ludo.loadState = function () {
    try {
      const saved = JSON.parse(sessionStorage.getItem(Ludo.STATE_KEY));
      if (!saved || !validSetup(saved.setupCfg)) return null;
      return { setupCfg: saved.setupCfg, state: validState(saved.state) ? saved.state : null };
    } catch { return null; }
  };

  Ludo.clearState = function () {
    try { sessionStorage.removeItem(Ludo.STATE_KEY); } catch { /* nothing to clear */ }
  };

  // Whatever is stored is checked against what the game can draw, so a stale or hand-edited value falls back to
  // the default instead of reaching the board.
  Ludo.loadSettings = function () {
    const settings = { ...Ludo.DEFAULT_SETTINGS };
    try {
      const saved = JSON.parse(localStorage.getItem(Ludo.SETTINGS_KEY));
      if (saved && Object.hasOwn(Ludo.PIECE_STYLES, saved.pieceStyle)) settings.pieceStyle = saved.pieceStyle;
    } catch { /* storage unavailable or unreadable: defaults apply */ }
    return settings;
  };

  Ludo.saveSettings = function () {
    try { localStorage.setItem(Ludo.SETTINGS_KEY, JSON.stringify(Ludo.settings)); }
    catch { /* storage unavailable: the choice holds for this page only */ }
  };
})();

Ludo.settings = Ludo.loadSettings();