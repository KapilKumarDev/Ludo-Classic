// home.js — mode selection: picking a mode starts a fresh setup for it.

document.querySelectorAll('.home-panel').forEach(panel => {
  panel.addEventListener('click', () => {
    Ludo.setupCfg = Ludo.defaultSetup(panel.dataset.mode);
    Ludo.saveState();
    location.href = 'setup.html';
  });
});