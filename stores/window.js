
/* ------------------------------------------------------------------ Imports */

import DedupValueStore from '@hkd-base/classes/DedupValueStore.js';

import { debounce } from '@hkd-base/helpers/function.js';

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export const windowSize =
  new DedupValueStore(
    {
      width: window.innerWidth,
      height: window.innerHeight
    } );

// -----------------------------------------------------------------------------

/**
 * Start subscribers
 * - Start after DOMContentLoaded event because running code during
 *   bootstrap leads to unwanted side effects
 */
window.addEventListener('DOMContentLoaded', () =>
  {
    const debounced = debounce( () =>
      {
        windowSize
          .set(
            {
              width: window.innerWidth,
              height: window.innerHeight
            } );
      } );

    windowSize.hasSubscribers.subscribe( ( hasSubscribers ) =>
    {
      if( hasSubscribers )
      {
        window.addEventListener( 'resize', debounced );
      }
      else {
        window.removeEventListener( 'resize', debounced );
      }
    } );
  } );