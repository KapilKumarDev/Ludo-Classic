// state.js — setup configuration (used before a game exists)
Ludo.setupCfg = { mode:'local', count:4, team:false, myColor:'red', names:{} };

Ludo.resetSetup = function(mode){
  Ludo.setupCfg = { mode, count:4, team:false, myColor:'red', names:{} };
};

// Seat colors for all four seats, in play order. Computer mode puts your color first.
Ludo.seatColors = function(){
  const cfg = Ludo.setupCfg;
  return cfg.mode==='computer'
    ? [cfg.myColor, ...Ludo.COLORS.filter(c=>c!==cfg.myColor)]
    : Ludo.COLORS.slice();
};

// Decide which color sits in which corner. The "first" color always goes bottom-left.
Ludo.assignSlots = function(){
  const cfg = Ludo.setupCfg;
  const order = Ludo.seatColors().slice(0, cfg.count);
  let slots;
  if(cfg.count===2) slots = ['bl','tr'];
  else if(cfg.count===3) slots = ['bl','tl','tr'];
  else slots = ['bl','tl','tr','br'];
  const map = {};
  order.forEach((color,i)=>{ map[slots[i]] = color; });
  return { order, map };
};

Ludo.defaultName = function(i){
  return Ludo.setupCfg.mode==='computer' && i>0 ? `Computer ${i}` : `Player ${i+1}`;
};

// Which player counts currently support teams. One place to extend if a
// future count (e.g. 6 players) should offer teams too - the setup screen
// reads this rather than hardcoding which counts have a team option.
Ludo.teamCapable = function(count){
  return count===4;
};

// Teams only exist where teamCapable() says so: seats 0/2 vs 1/3.
Ludo.teamOf = function(i){
  return Ludo.setupCfg.team && Ludo.teamCapable(Ludo.setupCfg.count) ? (i%2===0 ? 'A' : 'B') : null;
};

Ludo.startGame = function(){
  const cfg = Ludo.setupCfg;
  const { order, map } = Ludo.assignSlots();
  const players = order.map((color,i)=>({
    color,
    slot: Object.keys(map).find(k=>map[k]===color),
    name: (cfg.names[i] && cfg.names[i].trim()) || Ludo.defaultName(i),
    isAI: cfg.mode==='computer' && i>0,
    team: Ludo.teamOf(i),
    pieces: [0,1,2,3].map(pid => ({ id:pid, steps:-1 })) // -1 = still in base
  }));
  Ludo.state = {
    players, turn:0, dice:0, consecSix:0, rolled:false,
    animating:false, over:false
  };
  return Ludo.state;
};