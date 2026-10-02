/*
 * Knowledge base for "Ask Omar" on the homepage. Every answer is written by
 * Omar from the CV and site facts; nothing calls a language model. Questions
 * are matched in the browser by weighted keywords (see src/scripts/agent-match.ts).
 * Keep wording within what src/data/*.ts and the CV already state.
 */
export interface AgentCard {
  title: string;
  meta: string;
  href: string;
  /** Small duotone thumbnail (project plates only). */
  image?: string;
  external?: boolean;
}
export interface AgentSource { label: string; href: string }
export interface Intent {
  id: string;
  /** The question as a chip or follow-up shows it. */
  ask: string;
  /** Pretend tool call shown in the trace, e.g. open("work/katana"). */
  tool: string;
  /** Weighted match terms (single words or phrases), written in plain English. */
  strong?: string[]; // 3 points each
  keys?: string[]; // 2 points each
  hints?: string[]; // 1 point each
  answer: string;
  cards?: AgentCard[];
  sources: AgentSource[];
  follow: string[];
}

const cv: AgentCard = { title: 'CV (PDF)', meta: 'One page · opens in a new tab', href: '/Omar-Aboelella-CV.pdf', external: true };
const lessonCta: AgentCard = { title: 'Start a lesson enquiry', meta: 'Prepares an email you send', href: '/tutoring.html#lesson-enquiry' };

/** Order breaks ties: more specific intents (price, safe) come before broader ones. */
export const intents: Intent[] = [
  {
    id: 'about', ask: 'Who are you?', tool: 'open("profile/omar")',
    strong: ['who are you', 'about you', 'yourself', 'who is omar', 'introduce'],
    keys: ['omar', 'background', 'currently', 'right now', 'tell me about'],
    hints: ['you', 'what do you do'],
    answer: 'I’m Omar Aboelella, an AI product engineer in London. At Digis Squared I work on KATANA, reasoning systems for telecom network autonomy. I study Computer Science & Mathematics at Birkbeck, I’m building NOOKBASE, and I teach GCSE maths and physics at Southfields Academy.',
    cards: [{ title: 'About & CV', meta: 'Experience, education, skills', href: '/cv.html' }],
    sources: [{ label: 'cv/profile', href: '/cv.html' }],
    follow: ['work', 'study', 'lessons'],
  },
  {
    id: 'work', ask: 'What do you build?', tool: 'search("work/*")',
    strong: ['what do you build', 'your work', 'portfolio', 'what have you built', 'show me your projects'],
    keys: ['project', 'build', 'case study', 'experience', 'job'],
    hints: ['work', 'done'],
    answer: 'Reasoning systems, mostly. At Digis Squared I set the technical strategy for KATANA and designed its closed-loop MAPE-K architecture. I’m founding NOOKBASE, an agentic study platform. Before that: Bitcoin forecasting models at Bitget and an automated competitor-intelligence pipeline at BP.',
    cards: [
      { title: 'KATANA', meta: 'Network autonomy · Digis Squared', href: '/work.html#katana', image: '/project-katana-v14.jpg' },
      { title: 'NOOKBASE', meta: 'Founder · pre-launch', href: '/work.html#nookbase', image: '/project-nookbase.jpg' },
      { title: 'All projects', meta: 'Six entries · filters', href: '/work.html' },
    ],
    sources: [{ label: 'work/index', href: '/work.html' }],
    follow: ['katana', 'nookbase', 'bitget'],
  },
  {
    id: 'katana', ask: 'Show me KATANA', tool: 'open("work/katana")',
    strong: ['katana', 'mape k', 'mape', 'network autonomy', 'level 4', 'current job', 'current role'],
    keys: ['digis', 'digis squared', 'telecom', 'autonomy', 'bayesian', 'tm forum', 'langgraph', 'day job'],
    hints: ['network'],
    answer: 'KATANA is Digis Squared’s autonomy programme for telecom networks, working from Level 1 towards Level 4 against TM Forum standards. I set its technical strategy with the product manager, designed the closed-loop MAPE-K reasoning architecture using Bayesian inference, built TCO models, ran security audits and planned sprints. Level 4 is the programme’s direction, not a finished deployment.',
    cards: [{ title: 'KATANA case study', meta: 'Jan 2026 – present', href: '/work.html#katana', image: '/project-katana-v14.jpg' }],
    sources: [{ label: 'work/katana', href: '/work.html#katana' }, { label: 'cv/experience', href: '/cv.html#experience' }],
    follow: ['agents', 'inos', 'skills'],
  },
  {
    id: 'nookbase', ask: 'What’s NOOKBASE?', tool: 'open("work/nookbase")',
    strong: ['nookbase', 'nook base', 'nook', 'startup', 'your company', 'founder'],
    keys: ['founding', 'beta', 'app', 'study platform', 'side project'],
    hints: ['launch', 'users'],
    answer: 'My agentic study platform for iOS, Android and web, built around a conversational tutoring agent. The idea is understanding, not just answers: can a learner explain the work, not only finish it? It’s pre-launch, with around 150 beta users.',
    cards: [{ title: 'NOOKBASE case study', meta: 'Founder · ~150 beta users', href: '/work.html#nookbase', image: '/project-nookbase.jpg' }],
    sources: [{ label: 'work/nookbase', href: '/work.html#nookbase' }],
    follow: ['research', 'agents', 'lessons'],
  },
  {
    id: 'inos', ask: 'What did you do on INOS?', tool: 'open("work/inos")',
    strong: ['inos', 'octimind', 'o2', 'trainee', 'traineeship'],
    keys: ['r&d', 'hardware', 'network testing', 'optimisation products'],
    answer: 'INOS and OctiMind are Digis Squared’s network testing and optimisation products, deployed to O2. As an R&D Engineering Trainee (Sep 2024 – Mar 2025) I researched network systems, focusing on how hardware and software integrate. My work was one part of a wider R&D effort, not ownership of the products.',
    cards: [{ title: 'INOS & OctiMind', meta: 'R&D · Digis Squared', href: '/work.html#inos', image: '/project-inos.jpg' }],
    sources: [{ label: 'work/inos', href: '/work.html#inos' }],
    follow: ['katana', 'skills', 'work'],
  },
  {
    id: 'bitget', ask: 'What did you do at Bitget?', tool: 'open("work/bitget")',
    strong: ['bitget', 'bitcoin', 'crypto', 'btc', 'cryptocurrency'],
    keys: ['price prediction', 'forecasting', 'time series', 'telemetry', 'exchange'],
    hints: ['predict', 'model'],
    answer: 'From February to May 2026 I was an AI Product Intern in Platform & Operations at Bitget. I analysed exchange telemetry and built machine-learning models forecasting Bitcoin price movement from historical and live market data, with a lot of feature engineering. It was modelling work: no claim of trading returns, and nothing here is investment advice.',
    cards: [{ title: 'Crypto prediction models', meta: 'Bitget · Feb – May 2026', href: '/work.html#bitget' }],
    sources: [{ label: 'work/bitget', href: '/work.html#bitget' }],
    follow: ['hire', 'skills', 'research'],
  },
  {
    id: 'bp', ask: 'What did you build at BP?', tool: 'open("work/bp")',
    strong: ['bp', 'offshore wind', 'competitor intelligence', 'bloomberg'],
    keys: ['pipeline', 'excel', 'report', 'market intelligence', 'energy'],
    answer: 'At BP in summer 2024 I was a Market Intelligence Research Intern. I built a competitor-intelligence engine for the offshore-wind team: a weekly pipeline that pulls competitor data from Bloomberg and other sources, analyses it and produces Excel reports, so nobody rebuilt the same research by hand every week.',
    cards: [{ title: 'Competitor Intelligence Engine', meta: 'BP · Jun – Sep 2024', href: '/work.html#bp' }],
    sources: [{ label: 'work/bp', href: '/work.html#bp' }, { label: 'automations', href: '/automations.html' }],
    follow: ['automate', 'work', 'skills'],
  },
  {
    id: 'automate', ask: 'Can you automate my workflow?', tool: 'open("automations")',
    strong: ['automate', 'automation', 'workflow', 'freelance', 'consulting'],
    keys: ['repetitive', 'manual', 'process', 'integration', 'api', 'help my business', 'my team'],
    answer: 'Maybe. I’m interested in the work between tools: gathering information, checking it, deciding and getting the result somewhere useful. Think research and reporting, AI and agent workflows with human checkpoints, or connected data. Tell me what the process is and where the time disappears.',
    cards: [{ title: 'Automations', meta: 'Where I can help', href: '/automations.html' }, { title: 'Bring me a workflow', meta: 'Prepares an email you send', href: '/contact.html?topic=Automation' }],
    sources: [{ label: 'automations', href: '/automations.html' }, { label: 'work/bp', href: '/work.html#bp' }],
    follow: ['bp', 'agents', 'contact'],
  },
  {
    id: 'agents', ask: 'What AI do you work with?', tool: 'search("skills/ai")',
    strong: ['agents', 'agentic', 'llm', 'rag', 'machine learning', 'artificial intelligence', 'langgraph'],
    keys: ['ai', 'ml', 'reasoning', 'neural'],
    answer: 'Mostly reasoning and agent systems. At Digis Squared: closed-loop MAPE-K reasoning with Bayesian inference for KATANA, and cross-team LangGraph workflows. At NOOKBASE: a conversational tutoring agent. Around that sits the classical side: predictive modelling, time-series forecasting, feature engineering and RAG.',
    cards: [{ title: 'Capability matrix', meta: 'Every skill linked to evidence', href: '/index.html#skills-title' }],
    sources: [{ label: 'cv/skills', href: '/cv.html#skills' }, { label: 'work/katana', href: '/work.html#katana' }],
    follow: ['katana', 'nookbase', 'skills'],
  },
  {
    id: 'research', ask: 'What are you researching?', tool: 'open("research/*")',
    strong: ['research', 'researching', 'higher education', 'phd', 'quantum', 'qiskit', 'paper'],
    keys: ['publication', 'published', 'academic', 'interests', 'curious', 'optimisation', 'stochastic'],
    answer: 'Independent research on AI in higher education (2026 to now, unpublished): how efficiently AI models complete university assignments, and what that does to learning. Alongside it I’m exploring optimisation, quantitative modelling and quantum computing with Qiskit. A PhD is a long-term aspiration, not a current programme.',
    cards: [{ title: 'Research notebook', meta: 'Questions, not papers', href: '/research.html' }],
    sources: [{ label: 'research/ai-he', href: '/research.html#ai-he' }, { label: 'research/quantum', href: '/research.html#quantum' }],
    follow: ['santander', 'nookbase', 'study'],
  },
  {
    id: 'santander', ask: 'Tell me about Santander', tool: 'open("research/optimisation")',
    strong: ['santander', 'credit scoring', 'placement', 'summer 2027'],
    keys: ['fintech', 'bank', 'banking', 'credit'],
    answer: 'In summer 2027 I’m joining Santander for a Fintech Research Placement, applying mathematical optimisation and machine learning to credit-scoring models. It’s upcoming, not completed.',
    cards: [{ title: 'Optimisation research', meta: 'Incoming · Summer 2027', href: '/research.html#optimisation' }],
    sources: [{ label: 'research/optimisation', href: '/research.html#optimisation' }, { label: 'cv/experience', href: '/cv.html#experience' }],
    follow: ['hire', 'research', 'study'],
  },
  {
    id: 'study', ask: 'What do you study?', tool: 'open("cv/education")',
    strong: ['birkbeck', 'degree', 'university', 'study', 'bsc', 'modules', 'first class', 'graduate', 'graduation', 'graduating'],
    keys: ['course', 'college', 'grades', 'gcse results', 'education', 'qualification', 'maths degree', 'access to he'],
    hints: ['mathematics', 'maths'],
    answer: 'BSc (Hons) Computer Science & Mathematics at Birkbeck, University of London, expected 2028. Modules include Linear Algebra, Calculus, Discrete Mathematics, and Data Modelling and Analysis, and I’m aiming for a First. Before that: Access to HE Engineering with Distinction, and seven GCSEs including Maths (A).',
    cards: [{ title: 'Education', meta: 'About & CV', href: '/cv.html#education' }],
    sources: [{ label: 'cv/education', href: '/cv.html#education' }],
    follow: ['certs', 'research', 'skills'],
  },
  {
    id: 'skills', ask: 'What’s your stack?', tool: 'search("cv/skills")',
    strong: ['stack', 'skills', 'tech stack', 'programming', 'python', 'tools', 'technologies', 'what can you do'],
    keys: ['sql', 'docker', 'javascript', 'code', 'coding', 'framework', 'good at', 'proficient'],
    answer: 'Python (NumPy, Pandas, SciPy, FastAPI), SQL and PostgreSQL, plus JavaScript, HTML and CSS. On the ML side: predictive modelling, Bayesian inference, time series, feature engineering, RAG and MAPE-K loops. Engineering: Git, Docker, CI/CD and data pipelines. And the maths underneath: linear algebra, calculus, optimisation, probability.',
    cards: [{ title: 'Skills on the CV', meta: 'About & CV', href: '/cv.html#skills' }, { title: 'Capability matrix', meta: 'Skill → where it was used', href: '/index.html#skills-title' }],
    sources: [{ label: 'cv/skills', href: '/cv.html#skills' }],
    follow: ['agents', 'certs', 'work'],
  },
  {
    id: 'certs', ask: 'Any certifications?', tool: 'search("cv/certifications")',
    strong: ['certification', 'certificate', 'certified', 'ibm', 'microsoft fabric', 'credential', 'data science'],
    keys: ['google', 'microsoft', 'fabric', 'online course', 'qualification'],
    answer: 'Three: IBM Data Science, Google Mathematics for Machine Learning and Microsoft Fabric.',
    cards: [{ title: 'About & CV', meta: 'Certifications', href: '/cv.html#education' }],
    sources: [{ label: 'cv/certifications', href: '/cv.html#education' }],
    follow: ['study', 'skills', 'cv'],
  },
  {
    id: 'price', ask: 'How much are lessons?', tool: 'open("lessons/faq")',
    strong: ['price', 'pricing', 'cost', 'how much', 'fee', 'rate', 'per hour', 'hourly', 'charge'],
    keys: ['pay', 'payment', 'afford', 'expensive', 'cheap', 'budget'],
    answer: 'Lesson length, pricing and times are agreed directly once we’ve talked about what you need, usually after the free 15-minute intro call. No payment is taken on this website.',
    cards: [lessonCta],
    sources: [{ label: 'lessons/faq', href: '/tutoring.html#faq-title' }],
    follow: ['lessons', 'safe', 'contact'],
  },
  {
    id: 'safe', ask: 'Are you DBS checked?', tool: 'open("lessons/safeguarding")',
    strong: ['dbs', 'safeguarding', 'background check', 'vetted', 'sit in', 'safe', 'is it safe', 'safety'],
    keys: [ 'trust', 'parent', 'guardian', 'under 18'],
    answer: 'Yes. I hold an enhanced DBS check. Lessons for under-18s are arranged with a parent or guardian, who is welcome to sit in on any lesson.',
    cards: [lessonCta],
    sources: [{ label: 'lessons/faq', href: '/tutoring.html#faq-title' }],
    follow: ['lessons', 'price', 'contact'],
  },
  {
    id: 'lessons', ask: 'Can you teach my son?', tool: 'open("lessons/*")',
    strong: ['tutor', 'tutoring', 'lesson', 'teach', 'tuition', 'gcse', 'a level', 'son', 'daughter', 'child', 'kid'],
    keys: ['physics', 'science', 'exam', 'revision', 'southfields', 'student', 'help with maths', 'chemistry', 'biology'],
    hints: ['maths', 'mathematics', 'help'],
    answer: 'Probably. I teach maths and science online at GCSE Foundation, GCSE Higher and A-level, and I’m a Maths & Physics Teaching Assistant at Southfields Academy. I’m enhanced DBS checked, the first call is a free 15 minutes, I reply to every enquiry within one working day, and parents are welcome to sit in.',
    cards: [lessonCta, { title: 'How lessons work', meta: 'Levels · process · FAQ', href: '/tutoring.html#how' }],
    sources: [{ label: 'lessons', href: '/tutoring.html' }],
    follow: ['price', 'safe', 'contact'],
  },
  {
    id: 'hire', ask: 'Open to internships?', tool: 'search("cv/goals")',
    strong: ['internship', 'intern', 'hire', 'hiring', 'recruit', 'opportunity', 'job', 'vacancy', 'quant', 'sales trading', 'sales & trading'],
    keys: ['available', 'looking for', 'open to', 'role', 'position', 'trading', 'finance', 'work with you', 'join'],
    answer: 'Yes. I’m looking for a Sales & Trading or quantitative internship, to apply maths and programming to markets and systematic decision-making. In summer 2027 I join Santander for a research placement in optimisation and machine learning.',
    cards: [cv, { title: 'Get in touch', meta: 'Opportunity · prepares an email', href: '/contact.html?topic=Opportunity' }],
    sources: [{ label: 'cv/experience', href: '/cv.html#experience' }],
    follow: ['cv', 'santander', 'bitget'],
  },
  {
    id: 'contact', ask: 'How do I reach you?', tool: 'open("contact")',
    strong: ['contact', 'email', 'reach you', 'get in touch', 'message you', 'github', 'linkedin'],
    keys: ['talk to you', 'speak to you', 'reach', 'touch', 'connect', 'socials', 'phone'],
    answer: 'Email is best: omerapoua0@gmail.com. The contact page helps you write it and prepares an email you send yourself; nothing is sent or stored by this site. Code lives on github.com/omerapoua0.',
    cards: [{ title: 'Contact', meta: 'Prepares an email you send', href: '/contact.html' }, { title: 'GitHub', meta: 'github.com/omerapoua0', href: 'https://github.com/omerapoua0', external: true }],
    sources: [{ label: 'contact', href: '/contact.html' }],
    follow: ['hire', 'lessons', 'cv'],
  },
  {
    id: 'cv', ask: 'Download your CV', tool: 'fetch("Omar-Aboelella-CV.pdf")',
    strong: ['cv', 'resume', 'résumé', 'curriculum vitae', 'download'],
    keys: ['pdf', 'one pager'],
    answer: 'Here you go. One page, PDF.',
    cards: [cv, { title: 'About & CV', meta: 'The same, as a web page', href: '/cv.html' }],
    sources: [{ label: 'cv', href: '/cv.html' }],
    follow: ['hire', 'skills', 'contact'],
  },
  {
    id: 'where', ask: 'Where are you based?', tool: 'search("profile/location")',
    strong: ['where are you', 'based', 'location', 'london', 'timezone', 'time zone', 'what time'],
    keys: ['live', 'city', 'country', 'uk', 'remote', 'online', 'relocate'],
    answer: 'London, UK. It’s {time} here right now. Lessons are online, so students can be anywhere.',
    sources: [{ label: 'profile', href: '/cv.html' }],
    follow: ['lessons', 'hire', 'contact'],
  },
  {
    id: 'languages', ask: 'What languages do you speak?', tool: 'search("cv/languages")',
    strong: ['speak', 'arabic', 'english', 'bilingual', 'native'],
    keys: ['language', 'fluent'],
    answer: 'Arabic (native) and English (fluent). If you meant programming languages: mostly Python, then SQL and JavaScript.',
    sources: [{ label: 'cv/languages', href: '/cv.html#skills' }],
    follow: ['skills', 'lessons', 'about'],
  },
  {
    id: 'meta', ask: 'Is this a real AI?', tool: 'open("how-this-works")',
    strong: ['real ai', 'this chat', 'powered by', 'are you ai', 'are you an ai', 'is this ai', 'chatgpt', 'gpt', 'bot', 'scripted', 'language model', 'how does this work', 'how do you work', 'are you real', 'are you human', 'fake'],
    keys: ['openai', 'claude', 'gemini', 'model', 'robot', 'privacy', 'data'],
    answer: 'No model, honestly. I wrote every answer myself from my CV, and your question is matched to them by keywords, in your browser. Nothing you type leaves this page. If I haven’t written about something, I’ll say so.',
    sources: [{ label: 'source', href: 'https://github.com/omerapoua0' }],
    follow: ['about', 'agents', 'contact'],
  },
  {
    id: 'hello', ask: 'Hi!', tool: 'open("profile/omar")',
    strong: ['hello', 'hi', 'hey', 'hiya', 'yo', 'good morning', 'good afternoon', 'good evening', 'salam'],
    keys: ['thanks', 'thank you', 'cheers'],
    answer: 'Hi. Ask me about my work, research, lessons or how to reach me. Short answers, real sources.',
    sources: [{ label: 'profile', href: '/cv.html' }],
    follow: ['about', 'work', 'lessons'],
  },
];

export const intro = {
  text: 'Hi, I’m Omar. I build AI systems that reason at Digis Squared, I’m building NOOKBASE, and I teach maths and physics in London. Ask me anything; I wrote the answers myself.',
  chips: ['work', 'katana', 'nookbase', 'lessons', 'hire', 'cv'],
};

export const fallback = {
  text: 'I haven’t written about that yet, so I won’t guess. These are the closest things I can answer properly, or you can ask me directly.',
  suggestions: ['work', 'lessons', 'hire'],
};

/** Slash commands: /name → intent id, or a built-in action. */
export const commands: { name: string; intent?: string; action?: 'clear' | 'help'; hint: string }[] = [
  { name: '/help', action: 'help', hint: 'List commands' },
  { name: '/about', intent: 'about', hint: 'Who I am' },
  { name: '/projects', intent: 'work', hint: 'What I build' },
  { name: '/skills', intent: 'skills', hint: 'My stack' },
  { name: '/research', intent: 'research', hint: 'What I’m researching' },
  { name: '/lessons', intent: 'lessons', hint: 'Maths & science lessons' },
  { name: '/cv', intent: 'cv', hint: 'Download my CV' },
  { name: '/contact', intent: 'contact', hint: 'How to reach me' },
  { name: '/clear', action: 'clear', hint: 'Clear the conversation' },
];

export const disclosure = 'Answers written by me, matched in your browser. No AI model; nothing you type leaves this page.';
