/*
 * "Ask Omar": a chat over answers Omar wrote (src/data/agent.ts), matched in
 * the browser (agent-match.ts). Shows a short tool trace, streams the answer
 * word by word (instant with reduced or paused motion), then cards, sources,
 * copy/link buttons and follow-up chips. Also: slash commands with Tab
 * completion, ↑/↓ history, ?ask= permalinks, a transcript remembered in
 * localStorage with Clear, and an opt-in sound. Nothing leaves the page.
 */
import { intents, intro, fallback, commands, type Intent } from '../data/agent';
import { compile, match } from './agent-match';

type Turn = { you: string } | { id: string } | { miss: string; near: string[] } | { help: true };

const chat = document.querySelector<HTMLElement>('[data-chat]');
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
  const byId = new Map(intents.map(intent => [intent.id, intent]));
  const compiled = compile(intents);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const instant = () => reduce.matches || root.dataset.motion === 'off';
  const storeKey = 'omar-agent-v1';
  const store = {
    get<T>(key: string, fallbackValue: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallbackValue; } catch { return fallbackValue; } },
    set(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
    drop(key: string) { try { localStorage.removeItem(key); } catch { /* storage unavailable */ } },
  };

  let turns: Turn[] = [];
  let busy = false;
  let skip = false;
  const history: string[] = store.get<string[]>('omar-agent-history', []);
  let historyIndex = history.length;

  /* ---------- small helpers ---------- */
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const sleep = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, instant() || skip ? 0 : ms));
  const nearBottom = () => log.scrollHeight - log.scrollTop - log.clientHeight < 90;
  let stick = true;
  log.addEventListener('scroll', () => { stick = nearBottom(); if (stick) jump.hidden = true; }, { passive: true });
  const follow = () => { if (stick) { log.scrollTop = log.scrollHeight; jump.hidden = true; } else jump.hidden = false; };
  jump.addEventListener('click', () => { stick = true; log.scrollTo({ top: log.scrollHeight, behavior: instant() ? 'auto' : 'smooth' }); jump.hidden = true; });
  const londonTime = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }).format(new Date());
  const fill = (text: string) => text.replace('{time}', londonTime());
  const absolute = (href: string) => new URL(href, location.origin).href;

  /* ---------- opt-in sound (Web Audio, synthesised, off by default) ---------- */
  let audio: AudioContext | undefined;
  const soundOn = () => store.get<string>('omar-sound', 'off') === 'on';
  const labelSound = () => {
    soundButton.setAttribute('aria-pressed', String(soundOn()));
    soundButton.querySelector('[data-chat-sound-label]')!.textContent = soundOn() ? 'Sound on' : 'Sound off';
  };
  const blip = (notes: number[]) => {
    if (!soundOn() || instant()) return;
    try {
      audio ??= new AudioContext();
      notes.forEach((frequency, index) => {
        const start = audio!.currentTime + index * .07;
        const osc = audio!.createOscillator(), gain = audio!.createGain();
        osc.type = 'sine'; osc.frequency.value = frequency;
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

  const cardsFor = (intent: Intent) => {
    const row = el('div', 'cards');
    intent.cards?.forEach(card => {
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

  const copyText = async (text: string) => {
    try {
      await Promise.race([navigator.clipboard.writeText(text), new Promise((_, reject) => window.setTimeout(() => reject(new Error('timeout')), 1500))]);
      return true;
    } catch { return false; }
  };
  const footFor = (intent: Intent, text: string) => {
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
    const share = el('button', undefined, 'Link');
    share.type = 'button';
    share.setAttribute('aria-label', 'Copy a link to this answer');
    share.addEventListener('click', async () => {
      const ok = await copyText(absolute(`/index.html?ask=${intent.id}`));
      share.textContent = ok ? 'Link copied' : 'Copy failed';
      status.textContent = ok ? 'Link copied.' : 'Could not copy the link.';
      window.setTimeout(() => { share.textContent = 'Link'; }, 1600);
    });
    foot.append(sources, copy, share);
    return foot;
  };

  const setChips = (ids: string[]) => {
    const hadFocus = chipRow.contains(document.activeElement);
    chipRow.replaceChildren(...ids.map(id => byId.get(id)).filter((intent): intent is Intent => !!intent).map(intent => {
      const chip = el('button', 'chat__chip', intent.ask);
      chip.type = 'button';
      chip.dataset.ask = intent.id;
      return chip;
    }));
    chipRow.scrollLeft = 0;
    if (hadFocus) chipRow.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  };
  const setBusy = (state: boolean) => {
    busy = state;
    chat.toggleAttribute('data-busy', state);
    log.setAttribute('aria-busy', String(state));
    chipRow.querySelectorAll('button').forEach(button => { button.disabled = state; });
  };

  const streamInto = async (target: HTMLElement, text: string) => {
    if (instant() || skip) { target.textContent = text; return; }
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (skip) { target.textContent = text; return; }
      target.append(el('span', 'w', `${words[i]}${i < words.length - 1 ? ' ' : ''}`));
      if (i % 4 === 0) follow();
      await sleep(26);
    }
    target.textContent = text; // collapse spans into plain text once done
  };

  const userTurn = (text: string) => {
    const turn = el('div', 'turn turn--you');
    turn.append(el('p', 'bubble', text));
    log.append(turn);
    stick = true;
    follow();
  };

  /** Render an agent turn. `live` plays the trace and streaming; otherwise it appears complete. */
  const agentTurn = async (turnData: Exclude<Turn, { you: string }>, live: boolean, query = '') => {
    const turn = el('div', 'turn turn--agent');
    log.append(turn);
    const trace = el('div', 'chat__tools-run');
    turn.append(trace);
    let intent: Intent | undefined;
    let text = '';
    if ('id' in turnData) { intent = byId.get(turnData.id); text = fill(intent?.answer ?? ''); }
    else if ('miss' in turnData) text = fallback.text;
    else text = 'Commands I understand:';

    if (live) {
      const thinking = el('p', 'thinking', 'Thinking…');
      turn.append(thinking);
      follow();
      if ('help' in turnData) {
        const row = toolRow('list_commands()', '', 'run'); trace.append(row); await sleep(220); finishTool(row, `${commands.length} commands`, 'done');
      } else {
        const search = toolRow(`search_answers(${JSON.stringify((query || intent?.ask || '').slice(0, 40))})`, '', 'run');
        trace.append(search); follow();
        await sleep(380);
        if (intent) {
          finishTool(search, '1 match', 'done');
          const open = toolRow(intent.tool, '', 'run');
          trace.append(open); follow();
          await sleep(260);
          finishTool(open, 'ok', 'done');
        } else finishTool(search, '0 matches', 'miss');
      }
      thinking.remove();
    } else if ('help' in turnData) trace.append(toolRow('list_commands()', `${commands.length} commands`, 'done'));
    else if (intent) trace.append(toolRow(intent.tool, 'ok', 'done'));
    else trace.append(toolRow('search_answers(…)', '0 matches', 'miss'));

    const bubble = el('div', 'bubble');
    const paragraph = el('p');
    bubble.append(paragraph);
    turn.append(bubble);
    if (live) await streamInto(paragraph, text); else paragraph.textContent = text;

    if ('help' in turnData) {
      const list = el('div', 'cards');
      commands.forEach(command => {
        const button = el('button', 'chat__chip', `${command.name} · ${command.hint}`);
        button.type = 'button';
        button.dataset.command = command.name;
        list.append(button);
      });
      turn.append(list);
    }
    if (intent) {
      if (intent.cards?.length) turn.append(cardsFor(intent));
      turn.append(footFor(intent, text));
    }
    if ('miss' in turnData) {
      const row = el('div', 'cards');
      const ask = el('a', 'card');
      ask.href = '/contact.html?topic=Hello';
      const thumb = el('span', 'card__thumb', '→'); thumb.setAttribute('aria-hidden', 'true');
      const label = el('span'); label.append(el('strong', undefined, 'Ask me directly'), el('span', 'card__meta', 'Prepares an email you send'));
      ask.append(thumb, label);
      row.append(ask);
      turn.append(row);
    }
    follow();
    return text;
  };

  /* ---------- persistence ---------- */
  const save = () => store.set(storeKey, turns.slice(-40));
  const lastChips = () => {
    const last = [...turns].reverse().find(turn => !('you' in turn));
    if (last && 'id' in last) return byId.get(last.id)?.follow ?? intro.chips;
    if (last && 'miss' in last) return last.near;
    return intro.chips;
  };

  /* ---------- asking ---------- */
  const answer = async (turn: Exclude<Turn, { you: string }>, query: string) => {
    setBusy(true);
    skip = false;
    status.textContent = 'Answering…';
    turns.push(turn); save();
    const text = await agentTurn(turn, true, query);
    status.textContent = `Answer: ${text}`;
    setChips(lastChips());
    clearButton.hidden = false;
    setBusy(false);
    blip([660, 990]);
  };

  const ask = async (raw: string, preset?: string) => {
    const question = raw.trim().slice(0, 200);
    if (busy || (!question && !preset)) return;
    const intent = preset ? byId.get(preset) : undefined;
    const shown = question || intent?.ask || '';
    if (shown.startsWith('/')) return runCommand(shown);
    userTurn(shown);
    turns.push({ you: shown });
    blip([880]);
    if (intent) return answer({ id: intent.id }, shown);
    const result = match(question, compiled);
    if (result.best) return answer({ id: result.best.id }, question);
    const near = result.ranked.slice(0, 3).map(entry => entry.id);
    const suggestions = [...near, ...fallback.suggestions.filter(id => !near.includes(id))].slice(0, 3);
    return answer({ miss: question, near: suggestions }, question);
  };

  const clear = (announce = true) => {
    turns = [];
    store.drop(storeKey);
    log.querySelectorAll('.turn:not([data-static])').forEach(node => node.remove());
    setChips(intro.chips);
    clearButton.hidden = true;
    if (announce) status.textContent = 'Conversation cleared.';
    input.focus({ preventScroll: true });
  };

  const runCommand = async (text: string) => {
    const name = text.toLowerCase().split(/\s+/)[0];
    const command = commands.find(item => item.name === name);
    if (!command) {
      userTurn(text); turns.push({ you: text });
      return answer({ miss: text, near: ['about', 'work', 'contact'] }, text);
    }
    if (command.action === 'clear') return clear();
    userTurn(command.name); turns.push({ you: command.name });
    if (command.action === 'help') return answer({ help: true }, command.name);
    if (command.intent) return answer({ id: command.intent }, command.name);
  };

  /* ---------- composer: submit, history, slash completion ---------- */
  const matchingCommands = () => input.value.startsWith('/') ? commands.filter(command => command.name.startsWith(input.value.toLowerCase().split(/\s+/)[0])) : [];
  const showHint = () => {
    if (!hint) return;
    const found = matchingCommands();
    if (!input.value.startsWith('/')) { if (hint.dataset.mode) { hint.replaceChildren(...hintDefault); delete hint.dataset.mode; } return; }
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
  const commonPrefix = (names: string[]) => names.reduce((prefix, name) => { let i = 0; while (i < prefix.length && prefix[i] === name[i]) i++; return prefix.slice(0, i); });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value || busy) return;
    if (history[history.length - 1] !== value) history.push(value);
    history.splice(0, Math.max(0, history.length - 20));
    store.set('omar-agent-history', history);
    historyIndex = history.length;
    input.value = '';
    showHint();
    void ask(value);
  });

  chat.addEventListener('click', event => {
    const target = (event.target as Element).closest<HTMLElement>('[data-ask], [data-command]');
    if (target?.dataset.ask) void ask('', target.dataset.ask);
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

  /* ---------- typewriter placeholder (empty, unfocused, motion on) ---------- */
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
    window.setTimeout(tick, 2400);
  }

  /* ---------- start: restore, permalink, or intro ---------- */
  const saved = store.get<Turn[]>(storeKey, []).filter(turn => turn && typeof turn === 'object');
  turns = saved;
  for (const turn of saved) {
    if ('you' in turn) { const node = el('div', 'turn turn--you'); node.append(el('p', 'bubble', turn.you)); log.append(node); }
    else if (('id' in turn && byId.has(turn.id)) || 'miss' in turn || 'help' in turn) void agentTurn(turn, false);
  }
  if (saved.length) { setChips(lastChips()); clearButton.hidden = false; log.scrollTop = log.scrollHeight; }
  const params = new URLSearchParams(location.search);
  const permalink = (params.get('ask') || '').trim();
  if (permalink) void ask(byId.has(permalink) ? '' : permalink, byId.has(permalink) ? permalink : undefined);
  // Test hook: the matcher, so QA can check routing without typing.
  Object.defineProperty(chat, 'agentMatch', { value: (question: string) => match(question, compiled).best?.id ?? null });
}

export {};
