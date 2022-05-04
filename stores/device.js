
/* ------------------------------------------------------------------ Imports */

import { DedupValueStore } from "@hkd-base/stores.js";

import MediaQuery from "@hkd-fe/classes/MediaQuery.js";

// import { getCssVarValue } from "@hkd-fe/css.js";

import { BLOCK_MIN_WIDTH } from "$theme/all-constants.js";

/* ------------------------------------------------------------------ Exports */

export const deviceWidthInBlocks = new DedupValueStore( false );

export const windowInnerHeight = new DedupValueStore( window.innerHeight );

/**
 * Start detection on DOMContentLoaded
 * - running code during bootstrap leads to unwanted side effects
 */
window.addEventListener('DOMContentLoaded', () =>
{
  // console.log("DOMContentLoaded");

  // const minBlockWidth = getCssVarValue( "--layout-block-min-width" );

  // console.log( { minBlockWidth } );

  //
  // Query that fires when the device is at least min 2 blocks width
  //
  const query = `(min-width: calc(${BLOCK_MIN_WIDTH} * 2) )`;

  let mq;

  deviceWidthInBlocks.hasSubscribers.subscribe( ( hasSubscribers ) =>
  {
    // console.log("SUBSCRIBED", hasSubscribers );

    if( hasSubscribers )
    {
      mq = new MediaQuery( query );

      mq.listen( ( MediaQueryListEvent ) =>
        {
          if( MediaQueryListEvent.matches )
          {
            // console.log("Device width: 2 blocks");
            deviceWidthInBlocks.set( 2 );
          }
          else {
            // console.log("Device width: 1 block");
            deviceWidthInBlocks.set( 1 );
          }
        } );
    }
    else if( mq )
    {
      mq.unsubscribeAll();
      mq = null;
    }
  } );

  let resizeOff;
  let delayedInnerHeightTimer;

  function updateWindowInnerHeight()
  {
    console.log("updateWindowInnerHeight");

    if( window.innerHeight <= window.outerHeight &&
        window.innerWidth <= window.outerWidth )
    {
      // innerHeight or innerWidth not quircky (iOS)
      windowInnerHeight.set( window.innerHeight );
    }
    else {
      console.log("delayed update");
      clearTimeout( delayedInnerHeightTimer );
      delayedInnerHeightTimer = setTimeout( updateWindowInnerHeight, 400 );
    }
  }

  windowInnerHeight.hasSubscribers.subscribe( ( hasSubscribers ) =>
    {
      if( hasSubscribers )
      {
        window.addEventListener( "resize", updateWindowInnerHeight );

        resizeOff = () =>
        {
          window.removeEventListener( "resize", updateWindowInnerHeight );
        };
      }
      else {
        if( resizeOff )
        {
          resizeOff();
          resizeOff = null;
        }

      }
    } );

  // {
  //   const query = "(orientation: portrait)";

  //   const mq = new MediaQuery( query );

  //   mq.listen( ( MediaQueryListEvent ) =>
  //     {
  //       if( MediaQueryListEvent.matches )
  //       {
  //         console.log("portrait",
  //           {
  //             innerHeight: window.innerHeight,
  //             outerHeight: window.outerHeight
  //           } );
  //       }
  //       else {
  //         console.log("no portrait",
  //           {
  //             innerHeight: window.innerHeight,
  //             outerHeight: window.outerHeight
  //           });
  //       }
  //     } );
  // }

} );



