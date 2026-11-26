// Lógica pura (sem Three.js): encaixe fictício, ranking e animações por tempo.
export function evaluateFit(bay, bat) {
  if (bat.L > bay.trayL || bat.W > bay.trayW) return { status: 'nofit', reason: 'size' };
  if (bat.H > bay.maxH) return { status: 'nofit', reason: 'height' };
  const [lo, hi] = bay.recommendedAh;
  if (bat.ah < lo) return { status: 'warn', reason: 'low' };
  if (bat.ah > hi) return { status: 'warn', reason: 'high' };
  return { status: 'ok', reason: 'ok' };
}
export function rankBatteries(bay, list) {
  const rows = list.map((battery) => ({ battery, fit: evaluateFit(bay, battery) })).sort((a, b) => a.battery.ah - b.battery.ah);
  return { recommended: rows.filter((r) => r.fit.status === 'ok'), others: rows.filter((r) => r.fit.status !== 'ok') };
}
export const ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  outBounce: (t) => { const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
};
export class Tweens {
  constructor() { this.items = []; }
  add({ dur = 1, ease: e = ease.linear, update, delay = 0 }) {
    return new Promise((resolve) => this.items.push({ dur, e, update, t: -delay, resolve }));
  }
  tick(dt) {
    for (const it of [...this.items]) {
      it.t += dt; if (it.t < 0) continue;
      const p = Math.min(1, it.t / it.dur); it.update(it.e(p));
      if (p >= 1) { this.items.splice(this.items.indexOf(it), 1); it.resolve(true); }
    }
  }
  cancelAll() { const l = this.items; this.items = []; l.forEach((i) => i.resolve(false)); }
}
