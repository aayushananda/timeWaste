/** Build-time content layer: read Markdown, validate frontmatter, sort, type.
 *  Runs in server components only. A typo in a category fails the build. */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { z } from 'zod';
import { categorySlugs } from './site';

const CONTENT = join(process.cwd(), 'content');

const creditSchema = z.object({
  role: z.string(),
  name: z.string(),
});

const workSchema = z.object({
  title: z.string(),
  category: z.enum(categorySlugs),
  client: z.string().optional(),
  date: z.coerce.date(),
  location: z.string().optional(),
  summary: z.string(),
  cover: z.string(),
  previewVideo: z.string().optional(),
  youtubeId: z.string().optional(),
  credits: z.array(creditSchema).default([]),
});

const roleSchema = z.object({
  title: z.string(),
  organisation: z.string(),
  description: z.string(),
  image: z.string(),
  order: z.number().default(0),
});

const experienceSchema = z.object({
  place: z.string(),
  role: z.string(),
  period: z.string(),
  summary: z.string(),
  image: z.string(),
  order: z.number().default(0),
});

export type Work = z.infer<typeof workSchema> & { slug: string; href: string; body: string };
export type Role = z.infer<typeof roleSchema> & { slug: string; body: string };
export type Experience = z.infer<typeof experienceSchema> & { slug: string; body: string };

type Entry<T extends z.ZodType> = z.infer<T> & { slug: string; body: string };

function read<T extends z.ZodType>(folder: string, schema: T): Entry<T>[] {
  let files: string[];
  try {
    files = readdirSync(join(CONTENT, folder)).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }

  return files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const raw = readFileSync(join(CONTENT, folder, file), 'utf8');
    const { data, content } = matter(raw);
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      const problems = parsed.error.issues
        .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n');
      throw new Error(`Invalid frontmatter in content/${folder}/${file}\n${problems}`);
    }

    return {
      ...(parsed.data as Record<string, unknown>),
      slug,
      body: marked.parse(content.trim(), { async: false }),
    } as Entry<T>;
  });
}

// Memoised: the build reads each collection many times across routes.
let worksCache: Work[] | null = null;
let rolesCache: Role[] | null = null;
let experienceCache: Experience[] | null = null;

/** Newest first, so category chapters read as a reverse timeline. */
export function getWorks(): Work[] {
  worksCache ??= read('works', workSchema)
    .map((w) => ({ ...w, href: `/works/${w.category}/${w.slug}` }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  return worksCache;
}

export function getWorksByCategory(category: string): Work[] {
  return getWorks().filter((w) => w.category === category);
}

export function getWork(category: string, slug: string): Work | undefined {
  return getWorks().find((w) => w.category === category && w.slug === slug);
}

/** Previous and next within the same category, for the shoot page footer. */
export function getWorkNeighbours(category: string, slug: string) {
  const siblings = getWorksByCategory(category);
  const index = siblings.findIndex((w) => w.slug === slug);
  return {
    previous: index > 0 ? siblings[index - 1] : undefined,
    next: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined,
  };
}

export function getRoles(): Role[] {
  rolesCache ??= read('roles', roleSchema).sort((a, b) => a.order - b.order);
  return rolesCache;
}

export function getExperience(): Experience[] {
  experienceCache ??= read('experience', experienceSchema).sort((a, b) => a.order - b.order);
  return experienceCache;
}
