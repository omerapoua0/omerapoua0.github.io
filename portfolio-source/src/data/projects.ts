import type { Status } from './site';

export type Area = 'ai' | 'data' | 'systems' | 'research';
export const areaLabel: Record<Area, string> = {
  ai: 'AI & agents',
  data: 'Data & automation',
  systems: 'Network systems',
  research: 'Research & learning',
};

export interface Project {
  id: string;
  /** Older anchors that must keep resolving. */
  aliases: string[];
  name: string;
  org: string;
  role: string;
  period: string;
  year: string;
  status: Status;
  statusNote: string;
  areas: Area[];
  summary: string;
  href: string;
  /** logoOnDark: the logo is a white mark, so its chip is navy, not white. */
  media?: { image: string; video?: string; logo?: string; logoOnDark?: boolean; alt: string };
  context: string;
  contribution: string[];
  stage: string;
  stack: string[];
  external?: { label: string; href: string };
}

export const projects: Project[] = [
  {
    id: 'katana',
    aliases: ['project-1'],
    name: 'KATANA',
    org: 'Digis Squared',
    role: 'AI Product Engineer',
    period: 'Jan 2026 – present',
    year: '2026',
    status: 'current',
    statusNote: 'Level 4 is the programme direction, not a completed deployment.',
    areas: ['ai', 'systems'],
    summary: 'Technical strategy and closed-loop MAPE-K reasoning for a network-autonomy programme.',
    href: '/work.html#katana',
    media: { image: '/project-katana-v14.jpg', video: '/project-katana-v14.webm', logo: '/logo-katana.png', logoOnDark: true, alt: 'KATANA closed-loop reasoning concept visual' },
    context:
      'KATANA is an autonomy programme for telecom networks, working towards Level 4 autonomy against TM Forum standards. The hard question is when a network should observe, reason and act on its own.',
    contribution: [
      'Set the technical strategy for the programme with the product manager.',
      'Designed the closed-loop MAPE-K reasoning architecture, using Bayesian inference to automate network decisions.',
      'Built total-cost-of-ownership models and ran security auditing across the platform’s sub-modules.',
      'Planned sprints for the development and test teams, and created cross-team LangGraph workflows, including how data is selected and accessed for the data team.',
      'Choose technologies for the platform and help shape its business and product strategy.',
    ],
    stage: 'Ongoing engineering work. Moving from Level 1 towards Level 4 is the programme’s direction, not a claimed finished deployment.',
    stack: ['MAPE-K', 'Bayesian inference', 'LangGraph', 'Technology selection', 'TCO modelling', 'Security auditing', 'Product strategy', 'Jira'],
    external: { label: 'KATANA at Digis Squared', href: 'https://digis2.com/product/katana/' },
  },
  {
    id: 'nookbase',
    aliases: ['project-5'],
    name: 'NOOKBASE',
    org: 'Founder',
    role: 'Founder · Product & engineering',
    period: 'Pre-launch',
    year: '2026',
    status: 'development',
    statusNote: 'Pre-launch, with around 150 beta users. Not yet generally available.',
    areas: ['ai', 'research'],
    summary: 'An agentic study platform for iOS, Android and web, built around a conversational tutoring agent.',
    href: '/work.html#nookbase',
    media: { image: '/project-nookbase.jpg', video: '/project-nookbase.webm', logo: '/logo-nookbase.png', alt: 'NOOKBASE learning product concept visual' },
    context:
      'Completing a task with AI and understanding it are different outcomes. NOOKBASE asks how a learner can understand and explain the work, not just finish it.',
    contribution: [
      'Founder, working across product direction and engineering.',
      'Designing an agentic study experience with a conversational tutoring agent, connecting explanation, knowledge checks and planning.',
      'Building for iOS, Android and web from one product direction.',
    ],
    stage: 'In development and pre-launch, with around 150 beta users.',
    stack: ['Agentic AI', 'Conversational agents', 'iOS · Android · Web', 'Learning design'],
    external: { label: 'NOOKBASE', href: 'https://nookbase.app/' },
  },
  {
    id: 'inos',
    aliases: ['project-4'],
    name: 'INOS & OctiMind',
    org: 'Digis Squared',
    role: 'AI Product Engineer (previously R&D Engineering Trainee)',
    period: 'Jan 2026 – present · earlier Sep 2024 – Mar 2025',
    year: '2026',
    status: 'current',
    statusNote: 'The products are Digis Squared’s, built by a wider team (my traineeship was part of wider R&D): my work is one part of it, not sole ownership.',
    areas: ['systems'],
    summary: 'Network testing and optimisation products deployed to O2. Now: technology selection, audits, and business and product strategy, alongside KATANA. Earlier: R&D on hardware and software integration.',
    href: '/work.html#inos',
    media: { image: '/project-inos.jpg', video: '/project-inos.webm', logo: '/logo-inos.png', logoOnDark: true, alt: 'INOS network testing concept visual' },
    context:
      'INOS and OctiMind are Digis Squared’s network testing and optimisation products, deployed to O2. I first worked on them as an R&D Engineering Trainee, and I work on them again now as AI Product Engineer, alongside KATANA.',
    contribution: [
      'Now (AI Product Engineer, since Jan 2026): working on INOS and OctiMind alongside KATANA.',
      'Choose technologies: which tools and approaches the products are built with.',
      'Carry out technical and security audits.',
      'Help shape business and product strategy.',
      'Earlier (R&D Engineering Trainee, Sep 2024 – Mar 2025): researched network systems as part of the wider R&D team, focusing on how hardware and software integrate in network testing.',
    ],
    stage: 'Current work, after an earlier traineeship. The products are Digis Squared’s and are built by a wider team; my work is one part of it, and the traineeship was one part of a wider R&D effort.',
    stack: ['Technology selection', 'Technical & security audits', 'Product strategy', 'Network systems', 'Hardware/software integration', 'Testing', 'Optimisation'],
    external: { label: 'INOS at Digis Squared', href: 'https://digis2.com/product/inos/' },
  },
  {
    id: 'bitget',
    aliases: ['project-2'],
    name: 'Crypto prediction models',
    org: 'Bitget',
    role: 'AI Product Intern, Platform & Ops',
    period: 'Feb – May 2026',
    year: '2026',
    status: 'completed',
    statusNote: 'A modelling project. No claim of trading performance or investment returns.',
    areas: ['data', 'ai'],
    summary: 'Predictive models of Bitcoin price movement from historical and live market data, plus exchange telemetry analysis.',
    href: '/work.html#bitget',
    context:
      'In Platform & Operations, the question was what exchange telemetry and market data can tell you, and how to test whether a model has learned signal rather than noise.',
    contribution: [
      'Analysed exchange telemetry with the platform and operations teams.',
      'Built machine-learning models forecasting Bitcoin price movement from historical and live market data.',
      'Worked on feature engineering and time-series forecasting.',
    ],
    stage: 'Completed internship. This is modelling work; nothing here is investment advice or a claim of returns.',
    stack: ['Python', 'Time-series forecasting', 'Feature engineering', 'Predictive modelling'],
  },
  {
    id: 'bp',
    aliases: ['project-3'],
    name: 'Competitor Intelligence Engine',
    org: 'BP',
    role: 'Market Intelligence Research Intern',
    period: 'Jun – Sep 2024',
    year: '2024',
    status: 'completed',
    statusNote: 'Built for the offshore-wind market intelligence team.',
    areas: ['data'],
    summary: 'An automated weekly pipeline from Bloomberg and other sources to Excel reports for offshore-wind market intelligence.',
    href: '/work.html#bp',
    context:
      'The offshore-wind market intelligence team needed the same competitor research every week, without rebuilding it by hand every week.',
    contribution: [
      'Automated the department’s competitor-research reporting.',
      'Built a weekly pipeline pulling competitor data from Bloomberg and other sources, analysing it and producing Excel reports.',
      'Localised models for the offshore-wind market intelligence team.',
    ],
    stage: 'Completed internship.',
    stack: ['Data pipelines', 'Bloomberg', 'Excel', 'Automation', 'Research'],
  },
  {
    id: 'ai-he',
    aliases: [],
    name: 'AI in Higher Education',
    org: 'Independent research',
    role: 'Independent researcher',
    period: '2026 – present',
    year: '2026',
    status: 'progress',
    statusNote: 'Independent and unpublished.',
    areas: ['research'],
    summary: 'How efficiently do AI models complete university assignments, and what does that do to student learning?',
    href: '/research.html#ai-he',
    context:
      'Investigating how efficiently AI models complete university assignments and the effect on student learning outcomes.',
    contribution: ['Independent investigation, 2026 to present.'],
    stage: 'In progress. Unpublished.',
    stack: ['AI evaluation', 'Learning outcomes', 'Higher education'],
  },
];

export const caseStudies = projects.filter(project => project.id !== 'ai-he');
