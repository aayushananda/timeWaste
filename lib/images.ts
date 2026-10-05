import manifest from './image-manifest.json';

type Entry = { width: number; height: number; widths: number[] };

const images = manifest as Record<string, Entry>;

export const FORMATS = ['avif', 'webp'] as const;

/** Resolves a content path like `works/nike-ad-dolly.jpg` to the pre-sized
 *  variants on disk. Throws at build if the original is missing, so a bad path
 *  in frontmatter never ships as a broken image. */
export function resolveImage(src: string) {
  const entry = images[src];
  if (!entry) {
    throw new Error(
      `Unknown image "${src}". Add it to assets/images/ and run \`npm run images\`.`,
    );
  }

  const base = src.replace(/\.(jpe?g|png)$/i, '');
  const widest = entry.widths[entry.widths.length - 1];

  return {
    width: entry.width,
    height: entry.height,
    srcSet: Object.fromEntries(
      FORMATS.map((format) => [
        format,
        entry.widths.map((w) => `/images/${base}-${w}.${format} ${w}w`).join(', '),
      ]),
    ) as Record<(typeof FORMATS)[number], string>,
    // Only reached by a browser with neither AVIF nor WebP.
    fallback: `/images/${base}-${widest}.webp`,
  };
}
