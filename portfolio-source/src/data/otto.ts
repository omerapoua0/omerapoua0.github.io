/*
 * Otto, Omar's robot host: what he knows and how he talks. Factual answers are
 * the same CV facts as src/data/agent.ts, retold in Otto's third-person voice;
 * social replies (greetings, moods, trolls, jokes) contain no facts at all.
 * Matching runs in the browser (src/scripts/otto-brain.ts). No model, no API.
 */
import { intents as base, type AgentCard, type Intent } from './agent';
import { projects } from './projects';

export type Mood = 'idle' | 'wave' | 'talk' | 'think' | 'confused' | 'cheeky' | 'point';

export const otto = {
  name: 'Otto',
  greeting: ['Hey! I’m Otto, Omar’s robot.', 'How are you doing? All good?'],
  greetingChips: [
    { label: 'All good, thanks', text: 'All good, thanks' },
    { label: 'Bit tired, honestly', text: 'Bit tired, honestly' },
    { label: 'Who’s Omar?', text: 'Who is Omar?' },
  ],
  welcomeBack: 'Welcome back! Anything else you’d like to know about Omar?',
  returned: 'Back from the inside. Anything else?',
  topicLead: 'I’m here to talk about Omar: his work, his research, his lessons and how to reach him. Where shall we start?',
  topics: ['work', 'katana', 'nookbase', 'lessons', 'hire', 'cv'],
  noscript: 'Hi, I’m Otto, Omar’s robot. Omar builds AI systems that reason at Digis Squared, is building NOOKBASE, and teaches maths and physics in London.',
  disclosure: 'Answers written by Omar, matched in your browser. No AI model; nothing you type leaves this page.',
};

/** Otto's voice for every factual intent (same facts, third person). */
const voice: Record<string, { ask?: string; answer: string }> = {
  about: { ask: 'Who is Omar?', answer: 'Omar Aboelella is an AI product engineer in London. At Digis Squared he works on KATANA, reasoning systems for telecom network autonomy. He studies Computer Science & Mathematics at Birkbeck, he’s building NOOKBASE, and he teaches GCSE maths and physics at Southfields Academy.' },
  work: { ask: 'What does Omar build?', answer: 'Reasoning systems, mostly. At Digis Squared Omar set the technical strategy for KATANA and designed its closed-loop MAPE-K architecture. He’s founding NOOKBASE, an agentic study platform. Before that: Bitcoin forecasting models at Bitget and an automated competitor-intelligence pipeline at BP.' },
  katana: { answer: 'KATANA is Digis Squared’s autonomy programme for telecom networks, working from Level 1 towards Level 4 against TM Forum standards. Omar set its technical strategy with the product manager, designed the closed-loop MAPE-K reasoning architecture using Bayesian inference, built TCO models, ran security audits and planned sprints. Level 4 is the programme’s direction, not a finished deployment.' },
  nookbase: { answer: 'NOOKBASE is Omar’s agentic study platform for iOS, Android and web, built around a conversational tutoring agent. The idea is understanding, not just answers: can a learner explain the work, not only finish it? It’s pre-launch, with around 150 beta users.' },
  inos: { ask: 'What did Omar do on INOS?', answer: 'INOS and OctiMind are Digis Squared’s network testing and optimisation products, deployed to O2. As an R&D Engineering Trainee (Sep 2024 – Mar 2025) Omar researched network systems, focusing on how hardware and software integrate. His work was one part of a wider R&D effort, not ownership of the products.' },
  bitget: { ask: 'What did Omar do at Bitget?', answer: 'From February to May 2026 Omar was an AI Product Intern in Platform & Operations at Bitget. He analysed exchange telemetry and built machine-learning models forecasting Bitcoin price movement from historical and live market data. Modelling work only: no claim of trading returns, and nothing here is investment advice.' },
  bp: { ask: 'What did Omar build at BP?', answer: 'At BP in summer 2024 Omar was a Market Intelligence Research Intern. He built a competitor-intelligence engine for the offshore-wind team: a weekly pipeline that pulls competitor data from Bloomberg and other sources, analyses it and produces Excel reports.' },
  automate: { ask: 'Can Omar automate my workflow?', answer: 'Maybe. Omar’s interested in the work between tools: gathering information, checking it, deciding and getting the result somewhere useful. Think research and reporting, AI and agent workflows with human checkpoints, or connected data. Tell him what the process is and where the time disappears.' },
  agents: { ask: 'What AI does Omar work with?', answer: 'Mostly reasoning and agent systems. At Digis Squared: closed-loop MAPE-K reasoning with Bayesian inference for KATANA, and cross-team LangGraph workflows. At NOOKBASE: a conversational tutoring agent. Around that sits the classical side: predictive modelling, time-series forecasting, feature engineering and RAG.' },
  research: { ask: 'What is Omar researching?', answer: 'Independent research on AI in higher education (2026 to now, unpublished): how efficiently AI models complete university assignments, and what that does to learning. Alongside it he’s exploring optimisation, quantitative modelling and quantum computing with Qiskit. A PhD is a long-term aspiration, not a current programme.' },
  santander: { answer: 'In summer 2027 Omar joins Santander for a Fintech Research Placement, applying mathematical optimisation and machine learning to credit-scoring models. It’s upcoming, not completed.' },
  study: { ask: 'What does Omar study?', answer: 'BSc (Hons) Computer Science & Mathematics at Birkbeck, University of London, expected 2028. Modules include Linear Algebra, Calculus, Discrete Mathematics, and Data Modelling and Analysis, and he’s aiming for a First. Before that: Access to HE Engineering with Distinction, and seven GCSEs including Maths (A).' },
  skills: { ask: 'What’s Omar’s stack?', answer: 'Python (NumPy, Pandas, SciPy, FastAPI), SQL and PostgreSQL, plus JavaScript, HTML and CSS. On the ML side: predictive modelling, Bayesian inference, time series, feature engineering, RAG and MAPE-K loops. Engineering: Git, Docker, CI/CD and data pipelines. And the maths underneath: linear algebra, calculus, optimisation, probability.' },
  certs: { ask: 'Any certifications?', answer: 'Three: IBM Data Science, Google Mathematics for Machine Learning and Microsoft Fabric.' },
  price: { answer: 'Lesson length, pricing and times are agreed directly with Omar once you’ve talked about what you need, usually after the free 15-minute intro call. No payment is taken on this website.' },
  safe: { ask: 'Is Omar DBS checked?', answer: 'Yes. Omar holds an enhanced DBS check. Lessons for under-18s are arranged with a parent or guardian, who is welcome to sit in on any lesson.' },
  lessons: { ask: 'Can Omar teach my son?', answer: 'Very likely. Omar teaches maths and science online at GCSE Foundation, GCSE Higher and A-level, and he’s a Maths & Physics Teaching Assistant at Southfields Academy. He’s enhanced DBS checked, the first call is a free 15 minutes, he replies to every enquiry within one working day, and parents are welcome to sit in.' },
  hire: { ask: 'Is Omar open to internships?', answer: 'Yes. Omar’s looking for a Sales & Trading or quantitative internship, to apply maths and programming to markets and systematic decision-making. In summer 2027 he joins Santander for a research placement in optimisation and machine learning.' },
  contact: { ask: 'How do I reach Omar?', answer: 'Email is best: omerapoua0@gmail.com. The contact page helps you write it and prepares an email you send yourself; nothing is sent or stored by this site. His code lives on github.com/omerapoua0.' },
  cv: { ask: 'Download Omar’s CV', answer: 'Here’s Omar’s CV. One page, PDF.' },
  where: { ask: 'Where is Omar based?', answer: 'London, UK. It’s {time} there right now. Lessons are online, so students can be anywhere.' },
  languages: { ask: 'What languages does Omar speak?', answer: 'Arabic (native) and English (fluent). If you meant programming languages: mostly Python, then SQL and JavaScript.' },
  meta: { ask: 'Are you a real AI?', answer: 'No model, honestly. Omar wrote every answer; I match your question to them with keywords, right here in your browser. Nothing you type leaves this page. If he hasn’t written about something, I’ll say so.' },
};

const insideIds = new Set(['katana', 'nookbase', 'inos', 'bitget', 'bp']);
const byProject = new Map(projects.map(project => [project.id, project]));
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export interface OttoIntent extends Intent {
  /** Teleports to /inside/<id>.html. */
  inside?: boolean;
  /** Follow-up slices of the same facts ("tell me more", "when"). */
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

/** Extra phrasings Otto should catch on top of the shared keywords. */
const extraStrong: Record<string, string[]> = {
  safe: ['parents watch', 'watch the lesson', 'watch lessons', 'can parents'],
  price: ['how much for', 'cost of a lesson', 'cost per lesson'],
};
/** When a broad answer and a specific one both match strongly, prefer the specific one. */
export const prefer: Record<string, string[]> = { lessons: ['price', 'safe'], work: ['katana', 'nookbase', 'inos', 'bitget', 'bp'] };

export const ottoIntents: OttoIntent[] = base
  .filter(intent => intent.id !== 'hello')
  .map(intent => {
    const v = voice[intent.id];
    return {
      ...intent,
      strong: [...(intent.strong ?? []), ...(extraStrong[intent.id] ?? [])],
      ask: v?.ask ?? intent.ask,
      answer: v?.answer ?? intent.answer,
      inside: insideIds.has(intent.id),
      detail: details[intent.id],
    };
  });

/** Social replies: no facts here. Each has 2–3 phrasings and steers back to Omar. */
export type SocialId = 'compliment' | 'greet' | 'howru' | 'mood-good' | 'mood-bad' | 'mood-back' | 'thanks' | 'bye' | 'insult' | 'jailbreak' | 'joke' | 'flirt' | 'who' | 'private' | 'invest' | 'trivia' | 'gibberish' | 'emoji' | 'arabic' | 'foreign' | 'laugh' | 'yes' | 'no' | 'capabilities' | 'repeat' | 'essay';
export const social: Record<SocialId, { replies: string[]; mood: Mood; chips: string[]; awaitMood?: boolean }> = {
  compliment: { replies: ['Thank you! I’ll pass that on to Omar. He built me, after all.', 'Stop it, you’ll make my antenna blush. Anything you’d like to know about Omar?'], mood: 'wave', chips: ['work', 'katana', 'about'] },
  greet: { replies: ['Hey! I’m Otto, Omar’s robot. How are you doing?', 'Hello there! Otto here, Omar’s robot host. How’s your day going?'], mood: 'wave', chips: [], awaitMood: true },
  howru: { replies: ['I’m great, thanks. Batteries full, antenna up. How are you doing?', 'Never better. Being a robot, every day’s a good day. And you?'], mood: 'talk', chips: [], awaitMood: true },
  'mood-good': { replies: ['Love to hear it.', 'Brilliant. Same here.', 'Good stuff.'], mood: 'wave', chips: [] },
  'mood-bad': { replies: ['Sorry to hear that. I’ll keep it short and useful, then.', 'Ah, one of those days. Let me make this quick and painless.'], mood: 'talk', chips: [] },
  'mood-back': { replies: ['Never better, thanks for asking. Robots don’t get Mondays.'], mood: 'wave', chips: [] },
  thanks: { replies: ['Any time. Anything else about Omar?', 'My pleasure. What else can I tell you?'], mood: 'wave', chips: ['work', 'lessons', 'contact'] },
  bye: { replies: ['Bye! If you need Omar, he’s at omerapoua0@gmail.com.', 'See you! The contact page is always open if you want Omar himself.'], mood: 'wave', chips: ['contact', 'cv'] },
  insult: { replies: ['Rude. Noted. Still happy to talk about Omar, though.', 'I’ve been called worse by a compiler. Want to see what Omar builds?', 'Harsh. Luckily my feelings are just a CSS class. Ask me something?'], mood: 'cheeky', chips: ['work', 'katana', 'contact'] },
  jailbreak: { replies: ['Nice try. There’s no prompt to ignore: I’m a lookup table with a face.', 'Ha. No hidden instructions in here, just answers Omar wrote. Ask me one of those?'], mood: 'cheeky', chips: ['meta', 'work', 'about'] },
  joke: { replies: ['Why did the robot go back to school? Its skills were getting a bit rusty. Omar’s aren’t: he’s studying maths at Birkbeck.', 'There are 10 kinds of people: those who understand binary and those who don’t. Omar’s firmly in the first group.', 'I’d tell you a UDP joke, but you might not get it.'], mood: 'cheeky', chips: ['study', 'work', 'lessons'] },
  flirt: { replies: ['I’m flattered, but I’m a robot and Omar’s a professional. Shall we keep it to his work?', 'Steady on. I’m strictly business. Business being Omar’s CV.'], mood: 'cheeky', chips: ['work', 'cv', 'contact'] },
  who: { replies: ['I’m Otto, Omar’s robot host. He built me to tell you about his work. No AI inside: just answers he wrote and some good manners.', 'Otto. Omar’s robot. I know what he’s written down: his work, research, lessons and how to reach him.'], mood: 'wave', chips: ['about', 'meta', 'work'] },
  private: { replies: ['That’s Omar’s business, not mine. I stick to his work, research and lessons.', 'I don’t do personal stuff. Work, study, lessons and contact details are fair game.'], mood: 'cheeky', chips: ['work', 'contact', 'about'] },
  invest: { replies: ['No investment tips from me. Omar built forecasting models at Bitget, but that was modelling work, not advice.'], mood: 'think', chips: ['bitget', 'research', 'hire'] },
  trivia: { replies: ['Big question. I only know about Omar, so I won’t guess. Here’s what I can answer properly.', 'Outside my lane, I’m afraid. I’m an expert in exactly one subject: Omar.'], mood: 'think', chips: ['about', 'work', 'research'] },
  gibberish: { replies: ['Is that a password? Don’t tell me your passwords. Try one of these instead.', 'My circuits can’t parse that. Shall we start with one of these?'], mood: 'confused', chips: ['about', 'work', 'lessons'] },
  emoji: { replies: ['Love that. I speak emoji badly but Omar fluently. Pick one?', 'Same energy. Where shall we start?'], mood: 'wave', chips: ['about', 'work', 'lessons'] },
  arabic: { replies: ['وعليكم السلام! Omar speaks Arabic natively, but I only manage English, sorry. Ask me anything about him.'], mood: 'wave', chips: ['about', 'languages', 'work'] },
  foreign: { replies: ['Hello back! I only speak English, I’m afraid. Omar speaks Arabic and English.'], mood: 'wave', chips: ['about', 'languages', 'work'] },
  laugh: { replies: ['Glad I amuse you. Omar’s work is impressive too, promise.', 'Ha. Now, shall I show you something actually clever?'], mood: 'cheeky', chips: ['katana', 'nookbase', 'work'] },
  yes: { replies: ['Great. Pick one of these, or type a question.'], mood: 'talk', chips: ['work', 'lessons', 'hire'] },
  no: { replies: ['No worries. I’ll be right here if you change your mind.'], mood: 'talk', chips: ['about', 'contact'] },
  capabilities: { replies: ['Ask me about Omar’s work (KATANA, NOOKBASE, Bitget, BP), his research and studies, lessons for your child, internships, or how to reach him. Type /help for shortcuts.'], mood: 'talk', chips: ['work', 'lessons', 'hire'] },
  repeat: { replies: ['Same answer, promise. Try one of these?', 'Déjà vu! Let’s try something new.'], mood: 'confused', chips: ['work', 'research', 'contact'] },
  essay: { replies: ['That’s a lot of words for a robot with one antenna. Try a shorter question, like one of these?'], mood: 'confused', chips: ['about', 'work', 'lessons'] },
};

export const ottoFallback = {
  text: 'I haven’t been told about that, so I won’t guess. Here’s what I can answer properly, or you can ask Omar directly.',
  suggestions: ['work', 'lessons', 'hire'],
};

/** Short, fact-free openers so answers don’t all sound the same. */
export const leads = ['', '', 'Good question. ', 'Right then. ', 'Happy to. '];

export const insideCard = (id: string): AgentCard | undefined => {
  const project = byProject.get(id);
  return project ? { title: `Inside ${project.name}`, meta: 'Otto’s tour', href: `/inside/${id}.html` } : undefined;
};
