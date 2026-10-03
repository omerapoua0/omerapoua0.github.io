/*
 * Otto's chat. Greets first-time visitors, keeps a little context (the last
 * topic, whether he just asked how you are), answers from src/data/otto.ts via
 * otto-brain.ts, drives the robot's poses ('otto:state') and, for projects,
 * says "let me take you inside", points, goes "pew" and navigates to
 * /inside/<id>.html (with a "Stay here" escape). Nothing leaves the page.
 */
import { commands, type AgentCard } from '../data/agent';
import { otto, ottoIntents, social, ottoFallback, leads, insideCard, insideInfo, type Mood, type OttoIntent } from '../data/otto';
import { handoff } from './otto-handoff';
import { createBrain, type Context, type Reply } from './otto-brain';

type Chip = { ask?: string; say?: string; label: string };
type Said = { kind: 'intent' | 'detail' | 'social' | 'miss' | 'help' | 'say'; text: string; id?: string; also?: string; near?: string[]; chips?: string[]; greeting?: boolean };
type Turn = { you: string } | Said;

const chat = document.querySelector<HTMLElement>('[data-otto]');
const log = chat?.querySelector<HTMLElement>('[data-chat-log]');
const form = chat?.querySelector<HTMLFormElement>('[data-chat-form]');
const input = chat?.querySelector<HTMLInputElement>('[data-chat-input]');
const chipRow = chat?.querySelector<HTMLElement>('[data-chat-chips]');

if (chat && log && form && input && chipRow) {
  const root = document.documentElement;
  const status = chat.querySelector<HTMLElement>('[data-chat-status]')!;
  const hint = chat.querySelector<HTMLElement>('[data-chat-hint]');
  const hintDefault = [...(hint?.childNodes ?? [])];
  const jump = chat.querySelector<HTMLButtonElement>('[data-chat-jump]')!;
  const clearButton = chat.querySelector<HTMLButtonElement>('[data-chat-clear]')!;
  const soundButton = chat.querySelector<HTMLButtonElement>('[data-chat-sound]')!;
  const greetingNode = chat.querySelector<HTMLElement>('[data-greeting]');
  const byId = new Map(ottoIntents.map(intent => [intent.id, intent]));
  const brain = createBrain(ottoIntents);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const instant = () => reduce.matches || root.dataset.motion === 'off';
  const storeKey = 'otto-chat-v1';
  const store = {
    get<T>(key: string, fallbackValue: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallbackValue; } catch { return fallbackValue; } },
    set(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
    drop(key: string) { try { localStorage.removeItem(key); } catch { /* storage unavailable */ } },
  };
  const session = {
    take(key: string) { try { const value = sessionStorage.getItem(key); sessionStorage.removeItem(key); return value; } catch { return null; } },
    set(key: string, value: string) { try { sessionStorage.setItem(key, value); } catch { /* storage unavailable */ } },
  };

  const saved = store.get<{ turns: Turn[]; ctx: Context }>(storeKey, { turns: [], ctx: {} });
  let turns: Turn[] = Array.isArray(saved.turns) ? saved.turns : [];
  let ctx: Context = saved.ctx && typeof saved.ctx === 'object' ? saved.ctx : {};
  let busy = false;
  let skip = false;
  let leadIndex = 0;
  let greetingDone = true; // false while the first-visit greeting is still playing
  let greetingSecond: HTMLElement | null = null; // the greeting's second bubble, once it exists
  const history: string[] = store.get<string[]>('otto-history', []);
  let historyIndex = history.length;

  /* ---------- helpers ---------- */
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const sleep = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, instant() || skip ? 0 : ms));
  const robot = (state: Mood | 'pew' | 'welcome', ms = 0) => window.dispatchEvent(new CustomEvent('otto:state', { detail: { state, ms } }));
  const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  const nearBottom = () => log.scrollHeight - log.scrollTop - log.clientHeight < 90;
  let stick = true;
  log.addEventListener('scroll', () => { stick = nearBottom(); if (stick) jump.hidden = true; }, { passive: true });
  const follow = () => { if (stick) { log.scrollTop = log.scrollHeight; jump.hidden = true; } else jump.hidden = false; };
  jump.addEventListener('click', () => { stick = true; log.scrollTo({ top: log.scrollHeight, behavior: instant() ? 'auto' : 'smooth' }); jump.hidden = true; });
  const londonTime = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }).format(new Date());
  const fill = (text: string) => text.replace('{time}', londonTime());
  const absolute = (href: string) => new URL(href, location.origin).href;
  const save = () => store.set(storeKey, { turns: turns.slice(-40), ctx });

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
  const toolRow = (call: string, out: string, state: 'run' | 'done' | 'miss') => {
    const row = el('div', 'tool');
    row.dataset.state = state;
    row.innerHTML = '<svg class="tool__icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M5 8.2 7.1 10.3 11 6"/></svg>';
    row.append(el('code', undefined, call), el('span', 'tool__out', state === 'run' ? '' : out));
    return row;
  };
  const finishTool = (row: HTMLElement, out: string, state: 'done' | 'miss') => { row.dataset.state = state; row.querySelector('.tool__out')!.textContent = out; };
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

  const chipsFor = (said: Said | undefined): Chip[] => {
    if (!said) return otto.greetingChips.map(chip => ({ say: chip.text, label: chip.label }));
    if (said.greeting) return otto.greetingChips.map(chip => ({ say: chip.text, label: chip.label }));
    const ids = said.chips ?? (said.kind === 'intent' || said.kind === 'detail' ? [...(said.also ? [said.also] : []), ...(byId.get(said.id ?? '')?.follow ?? [])] : said.near ?? otto.topics);
    return [...new Set(ids)].slice(0, said.kind === 'say' ? 6 : 4).map(id => byId.get(id)).filter((intent): intent is OttoIntent => !!intent).map(intent => ({ ask: intent.id, label: intent.ask }));
  };
  const setChips = (chips: Chip[]) => {
    const hadFocus = chipRow.contains(document.activeElement);
    chipRow.replaceChildren(...chips.map(chip => {
      const button = el('button', 'chat__chip', chip.label);
      button.type = 'button';
      if (chip.ask) button.dataset.ask = chip.ask; else if (chip.say) button.dataset.say = chip.say;
      return button;
    }));
    chipRow.scrollLeft = 0;
    if (hadFocus) chipRow.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  };
  const lastSaid = () => [...turns].reverse().find((turn): turn is Said => !('you' in turn));
  const setBusy = (state: boolean) => {
    busy = state;
    chat.toggleAttribute('data-busy', state);
    log.setAttribute('aria-busy', String(state));
    chipRow.querySelectorAll('button').forEach(button => { button.disabled = state; });
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
    stick = true;
    follow();
  };
  const bubble = (turn: HTMLElement) => { const box = el('div', 'bubble'); const p = el('p'); box.append(p); turn.append(box); return p; };

  /** Render one Otto turn. live = trace + streaming; otherwise it appears complete. */
  const ottoTurn = async (said: Said, live: boolean, query = '', shortLine?: string) => {
    const turn = el('div', 'turn turn--agent');
    log.append(turn);
    const intent = said.id ? byId.get(said.id) : undefined;
    const traced = said.kind === 'intent' || said.kind === 'detail' || said.kind === 'miss';
    if (traced) {
      const trace = el('div', 'chat__tools-run');
      turn.append(trace);
      if (live) {
        const search = toolRow(`search_answers(${JSON.stringify((query || intent?.ask || '').slice(0, 40))})`, '', 'run');
        trace.append(search); follow();
        robot('think');
        await sleep(360);
        if (intent) {
          finishTool(search, '1 match', 'done');
          const open = toolRow(said.kind === 'detail' ? `read_detail("${intent.id}")` : intent.tool, '', 'run');
          trace.append(open); follow();
          await sleep(220);
          finishTool(open, 'ok', 'done');
        } else finishTool(search, '0 matches', 'miss');
      } else if (intent) trace.append(toolRow(intent.tool, 'ok', 'done'));
      else trace.append(toolRow('search_answers(…)', '0 matches', 'miss'));
    } else if (live) {
      const typing = el('p', 'thinking', 'Otto is typing…');
      turn.append(typing); follow();
      await sleep(420);
      typing.remove();
    }
    const paragraph = bubble(turn);
    const shown = shortLine ?? said.text;
    if (live) {
      window.dispatchEvent(new CustomEvent('otto:say', { detail: { text: shown } }));
      const mood = said.kind === 'social' ? social[said.id as keyof typeof social]?.mood : said.kind === 'miss' ? 'confused' : 'talk';
      robot(mood === 'cheeky' || mood === 'confused' ? mood : 'talk');
      await streamInto(paragraph, shown);
      robot(mood === 'wave' ? 'wave' : mood === 'cheeky' || mood === 'confused' ? mood : 'idle', 1400);
    } else paragraph.textContent = shown;
    if (shortLine) { follow(); return turn; }

    if (said.kind === 'help') {
      const list = el('div', 'cards');
      commands.forEach(command => {
        const button = el('button', 'chat__chip', `${command.name} · ${command.hint}`);
        button.type = 'button';
        button.dataset.command = command.name;
        list.append(button);
      });
      turn.append(list);
    }
    if (intent && (said.kind === 'intent' || said.kind === 'detail')) {
      const cards = cardsFor(intent);
      if (cards.length) turn.append(cardRow(cards));
      turn.append(footFor(intent, said.text));
    }
    if (said.kind === 'miss') turn.append(cardRow([{ title: 'Ask Omar directly', meta: 'Prepares an email you send', href: '/contact.html?topic=Hello' }]));
    follow();
    return turn;
  };

  /* ---------- answering ---------- */
  const say = async (said: Said, query: string) => {
    setBusy(true);
    skip = false;
    status.textContent = 'Otto is answering…';
    const intent = said.id ? byId.get(said.id) : undefined;
    turns.push(said); save();
    if (said.kind === 'intent' && intent?.inside) {
      const name = intent.ask.replace(/^(Show me|What’s|What's|What did Omar do (on|at)|What did Omar build at)\s*/i, '').replace(/\?$/, '') || intent.id;
      const line = `${said.text.startsWith('Language') ? 'Language! But fine. ' : ''}${name}? Good choice. Let me take you inside.`;
      const turn = await ottoTurn(said, true, query, line);
      const info = insideInfo(intent.id) ?? { name: intent.id };
      // otto-handoff stores 'otto-inside' only once the visitor actually takes his hand.
      const choice = await handoff(intent.id, info);
      if (choice === 'take') return;
      status.textContent = 'Staying here.';
      turn.remove();
      await ottoTurn(said, false);
    } else {
      await ottoTurn(said, true, query);
    }
    ctx = { ...ctx, recent: [...(ctx.recent ?? []), query.toLowerCase()].slice(-3) };
    if (said.kind === 'intent' || said.kind === 'detail') ctx.focus = said.id;
    save();
    status.textContent = `Otto: ${said.text}`;
    setChips(chipsFor(said));
    clearButton.hidden = false;
    setBusy(false);
    blip([660, 990]);
  };

  const replyFor = (reply: Reply): Said => {
    if (reply.kind === 'intent') {
      const intent = byId.get(reply.id)!;
      const lead = reply.prefix ?? leads[leadIndex++ % leads.length];
      const also = reply.also && byId.get(reply.also) ? ` You also asked about ${byId.get(reply.also)!.ask.replace(/\?$/, '')}: tap it below.` : '';
      return { kind: 'intent', id: intent.id, text: `${lead}${fill(intent.answer)}${also}`, also: reply.also };
    }
    if (reply.kind === 'detail') {
      const intent = byId.get(reply.id)!;
      const text = intent.detail?.[reply.part] ?? intent.detail?.more ?? `That’s everything I know about that. The sources below have the rest.`;
      return { kind: 'detail', id: intent.id, text };
    }
    if (reply.kind === 'social') {
      const entry = social[reply.id];
      ctx.awaiting = entry.awaitMood ? 'mood' : undefined;
      if (reply.then === 'topics') return { kind: 'say', text: `${pick(entry.replies)} ${otto.topicLead}`, chips: otto.topics };
      return { kind: 'social', id: reply.id, text: pick(entry.replies), chips: entry.chips.length ? entry.chips : undefined, greeting: entry.awaitMood };
    }
    return { kind: 'miss', text: ottoFallback.text, near: reply.near };
  };

  /** If the visitor speaks before Otto finished saying hello, finish it at once. */
  const finishGreeting = () => {
    if (greetingDone) return;
    greetingDone = true;
    // If the second greeting bubble already exists, each bubble keeps its own line.
    if (greetingNode) greetingNode.textContent = greetingSecond ? otto.greeting[0] : otto.greeting.join(' ');
    if (greetingSecond) greetingSecond.textContent = otto.greeting[1];
  };
  const ask = async (raw: string, preset?: string) => {
    const question = raw.trim().slice(0, 200);
    if (busy || (!question && !preset)) return;
    finishGreeting();
    const intent = preset ? byId.get(preset) : undefined;
    const shown = question || intent?.ask || '';
    if (shown.startsWith('/')) return runCommand(shown);
    youTurn(shown);
    turns.push({ you: shown });
    blip([880]);
    const reply: Reply = intent ? { kind: 'intent', id: intent.id } : brain.think(question, ctx);
    if (!(reply.kind === 'social' && social[reply.id].awaitMood)) ctx.awaiting = undefined;
    return say(replyFor(reply), shown);
  };

  const clear = (announce = true) => {
    turns = []; ctx = {};
    store.drop(storeKey);
    log.querySelectorAll('.turn:not([data-static])').forEach(node => node.remove());
    if (greetingNode) greetingNode.textContent = otto.greeting.join(' ');
    ctx.awaiting = 'mood';
    setChips(chipsFor(undefined));
    clearButton.hidden = true;
    if (announce) status.textContent = 'Conversation cleared.';
    input.focus({ preventScroll: true });
  };

  const runCommand = async (text: string) => {
    const name = text.toLowerCase().split(/\s+/)[0];
    const command = commands.find(item => item.name === name);
    if (command?.action === 'clear') return clear();
    youTurn(text); turns.push({ you: text });
    if (!command) return say({ kind: 'miss', text: ottoFallback.text, near: ['about', 'work', 'contact'] }, text);
    if (command.action === 'help') return say({ kind: 'help', text: 'Shortcuts I understand:' }, text);
    if (command.intent) return say(replyFor({ kind: 'intent', id: command.intent }), text);
  };

  /* ---------- composer ---------- */
  const matchingCommands = () => input.value.startsWith('/') ? commands.filter(command => command.name.startsWith(input.value.toLowerCase().split(/\s+/)[0])) : [];
  const commonPrefix = (names: string[]) => names.reduce((prefix, name) => { let i = 0; while (i < prefix.length && prefix[i] === name[i]) i++; return prefix.slice(0, i); });
  const showHint = () => {
    if (!hint) return;
    if (!input.value.startsWith('/')) { if (hint.dataset.mode) { hint.replaceChildren(...hintDefault); delete hint.dataset.mode; } return; }
    const found = matchingCommands();
    hint.dataset.mode = 'commands';
    hint.replaceChildren(...(found.length ? found.map(command => {
      const button = el('button', undefined, command.name);
      button.type = 'button'; button.dataset.command = command.name; button.title = command.hint;
      return button;
    }) : [document.createTextNode('No command like that. Try /help.')]));
    if (found.length) hint.append(document.createTextNode(found.length === 1 ? ` ${found[0].hint} · Tab to complete` : ' Tab to complete'));
  };
  input.addEventListener('input', showHint);
  input.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !event.shiftKey && input.value.startsWith('/')) {
      const found = matchingCommands();
      if (found.length && found[0].name !== input.value) { event.preventDefault(); input.value = found.length === 1 ? found[0].name : commonPrefix(found.map(command => command.name)); showHint(); }
    } else if (event.key === 'ArrowUp' && history.length && (input.value === '' || input.value === history[historyIndex])) {
      event.preventDefault(); historyIndex = Math.max(0, historyIndex - 1); input.value = history[historyIndex] ?? ''; showHint();
    } else if (event.key === 'ArrowDown' && historyIndex < history.length) {
      event.preventDefault(); historyIndex += 1; input.value = history[historyIndex] ?? ''; showHint();
    } else if (event.key === 'Escape' && busy) skip = true;
  });
  input.addEventListener('focus', () => { if (!busy) robot('idle'); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value || busy) return;
    if (history[history.length - 1] !== value) history.push(value);
    history.splice(0, Math.max(0, history.length - 20));
    store.set('otto-history', history);
    historyIndex = history.length;
    input.value = '';
    showHint();
    void ask(value);
  });
  chat.addEventListener('click', event => {
    const target = (event.target as Element).closest<HTMLElement>('[data-ask], [data-say], [data-command]');
    if (target?.dataset.ask) void ask('', target.dataset.ask);
    else if (target?.dataset.say) void ask(target.dataset.say);
    else if (target?.dataset.command) { input.value = ''; showHint(); void runCommand(target.dataset.command); }
    else if (busy && (event.target as Element).closest('.bubble')) skip = true;
  });
  clearButton.addEventListener('click', () => clear());
  chat.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const box = chat.getBoundingClientRect();
    chat.style.setProperty('--x', `${event.clientX - box.left}px`);
    chat.style.setProperty('--y', `${event.clientY - box.top}px`);
  });
  window.addEventListener('omar:ask', event => {
    const detail = (event as CustomEvent<{ id?: string; text?: string }>).detail ?? {};
    chat.scrollIntoView({ behavior: instant() ? 'auto' : 'smooth', block: 'center' });
    if (detail.id && byId.has(detail.id)) void ask('', detail.id); else if (detail.text) void ask(detail.text);
  });
  // Back/forward cache: welcome the visitor back from a tour.
  const welcomeBack = (id: string | null) => {
    if (!id || !byId.has(id)) return;
    const back: Said = { kind: 'say', text: otto.returned, chips: byId.get(id)!.follow };
    turns.push(back); save();
    void ottoTurn(back, false);
    setChips(chipsFor(back));
    robot('wave', 1200);
    follow();
  };
  addEventListener('pageshow', event => {
    if (event.persisted) { setBusy(false); welcomeBack(session.take('otto-inside')); }
  });

  /* ---------- typewriter placeholder ---------- */
  const examples: string[] = JSON.parse(input.dataset.placeholders || '[]');
  const resting = input.placeholder;
  if (examples.length) {
    let example = 0, chars = 0, deleting = false, visible = true;
    const idle = () => !input.value && document.activeElement !== input && !instant() && visible && !document.hidden;
    const tick = () => {
      if (!idle()) { input.placeholder = resting; window.setTimeout(tick, 1200); return; }
      const word = examples[example];
      chars += deleting ? -1 : 1;
      input.placeholder = word.slice(0, Math.max(0, chars)) || ' ';
      let delay = deleting ? 28 : 55;
      if (!deleting && chars >= word.length) { deleting = true; delay = 1800; }
      else if (deleting && chars <= 0) { deleting = false; example = (example + 1) % examples.length; delay = 350; }
      window.setTimeout(tick, delay);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(chat);
    input.addEventListener('focus', () => { input.placeholder = resting; });
    window.setTimeout(tick, 4200);
  }

  /* ---------- start: restore, greet, permalink ---------- */
  for (const turn of turns) {
    if ('you' in turn) { const node = el('div', 'turn turn--you'); node.append(el('p', 'bubble', turn.you)); log.append(node); }
    else if (!turn.id || byId.has(turn.id)) void ottoTurn(turn, false);
  }
  const returnedFrom = session.take('otto-inside');
  const permalink = (new URLSearchParams(location.search).get('ask') || '').trim();
  if (turns.length) {
    clearButton.hidden = false;
    log.scrollTop = log.scrollHeight;
    setChips(chipsFor(lastSaid()));
    welcomeBack(returnedFrom);
  } else if (!permalink) {
    // First visit: once Otto has landed (or the SVG Otto is standing in),
    // he waves, says hello and asks how you are, in two short bubbles.
    ctx.awaiting = 'mood';
    const landed = new Promise<void>(resolve => {
      const done = () => { window.removeEventListener('otto:landed', done); window.clearTimeout(cap); resolve(); };
      const cap = window.setTimeout(done, 4200);
      window.addEventListener('otto:landed', done);
      if (!document.querySelector('[data-otto-stage][data-stage-mode="hero"]:not([data-landed])')) done();
    });
    if (greetingNode && !instant()) {
      greetingNode.textContent = '';
      greetingDone = false;
      void (async () => {
        await landed;
        await sleep(350);
        if (greetingDone) return; // the visitor already started talking
        window.dispatchEvent(new CustomEvent('otto:say', { detail: { text: otto.greeting[0] } }));
        robot('wave', 1300);
        await streamInto(greetingNode, otto.greeting[0], () => greetingDone);
        if (greetingDone) { greetingNode.textContent = otto.greeting.join(' '); return; }
        await sleep(650);
        if (greetingDone) { greetingNode.textContent = otto.greeting.join(' '); return; }
        const second = el('div', 'turn turn--agent');
        greetingSecond = bubble(second);
        log.append(second);
        window.dispatchEvent(new CustomEvent('otto:say', { detail: { text: otto.greeting[1] } }));
        robot('welcome', 1800);
        await streamInto(greetingSecond, otto.greeting[1], () => greetingDone);
        greetingDone = true;
        follow();
      })();
    } else void landed.then(() => window.dispatchEvent(new CustomEvent('otto:say', { detail: { text: otto.greeting.join(' ') } })));
    setChips(chipsFor(undefined));
  }
  if (permalink) void ask(byId.has(permalink) ? '' : permalink, byId.has(permalink) ? permalink : undefined);

  // Test hook: what the brain decides for a message (no side effects).
  Object.defineProperty(chat, 'ottoThink', { value: (question: string, context: Context = {}) => {
    const reply = brain.think(question, context);
    return reply.kind === 'intent' ? reply.id : reply.kind === 'social' ? `soc:${reply.id}` : reply.kind === 'detail' ? `detail:${reply.id}:${reply.part}` : null;
  } });
}

export {};
