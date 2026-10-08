// setup.js — the lineup screen: full-bleed seats, live and reactive.
// The four seats are permanent elements (one per colour); every change updates and animates them in place rather
// than rebuilding the DOM, so picking a colour or a count visibly moves and resizes seats instead of redrawing them.
(function setupScreen() {
  const saved = Ludo.loadState();
  if (!saved) { location.replace('index.html'); return; }
  Ludo.setupCfg = saved.setupCfg;

  const countRow = document.getElementById('countRow');
  const teamToggle = document.getElementById('teamToggle');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const seatEls = {}; // colour -> seat element

  function buildSeats() {
    const lineup = document.getElementById('lineup');
    Ludo.COLORS.forEach(color => {
      const seat = document.createElement('div');
      seat.className = `seat tone-${color}`;

      const icon = document.createElement('span');
      icon.className = 'seat-icon';
      icon.textContent = '♟';
      icon.setAttribute('aria-hidden', 'true');

      const extra = document.createElement('div');
      extra.className = 'seat-extra';

      const name = document.createElement('input');
      name.className = 'seat-name';
      name.maxLength = Ludo.MAX_NAME_LENGTH;
      name.autocomplete = 'off';
      name.spellcheck = false;
      name.addEventListener('input', () => {
        Ludo.setupCfg.names[+name.dataset.seat] = name.value;
        Ludo.saveState();
      });

      seat.append(icon, extra, name);
      lineup.appendChild(seat);
      seatEls[color] = seat;
    });
  }

  function renderControls() {
    const { count, team } = Ludo.setupCfg;
    countRow.querySelectorAll('.count-opt').forEach(button => {
      const selected = count === +button.dataset.count;
      button.classList.toggle('sel', selected);
      button.setAttribute('aria-pressed', selected);
    });

    const capable = Ludo.teamCapable(count);
    teamToggle.hidden = !capable;
    if (capable) {
      const perTeam = count / 2;
      teamToggle.textContent = `Teams · ${perTeam}v${perTeam}`;
      teamToggle.classList.toggle('sel', team);
      teamToggle.setAttribute('aria-pressed', team);
    }
  }

  function renderSeats() {
    const { count, names } = Ludo.setupCfg;
    const order = Ludo.seatColors(); // all four colours in play order
    Ludo.COLORS.forEach(color => {
      const seat = seatEls[color], seatNo = order.indexOf(color), active = seatNo < count;
      seat.classList.toggle('active', active);
      seat.inert = !active; // an empty seat can be neither clicked, tabbed to nor read out
      seat.style.order = active ? seatNo : order.length + Ludo.COLORS.indexOf(color);
      if (!active) return;

      const name = seat.querySelector('.seat-name');
      name.dataset.seat = seatNo;
      name.placeholder = Ludo.defaultName(seatNo);
      name.value = names[seatNo] || '';
      name.setAttribute('aria-label', `Name of seat ${seatNo + 1}`);

      const extra = seat.querySelector('.seat-extra');
      extra.replaceChildren();
      const team = Ludo.teamOf(seatNo);
      if (team) {
        const label = document.createElement('span');
        label.className = 'seat-team';
        label.textContent = `Team ${team}`;
        extra.appendChild(label);
      }
      if (Ludo.vsComputer() && seatNo === 0) extra.appendChild(buildColorPicker());
    });
  }

  function buildColorPicker() {
    const picker = document.createElement('div');
    picker.className = 'seat-colors';
    picker.setAttribute('role', 'group');
    picker.setAttribute('aria-label', 'Your colour');
    Ludo.COLORS.forEach(color => {
      const selected = Ludo.setupCfg.myColor === color;
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `color-dot tone-${color}` + (selected ? ' sel' : '');
      dot.setAttribute('aria-label', `Play as ${color}`);
      dot.setAttribute('aria-pressed', selected);
      dot.addEventListener('click', () => change(() => { Ludo.setupCfg.myColor = color; }));
      picker.appendChild(dot);
    });
    return picker;
  }

  // Every control change goes through here: measure, mutate, persist, redraw, then slide each seat from where it was.
  function change(mutate) {
    const before = {};
    Ludo.COLORS.forEach(color => { before[color] = seatEls[color].getBoundingClientRect().left; });
    mutate();
    Ludo.saveState();
    renderControls();
    renderSeats();
    if (reduceMotion.matches) return;
    Ludo.COLORS.forEach(color => {
      const shift = before[color] - seatEls[color].getBoundingClientRect().left;
      if (Math.abs(shift) > 1) {
        seatEls[color].animate(
          [{ transform: `translateX(${shift}px)` }, { transform: 'none' }],
          { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)' }
        );
      }
    });
  }

  countRow.addEventListener('click', event => {
    const button = event.target.closest('.count-opt');
    if (!button) return;
    change(() => {
      Ludo.setupCfg.count = +button.dataset.count;
      if (!Ludo.teamCapable(Ludo.setupCfg.count)) Ludo.setupCfg.team = false;
    });
  });

  teamToggle.addEventListener('click', () => change(() => { Ludo.setupCfg.team = !Ludo.setupCfg.team; }));

  document.getElementById('startGameBtn').addEventListener('click', () => {
    Ludo.state = Ludo.newGame();
    Ludo.saveState();
    location.href = 'game.html';
  });

  buildSeats();
  renderControls();
  renderSeats();
})();