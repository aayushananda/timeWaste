import { Sakura } from '@/components/ui/Sakura';
import { site } from '@/lib/site';

/** Near-black so pale petals read clearly: cherry blossoms at night. */
export function Quote() {
  return (
    <section id="quote" className="slide quote" data-theme="noir">
      <Sakura />
      <div className="shell quote-inner">
        <blockquote className="script quote-text">{site.quote}</blockquote>
      </div>
    </section>
  );
}
