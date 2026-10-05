import Link from 'next/link';
import { Img } from '@/components/ui/Img';
import { TiltCard } from '@/components/ui/TiltCard';
import { launchpad } from '@/lib/site';

/** The site's primary navigation: six boxes around her photo. Real links in a
 *  list, so keyboard and screen-reader users get the same map. */
export function Launchpad() {
  const left = launchpad.slice(0, 3);
  const right = launchpad.slice(3);

  return (
    <section id="launchpad" className="slide launchpad" data-theme="blush">
      <div className="shell launchpad-inner">
        <h2 className="visually-hidden">Jump to a section</h2>

        <ul className="launchpad-col">
          {left.map((item) => (
            <LaunchBox key={item.href} {...item} />
          ))}
        </ul>

        <div className="launchpad-photo viewfinder">
          <Img
            src="people/portrait.jpg"
            alt=""
            sizes="(min-width: 1024px) 360px, 160px"
            className="photo"
          />
          <span className="viewfinder-foot" />
        </div>

        <ul className="launchpad-col">
          {right.map((item) => (
            <LaunchBox key={item.href} {...item} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function LaunchBox({ label, href }: { label: string; href: string }) {
  return (
    <li>
      <TiltCard className="launchpad-box">
        <Link href={href}>{label}</Link>
      </TiltCard>
    </li>
  );
}
