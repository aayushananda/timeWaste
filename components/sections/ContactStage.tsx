'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const ContactModel = dynamic(
  () => import('@/components/three/ContactModel').then((m) => m.ContactModel),
  { ssr: false },
);

/** The model is a megabyte at the very end of the page, so it is fetched only
 *  once the visitor scrolls within a screen of it. */
export function ContactStage() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: '100% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="contact-model" aria-hidden="true">
      {near && <ContactModel />}
    </div>
  );
}
