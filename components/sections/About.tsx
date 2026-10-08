import { CardWheel } from '@/components/ui/CardWheel';
import { Img } from '@/components/ui/Img';
import { site, skills } from '@/lib/site';

export function About() {
  return (
    <section id="about" className="slide about" data-theme="ivory">
      <div className="shell">
        {/* Her ten skills on a wide wheel, five on show at a time; the works
            ring further down keeps the orbit. */}
        <CardWheel title="about me" itemName="skill">
          {skills.map((skill) => (
            <figure key={skill.label} className="wheel-figure">
              <Img
                src={skill.image}
                alt=""
                sizes="(min-width: 640px) 300px, 40vw"
                className="wheel-img"
              />
              <figcaption className="wheel-label">{skill.label}</figcaption>
            </figure>
          ))}
        </CardWheel>

        <div className="about-bio measure">
          {site.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
