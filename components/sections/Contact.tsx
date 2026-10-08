import { contactModel, contacts } from '@/lib/site';
import { ContactStage } from './ContactStage';

const ICONS: Record<string, string> = {
  phone: 'M6.5 3h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A15 15 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z',
  instagram:
    'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.5 6.3v.01',
  email: 'M3 6.5h18v11H3zM3 7l9 6 9-6',
  linkedin: 'M4.5 9.5v10M4.5 4.6v.01M10 19.5v-10M10 13.2c0-2 1.3-3.4 3.2-3.4S16.5 11 16.5 13v6.5',
};

/** Soft background clouds; the link clouds are the outlined ones. */
const DRIFTERS = 4;

/** The cloud is a union of puffs. The outline layer is stroked at twice the
 *  line weight and the white layer covers its inner half, which leaves one
 *  clean outline around the whole shape. */
function CloudShape({ className, outlined = true }: { className: string; outlined?: boolean }) {
  return (
    <svg className={className} viewBox="33 11 268 164" aria-hidden="true">
      {outlined && <use href="#cloud-puffs" className="cloud-outline" />}
      <use href="#cloud-puffs" className="cloud-fill" />
    </svg>
  );
}

export function Contact() {
  return (
    <section id="contact" className="slide contact" data-theme="petal">
      <svg className="cloud-defs" aria-hidden="true">
        <defs>
          <g id="cloud-puffs">
            <circle cx="80" cy="122" r="42" vectorEffect="non-scaling-stroke" />
            <circle cx="122" cy="84" r="38" vectorEffect="non-scaling-stroke" />
            <circle cx="180" cy="68" r="52" vectorEffect="non-scaling-stroke" />
            <circle cx="238" cy="90" r="34" vectorEffect="non-scaling-stroke" />
            <circle cx="260" cy="126" r="36" vectorEffect="non-scaling-stroke" />
            <ellipse cx="168" cy="136" rx="84" ry="34" vectorEffect="non-scaling-stroke" />
            <rect x="80" y="92" width="180" height="60" vectorEffect="non-scaling-stroke" />
          </g>
        </defs>
      </svg>

      <div className="contact-sky" aria-hidden="true">
        {Array.from({ length: DRIFTERS }, (_, i) => (
          <CloudShape key={i} className="contact-drifter" outlined={false} />
        ))}
      </div>

      <div className="shell contact-inner">
        <h2 className="slide-word">contact</h2>

        <div className="contact-scene">
          <ContactStage />

          <ul className="contact-clouds">
            {contacts.map((contact) => (
              <li key={contact.kind} className="contact-cloud-slot">
                <a href={contact.href} className="contact-cloud">
                  <CloudShape className="contact-cloud-shape" />
                  <span className="contact-cloud-body">
                    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                      <path
                        d={ICONS[contact.kind]}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="contact-cloud-label">{contact.label}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="contact-credit">
          3D model{' '}
          <a href={contactModel.sourceUrl} target="_blank" rel="noopener noreferrer">
            “{contactModel.title}”
          </a>{' '}
          by {contactModel.author},{' '}
          <a href={contactModel.licenseUrl} target="_blank" rel="noopener noreferrer">
            {contactModel.license}
          </a>
        </p>
      </div>
    </section>
  );
}
