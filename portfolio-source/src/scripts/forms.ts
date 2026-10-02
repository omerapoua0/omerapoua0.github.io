/*
 * Enquiry journeys. Each form validates step by step and ends on a "check your
 * answers" review that prepares an editable email draft. Nothing is sent,
 * stored or booked by the website: the visitor sends the email themselves.
 */
const recipient = 'omerapoua0@gmail.com';
const MAILTO_LIMIT = 1800;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

document.querySelectorAll<HTMLFormElement>('form[data-enquiry]').forEach(form => {
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('[data-step]')];
  const stepItems = [...form.querySelectorAll<HTMLElement>('[data-step-item]')];
  const stepLabel = form.querySelector<HTMLElement>('[data-step-label]');
  const navigation = form.querySelector<HTMLElement>('[data-navigation]');
  const next = form.querySelector<HTMLButtonElement>('[data-next]');
  const back = form.querySelector<HTMLButtonElement>('[data-back]');
  const progress = form.querySelector<HTMLElement>('[data-progress]');
  const errors = form.querySelector<HTMLElement>('[data-errors]');
  const review = form.querySelector<HTMLElement>('[data-review]');
  const summary = form.querySelector<HTMLElement>('[data-summary]');
  const draft = form.querySelector<HTMLTextAreaElement>('[data-draft]');
  const emailLink = form.querySelector<HTMLAnchorElement>('[data-email]');
  const gmailLink = form.querySelector<HTMLAnchorElement>('[data-gmail]');
  const copyButton = form.querySelector<HTMLButtonElement>('[data-copy]');
  const lengthWarning = form.querySelector<HTMLElement>('[data-length-warning]');
  const status = form.querySelector<HTMLElement>('[data-status]');
  if (!steps.length || !navigation || !next || !review || !summary || !draft || !emailLink || !status || !errors) return;
  const lessons = form.dataset.enquiry === 'lessons';
  let current = 0;
  let body = '';
  let transition: Animation | null = null;
  form.noValidate = true;

  const controls = (scope: ParentNode) => [...scope.querySelectorAll<Control>('input, select, textarea')].filter(control => control.name);
  const labelFor = (control: Control) => control.dataset.label || control.closest<HTMLElement>('[data-label]')?.dataset.label || control.name;
  const valueOf = (name: string) => {
    const field = form.elements.namedItem(name);
    if (field instanceof RadioNodeList) return field.value;
    if (field instanceof HTMLInputElement && field.type === 'checkbox') return field.checked ? field.value : '';
    return field && 'value' in field ? String((field as Control).value) : '';
  };

  /* Conditional fields: data-when="name=value|value" shows a block only when it applies. */
  function applyConditions() {
    form.querySelectorAll<HTMLElement>('[data-when]').forEach(block => {
      const [name, values] = (block.dataset.when || '').split('=');
      const show = values.split('|').includes(valueOf(name));
      block.hidden = !show;
      controls(block).forEach(control => { control.disabled = !show; });
    });
  }

  function animateIn(element: HTMLElement, direction: number) {
    transition?.cancel();
    if (reducedMotion.matches || !element.animate) return;
    transition = element.animate([{ opacity: 0, transform: `translateX(${direction * 16}px)` }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
  }

  /* Live lesson brief (tutoring page). */
  function updateBrief() {
    const parts: string[] = [];
    document.querySelectorAll<HTMLElement>('[data-brief]').forEach(target => {
      const value = valueOf(target.dataset.brief || '').trim();
      target.textContent = value || target.dataset.empty || '—';
      target.toggleAttribute('data-filled', !!value);
      if (value && target.dataset.briefLine !== 'false') parts.push(value);
    });
    document.querySelectorAll<HTMLElement>('[data-brief-line]').forEach(line => { line.textContent = parts.length ? parts.join(' · ') : line.dataset.empty || ''; });
  }

  function clearErrors() {
    errors!.hidden = true;
    errors!.querySelector('ul')!.innerHTML = '';
    form.querySelectorAll('.field-error').forEach(node => node.remove());
    form.querySelectorAll<Control>('[aria-invalid]').forEach(control => {
      control.removeAttribute('aria-invalid');
      const ids = (control.getAttribute('aria-describedby') || '').split(' ').filter(id => id && !id.startsWith('err-'));
      if (ids.length) control.setAttribute('aria-describedby', ids.join(' ')); else control.removeAttribute('aria-describedby');
    });
  }

  function render(focus = false, direction = 1) {
    steps.forEach((step, index) => { step.hidden = index !== current; step.disabled = index !== current; });
    applyConditions();
    review!.hidden = true;
    navigation!.hidden = false;
    if (progress) progress.hidden = false;
    if (back) back.hidden = current === 0;
    stepItems.forEach((item, index) => {
      if (index === current) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
      item.toggleAttribute('data-done', index < current);
    });
    if (stepLabel) stepLabel.textContent = `Step ${current + 1} of ${steps.length}: ${steps[current].dataset.title || ''}`;
    next!.innerHTML = current === steps.length - 1 ? 'Check your answers <span aria-hidden="true">→</span>' : 'Continue <span aria-hidden="true">→</span>';
    status!.textContent = '';
    clearErrors();
    updateBrief();
    if (focus) {
      form.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      steps[current].querySelector<HTMLElement>('legend')?.focus({ preventScroll: true });
      animateIn(steps[current], direction);
    }
  }

  function message(control: Control) {
    const label = labelFor(control).toLowerCase();
    if (control instanceof HTMLInputElement && control.type === 'radio') return `Choose ${label}`;
    if (control instanceof HTMLSelectElement) return `Choose ${label}`;
    if (control instanceof HTMLInputElement && control.type === 'email' && control.value.trim()) return 'Enter an email address in the correct format, like name@example.com';
    return `Enter ${label}`;
  }

  function validStep() {
    clearErrors();
    applyConditions();
    const seen = new Set<string>();
    const invalid: Control[] = [];
    controls(steps[current]).filter(control => !control.disabled).forEach(control => {
      if (seen.has(control.name)) return;
      seen.add(control.name);
      const isRadio = control instanceof HTMLInputElement && control.type === 'radio';
      const empty = isRadio ? !valueOf(control.name) : !control.value.trim();
      control.setCustomValidity(control.required && !isRadio && !control.value.trim() ? 'Required' : '');
      if ((control.required && empty) || (!isRadio && !control.checkValidity())) invalid.push(control);
    });
    if (!invalid.length) return true;
    const list = errors!.querySelector('ul')!;
    invalid.forEach(control => {
      const text = message(control);
      const errorId = `err-${form.dataset.enquiry}-${control.name}`;
      const host = control.closest<HTMLElement>('.field, [data-label]') || control.parentElement!;
      const inline = document.createElement('p');
      inline.className = 'field-error';
      inline.id = errorId;
      inline.textContent = text;
      host.append(inline);
      const targets = control instanceof HTMLInputElement && control.type === 'radio' ? [...form.querySelectorAll<HTMLInputElement>(`input[name="${control.name}"]`)] : [control];
      targets.forEach(target => {
        target.setAttribute('aria-invalid', 'true');
        target.setAttribute('aria-describedby', [target.getAttribute('aria-describedby'), errorId].filter(Boolean).join(' '));
      });
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${targets[0].id}`;
      link.textContent = text;
      link.addEventListener('click', event => { event.preventDefault(); targets[0].focus(); });
      item.append(link);
      list.append(item);
    });
    errors!.hidden = false;
    errors!.focus();
    return false;
  }

  function prepareDraft() {
    steps.forEach(step => { step.disabled = false; });
    applyConditions();
    const rows: { label: string; value: string; step: number }[] = [];
    const seen = new Set<string>();
    steps.forEach((step, index) => controls(step).filter(control => !control.disabled).forEach(control => {
      if (seen.has(control.name)) return;
      seen.add(control.name);
      const value = valueOf(control.name).trim();
      if (value) rows.push({ label: labelFor(control), value, step: index });
    }));
    const subject = lessons
      ? `Lesson enquiry: ${valueOf('subject')} · ${valueOf('level')}`
      : `${valueOf('topic') || 'Portfolio'} enquiry from ${valueOf('name')}`;
    const opening = lessons ? 'I would like to discuss online lessons.' : 'I would like to start a conversation.';
    body = `Hi Omar,\n\n${opening}\n\n${rows.map(row => `${row.label}: ${row.value}`).join('\n')}\n\nThank you.`;
    draft!.value = body;
    const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const mailto = `mailto:${recipient}?${query}`;
    emailLink!.href = mailto;
    if (gmailLink) gmailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const tooLong = mailto.length > MAILTO_LIMIT;
    if (lengthWarning) lengthWarning.hidden = !tooLong;
    emailLink!.classList.toggle('btn--accent', !tooLong);
    emailLink!.classList.toggle('btn--ghost', tooLong);
    copyButton?.classList.toggle('btn--accent', tooLong);
    copyButton?.classList.toggle('btn--ghost', !tooLong);

    summary!.innerHTML = '';
    rows.forEach(row => {
      const wrap = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      const change = document.createElement('button');
      dt.textContent = row.label;
      dd.textContent = row.value;
      change.type = 'button';
      change.className = 'change';
      change.innerHTML = `Change<span class="sr-only"> ${row.label.toLowerCase()}</span>`;
      change.addEventListener('click', () => { current = row.step; render(true, -1); });
      wrap.append(dt, dd, change);
      summary!.append(wrap);
    });

    steps.forEach(step => { step.hidden = true; step.disabled = true; });
    navigation!.hidden = true;
    if (progress) progress.hidden = true;
    clearErrors();
    review!.hidden = false;
    status!.textContent = 'Your draft is ready to check. Nothing has been sent.';
    form.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    review!.querySelector<HTMLElement>('h2, h3')?.focus({ preventScroll: true });
    animateIn(review!, 1);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!review.hidden || !validStep()) return;
    if (current < steps.length - 1) { current += 1; render(true); } else prepareDraft();
  });
  back?.addEventListener('click', () => { current = Math.max(0, current - 1); render(true, -1); });
  form.addEventListener('input', event => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) target.setCustomValidity('');
    applyConditions();
    updateBrief();
  });
  form.addEventListener('change', () => { applyConditions(); updateBrief(); });
  form.querySelector('[data-edit]')?.addEventListener('click', () => { current = 0; render(true, -1); });
  copyButton?.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(body);
      status.textContent = `Copied. Paste it into an email to ${recipient} and send it from your own email app. Nothing has been sent yet.`;
    } catch {
      const details = draft.closest('details');
      if (details) details.open = true;
      draft.focus();
      draft.select();
      status.textContent = 'Automatic copying is unavailable. The email text is selected: copy it, then paste it into your email app.';
    }
  });
  emailLink.addEventListener('click', () => { status.textContent = 'Your email app should open with the draft. Check it and press send there. If nothing opens, use Copy instead. The website has not sent anything.'; });
  gmailLink?.addEventListener('click', () => { status.textContent = 'Gmail should open in a new tab with the draft. Check it and press send there. The website has not sent anything.'; });

  if (form.dataset.enquiry === 'contact') {
    const params = new URLSearchParams(location.search);
    const topic = (params.get('topic') || '').toLowerCase();
    const match = [...form.querySelectorAll<HTMLInputElement>('input[name="topic"]')].find(input => input.value.toLowerCase() === topic);
    if (match) match.checked = true;
    const brief = params.get('brief');
    const messageField = form.querySelector<HTMLTextAreaElement>('[name="message"]');
    if (brief && brief.length <= 180 && messageField) messageField.value = `I would like to discuss ${brief.toLowerCase()}.\n\n`;
  }

  render();
  form.hidden = false;
  form.closest('[data-form-shell]')?.setAttribute('data-ready', '');
});

export {};
