import { Img } from '@/components/ui/Img';
import { getRoles } from '@/lib/content';

/** No card containers here: images sit in viewfinder frames with text below. */
export function Roles() {
  const roles = getRoles();

  return (
    <section id="roles" className="slide roles" data-theme="nude">
      <div className="shell">
        <p className="eyebrow">right now</p>
        <h2 className="section-title">Current roles</h2>

        <ul className="roles-grid">
          {roles.map((role) => (
            <li key={role.slug}>
              <div className="viewfinder roles-frame">
                <Img
                  src={role.image}
                  alt=""
                  sizes="(min-width: 768px) 360px, 100vw"
                  ratio="4 / 5"
                  className="photo"
                />
                <span className="viewfinder-foot" />
              </div>
              <h3 className="roles-title">{role.title}</h3>
              <p className="roles-org">{role.organisation}</p>
              <p className="roles-desc">{role.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
