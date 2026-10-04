/*
 * What Otto, Omar's robot host, knows: answers Omar wrote from the CV and site
 * facts, told in Otto's third-person voice. Nothing calls a language model and
 * visitors never type: they reach these answers by choosing replies (the
 * conversation lives in src/data/otto.ts) or from the command menu's
 * "Ask Otto" items. Keep wording within what src/data/*.ts and the CV state.
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
  /** The question as the command menu and the visitor's bubble show it. */
  ask: string;
  /** Extra search words for the command menu (⌘K / Ctrl+K). */
  keywords?: string[];
  answer: string;
  cards?: AgentCard[];
  sources: AgentSource[];
}

const cv: AgentCard = { title: 'CV (PDF)', meta: 'One page · opens in a new tab', href: '/Omar-Aboelella-CV.pdf', external: true };
const lessonCta: AgentCard = { title: 'Start a lesson enquiry', meta: 'Prepares an email you send', href: '/tutoring.html#lesson-enquiry' };

export const intents: Intent[] = [
  {
    id: 'about', ask: 'Who is Omar?',
    keywords: ['who are you', 'about you', 'yourself', 'who is omar', 'introduce'],
    answer: 'Omar Aboelella is an AI product engineer in London. At Digis Squared he works on KATANA, reasoning systems for telecom network autonomy. He studies Computer Science & Mathematics at Birkbeck, he’s building NOOKBASE, and he teaches GCSE maths and physics at Southfields Academy.',
    cards: [{ title: 'About & CV', meta: 'Experience, education, skills', href: '/cv.html' }],
    sources: [{ label: 'cv/profile', href: '/cv.html' }],
  },
  {
    id: 'work', ask: 'What does Omar build?',
    keywords: ['what do you build', 'your work', 'portfolio', 'what have you built', 'show me your projects'],
    answer: 'Reasoning systems, mostly. At Digis Squared Omar set the technical strategy for KATANA and designed its closed-loop MAPE-K architecture. He’s founding NOOKBASE, an agentic study platform. Before that: Bitcoin forecasting models at Bitget and an automated competitor-intelligence pipeline at BP.',
    cards: [
      { title: 'KATANA', meta: 'Network autonomy · Digis Squared', href: '/work.html#katana', image: '/project-katana-v14.jpg' },
      { title: 'NOOKBASE', meta: 'Founder · pre-launch', href: '/work.html#nookbase', image: '/project-nookbase.jpg' },
      { title: 'All projects', meta: 'Six entries · filters', href: '/work.html' },
    ],
    sources: [{ label: 'work/index', href: '/work.html' }],
  },
  {
    id: 'katana', ask: 'Show me KATANA',
    keywords: ['katana', 'mape k', 'mape', 'network autonomy', 'level 4', 'current job'],
    answer: 'KATANA is Digis Squared’s autonomy programme for telecom networks, working from Level 1 towards Level 4 against TM Forum standards. Omar set its technical strategy with the product manager, designed the closed-loop MAPE-K reasoning architecture using Bayesian inference, built TCO models, ran security audits and planned sprints. Level 4 is the programme’s direction, not a finished deployment.',
    cards: [{ title: 'KATANA case study', meta: 'Jan 2026 – present', href: '/work.html#katana', image: '/project-katana-v14.jpg' }],
    sources: [{ label: 'work/katana', href: '/work.html#katana' }, { label: 'cv/experience', href: '/cv.html#experience' }],
  },
  {
    id: 'nookbase', ask: 'What’s NOOKBASE?',
    keywords: ['nookbase', 'nook base', 'nook', 'startup', 'your company', 'founder'],
    answer: 'NOOKBASE is Omar’s agentic study platform for iOS, Android and web, built around a conversational tutoring agent. The idea is understanding, not just answers: can a learner explain the work, not only finish it? It’s pre-launch, with around 150 beta users.',
    cards: [{ title: 'NOOKBASE case study', meta: 'Founder · ~150 beta users', href: '/work.html#nookbase', image: '/project-nookbase.jpg' }],
    sources: [{ label: 'work/nookbase', href: '/work.html#nookbase' }],
  },
  {
    id: 'inos', ask: 'What did Omar do on INOS?',
    keywords: ['inos', 'octimind', 'o2', 'trainee', 'traineeship'],
    answer: 'INOS and OctiMind are Digis Squared’s network testing and optimisation products, deployed to O2. As an R&D Engineering Trainee (Sep 2024 – Mar 2025) Omar researched network systems, focusing on how hardware and software integrate. His work was one part of a wider R&D effort, not ownership of the products.',
    cards: [{ title: 'INOS & OctiMind', meta: 'R&D · Digis Squared', href: '/work.html#inos', image: '/project-inos.jpg' }],
    sources: [{ label: 'work/inos', href: '/work.html#inos' }],
  },
  {
    id: 'bitget', ask: 'What did Omar do at Bitget?',
    keywords: ['bitget', 'bitcoin', 'crypto', 'btc', 'cryptocurrency'],
    answer: 'From February to May 2026 Omar was an AI Product Intern in Platform & Operations at Bitget. He analysed exchange telemetry and built machine-learning models forecasting Bitcoin price movement from historical and live market data. Modelling work only: no claim of trading returns, and nothing here is investment advice.',
    cards: [{ title: 'Crypto prediction models', meta: 'Bitget · Feb – May 2026', href: '/work.html#bitget' }],
    sources: [{ label: 'work/bitget', href: '/work.html#bitget' }],
  },
  {
    id: 'bp', ask: 'What did Omar build at BP?',
    keywords: ['bp', 'offshore wind', 'competitor intelligence', 'bloomberg'],
    answer: 'At BP in summer 2024 Omar was a Market Intelligence Research Intern. He built a competitor-intelligence engine for the offshore-wind team: a weekly pipeline that pulls competitor data from Bloomberg and other sources, analyses it and produces Excel reports.',
    cards: [{ title: 'Competitor Intelligence Engine', meta: 'BP · Jun – Sep 2024', href: '/work.html#bp' }],
    sources: [{ label: 'work/bp', href: '/work.html#bp' }, { label: 'automations', href: '/automations.html' }],
  },
  {
    id: 'automate', ask: 'Can Omar automate my workflow?',
    keywords: ['automate', 'automation', 'workflow', 'freelance', 'consulting'],
    answer: 'Maybe. Omar’s interested in the work between tools: gathering information, checking it, deciding and getting the result somewhere useful. Think research and reporting, AI and agent workflows with human checkpoints, or connected data. Tell him what the process is and where the time disappears.',
    cards: [{ title: 'Automations', meta: 'Where I can help', href: '/automations.html' }, { title: 'Bring me a workflow', meta: 'Prepares an email you send', href: '/contact.html?topic=Automation' }],
    sources: [{ label: 'automations', href: '/automations.html' }, { label: 'work/bp', href: '/work.html#bp' }],
  },
  {
    id: 'agents', ask: 'What AI does Omar work with?',
    keywords: ['agents', 'agentic', 'llm', 'rag', 'machine learning', 'artificial intelligence'],
    answer: 'Mostly reasoning and agent systems. At Digis Squared: closed-loop MAPE-K reasoning with Bayesian inference for KATANA, and cross-team LangGraph workflows. At NOOKBASE: a conversational tutoring agent. Around that sits the classical side: predictive modelling, time-series forecasting, feature engineering and RAG.',
    cards: [{ title: 'Capability matrix', meta: 'Every skill linked to evidence', href: '/index.html#skills-title' }],
    sources: [{ label: 'cv/skills', href: '/cv.html#skills' }, { label: 'work/katana', href: '/work.html#katana' }],
  },
  {
    id: 'research', ask: 'What is Omar researching?',
    keywords: ['research', 'researching', 'higher education', 'phd', 'quantum', 'qiskit'],
    answer: 'Independent research on AI in higher education (2026 to now, unpublished): how efficiently AI models complete university assignments, and what that does to learning. Alongside it he’s exploring optimisation, quantitative modelling and quantum computing with Qiskit. A PhD is a long-term aspiration, not a current programme.',
    cards: [{ title: 'Research notebook', meta: 'Questions, not papers', href: '/research.html' }],
    sources: [{ label: 'research/ai-he', href: '/research.html#ai-he' }, { label: 'research/quantum', href: '/research.html#quantum' }],
  },
  {
    id: 'santander', ask: 'Tell me about Santander',
    keywords: ['santander', 'credit scoring', 'placement', 'summer 2027'],
    answer: 'In summer 2027 Omar joins Santander for a Fintech Research Placement, applying mathematical optimisation and machine learning to credit-scoring models. It’s upcoming, not completed.',
    cards: [{ title: 'Optimisation research', meta: 'Incoming · Summer 2027', href: '/research.html#optimisation' }],
    sources: [{ label: 'research/optimisation', href: '/research.html#optimisation' }, { label: 'cv/experience', href: '/cv.html#experience' }],
  },
  {
    id: 'study', ask: 'What does Omar study?',
    keywords: ['birkbeck', 'degree', 'university', 'study', 'bsc', 'modules'],
    answer: 'BSc (Hons) Computer Science & Mathematics at Birkbeck, University of London, expected 2028. Modules include Linear Algebra, Calculus, Discrete Mathematics, and Data Modelling and Analysis, and he’s aiming for a First. Before that: Access to HE Engineering with Distinction, and seven GCSEs including Maths (A).',
    cards: [{ title: 'Education', meta: 'About & CV', href: '/cv.html#education' }],
    sources: [{ label: 'cv/education', href: '/cv.html#education' }],
  },
  {
    id: 'skills', ask: 'What’s Omar’s stack?',
    keywords: ['stack', 'skills', 'tech stack', 'programming', 'python', 'tools'],
    answer: 'Python (NumPy, Pandas, SciPy, FastAPI), SQL and PostgreSQL, plus JavaScript, HTML and CSS. On the ML side: predictive modelling, Bayesian inference, time series, feature engineering, RAG and MAPE-K loops. Engineering: Git, Docker, CI/CD and data pipelines. And the maths underneath: linear algebra, calculus, optimisation, probability.',
    cards: [{ title: 'Skills on the CV', meta: 'About & CV', href: '/cv.html#skills' }, { title: 'Capability matrix', meta: 'Skill → where it was used', href: '/index.html#skills-title' }],
    sources: [{ label: 'cv/skills', href: '/cv.html#skills' }],
  },
  {
    id: 'certs', ask: 'Any certifications?',
    keywords: ['certification', 'certificate', 'certified', 'ibm', 'microsoft fabric', 'credential'],
    answer: 'Three: IBM Data Science, Google Mathematics for Machine Learning and Microsoft Fabric.',
    cards: [{ title: 'About & CV', meta: 'Certifications', href: '/cv.html#education' }],
    sources: [{ label: 'cv/certifications', href: '/cv.html#education' }],
  },
  {
    id: 'price', ask: 'How much are lessons?',
    keywords: ['price', 'pricing', 'cost', 'how much', 'fee', 'rate'],
    answer: 'Lesson length, pricing and times are agreed directly with Omar once you’ve talked about what you need, usually after the free 15-minute intro call. No payment is taken on this website.',
    cards: [lessonCta],
    sources: [{ label: 'lessons/faq', href: '/tutoring.html#faq-title' }],
  },
  {
    id: 'safe', ask: 'Is Omar DBS checked?',
    keywords: ['dbs', 'safeguarding', 'background check', 'vetted', 'sit in', 'safe'],
    answer: 'Yes. Omar holds an enhanced DBS check. Lessons for under-18s are arranged with a parent or guardian, who is welcome to sit in on any lesson.',
    cards: [lessonCta],
    sources: [{ label: 'lessons/faq', href: '/tutoring.html#faq-title' }],
  },
  {
    id: 'lessons', ask: 'Can Omar teach my son?',
    keywords: ['tutor', 'tutoring', 'lesson', 'teach', 'tuition', 'gcse'],
    answer: 'Very likely. Omar teaches maths and science online at GCSE Foundation, GCSE Higher and A-level, and he’s a Maths & Physics Teaching Assistant at Southfields Academy. He’s enhanced DBS checked, the first call is a free 15 minutes, he replies to every enquiry within one working day, and parents are welcome to sit in.',
    cards: [lessonCta, { title: 'How lessons work', meta: 'Levels · process · FAQ', href: '/tutoring.html#how' }],
    sources: [{ label: 'lessons', href: '/tutoring.html' }],
  },
  {
    id: 'hire', ask: 'Is Omar open to internships?',
    keywords: ['internship', 'intern', 'hire', 'hiring', 'recruit', 'opportunity'],
    answer: 'Yes. Omar’s looking for a Sales & Trading or quantitative internship, to apply maths and programming to markets and systematic decision-making. In summer 2027 he joins Santander for a research placement in optimisation and machine learning.',
    cards: [cv, { title: 'Get in touch', meta: 'Opportunity · prepares an email', href: '/contact.html?topic=Opportunity' }],
    sources: [{ label: 'cv/experience', href: '/cv.html#experience' }],
  },
  {
    id: 'contact', ask: 'How do I reach Omar?',
    keywords: ['contact', 'email', 'reach you', 'get in touch', 'message you', 'github'],
    answer: 'Email is best: omerapoua0@gmail.com. The contact page helps you write it and prepares an email you send yourself; nothing is sent or stored by this site. His code lives on github.com/omerapoua0.',
    cards: [{ title: 'Contact', meta: 'Prepares an email you send', href: '/contact.html' }, { title: 'GitHub', meta: 'github.com/omerapoua0', href: 'https://github.com/omerapoua0', external: true }],
    sources: [{ label: 'contact', href: '/contact.html' }],
  },
  {
    id: 'cv', ask: 'Download Omar’s CV',
    keywords: ['cv', 'resume', 'résumé', 'curriculum vitae', 'download'],
    answer: 'Here’s Omar’s CV. One page, PDF.',
    cards: [cv, { title: 'About & CV', meta: 'The same, as a web page', href: '/cv.html' }],
    sources: [{ label: 'cv', href: '/cv.html' }],
  },
  {
    id: 'where', ask: 'Where is Omar based?',
    keywords: ['where are you', 'based', 'location', 'london', 'timezone', 'time zone'],
    answer: 'London, UK. It’s {time} there right now. Lessons are online, so students can be anywhere.',
    sources: [{ label: 'profile', href: '/cv.html' }],
  },
  {
    id: 'languages', ask: 'What languages does Omar speak?',
    keywords: ['speak', 'arabic', 'english', 'bilingual', 'native'],
    answer: 'Arabic (native) and English (fluent). If you meant programming languages: mostly Python, then SQL and JavaScript.',
    sources: [{ label: 'cv/languages', href: '/cv.html#skills' }],
  },
  {
    id: 'meta', ask: 'Are you a real AI?',
    keywords: ['real ai', 'this chat', 'powered by', 'are you ai', 'are you an ai', 'is this ai'],
    answer: 'No model, honestly. Omar wrote every answer and every reply you can pick, and it all runs right here in your browser. Nothing you choose leaves this page.',
    sources: [{ label: 'source', href: 'https://github.com/omerapoua0' }],
  },
];
