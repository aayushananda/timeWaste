import { contacts } from '@/lib/site';
import { inlineSvg } from '@/lib/svg';

const ICONS: Record<string, string> = {
  phone: 'M6.5 3h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A15 15 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z',
  instagram:
    'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.5 6.3v.01',
  email: 'M3 6.5h18v11H3zM3 7l9 6 9-6',
  linkedin: 'M4.5 9.5v10M4.5 4.6v.01M10 19.5v-10M10 13.2c0-2 1.3-3.4 3.2-3.4S16.5 11 16.5 13v6.5',
};

export function Contact() {
  const butterfly = inlineSvg('logo/butterfly.svg');

  return (
    <section id="contact" className="slide contact" data-theme="blush">
      <div className="shell contact-inner">
        <h2 className="slide-word">contact</h2>

        <div className="contact-mark" aria-hidden="true" dangerouslySetInnerHTML={{ __html: butterfly }} />

        <ul className="contact-links">
          {contacts.map((contact) => (
            <li key={contact.kind}>
              <a href={contact.href} className="chip contact-link">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path
                    d={ICONS[contact.kind]}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{contact.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
