import { inlineSvg } from '@/lib/svg';
import { site } from '@/lib/site';
import { HeroStage } from './HeroStage';

export function Hero() {
  const lockup = inlineSvg('logo/lockup.svg');

  return (
    <section id="hero" className="slide hero" data-theme="blush">
      <HeroStage />

      <div className="shell hero-inner">
        <h1 className="hero-logo-wrap">
          <span className="visually-hidden">
            {site.brand} — {site.name}
          </span>
          <span
            id="hero-logo"
            className="hero-logo"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: lockup }}
          />
        </h1>

        <p className="hero-tagline script">{site.tagline}</p>
      </div>

      <a className="hero-cue" href="#sakura">
        <span>scroll</span>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M12 4v15M6 13l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </section>
  );
}
