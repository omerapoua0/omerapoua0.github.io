export const site = {
  name: 'Omar Aboelella',
  url: 'https://omerapoua0.github.io',
  email: 'omerapoua0@gmail.com',
  // Personal GitHub for this portfolio. The CV PDF lists a separate work account.
  github: 'https://github.com/omerapoua0',
  location: 'London, UK',
  role: 'AI product engineer',
  description:
    'Omar Aboelella: London-based AI product engineer, Computer Science & Mathematics student at Birkbeck, and online maths & science tutor.',
} as const;

export const navigation = [
  { label: 'Projects', href: '/work.html' },
  { label: 'Automations', href: '/automations.html' },
  { label: 'Research', href: '/research.html' },
  { label: 'About & CV', href: '/cv.html' },
  { label: 'Tutoring', href: '/tutoring.html' },
] as const;

/** Labelled nodes in the hero's live skill network. Each note says where the
    CV shows the skill in use, so the interaction is evidence, not decoration. */
export const graphSkills = [
  { label: 'LangGraph', note: 'Cross-team workflows · KATANA, Digis Squared' },
  { label: 'MAPE-K', note: 'Closed-loop reasoning architecture · KATANA' },
  { label: 'Bayesian inference', note: 'Automating network decisions · KATANA' },
  { label: 'Agentic AI', note: 'Conversational tutoring agent · NOOKBASE' },
  { label: 'Time series', note: 'Bitcoin price-movement models · Bitget' },
  { label: 'Python', note: 'NumPy · Pandas · SciPy · FastAPI' },
  { label: 'Data pipelines', note: 'Weekly competitor intelligence · BP' },
  { label: 'Feature engineering', note: 'Market & telemetry data · Bitget' },
  { label: 'Linear algebra', note: 'BSc Computer Science & Maths · Birkbeck' },
  { label: 'Optimisation', note: 'Santander research placement · incoming 2027' },
  { label: 'Qiskit', note: 'Quantum computing · independent study' },
  { label: 'Teaching', note: 'GCSE maths & physics · Southfields Academy' },
] as const;

/** Count-up numbers. Each one is a CV fact. */
export const stats = [
  { value: 150, prefix: '~', label: 'beta users on NOOKBASE, pre-launch' },
  { value: 5, prefix: '', label: 'roles across AI, data and teaching' },
  { value: 3, prefix: '', label: 'certifications: IBM, Google, Microsoft' },
  { value: 2, prefix: '', label: 'languages: Arabic and English' },
] as const;

/** First-person homepage introduction. Every clause is backed by the CV. */
export const intro = {
  greetingName: 'Omar',
  lead: 'I build AI systems that reason. Right now that’s closed-loop autonomy for telecom networks at Digis Squared.',
  more: 'I study Computer Science & Mathematics at Birkbeck, I’m building NOOKBASE, and I teach GCSE maths and physics at Southfields Academy.',
  facts: ['Arabic & English', 'London', 'Online lessons worldwide'],
  cycle: ['I build AI that reasons.', 'I teach GCSE maths & physics.', 'I study maths at Birkbeck.', 'I’m building NOOKBASE.'],
  cycleSummary: 'I build AI that reasons, teach GCSE maths and physics, study maths at Birkbeck and I’m building NOOKBASE.',
  heroLead: 'AI product engineer at Digis Squared, Computer Science & Mathematics student and tutor, based in London.',
  status: ['Studying', 'Building', 'Teaching'],
  portraitAlt: 'Omar Aboelella smiling, wearing clear glasses and a black shirt',
  portraitCaption: 'That’s me.',
} as const;

/** Status vocabulary used across the site so claims stay consistent. */
export type Status = 'current' | 'development' | 'incoming' | 'completed' | 'exploratory' | 'aspiration' | 'progress';
export const statusLabel: Record<Status, string> = {
  current: 'Current role',
  development: 'In development',
  incoming: 'Incoming',
  completed: 'Completed',
  exploratory: 'Exploratory',
  aspiration: 'Aspiration',
  progress: 'In progress',
};
