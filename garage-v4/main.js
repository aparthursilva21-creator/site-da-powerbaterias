import { VEHICLES, BATTERIES } from './catalog.js';
import { rankBatteries, evaluateFit } from './garage-logic.js';

// Versão com capô 3D separado, confirmado por SHA do arquivo enviado ao GitHub.
const GARAGE_BUILD = 'black11-solid';
const HOOD_MODEL_URL = 'assets/sport-sedan-hood.glb?rev=black11-solid';
// Número de atendimento (DDI + DDD, sem formatação).
const WHATSAPP_NUMBER = '5561995191090';

const $ = (id) => document.getElementById(id);
const brand = $('brand'), model = $('model'), year = $('year'), engine = $('engine'), form = $('vehicleForm');
const stepBat = $('batteryStep'), goBtn = $('goBtn');
let current = null;      // { name, bay }
let toastTimer;
const buildState = document.getElementById('garageBuildState');
function setBuildState(message, state='loading'){
  if(buildState){buildState.textContent=message;buildState.dataset.state=state;}
}
setBuildState('V11 • Preparando o carro com capô articulado…');

/* ---------- formulário ---------- */
for (const b of Object.keys(VEHICLES)) brand.add(new Option(b, b));
brand.addEventListener('change', () => {
  model.length = 1; model.disabled = !brand.value; model.options[0].text = brand.value ? 'Selecione o modelo' : 'Escolha a marca';
  for (const m of Object.keys(VEHICLES[brand.value] || {})) model.add(new Option(m, m));
  $('engineList').innerHTML = '';
});
model.addEventListener('change', () => {
  const v = (VEHICLES[brand.value] || {})[model.value];
  $('engineList').innerHTML = v ? v.engines.map((e) => `<option value="${e}">`).join('') : '';
});
[brand, model].forEach((el) => el.addEventListener('change', () => el.classList.remove('invalid')));

/* ---------- 3D ---------- */
// O 3D é carregado dinamicamente: se o CDN do Three.js ou o WebGL falhar, o formulário
// e a lista de baterias continuam funcionando (modo texto, sem animação).
class FallbackGarage {
  constructor() { this.state = 'showroom'; this.headlightsOn = true; this.isSpinning = false; this.ready = Promise.resolve(); }
  async enterEngineView() { this.state = 'engine'; onState('engine'); return true; }
  async exitEngineView() { this.state = 'showroom'; onState('showroom'); return true; }
  async toggleHood() {} async faceFront() {} async recenter() {}
  setSpin() {} setHeadlights(on) { this.headlightsOn = on; return on; }
  async installBattery(b) { const r = { battery: b, ...evaluateFit(current.bay, b) }; showFeedback(r); return r; }
}
let garage = new FallbackGarage();
window.garage = garage;
(async () => {
  try {
    const { PowerGarage3D } = await import('./power-garage-3d.js?rev=black11-solid');
    // Carregamento DIRETO. O arquivo articulado está confirmado em assets/ na main.
    // Não usar HEAD nem trocar silenciosamente para o modelo sem capô.
    const modelUrl = HOOD_MODEL_URL;
    setBuildState('V11 • Lendo sport-sedan-hood.glb…');
    const g3d = new PowerGarage3D({
      container: $('viewport'),
      glbUrl: modelUrl,
      // O pós-processamento antigo compunha um retângulo opaco no canvas.
      // Renderização direta preserva o alpha e integra o carro ao fundo da página.
      bloom: false,
      onProgress: (p) => { $('loadBar').style.width = Math.round(p * 100) + '%'; },
      onFeedback: showFeedback,
      onState: onState,
    });
    await g3d.ready;
    garage = g3d; window.garage = g3d;
    setBuildState(g3d.hood
      ? 'V11 • Capô 3D detectado: animação disponível'
      : 'V11 • Arquivo carregado, mas a peça Hood não foi identificada',
      g3d.hood ? 'ready' : 'warning');
    console.info('[Power Garage]', GARAGE_BUILD, 'GLB:', modelUrl, 'Hood:', !!g3d.hood);
    if(!g3d.hood){
      $('cHood').disabled = true;
      const message = document.getElementById('garageAssetNotice');
      if(message)message.hidden=false;
    } else {
      const message=document.getElementById('garageAssetNotice');
      if(message)message.hidden=true;
    }       // no console: garage.setHeadlights(false), etc.
    $('loading').classList.add('done'); syncSpin();
  } catch (e) {
    console.error('[Power Garage] Falha no carregamento do modelo articulado:', e);
    setBuildState('V11 • Erro ao carregar o carro 3D. Confira a conexão e recarregue a página.', 'error');
    $('loadTxt').textContent='Não foi possível carregar o carro articulado.';
    $('loading').classList.add('done'); $('webglFail').hidden = false;
    $('webglFail').textContent='Não foi possível carregar sport-sedan-hood.glb. O arquivo existe no GitHub. Verifique a conexão ou a aba Console (F12) e atualize a página.';
  }
})();

function onState(s) {
  const hoodBtn = $('cHood');
  hoodBtn.lastChild.textContent = s === 'engine' ? ' Fechar capô' : ' Abrir capô';
  const busy = s === 'approach';
  [$('cFront'), $('cCenter'), $('cSpin')].forEach((b) => (b.disabled = busy || s === 'engine'));
  hoodBtn.disabled = busy;
  if (s === 'showroom') { stepBat.hidden = true; form.hidden = false; goBtn.disabled = false; current = null; hideToast(); syncSpin(); }
}

/* ---------- fluxo: consultar -> cofre -> bateria ---------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let ok = true;
  for (const el of [brand, model]) { if (!el.value) { el.classList.add('invalid'); ok = false; } }
  if (!ok) return;
  if(year.value && !/^(19|20)\d{2}$/.test(year.value.trim())) { year.classList.add('invalid'); return; }
  year.classList.remove('invalid');
  const v = VEHICLES[brand.value][model.value];
  current = { name: `${brand.value} ${model.value}${year.value ? ' ' + year.value : ''}${engine.value ? ' · ' + engine.value : ''}`, bay: v.bay };
  goBtn.disabled = true; hideToast();
  if(garage.car && !garage.hood){
    const note=document.getElementById('garageAssetNotice');
    if(note)note.hidden=false;
    goBtn.disabled=false;return;
  }
  const done = await garage.enterEngineView(current);
  if (!done) { goBtn.disabled = false; return; }
  $('vehName').textContent = current.name;
  renderBatteries(current.bay);
  form.hidden = true; stepBat.hidden = false;
  stepBat.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

$('backBtn').addEventListener('click', () => garage.exitEngineView());

function renderBatteries(bay) {
  const { recommended, others } = rankBatteries(bay, BATTERIES);
  const row = ({ battery: b }, tag) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="bat" aria-pressed="false"><span class="ah">${b.ah}<small> Ah</small></span>
      <span><div class="nm">${b.name}</div><div class="sp">${Math.round(b.L * 1000)}×${Math.round(b.W * 1000)}×${Math.round(b.H * 1000)} mm · ${b.cca} CCA</div></span>${tag ? `<span class="tag">${tag}</span>` : ''}</button>`;
    li.firstChild.addEventListener('click', (ev) => {
      document.querySelectorAll('.bat').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      ev.currentTarget.setAttribute('aria-pressed', 'true');
      hideToast(); garage.installBattery(b);
    });
    return li;
  };
  $('listRec').replaceChildren(...recommended.map((r) => row(r, 'SIMULAÇÃO')));
  $('listOther').replaceChildren(...others.map((r) => row(r, '')));
}

/* ---------- feedback ---------- */
function showFeedback(r) {
  const t = $('toast');
  t.className = 'toast ' + r.status;
  $('toastIco').textContent = r.status === 'ok' ? '✓' : r.status === 'warn' ? '!' : '✕';
  $('toastTitle').textContent = r.title + ' · SIMULAÇÃO';
  $('toastMsg').textContent = r.message + ' Resultado visual de demonstração; confirme a aplicação com a loja.';
  const cta = $('toastCta');
  if (WHATSAPP_NUMBER && r.status !== 'nofit') {
    cta.hidden = false;
    cta.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá, Power Baterias! Fiz uma SIMULAÇÃO na Power Garage. Meu veículo: ${current ? current.name : 'não informado'}. Exemplo visualizado: ${r.battery.name}. Podem confirmar quais baterias reais Heliar ou Moura são compatíveis, disponibilidade e orçamento?`)}`;
  } else cta.hidden = true;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 9000);
}
function hideToast() { clearTimeout(toastTimer); $('toast').hidden = true; }

/* ---------- botões do showroom ---------- */
const syncSpin = () => { const on = garage.isSpinning; $('cSpin').lastChild.textContent = on ? ' Pausar' : ' Retomar'; $('cSpin').firstChild.textContent = on ? '⏸' : '▶'; };
$('cSpin').addEventListener('click', () => { garage.setSpin(!garage.isSpinning); syncSpin(); });
$('cFront').addEventListener('click', () => { garage.faceFront(); syncSpin(); });
$('cCenter').addEventListener('click', () => { garage.recenter(); setTimeout(syncSpin, 50); });
$('cHood').addEventListener('click', () => garage.toggleHood());
$('cLights').addEventListener('click', (e) => {
  const on = garage.setHeadlights(!garage.headlightsOn);
  e.currentTarget.setAttribute('aria-pressed', String(on));
  e.currentTarget.lastChild.textContent = on ? ' Faróis ON' : ' Faróis OFF';
});
const headerWpp = $('hdrWpp');
if (WHATSAPP_NUMBER && headerWpp) headerWpp.href = `https://wa.me/${WHATSAPP_NUMBER}`;