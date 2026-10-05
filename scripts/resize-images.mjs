// Pre-sizes every original in assets/images/ into AVIF + WebP variants under
// public/images/, and records natural dimensions in lib/image-manifest.json so
// <Img> can always emit width/height and hold CLS at zero.
//
//   node scripts/resize-images.mjs [--force]

import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'assets/images');
const OUT = join(ROOT, 'public/images');
const MANIFEST = join(ROOT, 'lib/image-manifest.json');

export const WIDTHS = [640, 1080, 1920];
const FORMATS = { avif: { quality: 52 }, webp: { quality: 80 } };
const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png']);

const force = process.argv.includes('--force');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (SOURCE_EXT.has(extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

async function mtime(path) {
  try {
    return (await stat(path)).mtimeMs;
  } catch {
    return -1;
  }
}

const originals = await walk(SRC);
const manifest = {};
let written = 0;
let skipped = 0;

for (const file of originals) {
  const key = relative(SRC, file).replaceAll('\\', '/');
  const base = key.slice(0, -extname(key).length);
  const image = sharp(file);
  const { width, height } = await image.metadata();
  const sourceTime = await mtime(file);

  // Never upscale: keep the widths at or below the original, plus the original
  // itself when it is narrower than every target.
  const widths = WIDTHS.filter((w) => w <= width);
  if (widths.length === 0) widths.push(width);

  manifest[key] = { width, height, widths };

  for (const w of widths) {
    for (const [format, options] of Object.entries(FORMATS)) {
      const dest = join(OUT, `${base}-${w}.${format}`);
      if (!force && (await mtime(dest)) > sourceTime) {
        skipped++;
        continue;
      }
      await mkdir(dirname(dest), { recursive: true });
      await image.clone().resize({ width: w, withoutEnlargement: true })[format](options).toFile(dest);
      written++;
    }
  }
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await mkdir(dirname(MANIFEST), { recursive: true });
await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);

console.log(
  `images: ${originals.length} originals · ${written} variants written · ${skipped} up to date`,
);
