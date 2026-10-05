import Link from 'next/link';
import { Img } from '@/components/ui/Img';
import { OrbitRing } from '@/components/ui/OrbitRing';
import { categories } from '@/lib/site';

export function Works() {
  return (
    <section id="works" className="slide works" data-theme="plum">
      <div className="shell">
        {/* The six category cards orbiting the words. */}
        <OrbitRing lines={['my', 'works']}>
          {categories.map((category) => (
            <Link key={category.slug} href={`/works/${category.slug}/`} className="orbit-link">
              <figure className="orbit-figure">
                <Img src={category.image} alt="" sizes="300px" className="orbit-img" />
                <figcaption className="orbit-label">{category.label}</figcaption>
              </figure>
            </Link>
          ))}
        </OrbitRing>

        {/* Moving targets are hard to hit, so nobody has to. */}
        <ul className="orbit-fallback">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link href={`/works/${category.slug}/`} className="chip">
                {category.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
