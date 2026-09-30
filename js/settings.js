// settings.js — settings screen: one option group per setting, saved the moment a choice is made.
// Each option previews itself with the same .token shape the board draws, so what you pick is what you get.

(function init(){
  const row = document.getElementById('pieceStyleRow');
  Object.entries(Ludo.PIECE_STYLES).forEach(([style, text])=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'piece-opt';
    btn.dataset.style = style;

    const token = document.createElement('span');
    token.className = 'token '+style;
    token.setAttribute('aria-hidden','true');

    const label = document.createElement('span');
    label.className = 'piece-label';
    label.textContent = text;

    btn.append(token, label);
    row.appendChild(btn);
  });
  render();
})();

document.getElementById('settingsBack').addEventListener('click', ()=>{ location.href = 'index.html'; });

document.getElementById('pieceStyleRow').addEventListener('click', (e)=>{
  const btn = e.target.closest('.piece-opt');
  if(!btn) return;
  Ludo.settings.pieceStyle = btn.dataset.style;
  Ludo.saveSettings();
  render();
});

function render(){
  document.querySelectorAll('#pieceStyleRow .piece-opt').forEach(btn=>{
    const on = Ludo.settings.pieceStyle === btn.dataset.style;
    btn.classList.toggle('sel', on);
    btn.setAttribute('aria-pressed', on);
  });
}