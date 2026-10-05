'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const LINKS = [
  { label: 'about', href: '/#about' },
  { label: 'works', href: '/#works' },
  { label: 'contact', href: '/#contact' },
];

/** Below this much travel in one direction, scroll is treated as jitter. */
const SCROLL_SLOP = 2;

/** Hidden on every downward scroll, back on every upward one. */
function useHiddenOnScrollDown(pathname: string) {
  // The home page opens on the hero, which already carries the brand.
  const [hidden, setHidden] = useState(pathname === '/');

  useEffect(() => {
    setHidden(pathname === '/' && window.scrollY < window.innerHeight / 2);

    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      // Clamped, so rubber-band overscroll at either end never reads as a reversal.
      const y = Math.min(Math.max(window.scrollY, 0), max);
      const delta = y - lastY;
      // Small moves accumulate until they clear the slop, so a slow scroll
      // still flips the bar.
      if (Math.abs(delta) < SCROLL_SLOP) return;
      setHidden(delta > 0);
      lastY = y;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return [hidden, setHidden] as const;
}

export function Nav({ mark }: { mark: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const onWorkPage = segments[0] === 'works';

  const [hidden, setHidden] = useHiddenOnScrollDown(pathname);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const back =
    segments.length >= 3
      ? { href: `/works/${segments[1]}/`, label: `back to ${segments[1].replace(/-/g, ' ')}` }
      : { href: '/#works', label: 'back to my works' };

  const tucked = hidden && !sheetOpen;

  return (
    <>
      <nav
        className="nav"
        data-tucked={tucked}
        aria-label="Site"
        onFocusCapture={() => setHidden(false)}
      >
        <Link href="/" className="nav-brand">
          <span className="nav-mark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: mark }} />
          <span className="nav-word">Dezign What</span>
        </Link>

        {onWorkPage ? (
          <Link href={back.href} className="nav-link nav-back">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M19 12H5M11 6l-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {back.label}
          </Link>
        ) : (
          <>
            <ul className="nav-links">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="nav-toggle"
              aria-expanded={sheetOpen}
              aria-controls="nav-sheet"
              onClick={() => setSheetOpen((open) => !open)}
            >
              {sheetOpen ? 'close' : 'menu'}
            </button>
          </>
        )}
      </nav>

      {!onWorkPage && (
        <div id="nav-sheet" className="nav-sheet" data-open={sheetOpen} hidden={!sheetOpen}>
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setSheetOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
