
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString } from "@hkd-base/helpers/expect.js";

import Offs from "@hkd-base/classes/Offs.js";
import MediaQuery from "@hkd-fe/classes/MediaQuery.js";

import DedupValueStore from "@hkd-base/classes/DedupValueStore.js";
import DerivedStore from "@hkd-base/classes/DerivedStore.js";

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

    let query = "screen AND ";

    if( previousWidth )
    {
      query += `(min-width: ${previousWidth}) AND `;
    }

    query += `(max-width: ${width})`;

    // console.log( query );

    previousWidth = width;

    const mq = new MediaQuery( query );

    offs.register(
      mq.listen( ( MediaQueryListEvent ) =>
        {
          // if( MediaQueryListEvent.matches )
          // {
          //   console.log( "MATCHES",
          //     MediaQueryListEvent,
          //     MediaQueryListEvent.matches,
          //     {
          //       innerWidth: window.innerWidth,
          //       innerHeight: window.innerHeight,
          //       devicePixelRatio: window.devicePixelRatio
          //     } );
          // }

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

// -----------------------------------------------------------------------------

// let unsubscribeScreenWidthSmall;

// screenWidthSmall.hasSubscribers.subscribe(
//   ( hasSubscribers ) =>
//     {
//       if( hasSubscribers )
//       {
//         unsubscribeScreenWidthSmall =
//           screenWidthSize.subscribe( ( value ) =>
//             {
//               if( value <= SCREEN_WIDTH_SMALL )
//               {
//                 screenWidthSmall.set( true );
//               }
//               else {
//                 screenWidthSmall.set( false );
//               }
//             } );
//       }
//       else if( unsubscribeScreenWidthSmall )
//       {
//         unsubscribeScreenWidthSmall();
//         unsubscribeScreenWidthSmall = null;
//       }
//     } );

/* ------------------------------------------------------------------ Exports */

export { SCREEN_WIDTH_SMALL,
         SCREEN_WIDTH_MEDIUM,
         SCREEN_WIDTH_LARGE,
         SCREEN_WIDTH_EXTRA_LARGE };

export { screenWidthSize };

// -----------------------------------------------------------------------------

/**
 * Derived store
 * - Contains value true if the screen width is small
 */
export let screenWidthSmall =
  new DerivedStore( [ screenWidthSize ], ( storesMap ) =>
      {
        const value = storesMap.getValueFromStore( 0 );

        return (value <= SCREEN_WIDTH_SMALL );
      } );

// -----------------------------------------------------------------------------

/**
 * Derived store
 * - Contains value true if the screen width is small
 */
export let screenWidthSmallOrMedium =
  new DerivedStore( [ screenWidthSize ], ( storesMap ) =>
      {
        const value = storesMap.getValueFromStore( 0 );

        return (value <= SCREEN_WIDTH_MEDIUM );
      } );

// -----------------------------------------------------------------------------

// export function setBreakPoints( breakPoints )
// {
// }

