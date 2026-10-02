/*
 * Tiny local matcher for "Ask Omar": normalise, fold synonyms, then score each
 * intent by weighted keyword and phrase hits. No model, no network, no
 * dependencies. Below the threshold the chat says it hasn't written about it.
 */
import type { Intent } from '../data/agent';

const synonyms: Record<string, string> = {
  u: 'you', ur: 'your', r: 'are', pls: 'please', plz: 'please',
  teaching: 'teach', teache: 'teach', taught: 'teach', teacher: 'teach', tutoring: 'tutor', tutored: 'tutor', tuition: 'tutor',
  class: 'lesson', tutorial: 'lesson', kid: 'child', children: 'child', teen: 'child', teenager: 'child', boy: 'son', girl: 'daughter',
  alevel: 'a level', math: 'maths', mathematic: 'maths', mathematics: 'maths',
  building: 'build', built: 'build', making: 'build', make: 'build', made: 'build', create: 'build', created: 'build',
  researching: 'research', researcher: 'research', studying: 'study', studied: 'study', uni: 'university',
  hiring: 'hire', hired: 'hire', recruiting: 'recruit', recruiter: 'recruit', employ: 'hire', employment: 'hire', career: 'job',
  mail: 'email', emailing: 'email', contacting: 'contact', downloading: 'download',
  automating: 'automate', automated: 'automate', automation: 'automate', automatic: 'automate',
  certificate: 'certification', certified: 'certification', cert: 'certification', certificat: 'certification',
  priced: 'price', pricing: 'price', costing: 'cost', charging: 'charge', paying: 'pay', fees: 'fee',
  speaking: 'speak', spoken: 'speak', forecasting: 'forecast', predicting: 'predict', prediction: 'predict', predictive: 'predict',
  modelling: 'model', modeling: 'model', located: 'location', live: 'live', living: 'live',
  agentic: 'agentic', llms: 'llm', optimization: 'optimisation', optimise: 'optimisation', optimize: 'optimisation',
  programmer: 'programming', coder: 'code', coding: 'code', developer: 'code',
};

const keep = /(ss|us|is|ics|ys|as)$/;
function stem(word: string) {
  if (synonyms[word]) return synonyms[word];
  let base = word;
  if (base.length > 4 && base.endsWith('ies')) base = `${base.slice(0, -3)}y`;
  else if (base.length > 3 && base.endsWith('s') && !keep.test(base)) base = base.slice(0, -1);
  return synonyms[base] ?? base;
}

export function normalise(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘'`]/g, '')
    .replace(/[^a-z0-9&+]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap(word => stem(word).split(' '));
}

type Term = { tokens: string; weight: number };
export type Compiled = { id: string; ask: string; terms: Term[] }[];

export function compile(intents: Intent[]): Compiled {
  const terms = (list: string[] | undefined, weight: number) => (list ?? []).map(term => ({ tokens: ` ${normalise(term).join(' ')} `, weight }));
  return intents.map(intent => {
    // Synonym folding can make two terms identical (kid/child); count each once.
    const seen = new Set<string>();
    const unique = [...terms(intent.strong, 3), ...terms(intent.keys, 2), ...terms(intent.hints, 1)].filter(term => !seen.has(term.tokens) && !!seen.add(term.tokens));
    return { id: intent.id, ask: ` ${normalise(intent.ask).join(' ')} `, terms: unique };
  });
}

export const threshold = 2;

export function match(question: string, compiled: Compiled) {
  const text = ` ${normalise(question).join(' ')} `;
  const ranked = compiled
    .map((intent, order) => {
      if (intent.ask === text) return { id: intent.id, score: 99, strong: 9, order };
      const hits = intent.terms.filter(term => term.tokens.trim() && text.includes(term.tokens));
      return { id: intent.id, score: hits.reduce((sum, term) => sum + term.weight, 0), strong: hits.filter(term => term.weight === 3).length, order };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.strong - a.strong || a.order - b.order);
  const best = ranked[0] && ranked[0].score >= threshold ? ranked[0] : undefined;
  return { best, ranked };
}
