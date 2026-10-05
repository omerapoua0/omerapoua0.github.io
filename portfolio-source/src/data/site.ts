export const site = {
  name: 'Omar Aboelella',
  url: 'https://omerapoua0.github.io',
  email: 'omerapoua0@gmail.com',
  // Personal GitHub for this portfolio. The CV PDF lists a separate work account.
  github: 'https://github.com/omerapoua0',
  // From the CV header.
  linkedin: 'https://www.linkedin.com/in/omaraboelella',
  location: 'London, UK',
  role: 'AI product engineer',
  description:
    'Omar Aboelella: London-based AI product engineer, Computer Science & Mathematics student at Birkbeck, and online maths & science tutor.',
} as const;

/** One vocabulary everywhere: the homepage doors, the header, the menu, the
 *  footer and the light gate's label all say Work · Skills · Lessons. */
export const navigation = [
  { label: 'Work', href: '/work.html' },
  { label: 'Skills', href: '/index.html#skills' },
  { label: 'Lessons', href: '/tutoring.html' },
  { label: 'Automations', href: '/automations.html' },
  { label: 'Research', href: '/research.html' },
  { label: 'About & CV', href: '/cv.html' },
] as const;

/** Count-up numbers. Each one is a CV fact. */
export const stats = [
  { value: 150, prefix: '~', label: 'beta users on NOOKBASE, pre-launch' },
  { value: 5, prefix: '', label: 'roles across AI, data and teaching' },
  { value: 3, prefix: '', label: 'certifications: IBM, Google, Microsoft' },
  { value: 2, prefix: '', label: 'languages: Arabic and English' },
] as const;

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
