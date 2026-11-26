import assert from 'node:assert/strict';
import { evaluateFit, rankBatteries, Tweens, ease } from '../js/garage-logic.js';
import { BATTERIES, VEHICLES } from '../js/catalog.js';

const celta = VEHICLES.Chevrolet.Celta.bay;
const by = (ah) => BATTERIES.find((b) => b.ah === ah);

// Cenários descritos no pedido: Celta + 60 Ah, 40 Ah e uma bateria grande.
assert.equal(evaluateFit(celta, by(60)).status, 'ok');
assert.equal(evaluateFit(celta, by(40)).status, 'warn');
assert.equal(evaluateFit(celta, by(50)).reason, 'low');
assert.equal(evaluateFit(celta, by(40)).reason, 'low');
assert.equal(evaluateFit(celta, by(100)).status, 'nofit');
assert.equal(evaluateFit(celta, by(150)).status, 'nofit');
assert.equal(evaluateFit(celta, by(70)).status, 'nofit');
assert.equal(evaluateFit(VEHICLES.Honda.Civic.bay, by(90)).status, 'ok');
// altura demais, mesma base
const tall = { ah: 60, L: 0.24, W: 0.175, H: 0.25 };
assert.equal(evaluateFit(celta, tall).reason, 'height');
// ranking
const r = rankBatteries(celta, BATTERIES);
assert.deepEqual(r.recommended.map((x) => x.battery.ah), [60]);
assert.ok(r.others.some((x) => x.battery.ah === 40));

// tweens
const tw = new Tweens(); let last = -1;
const p = tw.add({ dur: 1, ease: ease.linear, update: (v) => (last = v) });
tw.tick(0.5); assert.equal(Math.round(last * 10) / 10, 0.5);
tw.tick(0.6); assert.equal(last, 1); assert.equal(await p, true);
const p2 = tw.add({ dur: 1, update() {} }); tw.cancelAll(); assert.equal(await p2, false);
console.log('OK — lógica de encaixe e tweens passaram.');
const roomy={trayL:.35,trayW:.20,maxH:.25,recommendedAh:[50,60]};
assert.equal(evaluateFit(roomy,by(70)).status,'warn');
assert.equal(evaluateFit(roomy,by(70)).reason,'high');
console.log('OK — acima da faixa não é declarado automaticamente compatível.');
