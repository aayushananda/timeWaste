'use client';

import { View } from '@react-three/drei';
import { useRef, type RefObject } from 'react';
import { QuestionField } from './QuestionField';

/** Draws the question-mark field into the hero's box on the shared canvas.
 *
 *  Used outside the Canvas, drei's View renders and tracks its *own* element
 *  and discards a `track` prop, so the box has to be the View itself. */
export function HeroField({ logoRef }: { logoRef: RefObject<HTMLElement | null> }) {
  const boxRef = useRef<HTMLDivElement>(null);

  return (
    <View ref={boxRef} className="hero-field">
      <QuestionField boxRef={boxRef} logoRef={logoRef} />
    </View>
  );
}
