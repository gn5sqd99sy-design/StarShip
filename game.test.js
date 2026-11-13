"use strict";

// Testid käivitavad sama game.js faili; mängukoodis pole testidele eraldi loogikat.
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const source = fs.readFileSync(`${__dirname}/game.js`, 'utf8');

function setup() {
  const events = {};
  const frames = [];
  const drawing = [];
  const context = {
    fillRect(...args) { drawing.push(['rect', this.fillStyle, ...args]); },
    fillText(...args) { drawing.push(['text', ...args]); }
  };
  const canvas = { width: 800, height: 600, getContext(type) { assert.equal(type, '2d'); return context; } };
  const button = { hidden: true, addEventListener(name, fn) { events[name] = fn; } };
  const sandbox = vm.createContext({
    document: {
      querySelector(selector) {
        if (selector === '#game') return canvas;
        if (selector === '#restart') return button;
        throw new Error(`Tundmatu element: ${selector}`);
      },
      addEventListener(name, fn) { events[name] = fn; }
    },
    window: { addEventListener(name, fn) { events[name] = fn; } },
    requestAnimationFrame(fn) { frames.push(fn); }
  });
  const run = code => vm.runInContext(code, sandbox, { timeout: 1000 });
  vm.runInContext(source, sandbox, { filename: 'game.js', timeout: 1000 });
  const press = (code, repeat = false, target = null) => {
    let prevented = false;
    events.keydown({ code, repeat, target, preventDefault() { prevented = true; } });
    return prevented;
  };
  return { run, press, events, frames, drawing, button, context };
}
function near(actual, expected) { assert(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`); }

test('Algseis: laev, kolm elu ja tühi mänguväli', () => {
  const { run } = setup();
  assert.equal(run('player.w === 32 && player.h === 32 && player.speed === 280'), true);
  assert.equal(run('player.x === 384 && player.y === 536'), true);
  assert.equal(run('lives === 3 && score === 0 && bullets.length === 0 && enemies.length === 0 && !paused && !gameOver'), true);
});
test('Suurendatud Canvas: 800 × 600 ja õiged HTML-elemendid', () => {
  const html = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
  assert.match(html, /<canvas[^>]*id="game"[^>]*width="800"[^>]*height="600"/);
  assert.match(html, /<button[^>]*id="restart"[^>]*hidden/);
  assert.match(html, /<script src="game.js" defer>/);
});
test('Nooleklahvid liigutavad laeva mõlemas suunas kiirusega 280 px/s', () => {
  const { run, press, events } = setup();
  assert.equal(press('ArrowLeft'), true); run('update(0.1)'); near(run('player.x'), 356);
  events.keyup({ code: 'ArrowLeft' }); press('ArrowRight'); run('update(0.1)'); near(run('player.x'), 384);
});
test('A ja D juhivad laeva ning keyup peatab liikumise', () => {
  const { run, press, events } = setup();
  press('KeyA'); run('update(0.1)'); near(run('player.x'), 356);
  events.keyup({ code: 'KeyA' }); run('update(0.1)'); near(run('player.x'), 356);
  press('KeyD'); run('update(0.1)'); near(run('player.x'), 384);
});
test('Laev ei ületa vasakut ega paremat piiri', () => {
  const { run, press, events } = setup();
  run('player.x = 1'); press('ArrowLeft'); run('update(0.05)'); assert.equal(run('player.x'), 0);
  events.keyup({ code: 'ArrowLeft' }); run('player.x = width - player.w - 1'); press('ArrowRight'); run('update(0.05)'); assert.equal(run('player.x'), 768);
});
test('Fookuse kadumine puhastab klahvid ja peatab mängu', () => {
  const { run, press, events } = setup(); press('KeyD'); press('Space'); events.blur();
  assert.equal(run('paused && !keys.KeyD && !keys.Space && lastTime === null'), true);
  run('update(0.05)'); assert.equal(run('player.x'), 384); assert.equal(run('bullets.length'), 0);
});
test('Tühik tekitab laeva keskele 4 × 14 kuuli', () => {
  const { run, press } = setup(); assert.equal(press('Space'), true); run('update(0)');
  assert.equal(run('bullets.length'), 1);
  assert.equal(run('bullets[0].x === player.x + 14 && bullets[0].y === player.y && bullets[0].w === 4 && bullets[0].h === 14'), true);
});
test('Kuul liigub üles kiirusega 430 px/s', () => {
  const { run } = setup(); run('bullets = [{x: 10, y: 200, w: 4, h: 14}]; update(0.1)'); near(run('bullets[0].y'), 157);
});
test('Laskude vahel on vähemalt 0,22 sekundit', () => {
  const { run, press } = setup(); press('Space'); run('update(0); update(0.1); update(0.119)');
  assert.equal(run('bullets.length'), 1); run('update(0.002)'); assert.equal(run('bullets.length'), 2);
});
test('Tühiku kordussündmused ei möödu laskmise taimerist', () => {
  const { run, press } = setup(); press('Space'); run('update(0)');
  for (let i = 0; i < 10; i++) { press('Space', true); run('update(0)'); }
  assert.equal(run('bullets.length'), 1);
});
test('Ekraanilt väljunud kuul eemaldatakse', () => {
  const { run } = setup(); run('bullets = [{x: 10, y: -13, w: 4, h: 14}]; update(0.01)'); assert.equal(run('bullets.length'), 0);
});
test('Vaenlane ilmub ülalt suurusega 28 × 28 mänguvälja laiuse sees', () => {
  const { run } = setup(); run('update(0)');
  assert.equal(run('enemies.length'), 1);
  assert.equal(run('enemies[0].y === -28 && enemies[0].w === 28 && enemies[0].h === 28 && enemies[0].x >= 0 && enemies[0].x <= width - 28'), true);
});
test('Algne vaenlase kiirus on 110 px/s', () => {
  const { run } = setup(); run('update(0); update(0.1)'); near(run('enemies[0].y'), -17);
});
test('Algne ilmumisintervall on 0,9 sekundit', () => {
  const { run } = setup(); run('update(0)'); near(run('enemyTimer'), 0.9);
  run('update(0.89)'); assert.equal(run('enemies.length'), 1);
  run('update(0.02)'); assert.equal(run('enemies.length'), 2);
});
test('Ristkülikute kattumine: tabamus, eraldatus ja servade puudutus', () => {
  const { run } = setup();
  assert.equal(run('overlaps({x:0,y:0,w:10,h:10},{x:9,y:9,w:2,h:2})'), true);
  assert.equal(run('overlaps({x:0,y:0,w:10,h:10},{x:11,y:0,w:2,h:2})'), false);
  assert.equal(run('overlaps({x:0,y:0,w:10,h:10},{x:10,y:0,w:2,h:2})'), false);
});
test('Tabamus eemaldab kuuli ja vaenlase ning annab täpselt 10 punkti', () => {
  const { run } = setup(); run('enemyTimer = 10; bullets = [{x:100,y:100,w:4,h:14}]; enemies = [{x:100,y:100,w:28,h:28}]; update(0); update(0)');
  assert.equal(run('score'), 10); assert.equal(run('bullets.length + enemies.length'), 0);
});
test('Üks kuul ei hävita kahte kattuvat vaenlast', () => {
  const { run } = setup(); run('enemyTimer = 10; bullets = [{x:100,y:100,w:4,h:14}]; enemies = [{x:100,y:100,w:28,h:28},{x:100,y:100,w:28,h:28}]; update(0)');
  assert.equal(run('score'), 10); assert.equal(run('enemies.length'), 1);
});
test('Ühe kaadri kaks sõltumatut tabamust annavad 20 punkti', () => {
  const { run } = setup(); run('enemyTimer = 10; bullets = [{x:100,y:100,w:4,h:14},{x:200,y:100,w:4,h:14}]; enemies = [{x:100,y:100,w:28,h:28},{x:200,y:100,w:28,h:28}]; update(0)');
  assert.equal(run('score'), 20); assert.equal(run('bullets.length + enemies.length'), 0);
});
test('Laevaga kokkupõrge võtab ühe elu ja eemaldab vaenlase', () => {
  const { run } = setup(); run('enemyTimer = 10; enemies = [{x:player.x,y:player.y,w:28,h:28}]; update(0); update(0)');
  assert.equal(run('lives'), 2); assert.equal(run('enemies.length'), 0);
});
test('Alumise piirini jõudnud vaenlane võtab ühe elu', () => {
  const { run } = setup(); run('enemyTimer = 10; enemies = [{x:0,y:height,w:28,h:28}]; update(0); update(0)');
  assert.equal(run('lives'), 2); assert.equal(run('enemies.length'), 0);
});
test('Kolme elu kaotus lõpetab mängu ja näitab restart-nuppu', () => {
  const { run, button } = setup(); run('loseLife(); loseLife(); loseLife(); loseLife()');
  assert.equal(run('gameOver'), true); assert.equal(run('lives'), 0); assert.equal(button.hidden, false);
});
test('Paus külmutab liikumise, objektid ja taimerid; P jätkab', () => {
  const { run, press } = setup(); press('KeyD'); press('Space'); run('update(0.01)'); press('KeyP');
  const state = run('JSON.stringify([player,bullets,enemies,shotTimer,enemyTimer,score,lives])');
  run('update(0.05)'); assert.equal(run('JSON.stringify([player,bullets,enemies,shotTimer,enemyTimer,score,lives])'), state);
  press('KeyP'); run('update(0.01)'); assert.equal(run('paused'), false); assert(run('player.x') > 384);
});
test('P allhoidmine ei lülita pausi korduvalt', () => {
  const { run, press } = setup(); press('KeyP'); press('KeyP', true); assert.equal(run('paused'), true);
});
test('Mängu lõpus ei liigu objektid ega lisandu punkte', () => {
  const { run, press } = setup(); run('loseLife(); loseLife(); loseLife()'); press('KeyD'); press('Space'); press('KeyP'); run('update(0.05)');
  assert.equal(run('player.x'), 384); assert.equal(run('bullets.length + enemies.length + score'), 0); assert.equal(run('paused'), false);
});
function dirty(run) {
  run('player.x=3; player.y=4; bullets=[{x:1,y:1,w:4,h:14}]; enemies=[{x:2,y:2,w:28,h:28}]; score=200; lives=0; shotTimer=0.2; enemyTimer=0.5; lastTime=123; paused=true; gameOver=true; keys.Space=true; keys.KeyD=true');
}
function assertReset(run, button) {
  assert.equal(run('player.x===384 && player.y===536 && score===0 && lives===3 && bullets.length===0 && enemies.length===0 && shotTimer===0 && enemyTimer===0 && lastTime===null && !gameOver && !paused && !keys.Space && !keys.KeyD'), true);
  assert.equal(button.hidden, true);
}
test('Restart-nupp lähtestab kogu mängu oleku', () => {
  const { run, events, button } = setup(); dirty(run); events.click(); assertReset(run, button);
});
test('Enter taaskäivitab lõppenud mängu', () => {
  const { run, press, button } = setup(); dirty(run); press('Enter'); assertReset(run, button);
});
test('100 punkti järel kasvab kiirus ja väheneb ilmumisintervall', () => {
  const { run } = setup(); run('score=100; update(0)'); near(run('enemyTimer'), 0.82);
  run('update(0.1)'); near(run('enemies[0].y'), -15.8);
});
test('Raskusaste muutub ainult iga 100 punkti järel ja intervall ei lange alla 0,3 s', () => {
  const { run } = setup(); run('score=99; update(0)'); near(run('enemyTimer'), 0.9);
  run('score=1000; enemyTimer=0; update(0)'); near(run('enemyTimer'), 0.3);
});
test('Kaadriaeg piiratakse 0,05 sekundiga ja animatsioon jätkub ühe ahelana', () => {
  const { run, press, frames } = setup(); assert.equal(frames.length, 1); press('KeyD');
  frames.shift()(1000); assert.equal(run('player.x'), 384); assert.equal(frames.length, 1);
  frames.shift()(2000); near(run('player.x'), 398); assert.equal(frames.length, 1);
});
test('Joonistamine sisaldab tähti, laeva, vaenlasi, kuule ja eestikeelset infot', () => {
  const { run, drawing } = setup(); run('bullets=[{x:100,y:100,w:4,h:14}]; enemies=[{x:200,y:100,w:28,h:28}]; draw()');
  assert.equal(drawing.filter(d => d[0] === 'rect' && d[1] === '#7185ad' && d[4] === 2 && d[5] === 2).length, 65);
  for (const color of ['#73eed8','#e7fbff','#ffbd69','#ff688c','#ffdc83']) assert(drawing.some(d => d[1] === color));
  for (const text of ['PUNKTID: 0','ELUD: 3']) assert(drawing.some(d => d[0] === 'text' && d[1] === text));
  run('paused=true; draw()'); assert(drawing.some(d => d[1] === 'PAUS'));
  run('gameOver=true; draw()'); assert(drawing.some(d => d[1] === 'MÄNG LÄBI'));
});
