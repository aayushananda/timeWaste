# Dezign What — Front End Architecture

Oct 4, 2026 · @Minti

Front end system design document for Dezign What — a single-page portfolio site for a creator working across videography, photography, branding, and more. This document captures all architectural decisions made during planning, their rationale, and the trade-offs weighed. This revision folds in the design phase, fixes what a review found, and moves the stack to Next.js so React and React Three Fiber are first-class.

## Overview

Dezign What is a single-page portfolio site for a solo creator working across videography, photography, branding, and content creation. The site has one job: convince a potential client to hire her within a minute of landing.

Visitors arrive mostly on mobile, from Instagram and WhatsApp links. First paint has to be fast on 4G; her work has to look polished since this is a visual portfolio, not a document.

Goals: LCP under 2.5s on 4G mobile, SEO strong enough for her name and projects to rank on Google, deep-linkable share URLs per shoot, restrained 3D accents that feel designed rather than decorative.

Non-goals: user accounts, server-side logic, a CMS, e-commerce, internationalisation, offline-first PWA behaviour. New works are added by editing the content folder and redeploying.

## What changed in this revision

Twelve changes, each traced to a stale fact, a contradiction, or a new requirement.

| Area | Before | Now | Why |
| --- | --- | --- | --- |
| Framework | Astro 4+ | Next.js 16, App Router, static export | React and R3F are requirements; one React tree suits the connected interactions |
| Interactivity | React islands, Framer Motion | Client components driving CSS through refs | Every interaction is a frame loop; shared state lives in one context |
| 3D | R3F lazy-loaded below the fold | R3F v9 and drei, loaded during the intro | The hero is above the fold, so the old rule could not hold |
| Tailwind setup | tailwind.config.mjs | Tailwind 4 CSS-first via @tailwindcss/postcss | v4 has no JS config; PostCSS is Next's built-in path |
| Content | MDX content collections | Markdown with Zod validation in lib/content.ts | No content framework needed for about 20 files |
| Work categories | Included writing, missed V.M. | The six categories from the sketch | Match the My Works slide |
| Category pages | Grid gallery | Stacked shoot chapters | Matches the sketch's right column |
| Images | Framework optimizer | Pre-sized at build with sharp, custom next/image loader | The optimizer needs a server; a static export has none |
| Bundle budget | Option in astro.config.mjs | Lighthouse CI budgets and @next/bundle-analyzer | No such config option exists |
| Nav visibility | Appears once the launchpad leaves view | Hidden while hero or launchpad is in view | A launchpad below the fold also counts as out of view |
| Social cards | Generated per work at build | Cover image per work | Deferred |
| R2 delivery | Public bucket URL | Custom domain on the bucket | r2.dev URLs are rate-limited and meant for development |

## Tech stack

Next.js 16 with the App Router, exported as static HTML; React 19 with React Three Fiber for the 3D; Tailwind 4 for layout utilities.

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16, App Router, output: 'export' | Static HTML for SEO and speed; no server to run or patch |
| UI | React 19; server components by default, client components only where interactive | Non-interactive markup ships no component JS |
| 3D | React Three Fiber v9 with drei | v9 pairs with React 19; drei's View lets several sections share one canvas |
| Physics | Custom drift in useFrame | Space drift needs four rules, not a physics engine |
| Animation | Client components writing CSS transforms through refs | Frame loops never re-render React |
| Styling | Tailwind 4 via @tailwindcss/postcss, plus component CSS | Utilities for layout; signature sections need hand-written 3D CSS |
| Tokens | CSS custom properties in styles/tokens.css, mapped with @theme inline | One source of truth |
| Content | Markdown frontmatter validated with Zod in lib/content.ts | Typed, in git, no CMS |
| Fonts | next/font/google for Fredoka and Caveat Brush | Self-hosted at build, no layout shift |
| Images | next/image with a custom loader over variants pre-sized by sharp | The optimizer needs a server; a static export has none |
| Preview video | Self-hosted MP4 on Cloudflare R2 | Light muted loops |
| Full video | Click-to-load YouTube (youtube-nocookie.com) | Zero YouTube bytes until asked |
| Hosting | Cloudflare Pages, static files | Free, edge locations in India |

**Why Next.js over Astro.** Once React and R3F are requirements, Astro ships React on every page too, and its speed edge shrinks to Next's router and runtime, roughly 100 KB gzipped (estimate). In return Next gives one React tree for connected interactions, one canvas for several 3D sections through drei's View, built-in metadata, sitemap and font handling, and the framework the developer wants to learn.

**Rules that keep it fast.** Pages stay server components; only interactive leaves are marked `'use client'`. The R3F canvas loads through `next/dynamic` with `ssr: false`, so three.js downloads while the intro plays. Frame loops write to refs and CSS variables, never to React state.

## Rendering strategy

Static Site Generation (SSG). Every page is pre-rendered to plain HTML at build time and served from Cloudflare's CDN edge. No runtime server.

Why SSG beats the alternatives for this site:

- **CSR (what the user initially proposed as "SPA")**: ships a blank HTML shell, waits for JS to download and render. First paint is slow, SEO suffers, WhatsApp and LinkedIn link previews often fail. Wrong for a portfolio.
- **SSR**: renders HTML per request on a running server. Fast first paint and good SEO, but each request costs a server hit and the server has to stay up. Overkill for content that changes once a month.
- **ISR**: SSG with scheduled rebuilds. Useful when content changes often from an external source. Not needed here since new works are added by editing files and redeploying.
- **SSG**: pre-renders every page to HTML at build time. First paint is near-instant from the nearest CDN edge, SEO is perfect, hosting is free. Rebuild on content change.

**How it works in Next.js.** `next build` with `output: 'export'` renders every route to HTML, including each shoot page listed by `generateStaticParams`, and writes the site to `out/`. Cloudflare Pages serves that folder from its edge. No Next.js server runs, so server-side vulnerabilities like this year's image-optimizer and next/og fixes have nothing to attack.

**Navigation stays SPA-like.** After the first page, Next's `<Link>` prefetches routes and swaps pages client-side, so the cursor, nav and 3D canvas persist between pages without reloading.

**The intro animation does not change this.** The full page is still server-rendered HTML; the intro is a fixed overlay drawn on top of it. A tiny inline script in the head decides before first paint whether the overlay shows (first visit this session, motion allowed, home page). Crawlers, no-JS visitors and link-preview bots never see it.

## Site architecture

One home page of ten full-screen slides, one route per works category, one route per shoot. Every deep link resolves to the exact page a visitor was sent.

&#91;embedded content: routing · one home, six categories, five videography shoots\]

**Home, in scroll order:** intro overlay (first visit only), hero with the logo and question-mark field, showreel, launchpad, about me, current roles, work experience with courses and achievements, my works, contact, quote. The launchpad boxes jump to hash anchors (`#about`, `#works`, `#roles`, `#experience`, `#achievements`, `#contact`), and the back button follows those jumps.

**Category pages** (`/works/videography` and five siblings) stack each shoot as a chapter: cover or preview loop, title, client and year, a two-line summary, a link to the shoot. This keeps the scroll-through-the-shoots feel from the sketch while every shoot keeps its own URL. `/works` lists the six categories for anyone who lands there directly.

**Shoot pages** (`/works/videography/sachee-sells-creative`) are the leaf she sends to clients: preview loop, click-to-load full video, write-up, credits, next and previous shoot.

**404** for any other path, from `app/not-found.tsx`.

Trade-off kept from the first draft: real per-shoot routes rather than anchors inside one long category page. Each shoot is indexable on its own, shares with a clean URL, and avoids nested scrolling on phones.

## Content model

All content lives in `content/` as Markdown with frontmatter. `lib/content.ts` reads the files at build, validates frontmatter with Zod so a typo in a category fails the build, and passes typed data to server components. File names become URLs: `content/works/nike-ad-dolly.md` becomes `/works/videography/nike-ad-dolly`. Image fields are paths under `public/images/`.

**works**, one Markdown file per shoot:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Sachee Sells, creative shoot |
| category | enum | yes | videography, photography, branding, video-editing, visual-merchandising, social-media |
| client | string | no | Brand or client |
| date | date | yes | Sorts chapters newest first |
| location | string | no | Shoot location |
| summary | string | yes | Two lines for the category chapter and the meta description |
| cover | image | yes | Chapter image, video poster, social card |
| previewVideo | string | no | URL of the short muted loop on R2 |
| youtubeId | string | no | Full video, loaded on click |
| credits | list of role and name | no | Collaborators |
| body | Markdown | yes | The write-up |

**roles**, current roles shown in three columns:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Role name |
| organisation | string | yes | Where she holds it |
| description | string | yes | One or two sentences |
| image | image | yes | Photo for the role |
| order | number | no | Manual sort, default 0 |

**experience**, the split boxes:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| place | string | yes | Name in the top half |
| role | string | yes | What she did there |
| period | string | yes | Written as she wants it shown, e.g. 2023 to 2024 |
| summary | string | yes | Short description |
| image | image | yes | Bottom half of the box |
| order | number | no | Manual sort, default 0 |

**Site data.** `lib/site.ts` holds what appears once: name, tagline, quote, contact links, the ten skills on the about ring, the six categories with their page colors, and the courses and achievements list.

## Placeholder content

Until real content arrives, each slot ships with lorem ipsum or a generated placeholder image, so layouts can be judged on real devices. Content already known from the sketch and the intro video goes in from day one.

| Slot | Placeholder until replaced | Already known |
| --- | --- | --- |
| Her name and bio | Lorem ipsum | Nothing yet |
| Tagline | None needed | to create you need to be free |
| Quote | None needed | Hope you become so free that you create more than you consume |
| Hero logo | Traced from the intro's last frame | Final SVG from her |
| Cursor | Simple blue butterfly | Her detailed butterfly image |
| Launchpad photo | Generated silhouette | Nothing yet |
| About me skill cards | Ten generated photo placeholders | Ten skills from the sketch: illustrator, graphic designer, art director, mentor, photographer, editor, content creator, model, writer, videographer |
| Current roles | Three lorem roles | Sketch shows Lenscap producer, content creator, and one name that is hard to read |
| Work experience | Three lorem places | Sketch shows Lenscap, public speaking and mentoring, and one name that is hard to read |
| Courses and achievements | Three lorem items | Nothing yet |
| Videography shoots | Lorem write-ups, generated covers | Five titles from the sketch: Sachee Sells creative shoot, Sachee Sells event shoot, WeWork x Eka fellowship, Dream a Dozen product shoot, Nike ad Dolly assignment |
| Other five categories | One lorem shoot each | Nothing yet |
| Contact links | Placeholder handles | Four channels from the sketch's icons, as read: phone, Instagram, email, LinkedIn |
| Showreel, preview clips, YouTube IDs | Poster image only | Nothing yet |

## Media pipeline

Three video assets with three jobs: a one-off intro that plays once per session, short muted loops that autoplay on scroll, and full videos on YouTube that load only on click. Images are pre-sized at build.

&#91;embedded content: two-tier video delivery · autoplay preview, click-to-load full version\]

**Why not YouTube everywhere.** Each YouTube iframe pulls roughly 0.5 to 1 MB of player code and trackers before any video plays. Six on a page is several megabytes of overhead, and the player chrome clashes with the portfolio.

**Intro animation.** The draft shared on 4 Oct runs 9.6 s at 1080×1080: question marks rain down, converge into the butterfly, then the wordmark and tagline type on.

- Plays once per browser session on the home page; skipped entirely when the visitor prefers reduced motion.
- Muted and `playsinline` with a poster frame, so autoplay works on iOS and Android. Sound would block autoplay.
- A skip control shows from the first frame; any click or key also skips.
- If playback has not started within 2 s (slow 4G, data saver), the overlay gives up and reveals the hero. Hard cap of 12 s.
- Encode at 720×720 H.264 with faststart, under 600 KB. The square format fits phones and desktops without cropping.
- The overlay background is the video's own pink, #FFBDE3, and the video edges are feathered with a CSS mask, so compression color shift never shows as a box.
- Recommendation: end the video when the butterfly completes (about 4.5 s) and let the hero reveal the wordmark and tagline as real HTML. Text inside a video is invisible to search engines and screen readers, and 9.6 s is a long wait on a link opened from WhatsApp.

**Preview tier, self-hosted on R2.**

- 5 to 15 s clips, 720p, muted, looping, H.264 for reach; 1 to 2 MB each.
- `<video muted loop playsinline preload="none">`; the source attaches only when the clip is half on screen, and it pauses when it leaves.
- Visitors who prefer reduced motion see the poster and play on demand.

**Full video tier, YouTube on click.**

- A button shows the work's own cover and a play mark; no YouTube code loads until it is pressed.
- On press it becomes a `youtube-nocookie.com` iframe with autoplay. Hovering first warms up the connection.

**Images.**

- Originals live in `public/images/`; a prebuild script uses sharp to write AVIF and WebP at 640, 1080 and 1920 px.
- A custom `next/image` loader points each `srcset` at those variants, keeping lazy loading and fixed dimensions.
- Each shoot's cover doubles as its social card through `generateMetadata`, so a shared link shows a real preview on WhatsApp and LinkedIn.

## 3D hero: the question-mark field

Glossy black question marks drift around the logo like objects in zero gravity. The cursor pushes them away; left alone, they return to a slow drift. Built with React Three Fiber and drei; no model files, no physics library.

**Why procedural geometry, not a model file.** Each question mark is a tube swept along a curve traced from the glyph in the intro video, plus a sphere for the dot and two for the rounded stroke ends. That is a few KB of code instead of a 300 KB to 2 MB GLB, and the stroke weight can be tuned to match the wordmark.

**Her own models.** The simple doodle-style models she plans to make in Blender, and any picked from Sketchfab, drop into the same field. The drift physics only needs a mesh and a collision radius, so a GLB can replace the procedural question marks or join them as extra drifting objects. They follow the model budget below.

**Why custom drift instead of Matter.js.** Matter.js is a 2D rigid-body engine built for gravity, stacking and friction. Space drift needs none of that, only four rules per frame, about 60 lines:

1. Cruise: each mark eases toward its own slow wander velocity (time constant about 2.5 s), so a push glides out instead of stopping dead.
2. Cursor: marks near the pointer get an impulse away from it, scaled by pointer speed, plus some spin. A slow hover nudges; a fast swipe scatters.
3. Logo exclusion: an ellipse around the logo pushes marks outward, so they circle the lockup instead of covering it.
4. Bounds and collisions: soft springs at the frame edges and elastic bounces between marks.

**Entrance.** When the intro ends, or at once on a repeat visit, the marks rain in from above and settle into drift, a short echo of the intro video.

**Loading.** The canvas is a client component loaded with `next/dynamic` and `ssr: false`, fetched as soon as the page hydrates, in parallel with the intro video. The logo and tagline are server-rendered HTML and paint first; the canvas fades in when the scene is ready. Without WebGL the canvas stays empty and the hero still works.

**One canvas for every 3D section.** A single R3F canvas sits fixed behind the page, and drei's View draws into the hero's box and into any later 3D section. That is one WebGL context instead of one per section.

**Contact daydream.** The contact slide's 3D section is a kid on a bean bag ("A little coffee in the evening" by Tijerín Art Studio, CC BY 4.0, credited under the scene), with the four links floating around it as outlined clouds. The Sketchfab file was cut from 7.9 MB to 1.1 MB with gltf-transform (meshopt geometry, WebP textures); the meshopt decoder ships inside three-stdlib, so nothing is fetched from a CDN. The model is fetched only once the visitor scrolls within a screen of it. Its materials skip filmic tone mapping so the painted browns stay brown, the skin is lifted 1.5x in linear light, and the bean bag gets a little emissive to read white.

**Guardrails.**

- 9 marks on desktop, 6 under 640 px; pixel ratio capped at 2.
- The loop runs only while the hero is on screen and the tab is visible.
- Reduced motion: one static frame, no drift, no pointer response.
- Physical material with clearcoat, black base and a pink rim light, so the marks read as part of the page.

**Sketchfab models elsewhere**, if added later: GLB only, Draco geometry, KTX2 textures at 1024 px or less, under 2 MB per scene, loaded when their section nears the viewport.

**Mobile fallback, phase 4.** A device-tier check (viewport width, `(hover: hover)`, a WebGL capability probe) will swap the canvas for a static frame or short loop on low-end phones. Not built yet; tracked under Deferred.

## Signature interactions

Seven interactions carry the site's personality. Each has one job, runs only while its section is on screen, and falls back to something still and readable. Each is a small client component; shared state (intro finished, page theme, pointer) lives in one React context, so the cursor can scatter the question marks without glue code.

| Interaction | Where | Built with | When motion is reduced |
| --- | --- | --- | --- |
| Intro animation | Before the hero, first visit | Video overlay, once per session | Skipped |
| Question-mark field | Hero | R3F with custom drift | One still frame |
| Scroll color journey | Whole home page | Observer plus CSS transition | Colors switch instantly |
| Butterfly cursor | Pointer devices | One element moved with transforms | Follows without flapping |
| Orbit rings | About me (horizontal), My works (vertical) | CSS 3D transforms set per frame | Static arrangement |
| Sakura petals | Quote | Canvas 2D particles | A still scatter |
| Card tilt | Launchpad, experience | Pointer-driven CSS variables | Off |

**Scroll color journey.** Each section declares a palette name (`data-theme="lilac"`). An observer watching a thin band across the middle of the viewport copies that name onto the `html` element; CSS maps it to `--bg` and `--ink`, and `body` transitions both over 700 ms. Sections are transparent, so one transition repaints the page, and `<meta name="theme-color">` updates the phone's browser bar to match.

- Trade-off: a timed fade on crossing rather than color scrubbed continuously with scroll. Scrubbing passes through muddy in-between colors on fast scrolls; a timed fade always lands on a palette color.
- Dark slides flip the ink to pink; every pair is checked for contrast.

**Butterfly cursor.** The native cursor is hidden and one fixed element follows the pointer with `translate3d`, flapping by scaling its width on a sine wave whose speed rises with pointer speed. Over links and buttons it grows and slows.

- Only on devices with a fine pointer and hover; touch devices never see it.
- The native cursor stays in forced-colors (high contrast) mode and over text fields.
- Trade-off: a CSS `cursor: url()` image has zero lag, but browsers cap it at 128 px and cannot animate it, so a detailed flapping butterfly needs the element approach. The cost is up to one frame of lag.
- The placeholder is a blue butterfly; her detailed image replaces `public/cursor/butterfly.svg` with no code change.

**Orbit rings.** One component, two modes, matching the two references:

- About me: a horizontal ring (spinning about the vertical axis) of ten skill cards around the words about me. Cards face outward, turn edge-on at the sides and fade as they pass behind the words.
- My works: a vertical ring (spinning about the horizontal axis) of the six category cards around my works, on the dark plum slide. Cards keep facing the viewer and alternate left and right of the words.
- Entrance: as the section scrolls in, cards swoop in on a spiral, from farther out, rotated and smaller, staggered. The entrance is scrubbed by scroll, so scrolling back reverses it.
- Spin speeds up briefly with scroll speed; hover or keyboard focus slows the ring to a stop so a card can be clicked.
- Depth uses computed `z-index` rather than `preserve-3d` sorting, which avoids the flicker browsers show where a large text plane meets rotating cards.
- The works ring is backed by a plain row of category links underneath. Moving targets are hard to hit, so nobody has to.

**Sakura petals.** A canvas over the quote slide draws 18 to 70 petals depending on its area, from one pre-rendered petal sprite. Each falls with sway, spins, and flips (its width scales with a cosine to fake a turn in 3D). Moving the cursor through them makes a small gust. The quote slide is night plum so pale petals read clearly: cherry blossoms at night.

**Card tilt.** Launchpad and experience boxes lean up to 8 degrees toward the pointer, on hover-capable devices only.

## Navigation

Two layers. The launchpad, her photo with six link boxes, is the primary navigation. A floating pill bar covers the rest of the scroll.

**Launchpad.** Six boxes around the photo, as in the sketch: about me, my works, current roles, courses and achievements, experience, contact. Each jumps to its slide by hash, and the back button follows. The boxes are real links in a list, so keyboard and screen-reader users get the same map.

**Floating bar rules.**

1. Hidden while the hero or the launchpad is on screen; both already carry the brand or the map.
2. Elsewhere it hides on downward scroll and returns on any upward scroll.
3. Butterfly mark and wordmark on the left; three links on the right: about, works, contact.
4. Moves only with `transform` over 220 ms, so it never triggers layout.
5. Its fill follows the page color, so it changes with the scroll journey. Height 52 px on desktop, 48 px on phones.

**Mobile.** The three links fold into a menu button that opens a full-screen sheet with 48 px targets.

**Work pages.** Rule 1 does not apply there. The bar shows a back link (to the category from a shoot, to my works from a category) in place of the three home links.

## Mobile strategy

Desktop-first for layout concept, mobile has stacked reflow rules per section. Breakpoints follow Tailwind defaults.

| Breakpoint | Width | Primary use |
| --- | --- | --- |
| mobile (default) | 0 to 639px | Single column, large tap targets, reflowed layouts |
| sm | 640px+ | Larger phones and small tablets portrait |
| md | 768px+ | Tablet portrait, two-column grids start here |
| lg | 1024px+ | Desktop, full launchpad layout kicks in |
| xl | 1280px+ | Wide desktop, extra breathing room on hero |

**Section-by-section reflow rules**

- **Intro**: the square video fits the screen width on the pink overlay; the skip control sits low, in thumb reach.
- **Hero**: the logo lockup scales to about 70% of the width; 6 question marks instead of 9.
- **Showreel**: full-width 16:9 frame.
- **Launchpad**: the photo moves to the top as a 160 px circle; the six boxes become a two-column grid below it.
- **About me**: the ring keeps spinning at a smaller radius with narrower cards; the bio follows below.
- **Current roles**: three columns become one.
- **Work experience**: the split boxes stack, each keeping text on top and image below; courses and achievements follow as a list.
- **My works**: the vertical ring shrinks to fit; the category links below wrap to two columns.
- **Contact**: the four cloud links zig-zag, two above the kid and two below, instead of sitting at the corners.
- **Quote**: type scales with the viewport and the petal count drops with the slide's area.
- **Cursor**: never shown on touch devices.

**Nested scrolls**

None. Each work's detail page (`/works/{category}/{slug}`) is its own route, not a nested scroll inside the category page. This avoids the mobile scroll-trap pattern where a user's finger-swipe gets caught by an inner scroll container.

**Touch and tap**

Minimum tap target 44x44 px (Apple HIG). No hover-only interactions on mobile — the CSS 3D tilt effect on cards is `@media (hover: hover)` only.

## Performance budget

Targets measured on a mid-range Android (Moto G Power class) on 4G, which is the realistic worst case for most visitors.

| Metric | Target | Why it matters |
| --- | --- | --- |
| LCP | < 2.5 s | Server-rendered HTML logo, or the intro poster on a first visit |
| CLS | < 0.1 | Every image and video declares its size; next/font removes font shift |
| INP | < 200 ms | Frame loops write to refs, never React state, and pause off screen |
| JS before the hero responds | < 170 KB gzipped | Next runtime and React (about 100 KB) plus the client components |
| 3D chunk (three.js, R3F, drei) | about 200 KB gzipped, async | Loads during the intro and never blocks first paint |
| HTML per page | < 60 KB gzipped | Includes the inline page data Next adds |
| Intro video | < 600 KB, poster < 30 KB | Starts within 2 s on 4G or is skipped |
| Preview clip | 1 to 2 MB, 720p, under 15 s | Fetched only when half on screen |
| Images | AVIF first, WebP fallback | About half the size of JPEG |
| Lighthouse mobile | > 90 performance and accessibility | Checked on every pull request |

**How these are enforced.**

- Lighthouse CI (`@lhci/cli`) runs against each Cloudflare Pages preview deploy and asserts the scores plus `resource-summary` budgets.
- `@next/bundle-analyzer` shows what each route ships; anything new in the shared chunk gets a second look.
- Images are pre-sized at build; anything outside `next/image` (an SVG, a CSS background) is reviewed by hand.

## Deployment and hosting

Cloudflare Pages for the site, Cloudflare R2 for media, GitHub for source and CI.

**Site hosting — Cloudflare Pages**

- Free tier: unlimited static requests and bandwidth, 500 builds a month.
- Edge locations in several Indian cities, including Mumbai, Chennai and Delhi.
- Auto-deploy on every push to `main`; a preview URL for every branch and pull request.
- Build command `npm run build`, output `out`; Node 22 pinned through `.nvmrc`.
- Static export ignores `headers()` in next.config, so `public/_headers` sets a one-year immutable cache on `/_next/static/*` and revalidates HTML.

**Media hosting — Cloudflare R2**

- S3-compatible storage with no egress fees, about $0.015 per GB-month.
- Holds the preview clips and any large stills; uploads through Wrangler or the dashboard.
- Served from a custom domain on the bucket, for example `media.dezignwhat.com`. The default `r2.dev` URL is rate-limited and meant for development.
- Phase 1 ships the intro video from `public/media/` instead, since it is one small file; it moves to R2 with the preview clips in phase 2.

**Git and CI**

- Source in a GitHub repo. One branch strategy: `main` is production, feature branches get Pages preview URLs for review.
- GitHub Actions runs on every PR: typecheck, lint, build, Lighthouse against the preview deploy.
- No test suite in phase 1 (the site has almost no runtime logic). Add Playwright smoke tests in phase 2 if the surface area grows.

**Full video hosting — YouTube**

- Her existing YouTube channel. No change to how she uploads.
- Each work entry references a video by its YouTube ID in the frontmatter. The site builds the lazy embed from that ID.

**Domain and DNS**

- Custom domain (e.g. `dezignwhat.com`) via any registrar, DNS managed through Cloudflare for the free DDoS protection and faster propagation.
- Email forwarding (not hosting) via Cloudflare Email Routing — free, lets her use `hello@dezignwhat.com` without paying for a mailbox.

**Cost estimate (steady state)**

- Pages: $0
- R2 storage (approx 2GB of preview clips): < $0.05/month
- Domain: $10-15/year
- Email routing: $0
- **Total: under $20/year** excluding the one-time cost of time to build.

## Folder structure

Next's App Router layout with one rule: routes in `app/`, interactive pieces as small client components in `components/`, content in Markdown.

```
dezign-what/
├── next.config.ts            # output: 'export', image loader, transpilePackages
├── postcss.config.mjs        # Tailwind 4
├── package.json              # next 16, react 19, @react-three/fiber 9, drei, three
├── .nvmrc                    # Node 22
├── scripts/resize-images.mjs # prebuild: AVIF and WebP variants with sharp
├── public/
│   ├── _headers              # immutable cache for /_next/static/*
│   ├── favicon.svg
│   ├── cursor/butterfly.svg  # placeholder cursor
│   ├── media/                # intro.mp4 and poster
│   └── images/               # originals and generated variants
├── content/                  # works/, roles/, experience/ as Markdown
├── lib/
│   ├── content.ts            # read, validate with Zod, sort
│   ├── site.ts               # name, tagline, quote, contacts, skills, categories
│   └── image-loader.ts       # maps next/image to pre-sized variants
├── styles/                   # globals.css, tokens.css, one file per section
├── components/
│   ├── providers/            # ExperienceProvider: intro, theme, pointer state
│   ├── chrome/               # Nav, IntroOverlay, ButterflyCursor
│   ├── sections/             # Hero, Showreel, Launchpad, About, Roles,
│   │                         # Experience, Works, Contact, Quote
│   ├── three/                # SceneCanvas (one shared canvas), QuestionField
│   └── ui/                   # OrbitRing, Frame, PreviewVideo, LazyYouTube, Sakura
└── app/
    ├── layout.tsx            # fonts, metadata, providers, canvas, cursor, nav
    ├── page.tsx              # home: the ten slides
    ├── not-found.tsx
    ├── sitemap.ts, robots.ts
    └── works/
        ├── page.tsx
        └── [category]/
            ├── page.tsx          # stacked chapters
            └── [slug]/page.tsx   # one shoot
```

**Convention.** Files in `app/` and `components/sections/` are server components unless they need the browser. Interactive pieces declare `'use client'` and stay small, so their JavaScript is all that ships. Frame-loop components write to refs and CSS variables, never to React state, so animation never triggers a re-render.

## Design system

The brand already sets the core: baby pink #FFBDE3 and black from the logo, a rounded wordmark, a brush-script tagline, and question marks that become a butterfly. The design extends those four things and adds nothing that competes with them.

**Palette.** Core colors first, then the scroll-journey pastels.

| Token | Hex | Role |
| --- | --- | --- |
| blush | #FFBDE3 | Brand pink sampled from the logo and intro; hero, launchpad |
| ink | #000000 | Logo black; text and lines on light slides |
| plum | #2B1630 | Dark slide behind the works ring |
| butterfly blue | #2F5BFF | Interaction only: the cursor and keyboard focus rings (at least 3:1 on every slide) |
| petal | #FFE4F1 | Showreel, contact |
| lilac | #E4D6FF | About me |
| butter | #FFF1B8 | Current roles |
| mint | #CDEFE0 | Work experience |
| night | #1B1230 | Quote with sakura |

**Scroll journey.** Hero and intro blush, showreel petal, launchpad blush, about me lilac, current roles butter, work experience mint, my works plum with pink ink, contact petal, quote night with pink ink.

**Type.**

- Display and body: Fredoka, variable (weight 300 to 700, width 75 to 125). Its rounded terminals match the wordmark, and the width axis lets the slide words run wide and the nav run narrow from one font file.
- Script: Caveat Brush, the face of the intro's tagline. Used for the tagline and the quote only.
- Scale: body 17 px at 1.55 line height; section titles fluid from 28 to 40 px; slide words fluid from 64 to 208 px; reading lines under 65 characters.
- Lowercase for the big slide words (about me, my works, contact), echoing the handwritten sketch; sentence case elsewhere; no all-caps labels.

**Layout.** Every home section is one full-screen slide (`min-height: 100svh`), the unit the sketch was drawn in. Signature compositions are centered; reading text is left-aligned. Content width 1200 px, with 24 px gutters on phones and 48 px on desktop.

**Shape and line.**

- Lines, borders and icons at 2.5 px with round caps and joins, the stroke weight of the logo.
- Radii: full pill for the nav, launchpad boxes and link chips; 28 px for boxes; 6 px for photos.
- No drop shadows and no gradients. Depth comes from the 3D field and the orbit rings, nowhere else.
- Photos and video sit inside viewfinder corner marks, the framing a camera shows.

**Motion.** 160 ms for hover feedback, 220 ms for the nav, 700 ms for page color. One UI easing curve, `cubic-bezier(0.2, 0.7, 0.2, 1)`; physics drives the 3D field and the rings. No fade-in-on-scroll reveals: the color change already marks each new slide.

**Principles.**

1. One idea per slide.
2. Monoline, like the logo.
3. The page color is the scroll; components stay transparent.
4. Blue means you can act; nothing decorative is blue.
5. Each moving thing has one job: drift, orbit, fall, flutter.
6. Frame media like a camera.

**Changed after checking the plan against the brief.**

- Dropped powder blue from the scroll journey, so blue stays reserved for interaction.
- Dropped a third, neutral body face; Fredoka at 400 reads well at 17 px and keeps one rounded voice.
- Current roles lost its card containers: images sit in viewfinder frames with text below. Only experience keeps boxes, because the sketch draws them as split boxes.

All tokens live in `styles/tokens.css` as custom properties and are mapped into Tailwind with `@theme inline`, so `bg-blush` and `var(--blush)` are the same value.

## Build phases

Four phases, each shippable. Phase 1 builds the whole site on placeholder content. Its brand assets are already prepared: the logo traced to SVG, a placeholder cursor, the intro re-encoded to 720×720 at 124 KB, and generated placeholder images. No site code exists yet.

**Phase 1, scaffold with placeholders.**

1. Next.js 16 project (App Router, static export) with Tailwind 4, Markdown content, and all ten home slides in lorem ipsum with generated placeholder images.
2. Every signature interaction working: intro overlay with the draft video, question-mark field, scroll colors, butterfly cursor, both orbit rings, sakura, tilt, floating nav.
3. Category and shoot routes generated from ten placeholder works.

**Phase 2, real content.**

1. Her photos, copy, roles, experience and works replace the placeholders.
2. Final logo as SVG, the detailed butterfly cursor image, a trimmed intro video.
3. Preview clips encoded and uploaded to R2 on a custom domain; YouTube IDs filled in.
4. Deploy to Cloudflare Pages on the real domain.

**Phase 3, polish and performance.**

1. Lighthouse CI on pull requests with the budgets above.
2. Physics and ring speeds tuned on real phones, art-directed image crops.
3. Optional: one Sketchfab model in a second section.

**Phase 4, resilience and accessibility.**

1. Mobile 3D fallback for low-end phones.
2. A visible pause control for the rings, a keyboard and screen-reader audit, a contrast pass.
3. Playwright smoke tests for routes and the intro skip.

**Order rationale.** Placeholders first, so every layout and interaction can be judged on real devices before content work starts. Performance and fallbacks last, because they should be measured against the real assets that set the weight.

## Deferred

Consciously not built yet, each with the trigger for revisiting it.

- **Mobile 3D fallback**: phase 4, after testing the field on a budget Android.
- **CMS**: when someone other than a developer adds work, or past about 30 shoots.
- **Page transitions**: Next already navigates client-side without reloads; animated transitions come once the base site is stable.
- **Smooth scrolling (Lenis)**: considered for the rings; native scroll kept for accessibility and touch feel. Revisit only if the rings feel steppy on real devices.
- **Generated social cards**: covers serve for now; add a generator if shares need text on the card.
- **Contact form**: email and social links cover it; a form needs a serverless function or a service like Formspree.
- **Analytics**: Cloudflare Web Analytics once there are real visitors.
- **Journal**: a new collection and a `/journal` route when she wants to write.
- **i18n**: English only until there is an audience for a second language.

## Open questions

1. Is the showreel slide still wanted now that the intro video exists? Kept as a placeholder slide for now.
2. Can the intro end when the butterfly forms, about 4.5 s, with the wordmark and tagline revealed in HTML?
3. Courses and achievements is planned as a short list at the end of the experience slide, so the sketch's sixth launchpad box has a target. Keep it, or drop the box?
4. Is V.M. visual merchandising? Assumed so for the category name.
5. The hero uses the butterfly lockup so the intro hands off without a jump. Should the question-mark wordmark appear anywhere?
6. The references did not say where the rings go. The horizontal ring is placed on about me and the vertical ring on my works; move either if you pictured them elsewhere.

## Sources

- [Next.js support table](https://endoflife.date/nextjs): 16 is the active line, 16.3.8 as of 30 Sep 2026.
- [September 2026 Next.js security release](https://daily.dev/posts/september-2026-security-release-z46gampdn): image-optimizer SSRF and SSG/ISR cache issues, server-side only.
- [Next.js release notes](https://releasebot.io/updates/vercel/next-js): the next/og remote code execution fix in 16.3.6.
- [React Three Fiber installation](https://r3f.docs.pmnd.rs/getting-started/installation): v9 pairs with React 19; transpilePackages for three.js add-ons.
- [R3F v9 migration guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide): React 19 compatibility release.
