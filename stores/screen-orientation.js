
/* ------------------------------------------------------------------ Imports */

import { ValueStore, DedupValueStore } from "@hkd-base/stores.js";

import MediaQuery from "@hkd-fe/classes/MediaQuery.js";

/* ------------------------------------------------------------------ Exports */

export const orientationIsLandscape = new DedupValueStore();
export const userChangedOrientation = new ValueStore();

export const isLandscapeOnMobile = new DedupValueStore();

const looksLikeMobileDevice =
    ( ("orientation" in window) && navigator.maxTouchPoints > 0 );
     /* && window.screenX !== 0 */

/* ---------------------------------------------------------------- Internals */

/**
 * Update value of store `orientationIsLandscape`
 * - Set to true if `window.innerWidth > window.innerHeight`,
 *   false otherwise
 */
function updateOrientationIsLandscape()
{
  const store = orientationIsLandscape;

  const currentValue = store.get();

  if( window.innerWidth > window.innerHeight )
  {
    store.set( true );
  }
  else {
    store.set( false );
  }

  if( currentValue !== undefined && currentValue !== store.get() )
  {
    // @note Orientation changed will not fire on initial orientation detection
    // console.log("userChangedOrientation", { currentValue } );
    userChangedOrientation.set( true );
  }
}

// -----------------------------------------------------------------------------

/**
 * Start detection on DOMContentLoaded
 * - running code during bootstrap leads to unwanted side effects
 */
window.addEventListener('DOMContentLoaded', () =>
{
  updateOrientationIsLandscape();

  // -- Use media query to detect if the screen orientation changes

  const query = "(orientation: landscape)";

  const mq = new MediaQuery( query );

  // const htmlClassList = document.documentElement.classList;

  // off =
    mq.listen( ( MediaQueryListEvent ) =>
      {
        // console.log( {
        //     "screenX": window.screenX,
        //     "window.orientation?": ("orientation" in window),
        //     "window.ontouchstart?": ('ontouchstart' in window),
        //     "window.DocumentTouch?": window.DocumentTouch,
        //     "navigator.maxTouchPoints": navigator.maxTouchPoints
        //   } );

        updateOrientationIsLandscape();

        if( !looksLikeMobileDevice )
        {
          isLandscapeOnMobile.set( false );
          return;
        }

        if( MediaQueryListEvent.matches )
        {
          isLandscapeOnMobile.set( true );
        }
        else {
          isLandscapeOnMobile.set( false );
        }
      } );
} );
