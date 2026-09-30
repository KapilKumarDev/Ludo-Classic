// home.js — mode selection screen

document.querySelectorAll('.home-panel').forEach(panel=>{
  panel.addEventListener('click', ()=>{
    Ludo.clearState();
    Ludo.resetSetup(panel.dataset.mode);
    Ludo.saveState();
    location.href = 'setup.html';
  });
});