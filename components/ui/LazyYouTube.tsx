'use client';

import { useState, type ReactNode } from 'react';

/** No YouTube code loads until the button is pressed. Each iframe otherwise
 *  pulls roughly 0.5 to 1 MB of player and trackers before anything plays. */
export function LazyYouTube({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const [playing, setPlaying] = useState(false);
  const [warm, setWarm] = useState(false);

  if (playing) {
    return (
      <div className="youtube-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <>
      {/* Hovering first warms up the connection. */}
      {warm && (
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      )}
      <button
        type="button"
        className="youtube-button"
        onPointerEnter={() => setWarm(true)}
        onFocus={() => setWarm(true)}
        onClick={() => setPlaying(true)}
      >
        {children}
        <span className="youtube-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30">
            <path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
          </svg>
        </span>
        <span className="visually-hidden">Play {title}</span>
      </button>
    </>
  );
}
