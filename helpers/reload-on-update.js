
/* ------------------------------------------------------------------ Imports */

import { httpGet } from "@hkd-base/helpers/http.js";

/* ---------------------------------------------------------------- Internals */

const MIN_CHECK_INTERVAL = 10000;

let lastCheckedAt = 0;

/* ------------------------------------------------------------------ Exports */

/**
 * Enable check for updates
 */
export function enableCheckForUpdates()
{

  // console.log( 123, document.visibilityState );

  document.addEventListener("visibilitychange", () => {

    // console.log("456", document.visibilityState );

    if( "visible" === document.visibilityState )
    {
      // alert("visble");
      tryAutoUpdate();
    }
  } );


  setTimeout( () =>
    {
      tryAutoUpdate();
    },
    2000 );

  // setInterval( () =>
  //   {
  //     tryAutoUpdate();
  //   },
  //   60000 );
}

// -----------------------------------------------------------------------------

/**
 * Check if there is a new version of the script available
 * - Checks script urls in the index.html
 */
async function tryAutoUpdate( force=false )
{
  const now = Date.now();

  if( now < lastCheckedAt + MIN_CHECK_INTERVAL )
  {
    // Recently checked
    return;
  }

  lastCheckedAt = now;

  // alert("check");

  try {
    let assetSources = [];

    let origin = location.origin;

    const scripts = document.scripts;

    for( let j = 0, n = scripts.length; j < n; j = j + 1 )
    {
      const src = document.scripts[j].src;

      // console.log( src );

      if( src.startsWith( origin ) )
      {
        const uri = src.slice( origin.length + 1);

        if( uri !== "@vite/client" )
        {
          // console.log( uri );

          assetSources.push( uri );

          const index = uri.indexOf("assets/index.");

          if( index >= 0 )
          {
            window.scriptVersion = uri.slice( index + 13, index + 21 );

            console.log(`version ${window.scriptVersion}`);
          }
        }
      }
    } // end for

    // console.log( "assets", assetSources );

    if( assetSources.length || 1 === 1 )
    {
      const response =
        await httpGet(
          {
            url: new URL( "index.html", location.origin )
          } );

      const content = await response.text();

      // console.log( "On server", content );

      for( let j = 0, n = assetSources.length; j < n; j = j + 1 )
      {
        const src = assetSources[ j ];

        if( !content.includes( src ) )
        {
          console.log(
            "New version of index.html is available", { reason: src } );

          if( confirm("Update available. Reload page?") )
          {
            location.reload();
          }

        }
      }
    }
  }
  catch( e )
  {
    console.log(`Failed to check for latest index.html`, { e } );
  }
}