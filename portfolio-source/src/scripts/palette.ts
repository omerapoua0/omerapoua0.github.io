/*
 * Command menu: ⌘K / Ctrl+K (or any [data-palette-open] button) opens a native
 * <dialog>. Typing filters with a forgiving subsequence match; ↑/↓ move,
 * Enter runs. Internal links go through the light gate (gate.ts) like any
 * other link on the site.
 */
const gate = () => (window as Window & { __gate?: (href: string, mode?: string) => void }).__gate;
const dialog = document.querySelector<HTMLDialogElement>('[data-palette]');
const input = dialog?.querySelector<HTMLInputElement>('[data-palette-input]');
const list = dialog?.querySelector<HTMLElement>('[data-palette-list]');

if (dialog && input && list && typeof dialog.showModal === 'function') {
  const status = dialog.querySelector<HTMLElement>('[data-palette-status]')!;
  const items = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll('[data-palette-key]').forEach(key => { key.textContent = mac ? '⌘K' : 'Ctrl K'; });
  const openers = [...document.querySelectorAll<HTMLButtonElement>('[data-palette-open]')];
  openers.forEach(button => { button.hidden = false; button.addEventListener('click', () => open()); });

  const text = (item: HTMLElement) => `${item.querySelector('.palette__label')?.textContent ?? ''} ${item.dataset.keywords ?? ''} ${item.dataset.group ?? ''}`.toLowerCase();
  const haystacks = new Map(items.map(item => [item, text(item)]));
  const score = (query: string, hay: string) => {
    if (!query) return 1;
    const at = hay.indexOf(query);
    if (at === 0) return 100;
    if (at > 0) return (hay[at - 1] === ' ' ? 80 : 60) - Math.min(at, 30) / 10;
    const words = query.split(/\s+/).filter(Boolean);
    if (words.length > 1 && words.every(word => hay.includes(word))) return 50;
    // Typo-tolerant fallback: the letters in order, close together.
    let position = -1, gaps = 0;
    for (const char of query.replace(/\s+/g, '')) {
      const next = hay.indexOf(char, position + 1);
      if (next < 0) return 0;
      if (position >= 0) gaps += next - position - 1;
      position = next;
    }
    return gaps <= query.length ? 20 - gaps : 0;
  };

  let visible: HTMLElement[] = items;
  let active = 0;
  const setActive = (index: number) => {
    visible.forEach(item => item.setAttribute('aria-selected', 'false'));
    active = visible.length ? (index + visible.length) % visible.length : 0;
    const item = visible[active];
    if (!item) { input.removeAttribute('aria-activedescendant'); return; }
    item.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', item.id);
    item.scrollIntoView({ block: 'nearest' });
  };
  const filter = () => {
    const query = input.value.trim().toLowerCase();
    const ranked = items.map(item => ({ item, value: score(query, haystacks.get(item)!) })).filter(entry => entry.value > 0);
    if (query) ranked.sort((a, b) => b.value - a.value);
    const shown = new Set(ranked.map(entry => entry.item));
    items.forEach(item => { item.hidden = !shown.has(item); });
    ranked.forEach(entry => list.append(entry.item));
    visible = ranked.map(entry => entry.item);
    setActive(0);
    status.textContent = query ? (ranked.length ? `${ranked.length} result${ranked.length === 1 ? '' : 's'}.` : 'No results.') : '';
  };

  const open = () => {
    if (dialog.open) return;
    input.value = '';
    filter();
    dialog.showModal();
    input.focus();
  };
  const close = () => { if (dialog.open) dialog.close(); };

  const run = async (item: HTMLElement | undefined) => {
    if (!item) return;
    const { href, action } = item.dataset;
    if (href) {
      close();
      if (item.hasAttribute('data-external')) window.open(href, '_blank', 'noopener');
      else if (gate()) gate()!(href, 'open');
      else location.href = href;
    } else if (action === 'copy-email') {
      const email = item.querySelector('.palette__hint')?.textContent ?? '';
      let ok = false;
      try { await Promise.race([navigator.clipboard.writeText(email), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))]); ok = true; } catch { ok = false; }
      status.textContent = ok ? 'Email address copied.' : `Could not copy. The address is ${email}.`;
      const hint = item.querySelector('.palette__hint');
      if (hint && ok) { hint.textContent = 'Copied'; setTimeout(() => { hint.textContent = email; close(); }, 700); }
    }
  };

  input.addEventListener('input', filter);
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
    else if (event.key === 'Home' && !input.value) { event.preventDefault(); setActive(0); }
    else if (event.key === 'End' && !input.value) { event.preventDefault(); setActive(visible.length - 1); }
    else if (event.key === 'Enter') { event.preventDefault(); void run(visible[active]); }
  });
  list.addEventListener('pointermove', event => {
    const item = (event.target as Element).closest<HTMLElement>('[role="option"]');
    const index = item ? visible.indexOf(item) : -1;
    if (index >= 0 && index !== active) setActive(index);
  });
  list.addEventListener('click', event => {
    const item = (event.target as Element).closest<HTMLElement>('[role="option"]');
    if (item) void run(item);
  });
  dialog.querySelector('[data-palette-close]')?.addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) close(); else open();
    }
  });
}

export {};
