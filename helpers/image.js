
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectObject,
         expectArray }
  from "@hkd-base/helpers/expect.js";

import DedupValueStore
  from "@hkd-base/classes/DedupValueStore.js";

import HkPromise
  from "@hkd-base/classes/HkPromise.js";

// import { waitForStoreValue }
//   from "@hkd-base/helpers/store.js";

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
 * Wait for all images to be preloaded
 *
 * @param {string[]} urls
 */
export async function waitForPreloadAll( urls )
{
  expectArray( urls );

  const promises = [];

  for( const url of urls )
  {
    promises.push( waitForPreload( { url } ) );
  }

  await Promise.all( promises );
}

// -----------------------------------------------------------------------------

/**
 * Wait until an image has been preloaded
 *
 * @param {object} _ *
 * @param {string} _.url
 *
 * @returns {Promise<string|Image>}
 */
export async function waitForPreload( { url } )
{
  expectNotEmptyString( url );

  // const store = preload( url );

  // await waitForStoreValue( { store, value: url, timeout } );

  // let img = loadingImages[ url ];

  let promise = new HkPromise();

  // if( !img )
  // {
  //   img =
  //     loadingImages[ url ] = new Image();

  //   img.srcStores = []; // for compatibility with `preload()`
  // }

  let img = new Image();

  if( url.startsWith("data:") )
  {
    //
    // Data url
    // => no loading needed
    //
    img.src = url;
    return img;
  }

  img.onerror = () => {
    console.log(`Image [${url}] failed to load`);

    //
    // Update url for all registered src stores
    //
    // for( const store of img.srcStores )
    // {
    //   store.set( "" ); // <= empty url
    // }

    img.onload = null;
    img.onerror = null;
    img = null;

    // delete loadingImages[ url ];

    // console.log("reject", url);
    promise.reject();
  };

  img.onload = () => {
    // console.log(`Image [${url}] loaded`);

    //
    // Update url for all registered src stores
    //
    // for( const store of img.srcStores )
    // {
    //   store.set( url );
    // }

    img.onload = null;
    img.onerror = null;

    // delete loadingImages[ url ];

    // console.log("resolve", url);
    promise.resolve();
  };

  // -- Start loading

  img.src = url;

  await promise;

  return img;
}

// -----------------------------------------------------------------------------

/**
 * Preload the image from the location specified by `src`
 * - Returns a store that contains the url of the image when the image
 *   has been preloaded
 * - An existingUrlStore can be supplied that will be used instead of a new
 *   store
 *
 * --
 *
 * @example
 *
 *   let url = "some-image.jpg";
 *
 *   let srcStore;
 *   srcStore = preloadSrcStore( url, srcStore )
 *
 *   <img src={$src} />
 *
 * --
 *
 * @param {string} url - Location to load the image from
 * @param {object} existingSrc - Existing source store
 *
 * @returns {object} url store
 */
export function preloadSrcStore( url, existingSrcStore )
{
  if( !url )
  {
    return new DedupValueStore(""); // <= "" is an empty url
  }

  expectNotEmptyString( url,
    "Missing or invalid parameter [url]" );

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

  if( url.startsWith("data:") )
  {
    //
    // Data url
    // => no loading needed
    //
    store.set( url );
    return store;
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
