import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ThemeJourney } from '@/components/chrome/ThemeJourney';
import { Img } from '@/components/ui/Img';
import { LazyYouTube } from '@/components/ui/LazyYouTube';
import { PreviewVideo } from '@/components/ui/PreviewVideo';
import { getWork, getWorkNeighbours, getWorks } from '@/lib/content';
import { getCategory } from '@/lib/site';
import { resolveImage } from '@/lib/images';

type Params = { category: string; slug: string };

export function generateStaticParams(): Params[] {
  return getWorks().map((work) => ({ category: work.category, slug: work.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const work = getWork(category, slug);
  if (!work) return {};

  // The cover doubles as the social card, so a shared link previews properly.
  const cover = resolveImage(work.cover);

  return {
    title: work.title,
    description: work.summary,
    openGraph: {
      title: work.title,
      description: work.summary,
      images: [{ url: cover.fallback, width: cover.width, height: cover.height }],
    },
  };
}

/** The leaf she sends to clients. */
export default async function WorkPage({ params }: { params: Promise<Params> }) {
  const { category: categorySlug, slug } = await params;
  const work = getWork(categorySlug, slug);
  const category = getCategory(categorySlug);
  if (!work || !category) notFound();

  const { previous, next } = getWorkNeighbours(categorySlug, slug);
  const cover = resolveImage(work.cover);

  return (
    <>
      <ThemeJourney fallback={category.theme} />
      <article className="work" data-theme={category.theme}>
        <header className="shell work-head">
          <p className="eyebrow">{category.label}</p>
          <h1 className="section-title work-title">{work.title}</h1>
          <dl className="work-meta">
            {work.client && (
              <div>
                <dt>Client</dt>
                <dd>{work.client}</dd>
              </div>
            )}
            <div>
              <dt>Year</dt>
              <dd>{work.date.getFullYear()}</dd>
            </div>
            {work.location && (
              <div>
                <dt>Location</dt>
                <dd>{work.location}</dd>
              </div>
            )}
          </dl>
        </header>

        <div className="shell work-media viewfinder">
          {work.youtubeId ? (
            <LazyYouTube id={work.youtubeId} title={work.title}>
              <Img
                src={work.cover}
                alt=""
                sizes="(min-width: 1024px) 1100px, 100vw"
                ratio="16 / 9"
                className="photo"
                priority
              />
            </LazyYouTube>
          ) : work.previewVideo ? (
            <PreviewVideo src={work.previewVideo} poster={cover.fallback} label={work.title} />
          ) : (
            <Img
              src={work.cover}
              alt=""
              sizes="(min-width: 1024px) 1100px, 100vw"
              ratio="16 / 9"
              className="photo"
              priority
            />
          )}
          <span className="viewfinder-foot" />
        </div>

        <div
          className="shell work-body measure"
          dangerouslySetInnerHTML={{ __html: work.body }}
        />

        {work.credits.length > 0 && (
          <section className="shell work-credits">
            <h2 className="eyebrow">Credits</h2>
            <ul>
              {work.credits.map((credit) => (
                <li key={`${credit.role}-${credit.name}`}>
                  <span className="work-credit-role">{credit.role}</span>
                  <span>{credit.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="shell work-nav" aria-label="More shoots">
          {previous ? (
            <Link href={`${previous.href}/`} className="chip">
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`${next.href}/`} className="chip">
              {next.title} →
            </Link>
          )}
        </nav>
      </article>
    </>
  );
}
