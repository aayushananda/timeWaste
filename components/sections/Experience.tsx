import { Img } from '@/components/ui/Img';
import { TiltCard } from '@/components/ui/TiltCard';
import { getExperience } from '@/lib/content';
import { achievements } from '@/lib/site';

/** Split boxes: name and role in the top half, image in the bottom. Courses and
 *  achievements follow as a list, so the launchpad's sixth box has a target. */
export function Experience() {
  const experience = getExperience();

  return (
    <section id="experience" className="slide experience" data-theme="petal">
      <div className="shell">
        <p className="eyebrow">where she has been</p>
        <h2 className="section-title">Work experience</h2>

        <ul className="experience-grid">
          {experience.map((item) => (
            <li key={item.slug}>
              <TiltCard className="experience-box">
                <div className="experience-head">
                  <h3>{item.place}</h3>
                  <p className="experience-role">{item.role}</p>
                  <p className="experience-period">{item.period}</p>
                  <p className="experience-summary">{item.summary}</p>
                </div>
                <Img
                  src={item.image}
                  alt=""
                  sizes="(min-width: 768px) 380px, 100vw"
                  ratio="16 / 10"
                  className="experience-photo"
                />
              </TiltCard>
            </li>
          ))}
        </ul>

        <div id="achievements" className="achievements">
          <h3 className="section-title">Courses &amp; achievements</h3>
          <ul>
            {achievements.map((item) => (
              <li key={item.title}>
                <span className="achievements-title">{item.title}</span>
                <span className="achievements-meta">
                  {item.issuer} · {item.year}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
