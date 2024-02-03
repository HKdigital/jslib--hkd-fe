/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString }
  from "@hkd-base/helpers/expect.js";

// -----------------------------------------------------------------------------

/**
 * Convert a data url to an image File object
 *
 * @param {string} _.dataUrl
 *   
 *   Format: "data:[<mediatype>][;base64],<data>"
 *   
 *   @see https://developer.mozilla.org/en-US/
 *        docs/web/http/basics_of_http/data_urls
 *   
 * @param {string} [_.baseFileName="image"]
 *
 * @returns {File} image file
 */
export async function dataUrlToImageFile(
  {
    dataUrl,
    baseFileName="image"
  } )
{
  expectNotEmptyString( dataUrl,
    "Missing or invalid parameter [dataUrl]" );

  expectNotEmptyString( baseFileName, 
    "Missing or invalid parameter [baseFileName]" );

  if( "data:," === dataUrl )
  {
    // 
    // When a data url cannot be generated from a canvas (the canavas has
    // size 0 or is too large), the string "data:," is returned.
    // 
    throw new Error("Invalid parameter [dataUrl] (missing data)");
  }

  const type = dataUrlImageType( dataUrl );

  if( !type )
  {
    throw new Error(`Missing image mime type in [dataUrl]`);
  }

  const fileExtension = type.slice(6); // remove "image/"

  const dataFrom = dataUrl.indexOf(",");

  if( -1 === dataFrom )
  {
    throw new Error("Invalid format [dataUrl] (missing data start token)");
  }

  const binaryString = atob( dataUrl.slice( dataFrom + 1 ) );

  const n = binaryString.length;
  const arr = new Uint8Array( n );

  // @note const arr = Uint8Array.from(...) does not work -> use for loop

  for( let j = 0; j < n; j = j + 1 )
  {
    arr[ j ] = binaryString.charCodeAt( j );
  }

  const fileName = `${baseFileName}.${fileExtension}`;

  const lastModified = Date.now();

  //
  // @note the first argument of `new File( ... )` is a file parts array,
  //       so wrap the ArrayBuffer data in an array first
  //
  const file =
    new File( [arr], fileName, { type, lastModified } );

  return file;
}

// -----------------------------------------------------------------------------

/**
 * Get the mime image type specified in the data url
 *
 * @param {string} dataUrl
 *
 *   e.g. data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNby
 *        blAAAADElEQVQImWNgoBMAAABpAAFEI8ARAAAAAElFTkSuQmCC
 *
 * @returns {string|null} mime type. E.g. "image/png" or "image/jpeg"
 */
export function dataUrlImageType( dataUrl )
{
  expectNotEmptyString( dataUrl,
    "Missing or invalid parameter [dataUrl]" );

  if( !dataUrl.startsWith("data:image/") )
  {
    return null;
  }

  let toType = dataUrl.indexOf(";", 11);

  if( -1 === toType )
  {
    toType = dataUrl.indexOf(",", 11);
  }

  if( -1 === toType )
  {
    return null;
  }

  return dataUrl.slice( 5,  toType );
}
