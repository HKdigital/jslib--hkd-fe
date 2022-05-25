
/* ------------------------------------------------------------------ Imports */

import { DedupValueStore } from "@hkd-base/stores.js";
import { debounce } from "@hkd-base/helpers/flow.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export const windowSize = new DedupValueStore();

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
        window.addEventListener( "resize", debounced );
      }
      else {
        window.removeEventListener( "resize", debounced );
      }
    } );
  } );