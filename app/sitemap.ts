import type { MetadataRoute } from 'next';
import { getWorks } from '@/lib/content';
import { categories, site } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const works = getWorks();

  return [
    { url: `${site.url}/`, priority: 1 },
    { url: `${site.url}/works/`, priority: 0.8 },
    ...categories.map((category) => ({
      url: `${site.url}/works/${category.slug}/`,
      priority: 0.7,
    })),
    ...works.map((work) => ({
      url: `${site.url}${work.href}/`,
      lastModified: work.date,
      priority: 0.6,
    })),
  ];
}
