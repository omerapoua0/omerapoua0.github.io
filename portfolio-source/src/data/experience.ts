import type { Status } from './site';

export interface Role {
  period: string;
  org: string;
  title: string;
  text: string;
  status: Status;
  href?: string;
}

/** Ordered as on the CV. Wording stays within what the CV states. */
export const technicalExperience: Role[] = [
  {
    period: 'Jan 2026 – present',
    org: 'Digis Squared Ltd',
    title: 'AI Product Engineer',
    text: 'Technical strategy for the KATANA autonomy programme, closed-loop MAPE-K reasoning with Bayesian inference, TCO models, security auditing, sprint planning and cross-team LangGraph workflows.',
    status: 'current',
    href: '/work.html#katana',
  },
  {
    period: 'Feb – May 2026',
    org: 'Bitget',
    title: 'AI Product Intern, Platform & Ops',
    text: 'Analysed exchange telemetry and built predictive models on historical and live market data to forecast price movement.',
    status: 'completed',
    href: '/work.html#bitget',
  },
  {
    period: 'Sep 2024 – Mar 2025',
    org: 'Digis Squared Ltd',
    title: 'R&D Engineering Trainee',
    text: 'Researched network systems, focusing on hardware and software integration.',
    status: 'completed',
    href: '/work.html#inos',
  },
];

export const researchAndTeaching: Role[] = [
  {
    period: 'Summer 2027',
    org: 'Santander',
    title: 'Fintech Research Placement, Optimisation & ML',
    text: 'Selected for a research placement applying mathematical optimisation and machine learning to credit-scoring models. Upcoming, not completed.',
    status: 'incoming',
    href: '/research.html#optimisation',
  },
  {
    period: '2026 – present',
    org: 'Independent',
    title: 'Independent Research, AI in Higher Education',
    text: 'Investigating how efficiently AI models complete university assignments and the effect on student learning outcomes. Unpublished.',
    status: 'progress',
    href: '/research.html#ai-he',
  },
  {
    period: 'Mar 2026 – present',
    org: 'Southfields Academy',
    title: 'Mathematics & Physics Teaching Assistant',
    text: 'Teaching GCSE Higher maths and physics to international and EAL students, explaining quantitative concepts clearly under time pressure.',
    status: 'current',
    href: '/tutoring.html',
  },
  {
    period: 'Jun – Sep 2024',
    org: 'BP',
    title: 'Market Intelligence Research Intern',
    text: 'Localised models for the offshore-wind market intelligence team and automated the department’s competitor-research reporting.',
    status: 'completed',
    href: '/work.html#bp',
  },
];

export const education = [
  {
    period: 'Expected 2028',
    org: 'Birkbeck, University of London',
    title: 'BSc (Hons) Computer Science & Mathematics',
    text: 'Relevant modules: Linear Algebra, Calculus, Discrete Mathematics, Data Modelling and Analysis, Systems Analysis. Target: First Class Honours.',
  },
  {
    period: '2025',
    org: 'Westminster Kingsway',
    title: 'Access to HE Engineering',
    text: 'Distinction.',
  },
  {
    period: 'Earlier',
    org: 'GCSEs',
    title: 'Seven GCSEs',
    text: 'Including Mathematics (A).',
  },
];

export const certifications = ['IBM Data Science', 'Google Mathematics for Machine Learning', 'Microsoft Fabric'];

export const languages = [
  { name: 'Arabic', level: 'Native' },
  { name: 'English', level: 'Fluent' },
];

export const skillGroups = [
  { title: 'Programming', items: 'Python (NumPy, Pandas, SciPy, FastAPI), SQL, PostgreSQL, LaTeX, JavaScript, HTML, CSS' },
  { title: 'ML & statistics', items: 'Predictive modelling, Bayesian inference, time-series forecasting, feature engineering, RAG, MAPE-K reasoning loops' },
  { title: 'Quantitative', items: 'Linear algebra, calculus, optimisation, probability and statistics, data modelling and analysis' },
  { title: 'Engineering', items: 'Git, GitHub, Docker, CI/CD, containerisation, data pipelines, automation, Jira, Excel' },
];
