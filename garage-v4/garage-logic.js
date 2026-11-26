// Lógica pura (sem Three.js): easing, tweens e regra de encaixe da bateria.
// Pode ser testada em Node: `node tests/logic.test.mjs`

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;

export const ease = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => {
    const c1 = 1.25, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/** Motor de tweens. add() devolve Promise<boolean>: true = terminou, false = cancelado. */
export class Tweens {
  constructor() { this.list = new Set(); }
  add({ dur, ease: e = ease.inOut, update, delay = 0 }) {
    return new Promise((resolve) => {
      this.list.add({ dur: Math.max(dur, 1e-4), e, update, delay, t: 0, resolve });
    });
  }
  tick(dt) {
    for (const tw of [...this.list]) {
      if (tw.delay > 0) { tw.delay -= dt; continue; }
      tw.t += dt;
      const k = clamp(tw.t / tw.dur, 0, 1);
      tw.update(tw.e(k), k);
      if (k >= 1) { this.list.delete(tw); tw.resolve(true); }
    }
  }
  cancelAll() {
    for (const tw of this.list) tw.resolve(false);
    this.list.clear();
  }
  get busy() { return this.list.size > 0; }
}

const mm = (m) => Math.round(m * 1000);

/**
 * Regra de encaixe. Medidas em metros.
 * bay:  { trayL, trayW, maxH, recommendedAh:[min,max] }
 * batt: { ah, L, W, H }
 * status: 'ok' | 'warn' | 'nofit'
 */
export function evaluateFit(bay, batt, tol = 0.003) {
  const dL = batt.L - bay.trayL;
  const dW = batt.W - bay.trayW;
  const dH = batt.H - bay.maxH;
  const overhang = { L: Math.max(0, dL), W: Math.max(0, dW), H: Math.max(0, dH) };
  const footprintOk = dL <= tol && dW <= tol;
  const heightOk = dH <= tol;

  if (!footprintOk || !heightOk) {
    const why = [];
    if (dL > tol) why.push(`comprimento de ${mm(batt.L)} mm (o cofre aceita até ${mm(bay.trayL)} mm)`);
    if (dW > tol) why.push(`largura de ${mm(batt.W)} mm (o cofre aceita até ${mm(bay.trayW)} mm)`);
    if (dH > tol) why.push(`altura de ${mm(batt.H)} mm (sob o capô cabem até ${mm(bay.maxH)} mm)`);
    return {
      status: 'nofit',
      reason: footprintOk ? 'height' : 'footprint',
      title: 'Não cabe no cofre ilustrativo',
      message: `A bateria de ${batt.ah} Ah não encaixa neste veículo: ${why.join('; ')}.`,
      overhang,
      slack: { L: 0, W: 0 },
    };
  }

  const slack = { L: Math.max(0, bay.trayL - batt.L), W: Math.max(0, bay.trayW - batt.W) };
  const [min, max] = bay.recommendedAh;
  if (batt.ah < min) {
    return {
      status: 'warn', reason: 'low', title: 'Encaixa na demonstração, mas não é recomendada',
      message: `A bateria de ${batt.ah} Ah entra no cofre, porém está abaixo do recomendado (${min}–${max} Ah). Pode falhar na partida e durar menos.`,
      overhang, slack,
    };
  }
  if (batt.ah > max) {
    return {
      status: 'warn', reason: 'high', title: 'Encaixa na demonstração, mas não é recomendada',
      message: `Esta bateria de ${batt.ah} Ah cabe na simulação, porém fica acima da faixa de exemplo (${min}–${max} Ah). Confirmar aplicação, CCA, tecnologia, polos e fixação com a loja.`,
      overhang, slack,
    };
  }
  return {
    status: 'ok', reason: 'recommended', title: 'Encaixe demonstrativo realizado',
    message: `Bateria de ${batt.ah} Ah posicionada na simulação. Os dados deste protótipo não confirmam compatibilidade real; consulte a equipe.`,
    overhang, slack,
  };
}

/** Separa o catálogo em recomendadas (encaixa e dentro da faixa) e demais opções. */
export function rankBatteries(bay, catalog) {
  const rows = catalog.map((battery) => ({ battery, fit: evaluateFit(bay, battery) }));
  const recommended = rows.filter((r) => r.fit.status === 'ok' && r.battery.ah >= bay.recommendedAh[0] && r.battery.ah <= bay.recommendedAh[1]);
  const others = rows.filter((r) => !recommended.includes(r));
  const byAh = (a, b) => a.battery.ah - b.battery.ah;
  return { recommended: recommended.sort(byAh), others: others.sort(byAh) };
}