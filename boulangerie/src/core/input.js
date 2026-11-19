import { toLocal } from './stage.js';

// Toutes les touches du plan de travail passent par ici, puis vont
// à la scène / l'étape active (input.target.down/move/up).
export const input = { target: null, firstTouch: [] };

export function initInput(canvas) {
  const send = (type, e) => {
    const t = input.target;
    if (!t || !t[type]) return;
    const p = toLocal(e);
    p.id = e.pointerId;
    p.t = e.timeStamp || performance.now();
    t[type](p);
  };

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
    send('down', e);
  });
  canvas.addEventListener('pointermove', (e) => {
    e.preventDefault();
    // événements groupés = tracés plus lisses (dorure au pinceau)
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (list && list.length > 1) list.forEach((ce) => send('move', ce));
    else send('move', e);
  });
  canvas.addEventListener('pointerup', (e) => send('up', e));
  canvas.addEventListener('pointercancel', (e) => send('up', e));

  // Premier contact : débloque le son (exigence iOS)
  const first = () => input.firstTouch.forEach((f) => f());
  window.addEventListener('pointerdown', first, { capture: true });
  window.addEventListener('touchend', first, { capture: true });

  // Pas de scroll, de zoom, de rebond ni de menu contextuel pendant les gestes
  document.addEventListener('touchmove', (e) => {
    if (!e.target.closest || !e.target.closest('.scrollable')) e.preventDefault();
  }, { passive: false });
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart'].forEach((ev) =>
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
  );
  let lastEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastEnd < 300 && !(e.target.closest && e.target.closest('button'))) e.preventDefault();
    lastEnd = now;
  }, { passive: false });
}
