// storage.js — single owner of cross-page persistence.
// Game state lives in sessionStorage: it survives refresh, and is cleared when the tab closes or a game ends.
// Settings live in localStorage: they are the player's preferences, so they outlive any one game.
window.Ludo = window.Ludo || {};

Ludo.STORAGE_KEY = 'ludoState';

Ludo.saveState = function(){
  try{
    sessionStorage.setItem(Ludo.STORAGE_KEY, JSON.stringify({
      setupCfg: Ludo.setupCfg,
      state: Ludo.state
    }));
  } catch(e){ /* storage unavailable (private mode, quota) — game still works, just won't resume */ }
};

Ludo.loadState = function(){
  try{
    const raw = sessionStorage.getItem(Ludo.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
};

Ludo.clearState = function(){
  try{ sessionStorage.removeItem(Ludo.STORAGE_KEY); } catch(e){ /* ignore */ }
};

Ludo.SETTINGS_KEY = 'ludoSettings';

// Whatever is stored is checked against what the game can actually draw, so a stale or hand-edited value
// falls back to the default instead of reaching the board.
Ludo.loadSettings = function(){
  const settings = { ...Ludo.DEFAULT_SETTINGS };
  try{
    const saved = JSON.parse(localStorage.getItem(Ludo.SETTINGS_KEY));
    if(saved && Object.hasOwn(Ludo.PIECE_STYLES, saved.pieceStyle)) settings.pieceStyle = saved.pieceStyle;
  } catch(e){ /* storage unavailable or unreadable — defaults apply */ }
  return settings;
};

Ludo.saveSettings = function(){
  try{ localStorage.setItem(Ludo.SETTINGS_KEY, JSON.stringify(Ludo.settings)); }
  catch(e){ /* storage unavailable — the choice holds for this page only */ }
};

Ludo.settings = Ludo.loadSettings();