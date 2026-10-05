/** Everything that appears exactly once on the site. */

export type ThemeName = 'blush' | 'petal' | 'ivory' | 'nude' | 'plum' | 'noir';

export const site = {
  name: 'Supriya',
  brand: 'Dezign What',
  // PLACEHOLDER: real domain goes here before launch (used by sitemap + og tags).
  url: 'https://dezignwhat.com',
  tagline: 'to create you need to be free',
  quote: 'Hope you become so free that you create more than you consume',
  description:
    'Videography, photography, branding and content by Supriya. Dezign What is a portfolio of shoots, campaigns and the people behind them.',
  // PLACEHOLDER: lorem bio until her copy arrives.
  bio: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, working across a camera, a cutting room and a brand deck in the same week.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse.',
  ],
} as const;

/** The ten skills on the about ring, from the sketch. */
export const skills = [
  { label: 'illustrator', image: 'skills/illustrator.jpg' },
  { label: 'graphic designer', image: 'skills/graphic-designer.jpg' },
  { label: 'art director', image: 'skills/art-director.jpg' },
  { label: 'mentor', image: 'skills/mentor.jpg' },
  { label: 'photographer', image: 'skills/photographer.jpg' },
  { label: 'editor', image: 'skills/editor.jpg' },
  { label: 'content creator', image: 'skills/content-creator.jpg' },
  { label: 'model', image: 'skills/model.jpg' },
  { label: 'writer', image: 'skills/writer.jpg' },
  { label: 'videographer', image: 'skills/videographer.jpg' },
] as const;

export const categories = [
  {
    slug: 'videography',
    label: 'videography',
    theme: 'plum' as ThemeName,
    image: 'categories/videography.jpg',
    blurb: 'Films, ads and event coverage, shot and cut end to end.',
  },
  {
    slug: 'photography',
    label: 'photography',
    theme: 'petal' as ThemeName,
    image: 'categories/photography.jpg',
    blurb: 'Portraits, products and the people who use them.',
  },
  {
    slug: 'branding',
    label: 'branding',
    theme: 'nude' as ThemeName,
    image: 'categories/branding.jpg',
    blurb: 'Marks, palettes and the rules that hold a brand together.',
  },
  {
    slug: 'video-editing',
    label: 'video editing',
    theme: 'noir' as ThemeName,
    image: 'categories/video-editing.jpg',
    blurb: 'Reels, long form and the rhythm that makes a cut land.',
  },
  {
    slug: 'visual-merchandising',
    label: 'visual merchandising',
    theme: 'ivory' as ThemeName,
    image: 'categories/visual-merchandising.jpg',
    blurb: 'Windows, shelves and displays built to stop a walk-past.',
  },
  {
    slug: 'social-media',
    label: 'social media',
    theme: 'blush' as ThemeName,
    image: 'categories/social-media.jpg',
    blurb: 'Campaign posts, grids and the voice that carries them.',
  },
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];

export const categorySlugs = categories.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

/** PLACEHOLDER: three lorem items until her list arrives. */
export const achievements = [
  { title: 'Lorem ipsum certification', issuer: 'Consectetur Institute', year: '2025' },
  { title: 'Dolor sit amet workshop', issuer: 'Adipiscing Academy', year: '2024' },
  { title: 'Tempor incididunt award', issuer: 'Labore Collective', year: '2023' },
] as const;

/** PLACEHOLDER: handles are the sketch's four channels, values not real yet. */
export const contacts = [
  { kind: 'phone', label: '+91 00000 00000', href: 'tel:+910000000000' },
  { kind: 'instagram', label: '@dezignwhat', href: 'https://instagram.com/dezignwhat' },
  { kind: 'email', label: 'hello@dezignwhat.com', href: 'mailto:hello@dezignwhat.com' },
  { kind: 'linkedin', label: '/in/dezignwhat', href: 'https://linkedin.com/in/dezignwhat' },
] as const;


/** Phone browser-bar color per palette, kept in step with tokens.css. */
export const themeColors: Record<ThemeName, string> = {
  blush: '#ffbde3',
  petal: '#ffe4f1',
  ivory: '#fbf5ef',
  nude: '#efdcd0',
  plum: '#2b1630',
  noir: '#150c12',
};

/** The launchpad's six boxes, the site's primary navigation. */
export const launchpad = [
  { label: 'about me', href: '#about' },
  { label: 'my works', href: '#works' },
  { label: 'current roles', href: '#roles' },
  { label: 'courses & achievements', href: '#achievements' },
  { label: 'experience', href: '#experience' },
  { label: 'contact', href: '#contact' },
] as const;

   export const sakuraQuote = {
     text: 'Fall seven times, stand up eight.',
     source: 'Japanese proverb',
   };