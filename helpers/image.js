
/* ------------------------------------------------------------------ Imports */

import { expectObject } from "@hkd-base/helpers/expect.js";

import DedupValueStore from "@hkd-base/classes/DedupValueStore.js";

// import MemoryCache from "@hkd-base/classes/MemoryCache.js";
// const cache = new MemoryCache();

/* ---------------------------------------------------------------- Internals */

//
// Images that are currently loading
//
let loadingImages = {};

// import { getModuleLogger }
//   from "@hkd-base/helpers/log.js";

// const log = getModuleLogger( "image-helper" );

/* ------------------------------------------------------------------ Exports */

/**
 * Preload the image from the location specified by `src`
 * - Returns a store that contains the url of the image when the image
 *   has been preloaded
 * - An existingUrlStore can be supplied that will be used instead of a new
 *   store
 *
 * --
 * @example
 *
 * let url = "some-image.jpg";
 *
 * let src;
 * src = preload( url, src )
 *
 * <img src={$src} />
 *
 * --
 *
 * @param {string} url - Location to load the image from
 * @param {object} existingSrc - Existing source store
 *
 * @returns {object} url store
 */
export function preload( url, existingSrcStore )
{
  let store;

  if( existingSrcStore )
  {
    expectObject( existingSrcStore,
      "Invalid value for property [existingSrcStore]" );

    let currentUrl = existingSrcStore.get();

    if( url === currentUrl )
    {
      //
      // Image has already been loaded
      //
      return existingSrcStore;
    }

    store = existingSrcStore;
  }
  else {
    store = new DedupValueStore("");
  }

  let img = loadingImages[ url ];

  if( img )
  {
    //
    // image with the specified url is already loading
    // => register store instance so it gets updated when the image has been
    //    loaded
    //
    img.srcStores.push( store );
  }
  else {
    img = new Image();
    img.srcStores = [ store ];
  }

  img.onerror = () => {
    console.log(`Image [${url}] failed to load`);

    //
    // Update url for all registered src stores
    //
    for( const store of img.srcStores )
    {
      store.set( "" ); // <= empty url
    }

    img = null;
    delete loadingImages[ url ];
  };

  img.onload = () => {
    // console.log(`Image [${url}] loaded`);

    //
    // Update url for all registered src stores
    //
    for( const store of img.srcStores )
    {
      store.set( url );
    }

    img = null;
    delete loadingImages[ url ];
  };

  // -- Start loading

  img.src = url;

  // -- Return source store

  return store;
}
