// storage.js — single owner of cross-page persistence (sessionStorage).
// Survives refresh; cleared when the tab closes or a game ends.
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