/*
 * Otto's chat, choice-only. Visitors never type: every reply Otto gives ends
 * with real buttons for what they can say next, so he can never meet a message
 * he doesn't understand. The conversation (src/data/otto.ts `reply()`) is built
 * from answers Omar wrote (src/data/agent.ts). Otto greets first-time visitors
 * once he has landed, streams each reply (instantly with reduced motion or
 * Pause motion), drives the robot's poses ('otto:state') and speech bubble
 * ('otto:say') and, for a project, offers his hand (otto-handoff.ts). The
 * transcript and the last choices are remembered in this browser only.
 * `?ask=<intent id>` and `omar:ask` ({ id }) start from an intent; anything
 * else is ignored.
 */
import type { AgentCard } from '../data/agent';
import { otto, ottoIntents, reply, nodeFor, insideCard, insideInfo, insideIds, type Choice, type Mood, type OttoIntent, type Reply } from '../data/otto';
import { handoff } from './otto-handoff';

type Turn = { you: string } | { node: string; text: string };

const chat = document.querySelector<HTMLElement>('[data-otto]');
const log = chat?.querySelector<HTMLElement>('[data-chat-log]');
const choiceBox = chat?.querySelector<HTMLElement>('[data-chat-choices]');

if (chat && log && choiceBox) {
  const root = document.documentElement;
  const status = chat.querySelector<HTMLElement>('[data-chat-status]')!;
  const jump = chat.querySelector<HTMLButtonElement>('[data-chat-jump]')!;
  const clearButton = chat.querySelector<HTMLButtonElement>('[data-chat-clear]')!;
  const soundButton = chat.querySelector<HTMLButtonElement>('[data-chat-sound]')!;
  const greetingNode = chat.querySelector<HTMLElement>('[data-greeting]');
  const byId = new Map(ottoIntents.map(intent => [intent.id, intent]));
  const projects = new Set<string>(insideIds);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const instant = () => reduce.matches || root.dataset.motion === 'off';
  const storeKey = 'otto-chat-v2';
  const store = {
    get<T>(key: string, fallbackValue: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallbackValue; } catch { return fallbackValue; } },
    set(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
    drop(key: string) { try { localStorage.removeItem(key); } catch { /* storage unavailable */ } },
  };
  const session = {
    take(key: string) { try { const value = sessionStorage.getItem(key); sessionStorage.removeItem(key); return value; } catch { return null; } },
  };
  // Earlier versions kept what visitors typed; there is no typing any more, so forget it.
  store.drop('otto-chat-v1');
  store.drop('otto-history');

  const saved = store.get<{ turns?: unknown; n?: unknown }>(storeKey, {});
  const valid = (turn: unknown): turn is Turn => !!turn && typeof turn === 'object' && (typeof (turn as { you?: unknown }).you === 'string' || (typeof (turn as { node?: unknown }).node === 'string' && typeof (turn as { text?: unknown }).text === 'string' && !!reply((turn as { node: string }).node)));
  let turns: Turn[] = Array.isArray(saved.turns) ? saved.turns.filter(valid) : [];
  let replies = Number.isFinite(saved.n) ? Number(saved.n) : 0; // Otto's replies so far (varies his phrasing)
  let busy = false;
  let skip = false;
  let queued: (() => void) | null = null; // one action waiting for Otto to finish (a menu ask, Clear)
  let greetingDone = true; // false while the first-visit greeting is still playing
  let greetingSecond: HTMLElement | null = null; // the greeting's second bubble, once it exists

  /* ---------- helpers ---------- */
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const sleep = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, instant() || skip ? 0 : ms));
  const robot = (state: Mood | 'welcome', ms = 0) => window.dispatchEvent(new CustomEvent('otto:state', { detail: { state, ms } }));
  const speak = (text: string) => window.dispatchEvent(new CustomEvent('otto:say', { detail: { text } }));
  const nearBottom = () => log.scrollHeight - log.scrollTop - log.clientHeight < 90;
  // Following a reply never scrolls past the top of Otto's latest turn, so a
  // long answer stays readable from its first line on a small phone.
  let anchor: HTMLElement | null = null;
  const ceiling = () => (anchor?.isConnected ? Math.max(0, anchor.offsetTop - 12) : Infinity);
  let stick = true;
  log.addEventListener('scroll', () => { stick = nearBottom() || Math.abs(log.scrollTop - ceiling()) < 4; if (stick) jump.hidden = true; }, { passive: true });
  const follow = () => { if (stick) { log.scrollTop = Math.min(log.scrollHeight, ceiling()); jump.hidden = true; } else jump.hidden = false; };
  jump.addEventListener('click', () => { stick = true; log.scrollTo({ top: log.scrollHeight, behavior: instant() ? 'auto' : 'smooth' }); jump.hidden = true; });
  const londonTime = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }).format(new Date());
  const fill = (text: string) => text.replace('{time}', londonTime());
  const absolute = (href: string) => new URL(href, location.origin).href;
  const save = () => store.set(storeKey, { turns: turns.slice(-40), n: replies });
  const lastNode = () => [...turns].reverse().find((turn): turn is { node: string; text: string } => 'node' in turn)?.node ?? 'hello';
  /** Resolves once Otto has landed (or the SVG Otto is standing in), at most 4.2 s. */
  const landed = () => new Promise<void>(resolve => {
    const done = () => { window.removeEventListener('otto:landed', done); window.clearTimeout(cap); resolve(); };
    const cap = window.setTimeout(done, 4200);
    window.addEventListener('otto:landed', done);
    if (!document.querySelector('[data-otto-stage][data-stage-mode="hero"]:not([data-landed])')) done();
  });

  /* ---------- opt-in sound ---------- */
  let audio: AudioContext | undefined;
  const soundOn = () => store.get<string>('omar-sound', 'off') === 'on';
  const labelSound = () => {
    soundButton.setAttribute('aria-pressed', String(soundOn()));
    soundButton.querySelector('[data-chat-sound-label]')!.textContent = soundOn() ? 'Sound on' : 'Sound off';
  };
  const blip = (notes: number[], type: OscillatorType = 'sine') => {
    if (!soundOn() || instant()) return;
    try {
      audio ??= new AudioContext();
      notes.forEach((frequency, index) => {
        const start = audio!.currentTime + index * .07;
        const osc = audio!.createOscillator(), gain = audio!.createGain();
        osc.type = type; osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.05, start + .01);
        gain.gain.exponentialRampToValueAtTime(.0001, start + .16);
        osc.connect(gain).connect(audio!.destination);
        osc.start(start); osc.stop(start + .18);
      });
    } catch { /* audio unavailable */ }
  };
  soundButton.hidden = false;
  soundButton.addEventListener('click', () => { store.set('omar-sound', soundOn() ? 'off' : 'on'); labelSound(); blip([880]); });
  window.addEventListener('omar:sound', labelSound);
  labelSound();

  /* ---------- rendering ---------- */
  const cardRow = (cards: AgentCard[]) => {
    const row = el('div', 'cards');
    cards.forEach(card => {
      const link = el('a', 'card');
      link.href = card.href;
      if (card.external) { link.target = '_blank'; link.rel = 'noopener'; }
      const thumb = el('span', 'card__thumb');
      thumb.setAttribute('aria-hidden', 'true');
      if (card.image) { const image = el('img'); image.src = card.image; image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; thumb.append(image); }
      else thumb.textContent = card.external ? '↗' : '→';
      const text = el('span');
      text.append(el('strong', undefined, card.title), el('span', 'card__meta', card.meta));
      link.append(thumb, text);
      row.append(link);
    });
    return row;
  };
  const cardsFor = (intent: OttoIntent) => {
    const inside = intent.inside ? insideCard(intent.id) : undefined;
    return [...(inside ? [inside] : []), ...(intent.cards ?? [])].slice(0, 3);
  };
  const copyText = async (text: string) => {
    try { await Promise.race([navigator.clipboard.writeText(text), new Promise((_, reject) => window.setTimeout(() => reject(new Error('timeout')), 1500))]); return true; } catch { return false; }
  };
  const footFor = (intent: OttoIntent, text: string) => {
    const foot = el('div', 'turn__foot');
    const sources = el('span');
    sources.append('Sources: ');
    intent.sources.forEach((source, index) => {
      if (index) sources.append(' · ');
      const link = el('a', undefined, source.label);
      link.href = source.href;
      if (/^https?:/.test(source.href)) { link.target = '_blank'; link.rel = 'noopener'; }
      sources.append(link);
    });
    const copy = el('button', undefined, 'Copy');
    copy.type = 'button';
    copy.setAttribute('aria-label', 'Copy this answer');
    copy.addEventListener('click', async () => {
      const ok = await copyText(`${text}\n\nSource: ${absolute(intent.sources[0]?.href ?? '/')}`);
      copy.textContent = ok ? 'Copied' : 'Copy failed';
      status.textContent = ok ? 'Answer copied.' : 'Could not copy the answer.';
      window.setTimeout(() => { copy.textContent = 'Copy'; }, 1600);
    });
    foot.append(sources, copy);
    return foot;
  };

  /** Show a set of choices where the composer used to be. */
  const setChoices = (choices: Choice[], focus = false) => {
    choiceBox.replaceChildren(...choices.map((item, index) => {
      const button = el('button', 'otto-choice');
      button.type = 'button';
      button.dataset.to = item.to;
      if (item.kind) button.dataset.kind = item.kind;
      button.style.setProperty('--i', String(index));
      button.append(el('span', 'otto-choice__label', item.label));
      return button;
    }));
    if (focus) choiceBox.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    follow();
  };
  const setBusy = (state: boolean) => {
    busy = state;
    chat.toggleAttribute('data-busy', state);
    choiceBox.toggleAttribute('data-busy', state);
    log.setAttribute('aria-busy', String(state));
    // aria-disabled, not disabled: the chosen button keeps keyboard focus while Otto answers.
    choiceBox.querySelectorAll('button').forEach(button => { if (state) button.setAttribute('aria-disabled', 'true'); else button.removeAttribute('aria-disabled'); });
    if (!state && queued) { const next = queued; queued = null; next(); }
  };

  const streamInto = async (target: HTMLElement, text: string, stop?: () => boolean) => {
    if (instant() || skip) { target.textContent = text; return; }
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (skip || stop?.()) { target.textContent = text; return; }
      target.append(el('span', 'w', `${words[i]}${i < words.length - 1 ? ' ' : ''}`));
      if (i % 4 === 0) follow();
      await sleep(24);
    }
    target.textContent = text;
  };
  const youTurn = (text: string) => {
    const turn = el('div', 'turn turn--you');
    turn.append(el('p', 'bubble', text));
    log.append(turn);
    anchor = turn;
    stick = true;
    follow();
  };
  const bubble = (turn: HTMLElement) => { const box = el('div', 'bubble'); const p = el('p'); box.append(p); turn.append(box); return p; };

  /** Render one Otto reply. live: a typing pause, the bubble and pose, then streaming. */
  const ottoTurn = async (said: Reply, text: string, live: boolean) => {
    const turn = el('div', 'turn turn--agent');
    turn.dataset.node = said.id;
    if (said.intent) turn.dataset.intent = said.intent;
    log.append(turn);
    // Keep the visitor's choice (or, failing that, the start of the reply) in view.
    const before = turn.previousElementSibling as HTMLElement | null;
    anchor = before?.classList.contains('turn--you') ? before : turn;
    if (live && !instant()) {
      const dots = el('p', 'typing');
      dots.setAttribute('aria-hidden', 'true');
      dots.append(el('i'), el('i'), el('i'));
      turn.append(dots); follow();
      robot(said.intent ? 'think' : 'talk');
      await sleep(said.intent ? 420 : 300);
      dots.remove();
    }
    const paragraph = bubble(turn);
    if (live) {
      speak(text);
      robot(said.pose === 'cheeky' || said.pose === 'confused' ? said.pose : 'talk');
      await streamInto(paragraph, text);
      // A hand-off sets its own pose (the offered hand).
      if (!said.handoff) robot(said.pose === 'wave' || said.pose === 'cheeky' ? said.pose : 'idle', 1400);
    } else paragraph.textContent = text;
    const intent = said.intent ? byId.get(said.intent) : undefined;
    if (intent) {
      if (said.cards) { const cards = cardsFor(intent); if (cards.length) turn.append(cardRow(cards)); }
      turn.append(footFor(intent, text));
    }
    follow();
    return turn;
  };

  /** Otto answers (after the visitor's choice, if any), offers his hand for a project, then shows what comes next. */
  const respond = async (to: string, you?: string, focus = false) => {
    const answer = reply(to, replies);
    if (!answer) return;
    finishGreeting();
    setBusy(true);
    skip = false;
    if (you) { youTurn(you); turns.push({ you }); blip([880]); }
    status.textContent = 'Otto is answering…';
    let shown = answer;
    let text = fill(answer.text);
    // Saved before streaming, so a transcript always ends with Otto's reply.
    turns.push({ node: answer.id, text }); replies += 1; save();
    const turn = await ottoTurn(answer, text, true);
    if (answer.handoff) {
      // otto-handoff stores 'otto-inside' only once the visitor actually takes his hand.
      const choice = await handoff(answer.handoff.id, insideInfo(answer.handoff.id) ?? { name: answer.handoff.id });
      if (choice === 'take') return; // leaving for the tour; a back/forward restore resets us
      status.textContent = 'Staying here.';
      turn.remove();
      turns.pop();
      shown = reply(answer.handoff.stay, replies)!;
      text = fill(shown.text);
      turns.push({ node: shown.id, text }); replies += 1; save();
      await ottoTurn(shown, text, true);
    }
    status.textContent = `Otto: ${text}`;
    setChoices(shown.choices, focus || choiceBox.contains(document.activeElement));
    clearButton.hidden = false;
    setBusy(false);
    blip([660, 990]);
  };

  /** If the visitor chooses before Otto finished saying hello, finish it at once. */
  const finishGreeting = () => {
    if (greetingDone) return;
    greetingDone = true;
    // If the second greeting bubble already exists, each bubble keeps its own line.
    if (greetingNode) greetingNode.textContent = greetingSecond ? otto.greeting[0] : otto.greeting.join(' ');
    if (greetingSecond) greetingSecond.textContent = otto.greeting[1];
  };

  /** Ask from outside the chat (the command menu, ?ask=): intent ids only. */
  const askIntent = (id: string) => {
    const intent = byId.get(id);
    if (!intent) return;
    const run = () => void respond(nodeFor(id), intent.ask);
    if (busy) { queued = run; skip = true; } else run();
  };

  const clear = () => {
    if (busy) { queued = clear; skip = true; return; }
    turns = []; replies = 0; anchor = null; stick = true;
    store.drop(storeKey);
    log.querySelectorAll('.turn:not([data-static])').forEach(node => node.remove());
    greetingDone = true;
    greetingSecond = null;
    if (greetingNode) greetingNode.textContent = otto.greeting.join(' ');
    setChoices(reply('hello')!.choices, true);
    clearButton.hidden = true;
    status.textContent = 'Conversation cleared.';
  };

  /* ---------- choosing ---------- */
  choiceBox.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-to]');
    if (!button || busy) return;
    const focused = button === document.activeElement;
    button.setAttribute('data-picked', '');
    void respond(button.dataset.to!, button.textContent?.trim() || undefined, focused);
  });
  log.addEventListener('click', event => { if (busy && (event.target as Element).closest('.bubble')) skip = true; });
  chat.addEventListener('keydown', event => { if (event.key === 'Escape' && busy && !event.defaultPrevented) skip = true; });
  clearButton.addEventListener('click', () => clear());
  chat.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const box = chat.getBoundingClientRect();
    chat.style.setProperty('--x', `${event.clientX - box.left}px`);
    chat.style.setProperty('--y', `${event.clientY - box.top}px`);
  });
  window.addEventListener('omar:ask', event => {
    const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
    if (typeof id !== 'string' || !byId.has(id)) return;
    chat.scrollIntoView({ behavior: instant() ? 'auto' : 'smooth', block: 'center' });
    askIntent(id);
  });
  // Back from a tour: "Back from the inside! Where next?" with the other projects.
  const welcomeBack = async (id: string | null) => {
    if (!id || !projects.has(id)) return;
    await landed();
    if (busy) return;
    await respond(`back:${id}`);
  };
  // Back/forward cache: the page left mid hand-off, so settle and welcome the visitor back.
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    setChoices(reply(lastNode())?.choices ?? reply('hello')!.choices);
    setBusy(false);
    void welcomeBack(session.take('otto-inside'));
  });

  /* ---------- start: restore, greet, permalink ---------- */
  for (const turn of turns) {
    if ('you' in turn) { const node = el('div', 'turn turn--you'); node.append(el('p', 'bubble', turn.you)); log.append(node); }
    else void ottoTurn(reply(turn.node)!, turn.text, false);
  }
  const returnedFrom = session.take('otto-inside');
  const permalink = new URLSearchParams(location.search).get('ask') ?? '';
  const asked = byId.has(permalink) ? permalink : '';
  if (turns.length) {
    clearButton.hidden = false;
    follow();
    setChoices(reply(lastNode())?.choices ?? reply('hello')!.choices);
    if (!asked) void welcomeBack(returnedFrom);
  } else if (!asked) {
    // First visit: once Otto has landed (or the SVG Otto is standing in), he
    // waves, says hello and asks how you are, in two short bubbles.
    setChoices(reply('hello')!.choices);
    if (greetingNode && !instant()) {
      greetingNode.textContent = '';
      greetingDone = false;
      void (async () => {
        await landed();
        await sleep(350);
        if (greetingDone) return; // the visitor already chose
        speak(otto.greeting[0]);
        robot('wave', 1300);
        await streamInto(greetingNode, otto.greeting[0], () => greetingDone);
        if (greetingDone) { greetingNode.textContent = otto.greeting.join(' '); return; }
        await sleep(650);
        if (greetingDone) { greetingNode.textContent = otto.greeting.join(' '); return; }
        const second = el('div', 'turn turn--agent');
        second.dataset.node = 'hello';
        greetingSecond = bubble(second);
        log.append(second);
        speak(otto.greeting[1]);
        robot('welcome', 1800);
        await streamInto(greetingSecond, otto.greeting[1], () => greetingDone);
        greetingDone = true;
        follow();
      })();
    } else void landed().then(() => speak(otto.greeting.join(' ')));
  }
  if (asked) askIntent(asked);
}

export {};
