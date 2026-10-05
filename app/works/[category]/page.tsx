import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ThemeJourney } from '@/components/chrome/ThemeJourney';
import { Img } from '@/components/ui/Img';
import { getWorksByCategory } from '@/lib/content';
import { categories, getCategory } from '@/lib/site';

type Params = { category: string };

export function generateStaticParams(): Params[] {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};

  return {
    title: category.label,
    description: category.blurb,
  };
}

/** Each shoot is a chapter, so the scroll-through feel from the sketch stays
 *  while every shoot keeps its own URL. */
export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const works = getWorksByCategory(slug);

  return (
    <>
      <ThemeJourney fallback={category.theme} />
      <div className="category" data-theme={category.theme}>
        <header className="shell category-head">
          <h1 className="slide-word">{category.label}</h1>
          <p className="measure">{category.blurb}</p>
        </header>

        {works.length === 0 ? (
          <p className="shell">Nothing here yet.</p>
        ) : (
          <ul className="category-chapters">
            {works.map((work) => (
              <li key={work.slug} className="shell category-chapter">
                <Link href={`${work.href}/`} className="category-chapter-link">
                  <div className="viewfinder">
                    <Img
                      src={work.cover}
                      alt=""
                      sizes="(min-width: 768px) 55vw, 100vw"
                      ratio="16 / 10"
                      className="photo"
                    />
                    <span className="viewfinder-foot" />
                  </div>

                  <div className="category-chapter-text">
                    <h2 className="section-title">{work.title}</h2>
                    <p className="eyebrow">
                      {[work.client, work.date.getFullYear()].filter(Boolean).join(' · ')}
                    </p>
                    <p className="measure">{work.summary}</p>
                    <span className="chip">view the shoot</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
