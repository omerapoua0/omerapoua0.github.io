const recipient = 'omerapoua0@gmail.com';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const labels: Record<string, string> = {
  topic: 'Conversation', subject: 'Subject', level: 'Level', goal: 'Main goal',
  days: 'Preferred days', time: 'Preferred time', timezone: 'Time zone',
  message: 'Details', name: 'Name', email: 'Email', relationship: 'Enquiring as',
};

document.querySelectorAll<HTMLFormElement>('[data-enquiry]').forEach(form => {
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('[data-step]')];
  const navigation = form.querySelector<HTMLElement>('[data-navigation]');
  const next = form.querySelector<HTMLButtonElement>('[data-next]');
  const back = form.querySelector<HTMLButtonElement>('[data-back]');
  const progress = form.querySelector<HTMLElement>('[data-progress]');
  const review = form.querySelector<HTMLElement>('[data-review]');
  const draft = form.querySelector<HTMLTextAreaElement>('[data-draft]');
  const emailLink = form.querySelector<HTMLAnchorElement>('[data-email]');
  const status = form.querySelector<HTMLElement>('[data-status]');
  if (!steps.length || !navigation || !next || !review || !draft || !emailLink || !status) return;
  let current = 0;
  let body = '';
  let transition: Animation | null = null;
  form.noValidate = true;

  function cancelTransition() { transition?.cancel(); transition = null; }
  function enter(element: HTMLElement, direction = 1, axis = 'X') {
    cancelTransition();
    if (document.documentElement.dataset.motion === 'off' || reducedMotion.matches || !element.animate) return;
    transition = element.animate([
      { opacity: 0, transform: `translate${axis}(${direction * 14}px)` },
      { opacity: 1, transform: `translate${axis}(0)` },
    ], { duration: 400, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  }
  reducedMotion.addEventListener('change', event => { if (event.matches) cancelTransition(); });
  window.addEventListener('omar:motion', () => { if (document.documentElement.dataset.motion === 'off') cancelTransition(); });

  function updateSummary() {
    const subject = form.querySelector<HTMLInputElement>('input[name="subject"]:checked');
    const level = form.querySelector<HTMLInputElement>('input[name="level"]:checked');
    const subjectTarget = document.querySelector<HTMLElement>('[data-summary-subject]');
    const levelTarget = document.querySelector<HTMLElement>('[data-summary-level]');
    if (subjectTarget) subjectTarget.textContent = subject?.value || 'Choose your subject';
    if (levelTarget) levelTarget.textContent = level?.value || 'Then tell me your level.';
  }
  function render(focus = false, direction = 1) {
    cancelTransition();
    steps.forEach((step, index) => { step.hidden = index !== current; step.disabled = index !== current; });
    review!.hidden = true;
    navigation!.hidden = false;
    if (back) back.hidden = current === 0;
    if (progress) {
      progress.hidden = false;
      const label = progress.querySelector('[data-step-label]');
      if (label) label.textContent = `Step ${current + 1} of ${steps.length}`;
      const bar = progress.querySelector('progress');
      if (bar) { bar.value = current + 1; bar.textContent = `${current + 1} of ${steps.length}`; bar.setAttribute('aria-valuetext', `Step ${current + 1} of ${steps.length}`); }
    }
    next!.textContent = current === steps.length - 1 ? 'Review my enquiry ↗' : 'Continue →';
    status!.textContent = '';
    updateSummary();
    if (focus) { steps[current].querySelector('legend')?.focus(); enter(steps[current], direction); }
  }
  function validStep() {
    const fields = [...steps[current].querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')];
    fields.forEach(field => {
      field.removeAttribute('aria-invalid');
      const isRadio = field instanceof HTMLInputElement && field.type === 'radio';
      field.setCustomValidity(field.required && !isRadio && !field.value.trim() ? 'Please complete this field.' : '');
    });
    const invalid = fields.find(field => !field.checkValidity());
    if (!invalid) return true;
    invalid.setAttribute('aria-invalid', 'true');
    invalid.setAttribute('aria-describedby', status!.id);
    status!.textContent = invalid instanceof HTMLInputElement && invalid.type === 'radio'
      ? 'Choose an option to continue.'
      : invalid instanceof HTMLInputElement && invalid.type === 'email' && invalid.value
        ? 'Please enter a valid email address, for example name@example.com.'
        : 'Please complete the required field before continuing.';
    invalid.focus();
    return false;
  }
  function prepareDraft() {
    steps.forEach(step => { step.disabled = false; });
    const data = new FormData(form);
    const lines: string[] = [];
    for (const [key, value] of data.entries()) {
      const clean = String(value).trim();
      if (clean && labels[key]) lines.push(`${labels[key]}: ${clean}`);
    }
    const lessons = form.dataset.enquiry === 'lessons';
    const subject = lessons ? `Lesson enquiry: ${data.get('subject')} / ${data.get('level')}` : `${data.get('topic') || 'Portfolio'} enquiry`;
    body = `Hi Omar,\n\n${lessons ? 'I would like to discuss online lessons.' : 'I would like to start a conversation.'}\n\n${lines.join('\n\n')}\n\nThank you!`;
    draft!.value = body;
    emailLink!.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    steps.forEach(step => { step.hidden = true; step.disabled = true; });
    navigation!.hidden = true;
    if (progress) progress.hidden = true;
    review!.hidden = false;
    status!.textContent = 'Your draft is ready to review. Nothing has been sent.';
    review!.querySelector('h2')?.focus();
    enter(review!, 1, 'Y');
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!review.hidden || !validStep()) return;
    if (current < steps.length - 1) { current += 1; render(true); } else prepareDraft();
  });
  back?.addEventListener('click', () => { current = Math.max(0, current - 1); render(true, -1); });
  form.addEventListener('input', event => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) { target.removeAttribute('aria-invalid'); target.setCustomValidity(''); }
    status.textContent = '';
    updateSummary();
  });
  form.querySelector('[data-edit]')?.addEventListener('click', () => { current = 0; render(true, -1); });
  form.querySelector('[data-copy]')?.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(body);
      status.textContent = `Copied. Paste your enquiry into an email to ${recipient} and send it. Nothing has been sent yet.`;
    } catch {
      draft.focus(); draft.select();
      status.textContent = 'Automatic copying is unavailable. Your draft is selected: use Copy, then paste it into your email app.';
    }
  });
  emailLink.addEventListener('click', () => { status.textContent = 'Your email app may open now. Review and send the message there. If it does not open, use Copy instead. This website has not sent your enquiry.'; });
  if (form.dataset.enquiry === 'contact') {
    const params = new URLSearchParams(location.search);
    const topic = (params.get('topic') || '').toLowerCase();
    const match = [...form.querySelectorAll<HTMLInputElement>('input[name="topic"]')].find(input => input.value.toLowerCase() === topic);
    if (match) match.checked = true;
    const brief = params.get('brief');
    const message = form.querySelector<HTMLTextAreaElement>('[name="message"]');
    if (brief && brief.length <= 180 && message) message.value = `I would like to discuss ${brief.toLowerCase()}.\n\n`;
  }
  render();
  form.hidden = false;
});
