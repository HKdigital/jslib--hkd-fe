
/* ------------------------------------------------------------------ Imports */

import { expectPositiveNumber, expectFunction } from "$hk/expect.js";
import { sortByKeyValue } from "$hk/array.js";

import { rethrow } from "$hk/exceptions.js";

/* ---------------------------------------------------------------- Internals */

let onLoadFunctions = [];

async function dom_content_loaded()
{
  // -- Sort onLoadFunctions based on property prio

  sortByKeyValue( onLoadFunctions, "priority", { reversed: true } );

  // -- Call all onload functions

  // console.log( "onLoadFunctions", onLoadFunctions );

  for( const { fn } of onLoadFunctions )
  {
    try {
      await fn();
    }
    catch( e )
    {
      rethrow( "Exception in [onload] callback", e );
    }
  }

  // -- Remove event listener

  window.removeEventListener('DOMContentLoaded', dom_content_loaded );
}

window.addEventListener('DOMContentLoaded', dom_content_loaded );

// -- Ensure the event listener has been remove (even if not loaded yet)

onBeforeUnload( () =>  {
  window.removeEventListener('DOMContentLoaded', dom_content_loaded );
} );

/* ------------------------------------------------------------------ Exports */

export const PRIORITY_HIGH = 100;
export const PRIORITY_NORMAL = 50;

/**
 * Register a callback that will be called when the page has been loaded
 * - The DOMContentLoaded event
 *
 * @param {function} fn - Callback function
 *
 * @param {number} [prio=PRIORITY_NORMAL]
 *   Callbacks with higher priority will be called first
 */
export function onLoad( fn, priority=PRIORITY_NORMAL )
{
  expectFunction( fn, "Invalid parameter [fn]" );

  expectPositiveNumber( priority, "Invalid parameter [priority]" );

  onLoadFunctions.push( { fn, priority } );
}

// -----------------------------------------------------------------------------

/**
 * Register a callback or multiple callbacks that will be called when the
 * `beforeunload` event is triggered on the page.
 *
 * @param {function|object}} fnOrOffs
 *   Callback function or object with (key, callback) pairs
 */
export function onBeforeUnload( fnOrOffs )
{
  // -- Checks

  if( fnOrOffs instanceof Object )
  {
    for( const key in fnOrOffs )
    {
      const fn = fnOrOffs[ key ];

      expectFunction( fn, `Invalid parameter [fnOrOffs[${key}]]` );
    }
  }
  else {
    expectFunction( fnOrOffs, "Missing or invalid parameter [fnOrOffs]" );
  }

  // -- Unload wrapper

  async function unload()
  {
    window.removeEventListener( "beforeunload", unload );

    if( fnOrOffs instanceof Object )
    {
      for( const key in fnOrOffs )
      {
        const fn = fnOrOffs[ key ];

        await fn();
      }
    }
    else {
      await fnOrOffs();
    }
  }

  // -- Register event listener

  // FIXME >>> quite difficult to get this consistent...

  // window.addEventListener( "beforeunload", unload );
  // window.addEventListener( "beforeunload", unload );
}
