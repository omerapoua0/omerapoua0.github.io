/*
 * Otto, Omar's robot host: how he talks. Factual answers live in
 * src/data/agent.ts (already in Otto's third-person voice); this file adds
 * follow-up details, a few fact-free social lines and the conversation itself:
 * every reply Otto can give and the replies a visitor can choose next.
 * Visitors only choose (there is no text box), so Otto never meets a message
 * he can't answer. Nothing is typed, matched or sent. No model, no API.
 *
 * Node ids (a choice's `to`):
 *   hello                          the greeting: "How are you doing?"
 *   mood-good | mood-bad | mood-back   a mood reply, then the topics
 *   topics                         the topics again ("Back to topics")
 *   <intent>                       an answer from agent.ts, with cards and sources
 *   <intent>.more | <intent>.when  a follow-up slice of the same facts
 *   go:<project>                   "Let me take you inside", then the hand-off
 *   again:<project>                "Take me inside after all", then the hand-off
 *   later:<project>                the visitor stayed after a second offer
 *   projects:<project>             the other projects
 *   back:<project>                 back from that project's tour
 *   joke | who                     social replies (no facts)
 * Rules (checked by scripts/qa.cjs): every reply offers 2–6 choices (menus of
 * places up to 6, conversation 2–4), a way back to the topics, labels of at
 * most 30 characters and no duplicate labels in one set.
 */
import { intents as base, type AgentCard, type Intent } from './agent';
import { projects } from './projects';

export type Mood = 'idle' | 'wave' | 'talk' | 'think' | 'confused' | 'cheeky' | 'point';

export const otto = {
  name: 'Otto',
  greeting: ['Hey! I’m Otto, Omar’s robot.', 'How are you doing?'],
  topicLead: 'I’m here to talk about Omar. Where shall we start?',
  noscript: 'Hi, I’m Otto, Omar’s robot. Omar builds AI systems that reason at Digis Squared, is building NOOKBASE, and teaches maths and physics in London.',
  disclosure: 'Answers written by Omar. No AI model; nothing you choose leaves this page.',
};

export const insideIds = ['katana', 'nookbase', 'inos', 'bitget', 'bp'] as const;
const insideSet = new Set<string>(insideIds);
const byProject = new Map(projects.map(project => [project.id, project]));
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export interface OttoIntent extends Intent {
  /** A project with a tour at /inside/<id>.html: Otto offers his hand. */
  inside?: boolean;
  /** Follow-up slices of the same facts ("Tell me more", "When was that?"). */
  detail?: { more?: string; when?: string };
}

const details: Record<string, OttoIntent['detail']> = {
  santander: { when: 'Summer 2027. It’s upcoming, not something he’s done yet.' },
  study: { when: 'He’s expected to graduate in 2028.', more: 'The modules that matter most for his work: Linear Algebra, Calculus, Discrete Mathematics, and Data Modelling and Analysis. Target: First Class Honours.' },
  lessons: { more: 'How it works: you send an enquiry (the form prepares an email you send yourself), Omar replies within one working day, then there’s a free 15-minute intro call, then you agree lesson length, times and pricing directly.' },
  research: { when: 'Since 2026, and still going. It’s unpublished.', more: 'The core question: how efficiently do AI models complete university assignments, and what does that do to learning? Teaching and building NOOKBASE give him two more angles on it.' },
  hire: { more: 'He’d bring Python, statistics and modelling experience from Bitget and Digis Squared. The CV has the details, and the contact page prepares an email you send yourself.' },
};
for (const id of insideIds) {
  const project = byProject.get(id);
  if (!project) continue;
  details[id] = {
    when: `${project.period}, as ${project.role} (${project.org}).`,
    more: `What Omar did on ${project.name}: ${project.contribution.map(line => lowerFirst(line.replace(/\.$/, ''))).join('; ')}. ${project.stage}`,
  };
}

export const ottoIntents: OttoIntent[] = base.map(intent => ({ ...intent, inside: insideSet.has(intent.id), detail: details[intent.id] }));
const byId = new Map(ottoIntents.map(intent => [intent.id, intent]));

/** Social lines: no facts here. Several phrasings so Otto doesn't repeat himself. */
export const social = {
  'mood-good': { replies: ['Love to hear it.', 'Brilliant. Same here.', 'Good stuff.'], mood: 'wave' },
  'mood-bad': { replies: ['Sorry to hear that. I’ll keep it short and useful, then.', 'Ah, one of those days. Let me make this quick and painless.'], mood: 'talk' },
  'mood-back': { replies: ['Never better, thanks for asking. Robots don’t get Mondays.'], mood: 'wave' },
  joke: { replies: ['Why did the robot go back to school? Its skills were getting a bit rusty. Omar’s aren’t: he’s studying maths at Birkbeck.', 'There are 10 kinds of people: those who understand binary and those who don’t. Omar’s firmly in the first group.', 'I’d tell you a UDP joke, but you might not get it.'], mood: 'cheeky' },
  who: { replies: ['I’m Otto, Omar’s robot host. He built me to tell you about his work. No AI inside: just answers he wrote and some good manners.', 'Otto. Omar’s robot. I know what he’s written down: his work, research, lessons and how to reach him.'], mood: 'wave' },
} satisfies Record<string, { replies: string[]; mood: Mood }>;

export type Choice = { label: string; to: string; kind?: 'back' | 'go' };
export interface Reply {
  id: string;
  /** What Otto says. `{time}` is filled in with London time by the chat. */
  text: string;
  pose: Mood;
  /** The intent this reply speaks from: its sources (and cards, for a full answer). */
  intent?: string;
  /** A full answer: show the intent's cards as well as its sources. */
  cards?: boolean;
  /** Offer Otto's hand for this project; `stay` is the reply shown if the visitor stays. */
  handoff?: { id: string; stay: string };
  choices: Choice[];
}

type Pair = [label: string, to: string];
/** Each project's choice label, and how Otto names it in "…? Good choice." */
const named: Record<string, [label: string, spoken: string]> = {
  katana: ['KATANA', 'KATANA'],
  nookbase: ['NOOKBASE', 'NOOKBASE'],
  inos: ['INOS & OctiMind', 'INOS & OctiMind'],
  bitget: ['Bitget models', 'The Bitget models'],
  bp: ['BP pipeline', 'The BP pipeline'],
};
const project = (id: string): Pair => [named[id][0], `go:${id}`];
const topics: Pair[] = [['His work', 'work'], ['Research & study', 'research'], ['Lessons for my child', 'lessons'], ['Internships & hiring', 'hire'], ['Get in touch', 'contact'], ['Tell me a joke', 'joke']];

/** What a visitor can say after each answer or detail ("Back to topics" is added). */
const next: Record<string, Pair[]> = {
  hello: [['Good, thanks', 'mood-good'], ['Bit tired, honestly', 'mood-bad'], ['Who’s Omar?', 'about'], ['And you, Otto?', 'mood-back']],
  about: [['His work', 'work'], ['Research & study', 'research'], ['Lessons for my child', 'lessons']],
  work: insideIds.map(project),
  research: [['His degree', 'study'], ['Santander placement', 'santander'], ['Tell me more', 'research.more']],
  'research.more': [['When did it start?', 'research.when'], ['His degree', 'study']],
  'research.when': [['Santander placement', 'santander'], project('nookbase')],
  study: [['Tell me more', 'study.more'], ['When does he graduate?', 'study.when'], ['Any certifications?', 'certs']],
  'study.more': [['Any certifications?', 'certs'], ['His tech stack', 'skills']],
  'study.when': [['Santander placement', 'santander'], ['Any certifications?', 'certs']],
  santander: [['When is it?', 'santander.when'], ['Internships & hiring', 'hire']],
  'santander.when': [['Internships & hiring', 'hire'], ['What’s he researching?', 'research']],
  certs: [['His tech stack', 'skills'], ['Download his CV', 'cv']],
  skills: [['What AI does he use?', 'agents'], ['Any certifications?', 'certs'], ['Languages he speaks', 'languages']],
  agents: [project('katana'), project('nookbase'), ['His tech stack', 'skills']],
  languages: [['His tech stack', 'skills'], ['Lessons for my child', 'lessons']],
  lessons: [['How do lessons work?', 'lessons.more'], ['How much are lessons?', 'price'], ['Is it safe for my child?', 'safe']],
  'lessons.more': [['How much are lessons?', 'price'], ['Get in touch', 'contact']],
  price: [['How do lessons work?', 'lessons.more'], ['Is it safe for my child?', 'safe']],
  safe: [['How much are lessons?', 'price'], ['Where’s he based?', 'where']],
  where: [['Lessons for my child', 'lessons'], ['Languages he speaks', 'languages']],
  hire: [['What would he bring?', 'hire.more'], ['His tech stack', 'skills'], ['Download his CV', 'cv']],
  'hire.more': [['Santander placement', 'santander'], ['Get in touch', 'contact']],
  cv: [['Internships & hiring', 'hire'], ['Get in touch', 'contact']],
  contact: [['Download his CV', 'cv'], ['Can he automate my work?', 'automate'], ['Where’s he based?', 'where']],
  automate: [project('bp'), ['What AI does he use?', 'agents'], ['Get in touch', 'contact']],
  meta: [['Who’s Omar?', 'about'], ['Who are you, Otto?', 'who']],
  who: [['Are you a real AI?', 'meta'], ['Who’s Omar?', 'about']],
  joke: [['Another one', 'joke'], ['Are you a real AI?', 'meta'], ['Who’s Omar?', 'about']],
};
/** After a project's dates, one related thread to pull on. */
const related: Record<string, Pair> = {
  katana: ['What AI does he use?', 'agents'],
  nookbase: ['What’s he researching?', 'research'],
  inos: project('katana'),
  bitget: ['Is he open to internships?', 'hire'],
  bp: ['Can he automate my work?', 'automate'],
};

const choice = ([label, to]: Pair): Choice => ({ label, to, kind: to === 'topics' ? 'back' : /^(go|again):/.test(to) ? 'go' : undefined });
/** Every reply keeps a way back to the topics. */
const withBack = (pairs: Pair[]): Choice[] => [...pairs, ...(pairs.some(([, to]) => to === 'topics') ? [] : [['Back to topics', 'topics'] as Pair])].map(choice);
const others = (id: string) => insideIds.filter(other => other !== id).map(project);
const insideChoices = (id: string, middle: Pair): Choice[] => withBack([['Take me inside after all', `again:${id}`], middle, ['Other projects', `projects:${id}`]]);
const pickOf = <T>(list: T[], variant: number) => list[Math.abs(variant) % list.length];

/**
 * Otto's reply for a node id, or undefined if there is none. `variant` picks
 * between phrasings (the chat passes a running count, so a second joke differs).
 */
export function reply(id: string, variant = 0): Reply | undefined {
  const [head, arg = ''] = id.split(':');
  if (id === 'hello') return { id, text: otto.greeting.join(' '), pose: 'wave', choices: next.hello.map(choice) };
  if (id === 'mood-good' || id === 'mood-bad' || id === 'mood-back') {
    const entry = social[id];
    return { id, text: `${pickOf(entry.replies, variant)} ${otto.topicLead}`, pose: entry.mood, choices: topics.map(choice) };
  }
  if (id === 'topics') return { id, text: 'Sure. What else would you like to know about Omar?', pose: 'talk', choices: topics.map(choice) };
  if (id === 'joke' || id === 'who') return { id, text: pickOf(social[id].replies, variant), pose: social[id].mood, choices: withBack(next[id]) };
  if (arg && insideSet.has(arg)) {
    if (head === 'go') return { id, text: `${named[arg][1]}? Good choice. Let me take you inside.`, pose: 'point', handoff: { id: arg, stay: arg }, choices: insideChoices(arg, ['Tell me more', `${arg}.more`]) };
    if (head === 'again') return { id, text: 'Off we go, then. Take my hand.', pose: 'point', handoff: { id: arg, stay: `later:${arg}` }, choices: insideChoices(arg, ['Tell me more', `${arg}.more`]) };
    if (head === 'later') return { id, text: 'No problem. Whenever you’re ready.', pose: 'talk', choices: insideChoices(arg, ['Tell me more', `${arg}.more`]) };
    if (head === 'projects') return { id, text: 'Which one next? Pick one and I’ll take you inside.', pose: 'talk', choices: withBack(others(arg)) };
    if (head === 'back') return { id, text: 'Back from the inside! Where next?', pose: 'wave', choices: [...others(arg), ['Something else', 'topics'] as Pair].map(choice) };
  }
  const [intentId, part] = id.split('.') as [string, 'more' | 'when' | undefined];
  const intent = byId.get(intentId);
  if (!intent || id.includes(':')) return undefined;
  if (part) {
    const text = intent.detail?.[part];
    if (!text) return undefined;
    const choices = intent.inside ? insideChoices(intentId, part === 'more' ? ['When was that?', `${intentId}.when`] : related[intentId]) : next[id] ? withBack(next[id]) : undefined;
    return choices ? { id, text, pose: 'talk', intent: intentId, choices } : undefined;
  }
  const choices = intent.inside ? insideChoices(intentId, ['Tell me more', `${intentId}.more`]) : next[intentId] ? withBack(next[intentId]) : undefined;
  return choices ? { id, text: intent.answer, pose: 'talk', intent: intentId, cards: true, choices } : undefined;
}

/** The node an intent id opens: a project starts the hand-off. */
export const nodeFor = (intentId: string) => (insideSet.has(intentId) ? `go:${intentId}` : intentId);

export const insideCard = (id: string): AgentCard | undefined => {
  const project = byProject.get(id);
  return project ? { title: `Inside ${project.name}`, meta: 'Otto’s tour', href: `/inside/${id}.html` } : undefined;
};

/** Name and poster for Otto's chest screen during the hand-off. */
export const insideInfo = (id: string) => {
  const project = byProject.get(id);
  return project ? { name: project.name, media: project.media?.image } : undefined;
};
