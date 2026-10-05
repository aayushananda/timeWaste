import type { Metadata } from 'next';
import Link from 'next/link';
import { Img } from '@/components/ui/Img';
import { getWorksByCategory } from '@/lib/content';
import { categories } from '@/lib/site';

export const metadata: Metadata = {
  title: 'My works',
  description: 'Videography, photography, branding, editing, visual merchandising and social.',
};

/** For anyone who lands on /works directly. */
export default function WorksIndexPage() {
  return (
    <section className="slide work-index" data-theme="plum">
      <div className="shell">
        <h1 className="slide-word">my works</h1>

        <ul className="work-index-grid">
          {categories.map((category) => {
            const count = getWorksByCategory(category.slug).length;
            return (
              <li key={category.slug}>
                <Link href={`/works/${category.slug}/`} className="work-index-card">
                  <div className="viewfinder">
                    <Img
                      src={category.image}
                      alt=""
                      sizes="(min-width: 768px) 360px, 100vw"
                      ratio="4 / 3"
                      className="photo"
                    />
                    <span className="viewfinder-foot" />
                  </div>
                  <h2 className="work-index-title">{category.label}</h2>
                  <p className="work-index-blurb">{category.blurb}</p>
                  <p className="eyebrow">
                    {count} {count === 1 ? 'shoot' : 'shoots'}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
