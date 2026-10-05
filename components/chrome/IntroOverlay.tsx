'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';

/** Open question 2 in the architecture doc: the draft runs 9.6 s, but the
 *  butterfly completes near 4.5 s and the hero can reveal the wordmark and
 *  tagline as real HTML. Set this to 4.5 to cut there; null plays to the end. */
const INTRO_END_SECONDS: number | null = null;

/** If playback has not begun by now (slow 4G, data saver), reveal the hero. */
const START_TIMEOUT_MS = 2000;

/** Nothing holds the hero longer than this, whatever the network does. */
const HARD_CAP_MS = 12000;

const LEAVE_MS = 420;

export function IntroOverlay() {
  const { finishIntro } = useExperience();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const closed = useRef(false);

  const close = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    // Hand off immediately: the marks rain in while the overlay fades out.
    finishIntro();
    setLeaving(true);
    window.setTimeout(() => {
      // Flipped only after the fade, since the overlay is displayed only while
      // this reads "play". Once per page load: a client-side return to the
      // home page must not replay it.
      document.documentElement.setAttribute('data-intro', 'done');
      setGone(true);
    }, LEAVE_MS);
  }, [finishIntro]);

  useEffect(() => {
    if (document.documentElement.getAttribute('data-intro') !== 'play') {
      // Reduced motion, or already played on this load: the marks settle in at once.
      finishIntro();
      setGone(true);
      closed.current = true;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const timers: number[] = [];
    let started = false;

    const onPlaying = () => {
      started = true;
    };

    const onTimeUpdate = () => {
      if (INTRO_END_SECONDS !== null && video.currentTime >= INTRO_END_SECONDS) close();
    };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('ended', close);
    video.addEventListener('error', close);
    video.addEventListener('timeupdate', onTimeUpdate);

    // Autoplay can still be refused; muted + playsinline covers iOS and Android.
    video.play().catch(close);

    timers.push(
      window.setTimeout(() => {
        if (!started) close();
      }, START_TIMEOUT_MS),
      window.setTimeout(close, HARD_CAP_MS),
    );

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') close();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', close);

    return () => {
      timers.forEach(window.clearTimeout);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('ended', close);
      video.removeEventListener('error', close);
      video.removeEventListener('timeupdate', onTimeUpdate);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', close);
    };
  }, [close, finishIntro]);

  if (gone) return null;

  return (
    <div className="intro" data-state={leaving ? 'leaving' : 'playing'}>
      <div className="intro-stage">
        <video
          ref={videoRef}
          className="intro-video"
          src="/media/intro.mp4"
          poster="/media/intro-poster.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          width={720}
          height={720}
        />
      </div>
      <button type="button" className="intro-skip" onClick={close}>
        Skip intro
      </button>
    </div>
  );
}
