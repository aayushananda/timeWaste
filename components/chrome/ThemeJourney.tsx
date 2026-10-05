'use client';

import { useEffect } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { themeColors, type ThemeName } from '@/lib/site';

/** Watches a thin band across the middle of the viewport and copies the
 *  palette of whichever slide owns it onto <html>. One body transition then
 *  repaints the whole page, because sections are transparent. */
export function ThemeJourney({ fallback = 'blush' }: { fallback?: ThemeName }) {
  const { setTheme } = useExperience();

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-theme]'));

    const apply = (theme: ThemeName) => {
      document.documentElement.setAttribute('data-theme', theme);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', themeColors[theme]);
      setTheme(theme);
    };

    if (sections.length === 0) {
      apply(fallback);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const theme = entry.target.getAttribute('data-theme') as ThemeName | null;
          if (theme) apply(theme);
        }
      },
      // A 2% band at the vertical centre: exactly one slide owns it at a time.
      { rootMargin: '-49% 0px -49% 0px', threshold: 0 },
    );

    // Observing fires at once for whichever slide already owns the band, so a
    // page restored mid-scroll lands on the right palette without a flash.
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [fallback, setTheme]);

  return null;
}
