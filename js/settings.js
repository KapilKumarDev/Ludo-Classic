// settings.js — the settings screen: one option group per setting, saved the moment a choice is made.
// Each option previews itself with the same .token shape the board draws, so what you pick is what you get.
(function settingsScreen() {
  const row = document.getElementById('pieceStyleRow');

  Object.entries(Ludo.PIECE_STYLES).forEach(([style, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'piece-opt';
    button.dataset.style = style;

    const token = document.createElement('span');
    token.className = 'token ' + style;
    token.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'piece-label';
    text.textContent = label;

    button.append(token, text);
    row.appendChild(button);
  });

  function renderSelection() {
    row.querySelectorAll('.piece-opt').forEach(button => {
      const selected = Ludo.settings.pieceStyle === button.dataset.style;
      button.classList.toggle('sel', selected);
      button.setAttribute('aria-pressed', selected);
    });
  }

  row.addEventListener('click', event => {
    const button = event.target.closest('.piece-opt');
    if (!button) return;
    Ludo.settings.pieceStyle = button.dataset.style;
    Ludo.saveSettings();
    renderSelection();
  });

  renderSelection();
})();