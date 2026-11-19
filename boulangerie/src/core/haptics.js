// Vibrations : navigator.vibrate sur Android.
// Sur iOS (18+), on utilise l'astuce du <input switch> qui déclenche un petit
// retour haptique natif quand on le bascule pendant un geste de l'utilisateur.
let iosLabel = null;
let lastIos = 0;

function setupIos() {
  if (iosLabel || typeof document === 'undefined') return;
  const label = document.createElement('label');
  label.style.cssText = 'position:fixed;left:-100px;top:-100px;width:1px;height:1px;opacity:0;pointer-events:none';
  label.setAttribute('aria-hidden', 'true');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.appendChild(input);
  document.body.appendChild(label);
  iosLabel = label;
}

const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;
const isIOS = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent);

export const haptics = {
  enabled: true,
  tap(ms = 10) {
    if (!this.enabled) return;
    if (canVibrate) {
      try { navigator.vibrate(ms); } catch (_) { /* rien */ }
    } else if (isIOS) {
      const now = performance.now();
      if (now - lastIos < 60) return;
      lastIos = now;
      setupIos();
      iosLabel.click();
    }
  },
  pattern(p) {
    if (!this.enabled) return;
    if (canVibrate) {
      try { navigator.vibrate(p); } catch (_) { /* rien */ }
    } else {
      this.tap();
    }
  },
};
