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

export const film = {
  credit: 'Licensed stock footage, not me or my workplace.',
  chapters: [
    { label: 'Physical computing', start: 0 },
    { label: 'Mathematical study', start: 5 },
    { label: 'Software engineering', start: 10 },
    { label: 'London & finance', start: 15 },
  ],
  duration: 20,
} as const;

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
