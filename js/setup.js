// setup.js — lineup screen: full-bleed seats, live and reactive.
// Seats are 4 permanent elements (one per color); every change updates and
// animates them in place rather than rebuilding the DOM, so picking a color
// or a count visibly moves and resizes seats instead of just redrawing them.

let seatEls = {};

(function init(){
  const saved = Ludo.loadState();
  if(!saved || !saved.setupCfg){ location.href = 'index.html'; return; }
  Ludo.setupCfg = saved.setupCfg;
  buildSeats();
  render();
})();

document.getElementById('setupBack').addEventListener('click', ()=>{ location.href = 'index.html'; });

document.getElementById('countRow').addEventListener('click', (e)=>{
  const btn = e.target.closest('.count-opt');
  if(!btn) return;
  change(()=>{
    Ludo.setupCfg.count = +btn.dataset.count;
    if(!Ludo.teamCapable(Ludo.setupCfg.count)) Ludo.setupCfg.team = false;
  });
});

document.getElementById('teamToggle').addEventListener('click', ()=>{
  if(!Ludo.teamCapable(Ludo.setupCfg.count)) return;
  change(()=>{ Ludo.setupCfg.team = !Ludo.setupCfg.team; });
});

document.getElementById('startGameBtn').addEventListener('click', ()=>{
  Ludo.startGame();
  Ludo.saveState();
  location.href = 'game.html';
});

// Every control change goes through here: measure, mutate, persist, redraw, animate the move.
function change(mutate){
  const before = {};
  Ludo.COLORS.forEach(c => before[c] = seatEls[c].getBoundingClientRect());
  mutate();
  Ludo.saveState();
  render();
  Ludo.COLORS.forEach(c=>{
    const el = seatEls[c];
    const after = el.getBoundingClientRect();
    const dx = before[c].left - after.left;
    if (Math.abs(dx) > 1 && el.animate) {
      el.animate(
        [{ transform:`translateX(${dx}px)` }, { transform:'none' }],
        { duration:320, easing:'cubic-bezier(.4,0,.2,1)' }
      );
    }
  });
}

function buildSeats(){
  const lineup = document.getElementById('lineup');
  lineup.innerHTML = '';
  seatEls = {};
  Ludo.COLORS.forEach(color=>{
    const seat = document.createElement('div');
    seat.className = `seat tone-${color}`;

    const icon = document.createElement('span');
    icon.className = 'seat-icon'; icon.textContent = '♟'; icon.setAttribute('aria-hidden','true');

    const extra = document.createElement('div');
    extra.className = 'seat-extra';

    const name = document.createElement('input');
    name.className = 'seat-name';
    name.addEventListener('input', ()=>{
      Ludo.setupCfg.names[+name.dataset.pos] = name.value;
      Ludo.saveState();
    });

    seat.append(icon, extra, name);
    lineup.appendChild(seat);
    seatEls[color] = seat;
  });
}

function render(){
  renderCount();
  renderSeats();
}

function renderCount(){
  const cfg = Ludo.setupCfg;
  document.querySelectorAll('#countRow .count-opt').forEach(btn=>{
    const on = cfg.count === +btn.dataset.count;
    btn.classList.toggle('sel', on);
    btn.setAttribute('aria-pressed', on);
  });

  const toggle = document.getElementById('teamToggle');
  const capable = Ludo.teamCapable(cfg.count);
  toggle.hidden = !capable;
  if(capable){
    const perTeam = cfg.count/2; // e.g. "2v2" at 4 players; scales on its own if teamCapable ever allows other counts
    toggle.textContent = `Teams · ${perTeam}v${perTeam}`;
    toggle.classList.toggle('sel', cfg.team);
    toggle.setAttribute('aria-pressed', cfg.team);
  }
}

function renderSeats(){
  const cfg = Ludo.setupCfg;
  const order = Ludo.seatColors(); // all 4 colors, current play order
  Ludo.COLORS.forEach(color=>{
    const seat = seatEls[color];
    const pos = order.indexOf(color);
    const active = pos < cfg.count;
    seat.classList.toggle('active', active);
    seat.style.order = active ? pos : 4 + Ludo.COLORS.indexOf(color);

    const name = seat.querySelector('.seat-name');
    name.tabIndex = active ? 0 : -1;
    if(!active) return;

    name.dataset.pos = pos;
    name.placeholder = Ludo.defaultName(pos);
    name.value = cfg.names[pos] || '';

    const extra = seat.querySelector('.seat-extra');
    extra.innerHTML = '';
    const team = Ludo.teamOf(pos);
    if(team){
      const label = document.createElement('span');
      label.className = 'seat-team'; label.textContent = `Team ${team}`;
      extra.appendChild(label);
    }
    if(cfg.mode==='computer' && pos===0) extra.appendChild(buildColorPicker());
  });
}

function buildColorPicker(){
  const wrap = document.createElement('div');
  wrap.className = 'seat-colors';
  wrap.setAttribute('role','group'); wrap.setAttribute('aria-label','Your color');
  Ludo.COLORS.forEach(c=>{
    const on = Ludo.setupCfg.myColor===c;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `color-dot tone-${c}`+(on?' sel':'');
    dot.setAttribute('aria-label', `Play as ${c}`);
    dot.setAttribute('aria-pressed', on);
    dot.addEventListener('click', ()=>change(()=>{ Ludo.setupCfg.myColor = c; }));
    wrap.appendChild(dot);
  });
  return wrap;
}