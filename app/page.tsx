import { IntroOverlay } from '@/components/chrome/IntroOverlay';
import { ThemeJourney } from '@/components/chrome/ThemeJourney';
import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { Experience } from '@/components/sections/Experience';
import { Hero } from '@/components/sections/Hero';
import { Launchpad } from '@/components/sections/Launchpad';
import { Quote } from '@/components/sections/Quote';
import { Roles } from '@/components/sections/Roles';
import { SakuraQuote } from '@/components/sections/SakuraQuote';
import { Works } from '@/components/sections/Works';

/** The home page, in scroll order. */
export default function HomePage() {
  return (
    <>
      {/* Home only: the overlay never exists on a work page. */}
      <IntroOverlay />
      <ThemeJourney />

      <Hero />
      <SakuraQuote />
      <Launchpad />
      <About />
      <Roles />
      <Experience />
      <Works />
      <Contact />
      <Quote />
    </>
  );
}
