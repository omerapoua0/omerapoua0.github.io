/* Project index: hovering or focusing a row shows its visual in the sticky pane;
   area filters hide rows and announce the count. Links work without this script. */
document.querySelectorAll<HTMLElement>('[data-project-index]').forEach(index => {
  const rows = [...index.querySelectorAll<HTMLLIElement>('[data-row]')];
  const paneItems = [...index.querySelectorAll<HTMLElement>('[data-pane-item]')];
  const filters = index.querySelector<HTMLFieldSetElement>('[data-filters]');
  const count = index.querySelector<HTMLElement>('[data-count]');

  const activate = (id: string) => {
    paneItems.forEach(item => item.toggleAttribute('data-active', item.dataset.paneItem === id));
    document.dispatchEvent(new CustomEvent('previews:update'));
  };

  rows.forEach(row => {
    const link = row.querySelector<HTMLAnchorElement>('a');
    const id = row.dataset.row;
    if (!link || !id) return;
    link.addEventListener('pointerenter', () => activate(id));
    link.addEventListener('focus', () => activate(id));
  });

  /* List / grid layout switch, remembered per browser. */
  const views = index.querySelector<HTMLElement>('[data-views]');
  if (views) {
    const buttons = [...views.querySelectorAll<HTMLButtonElement>('[data-view-set]')];
    const setView = (view: string) => {
      index.dataset.view = view;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.viewSet === view)));
      document.dispatchEvent(new CustomEvent('previews:update'));
    };
    let saved = 'list';
    try { saved = localStorage.getItem('omar-work-view') === 'grid' ? 'grid' : 'list'; } catch { /* storage unavailable */ }
    setView(saved);
    views.hidden = false;
    buttons.forEach(button => button.addEventListener('click', () => {
      const view = button.dataset.viewSet || 'list';
      const swap = () => setView(view);
      const doc = document as Document & { startViewTransition?: (callback: () => void) => unknown };
      if (doc.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) doc.startViewTransition(swap); else swap();
      try { localStorage.setItem('omar-work-view', view); } catch { /* storage unavailable */ }
    }));
  }

  if (filters) {
    filters.hidden = false;
    filters.addEventListener('change', event => {
      const input = event.target as HTMLInputElement;
      const area = input.value;
      let shown = 0;
      rows.forEach(row => {
        const match = area === 'all' || (row.dataset.areas || '').split(' ').includes(area);
        row.hidden = !match;
        if (match) shown += 1;
      });
      const first = rows.find(row => !row.hidden);
      if (first?.dataset.row) activate(first.dataset.row);
      const name = input.closest('label')?.textContent?.replace(/\d+\s*$/, '').trim() || 'All';
      if (count) count.textContent = `${shown} ${shown === 1 ? 'project' : 'projects'} shown: ${name}.`;
    });
  }
});

export {};
