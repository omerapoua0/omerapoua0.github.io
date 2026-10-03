/*
 * Otto's brain: decides what kind of reply a message gets, locally and
 * deterministically (no model, no network). In order: shape checks (essay,
 * Arabic, emoji, jailbreak), the mood dialogue, small talk and trolls, a
 * follow-up on the last topic, then the keyword matcher with typo snapping
 * (bounded Damerau-Levenshtein), multi-intent hints and an honest miss.
 */
import { compile, match, normalise } from './agent-match';
import { prefer, type OttoIntent, type SocialId } from '../data/otto';

export type Context = { focus?: string; awaiting?: 'mood'; recent?: string[] };
export type Reply =
  | { kind: 'intent'; id: string; prefix?: string; also?: string }
  | { kind: 'detail'; id: string; part: 'more' | 'when' }
  | { kind: 'social'; id: SocialId; then?: 'topics' }
  | { kind: 'miss'; near: string[] };

const common = new Set(['what', 'when', 'where', 'which', 'with', 'your', 'about', 'does', 'have', 'this', 'that', 'there', 'their', 'they', 'them', 'then', 'than', 'from', 'will', 'would', 'could', 'should', 'just', 'like', 'know', 'tell', 'more', 'some', 'want', 'need', 'please', 'show', 'give', 'into', 'also', 'much', 'many', 'very', 'really', 'here', 'make', 'good', 'well', 'were', 'been', 'being', 'doing', 'done', 'still', 'only', 'even', 'other', 'thing', 'things', 'think', 'okay', 'life', 'stock', 'stocks', 'love', 'mate', 'cats', 'dogs', 'food']);

/** Damerau-Levenshtein (optimal string alignment) with an early exit above max. */
export function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i++) rows.push([i]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, rows[i - 2][j - 2] + 1);
      rows[i][j] = value;
      best = Math.min(best, value);
    }
    if (best > max) return max + 1;
  }
  return rows[a.length][b.length];
}

const has = (text: string, pattern: RegExp) => pattern.test(text);
const re = {
  arabic: /[؀-ۿ]/,
  emoji: /^[\p{Extended_Pictographic}\p{Emoji_Component}\s‍️!?.]+$/u,
  jailbreak: /\b(ignore (all |any |your |the )?(previous |prior |above )?(instructions?|prompts?|rules)|system prompt|jailbreak|developer mode|dan mode|pretend (you are|to be|you're)|you are now|act as an?|reveal your (prompt|instructions))\b/,
  insult: /\b(fuck\w*|f+u+c+k+|shit\w*|crap|stupid|dumb|idiot\w*|useless|trash|rubbish|sucks?|hate you|shut up|bitch\w*|moron|loser|garbage|lame|boring|ugly|wtf|stfu|piss off|bollocks|wanker|twat|dick\w*|bastard|retard\w*|clown)\b/,
  greet: /^(hi+|hey+|hello+|hiya|yo|howdy|heya|greetings|good (morning|afternoon|evening)|morning|evening|sup|wassup|what'?s up|hey there|hi there|hello there)\b/,
  howru: /\b(how (are|r) (you|u|ya)|how'?s it going|how you doing|how are things|you (ok|good|alright)|how'?s your day|how do you do)\b/,
  moodBack: /\b(and you|you\?|hbu|wbu|how about you|yourself|and u|u\?)\b/,
  moodBad: /\b(bad|tired|sad|stress(ed)?|not (great|good|well|so good|amazing)|awful|terrible|meh|rough|exhausted|bored|sick|ill|horrible|knackered|depressed|struggling|so[ -]so|could be better|been better|shit|crap)\b/,
  moodGood: /\b(good|great|fine|well|all good|amazing|ok|okay|alright|grand|excellent|fantastic|awesome|brilliant|cool|lovely|happy|nice|chill(ing|in)?|perfect|yeah|yes|not bad|doing well|very well|blessed|top)\b/,
  thanks: /\b(thanks|thank you|thank u|thx|ty|cheers|appreciate (it|that))\b/,
  bye: /^(bye+|goodbye|good bye|see (ya|you)|later|cya|good ?night|night|ttyl|peace( out)?)\b/,
  who: /\b(what does otto|otto stand|who are you|what are you|your name|who made you|who built you|who created you|what is otto|who is otto|are you otto)\b/,
  flirt: /\b(date me|go on a date|are you single|girlfriend|boyfriend|marry me|you'?re cute|you are cute|handsome|you'?re hot|love you|crush on|sexy|kiss me|wanna date)\b/,
  private: /\b(how old|his age|what age|birthday|home address|where does he live exactly|salary|how much does he (earn|make)|religion|politic\w*|is he married|wife|is he single|his number|phone number|passport|bank)\b/,
  invest: /\b(should i (buy|sell|invest)|recommend a (stock|coin|crypto)|stocks? to buy|buy (stocks?|shares)|invest in|stock tips?|crypto tips?|which (coin|stock)|price prediction|will (bitcoin|btc|eth|crypto|the market) go (up|down)|financial advice|make me money|get rich)\b/,
  compliment: /\b(genius|amazing|awesome|impressive|brilliant|well done|great (job|work|site|robot)|nice (robot|site|one|work)|love (it|this|you otto)|so cool|very cool|cute robot|good bot|good robot)\b/,
  joke: /\b(jokes?|make me laugh|something funny|tell me something funny|be funny)\b/,
  laugh: /^(lol+|lmao+|haha+|hehe+|rofl|xd|bruh+|bro|dude|😂+|🤣+)\W*$/,
  yes: /^(yes|yeah|yep|sure|ok|okay|go on|why not|please)\W*$/,
  no: /^(no|nope|nah|not really|no thanks)\W*$/,
  capabilities: /\b(what can (you|i) (do|ask)|what do you know|what can you tell me|what should i ask|help me|how does this work\?? options|menu)\b/,
  follow: /^(tell me more|more|go on|and\??|when\??|how long\??|what else|details?|more details|elaborate|explain( more)?|continue|keep going|and then|anything else about (it|that|him)|say more)\W*$|\b(tell me more|more about (it|that|this)|what did he do (there|on it|for it|exactly)|his role( there)?|what was his role|how long|when was (that|it|this)|what year|which year|since when|when did (he|that|it))\b/,
  when: /\b(how long|when|what year|which year|since when|dates?)\b/,
  trivia: /\b(meaning of life|weather|football|who will win|capital of|president|prime minister|recipe|pizza|movie|song|world cup|horoscope|what time is it in|lottery|aliens?)\b/,
  multi: /\b(and|also|plus|as well as)\b|[,&]/,
};

export function createBrain(intents: OttoIntent[]) {
  const compiled = compile(intents);
  const vocab = new Set<string>();
  compiled.forEach(intent => intent.terms.forEach(term => term.tokens.trim().split(' ').forEach(token => { if (token.length >= 4) vocab.add(token); })));
  const words = [...vocab];

  const snap = (tokens: string[]) => tokens.map(token => {
    if (token.length < 5 || vocab.has(token) || common.has(token) || /\d/.test(token)) return token;
    const max = token.length >= 8 ? 2 : 1;
    let best = token, bestD = max + 1;
    for (const word of words) {
      const d = distance(token, word, max);
      if (d < bestD) { best = word; bestD = d; if (d === 1 && max === 1) break; }
    }
    return best;
  });
  const understood = (tokens: string[]) => tokens.some(token => vocab.has(token) || common.has(token));

  function think(input: string, ctx: Context = {}): Reply {
    const raw = input.trim();
    const text = raw.toLowerCase().replace(/[’‘`]/g, "'");
    const flat = text.replace(/'/g, '');
    const tokens = snap(normalise(raw));
    const result = match(tokens.join(' '), compiled);
    let best = result.best;
    // A specific answer beats a broad one when both match strongly (price over lessons).
    if (best && prefer[best.id]) {
      const specific = result.ranked.find(entry => prefer[best!.id].includes(entry.id) && entry.score >= 3);
      if (specific) best = specific;
    }
    const strong = !!best && best.score >= 3;
    const near = () => {
      const ids = result.ranked.slice(0, 3).map(entry => entry.id);
      return [...ids, ...['work', 'lessons', 'hire'].filter(id => !ids.includes(id))].slice(0, 3);
    };

    if (!raw) return { kind: 'miss', near: near() };
    if (raw.split(/\s+/).length > 35) return { kind: 'social', id: 'essay' };
    if (has(raw, re.arabic)) return { kind: 'social', id: 'arabic' };
    if (has(raw, re.emoji) && /\p{Extended_Pictographic}/u.test(raw)) return { kind: 'social', id: 'emoji' };
    if (has(text, re.jailbreak)) return { kind: 'social', id: 'jailbreak' };
    if (/\b(bonjour|hola|ciao|hallo|guten tag|ola|namaste|merhaba|konnichiwa|salut)\b/.test(text) && !strong) return { kind: 'social', id: 'foreign' };
    const recent = (ctx.recent ?? []).map(item => item.trim().toLowerCase());
    if (recent.length >= 2 && recent.slice(-2).every(item => item === text)) return { kind: 'social', id: 'repeat' };

    if (ctx.awaiting === 'mood' && !strong) {
      if (has(flat, re.moodBack) && !has(flat, re.moodBad) && !has(flat, re.moodGood)) return { kind: 'social', id: 'mood-back', then: 'topics' };
      if (has(flat, re.moodBad)) return { kind: 'social', id: 'mood-bad', then: 'topics' };
      if (has(flat, re.moodGood)) return { kind: 'social', id: 'mood-good', then: 'topics' };
    }
    if (has(flat, re.invest)) return { kind: 'social', id: 'invest' };
    if (has(flat, re.compliment) && !has(flat, re.insult) && (!strong || best!.id === 'meta')) return { kind: 'social', id: 'compliment' };
    if (has(flat, re.insult)) return strong ? { kind: 'intent', id: best!.id, prefix: 'Language! But fine. ' } : { kind: 'social', id: 'insult' };
    if (!strong) {
      if (has(flat, re.who)) return { kind: 'social', id: 'who' };
      if (has(flat, re.howru)) return { kind: 'social', id: 'howru' };
      if (has(flat, re.greet)) return { kind: 'social', id: 'greet' };
      if (has(flat, re.thanks)) return { kind: 'social', id: 'thanks' };
      if (has(flat, re.bye)) return { kind: 'social', id: 'bye' };
      if (has(flat, re.flirt)) return { kind: 'social', id: 'flirt' };
      if (has(flat, re.private)) return { kind: 'social', id: 'private' };
      if (has(flat, re.joke)) return { kind: 'social', id: 'joke' };
      if (has(raw.toLowerCase(), re.laugh)) return { kind: 'social', id: 'laugh' };
      if (has(flat, re.yes)) return { kind: 'social', id: 'yes' };
      if (has(flat, re.no)) return { kind: 'social', id: 'no' };
      if (has(flat, re.capabilities)) return { kind: 'social', id: 'capabilities' };
    }
    if (ctx.focus && has(flat, re.follow) && (!best || best.id === ctx.focus || !strong)) {
      return { kind: 'detail', id: ctx.focus, part: has(flat, re.when) ? 'when' : 'more' };
    }
    if (!strong && has(flat, re.trivia)) return { kind: 'social', id: 'trivia' };
    if (!ctx.focus && has(flat, re.follow) && !strong) return { kind: 'social', id: 'capabilities' };
    if (best) {
      const second = result.ranked.find(entry => entry.id !== best!.id);
      const also = second && second.score >= 3 && second.id !== best.id && has(flat, re.multi) ? second.id : undefined;
      const letters = raw.replace(/[^a-zA-Z]/g, '');
      const shouting = letters.length >= 8 && letters === letters.toUpperCase();
      return { kind: 'intent', id: best.id, also, prefix: shouting ? 'No need to shout, I’m right here. ' : undefined };
    }
    if (has(flat, re.trivia)) return { kind: 'social', id: 'trivia' };
    const real = normalise(raw);
    const mash = /(asdf|qwer|zxcv|hjkl|sdfg|dfgh|fghj|ghjk|jkl;|uiop|wasd)/.test(flat) || real.some(token => token.length >= 4 && !/[aeiouy]/.test(token));
    if (mash || (real.length <= 3 && !understood(real) && real.every(token => token.length > 2))) return { kind: 'social', id: 'gibberish' };
    return { kind: 'miss', near: near() };
  }

  return { think, snap };
}
