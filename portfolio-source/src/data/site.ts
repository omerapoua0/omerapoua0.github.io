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
  credit: 'Licensed Mixkit stock footage. Not Omar, his work or his workplace.',
  chapters: [
    { label: 'Physical computing', start: 0 },
    { label: 'Mathematical study', start: 5 },
    { label: 'Software engineering', start: 10 },
    { label: 'London & finance', start: 15 },
  ],
  duration: 20,
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
