
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString } from "@hkd-base/helpers/expect.js";

import Offs from "@hkd-base/classes/Offs.js";
import MediaQuery from "@hkd-fe/classes/MediaQuery.js";

import DedupValueStore from "@hkd-base/classes/DedupValueStore.js";

/* ---------------------------------------------------------------- Internals */

const SCREEN_WIDTH_SMALL = 1;
const SCREEN_WIDTH_MEDIUM = 2;
const SCREEN_WIDTH_LARGE = 3;
const SCREEN_WIDTH_EXTRA_LARGE = 4;

let breakPoints =
  {
    [ SCREEN_WIDTH_SMALL ]: "576px",
    [ SCREEN_WIDTH_MEDIUM ]: "768px",
    [ SCREEN_WIDTH_LARGE ]: "992px",
    [ SCREEN_WIDTH_EXTRA_LARGE ]: "1200px"
  };

let offs;
let screenWidthSize  = new DedupValueStore();

// -----------------------------------------------------------------------------

/**
 * Disable media queries
 */
function disableMediaQueries()
{
  if( offs )
  {
    offs.unsubscribeAll();
  }

  offs = null;
}

// -----------------------------------------------------------------------------

/**
 * Enable media queries
 */
function enableMediaQueries()
{
  disableMediaQueries();

  offs = new Offs();

  let previousWidth;

  for( const label in breakPoints )
  {
    const width = breakPoints[ label ];

    expectNotEmptyString( width, "Invalid breakpoint width" );

    let query;

    if( previousWidth )
    {
      query = `(min-width: ${previousWidth}) AND `;
    }
    else {
      query = "";
    }

    query += `(max-width: ${width})`;

    // console.log( query );

    previousWidth = width;

    const mq = new MediaQuery( query );

    offs.register(
      mq.listen( ( MediaQueryListEvent ) =>
        {
          if( MediaQueryListEvent.matches )
          {
            screenWidthSize.set( label );
          }
        } )
      );

  } // end for
}

// -----------------------------------------------------------------------------

/**
 * Automatically enable and disable media queries
 */
screenWidthSize.hasSubscribers.subscribe(
  ( hasSubscribers ) =>
    {
      if( hasSubscribers )
      {
        enableMediaQueries();
      }
      else {
        disableMediaQueries();
      }
    } );

/* ------------------------------------------------------------------ Exports */

export { SCREEN_WIDTH_SMALL,
         SCREEN_WIDTH_MEDIUM,
         SCREEN_WIDTH_LARGE,
         SCREEN_WIDTH_EXTRA_LARGE };

export { screenWidthSize };

// -----------------------------------------------------------------------------

// export function setBreakPoints( breakPoints )
// {
// }

