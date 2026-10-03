/*
 * Inside pages: "Back to Otto" returns to wherever Otto teleported from
 * (history when it was this site, otherwise the homepage); Esc does the same.
 * Otto says hello on arrival.
 */
const back = document.querySelector<HTMLAnchorElement>('[data-inside-back]');
const fromHere = (() => { try { return !!document.referrer && new URL(document.referrer).origin === location.origin; } catch { return false; } })();
const goBack = () => { if (fromHere && history.length > 1) history.back(); else location.href = back?.href ?? '/index.html'; };

back?.addEventListener('click', event => { if (fromHere && history.length > 1) { event.preventDefault(); history.back(); } });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;
  goBack();
});
window.setTimeout(() => {
  window.dispatchEvent(new CustomEvent('otto:state', { detail: { state: 'wave', ms: 1300 } }));
}, 350);

export {};
