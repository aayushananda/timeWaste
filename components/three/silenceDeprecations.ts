import { getConsoleFunction, setConsoleFunction } from 'three';

type ConsoleFunction = (
  type: 'log' | 'warn' | 'error',
  message: string,
  ...params: unknown[]
) => void;

/** Marks our filter so a dev hot reload re-running this module recognises the
 *  filter it already installed instead of wrapping it a second time. */
type Filter = ConsoleFunction & { silencesThreeDeprecations?: true };

/** Notices about deprecated three APIs that only a dependency can act on.
 *  @react-three/fiber builds every Canvas store with `new THREE.Clock()` and
 *  three deprecated Clock in r183, so each page load logged a warning we cannot
 *  fix until fiber moves to THREE.Timer. Matched as whole messages, so an
 *  unrelated Clock or Timer warning still reaches the console. */
const SILENCED = ['THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.'];

function isStackTrace(value: unknown): value is { getError: (message: string) => Error } {
  return typeof value === 'object' && value !== null && 'isStackTrace' in value;
}

/** Drops the messages above and forwards every other three log untouched, so
 *  shader compile and lost-context errors still show up. */
function install() {
  const previous = getConsoleFunction() as Filter | null;
  if (previous?.silencesThreeDeprecations) return;

  const filter: Filter = (type, message, ...params) => {
    if (type === 'warn' && SILENCED.includes(message)) return;

    if (previous) {
      previous(type, message, ...params);
      return;
    }

    // Matches three's own console path: a stack trace in the first param turns
    // the message into an Error, which is what makes it clickable in devtools.
    const [trace] = params;
    if (isStackTrace(trace)) {
      console[type](trace.getError(message));
      return;
    }

    console[type](message, ...params);
  };

  filter.silencesThreeDeprecations = true;
  setConsoleFunction(filter);
}

install();
