'use client';

import { useEffect, useRef, useState } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';

type Props = {
  /** Short muted loop on R2. */
  src: string;
  poster: string;
  label: string;
};

/** The source attaches only when the clip is half on screen, and it pauses
 *  when it leaves. Visitors who prefer reduced motion get a play control. */
export function PreviewVideo({ src, poster, label }: Props) {
  const { reducedMotion } = useExperience();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [attached, setAttached] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAttached(true);
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <video
      ref={videoRef}
      className="photo preview-video"
      poster={poster}
      src={attached ? src : undefined}
      muted
      loop
      playsInline
      preload="none"
      controls={reducedMotion}
      aria-label={label}
    />
  );
}
