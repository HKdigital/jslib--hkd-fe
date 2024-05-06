
/* ------------------------------------------------------------------ Imports */

import Offs
  from '@hkd-base/classes/Offs.js';
import MediaQuery
  from '@hkd-fe/classes/MediaQuery.js';

import DedupValueStore
  from '@hkd-base/classes/DedupValueStore.js';

import DerivedStore
  from '@hkd-base/classes/DerivedStore.js';

/* ---------------------------------------------------------------- Internals */

const WIDTH_RANGE_SMALL = 1;
const WIDTH_RANGE_MEDIUM = 2;
const WIDTH_RANGE_LARGE = 3;
const WIDTH_RANGE_XL = 4;

const BREAKPOINTS =
  [
    0,
    600,      // 600px or less => WIDTH_RANGE_SMALL
    900,      // 900px or less => WIDTH_RANGE_MEDIUM
    1200,     // 1200px or less => WIDTH_RANGE_LARGE
    1800      // else WIDTH_RANGE_XL
  ];

const WIDTH_RANGE_LABELS =
  {
    [ WIDTH_RANGE_SMALL ]: 'small',
    [ WIDTH_RANGE_MEDIUM ]: 'medium',
    [ WIDTH_RANGE_LARGE ]: 'large',
    [ WIDTH_RANGE_XL ]: 'xl'
  };

let offs;

const screenWidthRange  = new DedupValueStore();

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

  const small = BREAKPOINTS[1];
  const medium = BREAKPOINTS[2];
  const large = BREAKPOINTS[3];

  const queriesByRange =
    [
      null,
      `screen AND (max-width: ${small}px)`,
      `screen AND (min-width: ${small}px) AND (max-width: ${medium}px)`,
      `screen AND (min-width: ${medium}px) AND (max-width: ${large}px)`,
      `screen AND (min-width: ${large}px)`
    ];

  for( let range = 1; range <= 4; range = range + 1 )
  {
    const query = queriesByRange[ range ];

    const mq = new MediaQuery( query );

    offs.register(
      mq.listen( ( MediaQueryListEvent ) =>
        {
          // console.log(
          //   WIDTH_RANGE_LABELS[ range ], ": ",
          //   query, MediaQueryListEvent.matches );

          if( MediaQueryListEvent.matches )
          {
            screenWidthRange.set( range );
          }
        } )
      );
  } // end for
}

// -----------------------------------------------------------------------------

/**
 * Automatically enable and disable media queries
 */
screenWidthRange.hasSubscribers.subscribe(
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

export { WIDTH_RANGE_SMALL,
         WIDTH_RANGE_MEDIUM,
         WIDTH_RANGE_LARGE,
         WIDTH_RANGE_XL };

export { BREAKPOINTS };

export { screenWidthRange };

// -----------------------------------------------------------------------------

/**
 * Derived store
 * - Contains the label the corresponds with the current screen size
 */
export const screenWidthRangeLabel =
  new DerivedStore( [ screenWidthRange ], ( storesMap ) =>
      {
        const value = storesMap.getValueFromStore( 0 );

        return WIDTH_RANGE_LABELS[ value ];
      } );

// -----------------------------------------------------------------------------

/**
 * Derived store
 * - Contains value true if the screen width is small of less
 */
export const screenWidthSmall =
  new DerivedStore( [ screenWidthRange ], ( storesMap ) =>
      {
        const value = storesMap.getValueFromStore( 0 );

        return (value <= WIDTH_RANGE_SMALL );
      } );

// -----------------------------------------------------------------------------

/**
 * Derived store
 * - Contains value true if the screen width is medium or less
 */
export const screenWidthSmallOrMedium =
  new DerivedStore( [ screenWidthRange ], ( storesMap ) =>
      {
        const value = storesMap.getValueFromStore( 0 );

        return (value <= WIDTH_RANGE_MEDIUM );
      } );

// -----------------------------------------------------------------------------

/**
 * Derived store
 * - Contains value true if the screen width is (large or bigger)
 */
export const screenWidthLargePlus =
  new DerivedStore( [ screenWidthRange ], ( storesMap ) =>
      {
        const value = storesMap.getValueFromStore( 0 );

        return (value >= WIDTH_RANGE_LARGE );
      } );

// -----------------------------------------------------------------------------

// export function setBreakPoints( breakPoints )
// {
// }

