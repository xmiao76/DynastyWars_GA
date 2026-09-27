const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const r = await p.evaluate(() => {
    const c = document.createElement('canvas').getContext('2d');
    const m = (f, s) => { c.font = f; return Math.round(c.measureText(s).width * 10) / 10 };
    return {
      a: m('9px sans-serif', 'GAMEPAD      A  ATTACK      B  JUMP      X  SPECIAL      START  CONFIRM / PAUSE'),
      b: m('9px sans-serif', 'GAMEPAD    A  ATTACK    B  JUMP    X  SPECIAL    START  CONFIRM / PAUSE'),
      c: m('9px sans-serif', 'GAMEPAD:   A  ATTACK   B  JUMP   X  SPECIAL   START  CONFIRM + PAUSE'),
      d: m('9px sans-serif', 'PAD   A  ATTACK   B  JUMP   X  SPECIAL   START  CONFIRM / PAUSE'),
      e: m('8px sans-serif', 'GAMEPAD    A  ATTACK    B  JUMP    X  SPECIAL    START  CONFIRM / PAUSE'),
      f: m('9px sans-serif', 'GAMEPAD   A  ATTACK   B  JUMP   X  SPECIAL   START  CONFIRM / PAUSE'),
      sp: m('9px sans-serif', ' '),
      h1: m('10px sans-serif', 'PRESS P OR START TO RESUME'),
      h0: m('10px sans-serif', 'PRESS P TO RESUME'),
    };
  });
  console.log(JSON.stringify(r)); await b.close();
})();

