import { resolveImage } from '@/lib/images';

type Props = {
  src: string;
  alt: string;
  /** Rendered width at each breakpoint, so the browser picks the right variant. */
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Override the intrinsic ratio when the art direction crops. */
  ratio?: string;
};

/** AVIF first, WebP fallback, always with intrinsic dimensions so nothing
 *  shifts. A static export has no image optimizer, so the variants come from
 *  scripts/resize-images.mjs instead. */
export function Img({ src, alt, sizes = '100vw', priority = false, className, ratio }: Props) {
  const { width, height, srcSet, fallback } = resolveImage(src);

  return (
    <picture>
      <source type="image/avif" srcSet={srcSet.avif} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet.webp} sizes={sizes} />
      <img
        src={fallback}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={ratio ? { aspectRatio: ratio } : undefined}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
      />
    </picture>
  );
}
