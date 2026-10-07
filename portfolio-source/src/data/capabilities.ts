/**
 * Capability matrix: each skill lists only the places where the CV shows it
 * being used. Columns are evidence, not decoration.
 */
export const evidence = [
  { id: 'katana', label: 'KATANA', href: '/work.html#katana' },
  { id: 'nookbase', label: 'NOOKBASE', href: '/work.html#nookbase' },
  { id: 'inos', label: 'INOS', href: '/work.html#inos' },
  { id: 'bitget', label: 'Bitget', href: '/work.html#bitget' },
  { id: 'bp', label: 'BP', href: '/work.html#bp' },
  { id: 'teaching', label: 'Teaching', href: '/tutoring.html' },
  { id: 'study', label: 'Study', href: '/research.html' },
] as const;

export type EvidenceId = (typeof evidence)[number]['id'];

export const capabilities: { group: string; skills: { name: string; in: EvidenceId[] }[] }[] = [
  {
    group: 'Reasoning systems',
    skills: [
      { name: 'MAPE-K closed-loop reasoning', in: ['katana'] },
      { name: 'Bayesian inference', in: ['katana'] },
      { name: 'LangGraph workflows', in: ['katana'] },
      { name: 'Conversational & agentic AI', in: ['nookbase'] },
    ],
  },
  {
    group: 'Data & modelling',
    skills: [
      { name: 'Time-series forecasting', in: ['bitget'] },
      { name: 'Feature engineering', in: ['bitget'] },
      { name: 'Data pipelines & reporting automation', in: ['bp'] },
      { name: 'Hardware/software integration research', in: ['inos'] },
    ],
  },
  {
    group: 'Product & delivery',
    skills: [
      { name: 'Technical strategy', in: ['katana', 'nookbase'] },
      { name: 'Technology selection', in: ['katana', 'inos'] },
      { name: 'Technical & security audits', in: ['katana', 'inos'] },
      { name: 'Business & product strategy', in: ['katana', 'inos'] },
      { name: 'TCO modelling', in: ['katana'] },
      { name: 'Sprint & test planning', in: ['katana'] },
    ],
  },
  {
    group: 'Mathematics & explanation',
    skills: [
      { name: 'Linear algebra, calculus, discrete maths', in: ['study'] },
      { name: 'Optimisation, probability, stochastic processes', in: ['study'] },
      { name: 'Quantum computing with Qiskit', in: ['study'] },
      { name: 'Explaining quantitative ideas', in: ['teaching', 'nookbase'] },
    ],
  },
];

export const toolbox =
  'Python · NumPy · Pandas · SciPy · FastAPI · SQL · PostgreSQL · Docker · Git · CI/CD · LaTeX · JavaScript · Jira · Excel';
