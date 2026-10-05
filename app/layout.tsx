import type { Metadata, Viewport } from 'next';
import { Caveat_Brush, Fredoka } from 'next/font/google';
import { ButterflyCursor } from '@/components/chrome/ButterflyCursor';
import { INTRO_SCRIPT } from '@/components/chrome/introScript';
import { Nav } from '@/components/chrome/Nav';
import { ExperienceProvider } from '@/components/providers/ExperienceProvider';
import { Scene } from '@/components/three/Scene';
import { site, themeColors } from '@/lib/site';
import { inlineSvg } from '@/lib/svg';
import '@/styles/globals.css';

// Self-hosted at build, so there is no layout shift and no Google request.
const fredoka = Fredoka({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-fredoka',
  display: 'swap',
});

const caveat = Caveat_Brush({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.brand} — ${site.name}`,
    template: `%s · ${site.brand}`,
  },
  description: site.description,
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    siteName: site.brand,
    title: `${site.brand} — ${site.name}`,
    description: site.description,
    url: site.url,
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Kept in step with the scroll journey by ThemeJourney.
  themeColor: themeColors.blush,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="blush"
      className={`${fredoka.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Decides before first paint whether the intro overlay shows. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <ExperienceProvider>
          <Scene />
          <ButterflyCursor />
          <Nav mark={inlineSvg('logo/butterfly.svg')} />
          <main className="page">{children}</main>
        </ExperienceProvider>
      </body>
    </html>
  );
}
