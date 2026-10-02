/* Scripted "talk to my agent" demo. Answers come from the page (written from
   the CV); a trace line shows the "retrieval", then the answer types out.
   Reduced motion or paused motion shows answers instantly. */
type Card = { title: string; meta: string; href: string; external?: boolean };
type Answer = { q?: string; trace: string; text: string; cards?: Card[] };
type Script = { intro: Answer; answers: Answer[] };

const chat = document.querySelector<HTMLElement>('[data-chat]');
const log = chat?.querySelector<HTMLElement>('[data-chat-log]');
const chips = [...(chat?.querySelectorAll<HTMLButtonElement>('[data-chat-ask]') ?? [])];

if (chat && log) {
  const script: Script = JSON.parse(chat.dataset.script || '{}');
  const instant = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
  const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, instant() ? 0 : ms));
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const add = (className: string, text = '') => { const node = document.createElement('div'); node.className = className; node.textContent = text; log.append(node); scroll(); return node; };
  let busy = false;

  const reply = async (answer: Answer) => {
    busy = true;
    chips.forEach(chip => { chip.disabled = true; });
    log.setAttribute('aria-busy', 'true');
    add('chat__trace', answer.trace);
    const typing = add('chat__typing');
    typing.innerHTML = '<i></i><i></i><i></i>';
    await wait(650);
    typing.remove();
    const message = add('chat__msg');
    if (instant()) message.textContent = answer.text;
    else {
      const words = answer.text.split(' ');
      for (let i = 0; i < words.length; i++) {
        message.textContent = words.slice(0, i + 1).join(' ');
        if (i % 3 === 0) scroll();
        await wait(28);
      }
    }
    if (answer.cards?.length) {
      const row = add('chat__cards');
      answer.cards.forEach(card => {
        const link = document.createElement('a');
        link.className = 'chat__card';
        link.href = card.href;
        if (card.external) { link.target = '_blank'; link.rel = 'noopener'; }
        link.innerHTML = '<strong></strong><span></span>';
        link.querySelector('strong')!.textContent = `${card.title} ↗`;
        link.querySelector('span')!.textContent = card.meta;
        row.append(link);
      });
    }
    scroll();
    log.setAttribute('aria-busy', 'false');
    chips.forEach(chip => { chip.disabled = false; });
    busy = false;
  };

  chips.forEach(chip => chip.addEventListener('click', async () => {
    if (busy) return;
    const answer = script.answers[Number(chip.dataset.chatAsk)];
    if (!answer) return;
    chip.setAttribute('data-asked', '');
    add('chat__msg chat__msg--you', answer.q ?? chip.textContent ?? '');
    await reply(answer);
  }));

  void (async () => { await wait(500); await reply(script.intro); })();
}

export {};
