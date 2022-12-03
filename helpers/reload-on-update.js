
/* ------------------------------------------------------------------ Imports */

import { httpGet } from "@hkd-base/helpers/http.js";
import { delay } from "@hkd-base/helpers/time.js";
import { defer } from "@hkd-base/helpers/process.js";

/* ---------------------------------------------------------------- Internals */

const MIN_CHECK_INTERVAL = 10000;

const MIN_CHECK_LOOP_DELAY = 50000;

let lastCheckedAt = 0;

const ORIGIN = location.origin;
const ORIGIN_ASSETS_PREFIX = `${ORIGIN}/assets`;

let RELOAD_MESSAGE = "Update available. Reload page?";

/* ------------------------------------------------------------------ Exports */

/**
 * Enable check for updates
 *
 * @param {string} customReloadMessage
 */
export async function enableCheckForUpdates()
{
  // == Check if app becomes visible

  document.addEventListener("visibilitychange", () => {

    if( "visible" === document.visibilityState )
    {
      tryAutoUpdate();
    }
  } );

  // == Check after boot

  setTimeout( () =>
    {
      tryAutoUpdate();
    },
    2000 );

  // == Start check loop

  checkLoop();
}

// -----------------------------------------------------------------------------

/**
 * Infinite check loop
 * - Waits a variable amount of time
 * - Checks if an update is available
 */
async function checkLoop()
{
  try {
    await delay( MIN_CHECK_LOOP_DELAY, MIN_CHECK_LOOP_DELAY * 1.2 );

    if( "visible" === document.visibilityState && navigator.onLine !== false )
    {
      tryAutoUpdate();
    }
  }
  catch( e ) { console.log( e ); }

  defer( checkLoop );
}

// -----------------------------------------------------------------------------

/**
 * Check if there is a new version of the script available
 * - Checks if asset urls in the index.html have changed
 */
async function tryAutoUpdate()
{
  // console.log("tryAutoUpdate");

  const now = Date.now();

  if( now < lastCheckedAt + MIN_CHECK_INTERVAL )
  {
    // Recently checked => ignore
    return;
  }

  lastCheckedAt = now;

  try {
    // == Get list of current SCRIPT assets on the page

    let assetSources = [];

    const scripts = document.scripts;

    for( let j = 0, n = scripts.length; j < n; j = j + 1 )
    {
      const src = document.scripts[j].src;

      // console.log( src );

      if( src.startsWith( ORIGIN_ASSETS_PREFIX ) )
      {
        const path = src.slice( ORIGIN.length );

        assetSources.push( path );

        const index = path.indexOf("assets/index.");

        if( index >= 0 /*&& path.endsWith(".js")*/ )
        {
          window.scriptVersion = path.slice( index + 13, index + 21 );
          console.log(`Current site version [${window.scriptVersion}]`);
        }
      }
    } // end for

    // console.log( "assets", assetSources );

    // == Fetch latest "index.html"

    if( assetSources.length )
    {
      //
      // The page has script assets => check
      //

      const response =
        await httpGet(
          {
            // url: new URL( "index.html", location.origin )
            url: location.href
          } );

      const content = await response.text();

      for( let j = 0, n = assetSources.length; j < n; j = j + 1 )
      {
        const src = assetSources[ j ];

        if( !content.includes( src ) )
        {
          console.log(
            "New site version is available",
            { reason: src }
            /*,content*/ );

          if( confirm( RELOAD_MESSAGE ) )
          {
            location.reload();
          }
        }
      }
    }
    // else {
    //   console.log("tryAutoUpdate: skip check (no assets on page)");
    // }
  }
  catch( e )
  {
    console.log(`Failed to check for latest index.html`, { e } );
  }
}