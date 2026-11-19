// Canvas plein écran avec un repère logique fixe : 400 unités de large,
// la hauteur suit l'écran. Tout le dessin et les gestes utilisent ce repère.
export const stage = {
  W: 400,
  H: 800,
  scale: 1,
  dpr: 1,
  canvas: null,
  ctx: null,
  // zone de travail (sous la bannière, au-dessus des boutons)
  top: 170,
  bottom: 680,
  shakeT: 0,
  shakeAmp: 0,
  listeners: [],
};

export function initStage(canvas) {
  stage.canvas = canvas;
  stage.ctx = canvas.getContext('2d');
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    stage.dpr = Math.min(window.devicePixelRatio || 1, 2);
    stage.scale = r.width / stage.W;
    stage.H = r.height / stage.scale;
    canvas.width = Math.round(r.width * stage.dpr);
    canvas.height = Math.round(r.height * stage.dpr);
    // bannière ≈ safe-area + 52px + ~90px ; boutons ≈ 110px
    const safeTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0;
    stage.top = (safeTop + 150) / stage.scale;
    stage.bottom = stage.H - 110 / stage.scale;
    stage.listeners.forEach((f) => f());
  };
  new ResizeObserver(resize).observe(canvas);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  resize();
}

export function onResize(f) {
  stage.listeners.push(f);
}

export function toLocal(e) {
  const r = stage.canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / stage.scale, y: (e.clientY - r.top) / stage.scale };
}

export function shake(amp = 6, t = 0.25) {
  stage.shakeAmp = Math.max(stage.shakeAmp, amp);
  stage.shakeT = Math.max(stage.shakeT, t);
}

export function beginFrame(dt) {
  const { ctx, dpr, scale } = stage;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, stage.canvas.width, stage.canvas.height);
  let ox = 0, oy = 0;
  if (stage.shakeT > 0) {
    stage.shakeT -= dt;
    const a = stage.shakeAmp * Math.max(0, stage.shakeT) * 4;
    ox = (Math.random() - 0.5) * a;
    oy = (Math.random() - 0.5) * a;
    if (stage.shakeT <= 0) stage.shakeAmp = 0;
  }
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * scale * dpr, oy * scale * dpr);
}

// Crée un canvas hors-écran à la résolution de l'appareil, dessiné en unités logiques.
export function makeLayer(w, h) {
  const c = document.createElement('canvas');
  const k = stage.scale * stage.dpr;
  c.width = Math.ceil(w * k);
  c.height = Math.ceil(h * k);
  const x = c.getContext('2d');
  x.setTransform(k, 0, 0, k, 0, 0);
  return { canvas: c, ctx: x, w, h };
}
