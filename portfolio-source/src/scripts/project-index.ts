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
