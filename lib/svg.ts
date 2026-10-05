import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cache = new Map<string, string>();

/** Inlines a brand SVG at build time: no second round trip before LCP, and
 *  `currentColor` lets the mark follow the page's ink through the journey. */
export function inlineSvg(path: string) {
  const cached = cache.get(path);
  if (cached) return cached;

  const svg = readFileSync(join(process.cwd(), 'public', path), 'utf8')
    .replace(/fill="#000"/g, 'fill="currentColor"')
    .replace(/<\?xml[^>]*\?>/g, '')
    .trim();

  cache.set(path, svg);
  return svg;
}
