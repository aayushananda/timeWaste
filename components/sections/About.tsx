import { Img } from '@/components/ui/Img';
import { OrbitRing } from '@/components/ui/OrbitRing';
import { site, skills } from '@/lib/site';

export function About() {
  return (
    <section id="about" className="slide about" data-theme="ivory">
      <div className="shell">
        {/* Ten skill cards orbiting the words; it leans the opposite way to
            the works ring further down. */}
        <OrbitRing lines={['about', 'me']} lean={-1}>
          {skills.map((skill) => (
            <figure key={skill.label} className="orbit-figure">
              <Img src={skill.image} alt="" sizes="300px" className="orbit-img" />
              <figcaption className="orbit-label">{skill.label}</figcaption>
            </figure>
          ))}
        </OrbitRing>

        <div className="about-bio measure">
          {site.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
