import { Img } from '@/components/ui/Img';
import { PetalField } from '@/components/ui/PetalField';
import { sakuraQuote } from '@/lib/site';

/** A sakura tree flush to the right, its blossoms drifting across to a proverb
 *  on the left. Replaces the old showreel slot after the hero. */
export function SakuraQuote() {
  return (
    <section id="sakura" className="slide sakura-break" data-theme="ivory">
      <div className="sakura-tree" aria-hidden="true">
        <Img
          src="sakura-tree-cutout.png"
          alt=""
          sizes="(orientation: portrait) min(84vw, 560px), min(40vw, 640px)"
          priority
        />
      </div>

      <PetalField source=".sakura-tree" />

      <div className="sakura-inner">
        <figure className="sakura-quote">
          <blockquote className="sakura-quote-text">{sakuraQuote.text}</blockquote>
          <figcaption className="sakura-quote-source">— {sakuraQuote.source}</figcaption>
        </figure>
      </div>
    </section>
  );
}
