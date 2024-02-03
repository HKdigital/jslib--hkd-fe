
/* ------------------------------------------------------------------ Imports */

import {
  expectNotEmptyString,
  expectNumber } from "@hkd-base/helpers/expect.js";

/* ---------------------------------------------------------------- Internals */

const DEFAULT_CANVAS_BACKGROUND_COLOR = '#FFF';
const DEFAULT_CANVAS_MIN_WIDTH = 700;
const DEFAULT_CANVAS_MIN_HEIGHT = 250;
const DEFAULT_CANVAS_MAX_WIDTH = 4096;
const DEFAULT_CANVAS_MAX_HEIGHT = 4096;

//
// Info about the original image that was drawn on the canvas
//
const canvasImageInfo = new WeakMap();

/* ------------------------------------------------------------------ Exports */

export const DEFAULT_QUALITY_JPG = 0.85;
export const DEFAULT_QUALITY_PNG = 0.92;

// -----------------------------------------------------------------------------

/**
 * Get a CANVAS element with the specified IMG drawn onto it
 *
 * @param {Image} img - Image data
 *
 * @param {object} [options] - Upload options
 *
 * @param {number} [options.orientation=1]
 *   Image orientation [1-8]. If not 1, the image will be rotated.
 *
 * @param {string} [options.backgroundColor=DEFAULT_CANVAS_BACKGROUND_COLOR]
 *   Background color to use in case the source image contains transparency
 *
 * @param {string} [options.backgroundColor=DEFAULT_CANVAS_BACKGROUND_COLOR]
 *   Background color to use in case the source image contains transparency
 *
 * @param {number} [options.canvas]
 *   An existing HTMLCanvasElement to load the image on.
 *
 *   @note that the canvas properties `width` and `height` will be set to
 *         the `width` and `height` of the image
 *
 * @param {number} [options.minWidth=DEFAULT_CANVAS_MIN_WIDTH]
 *   Minimum source image width. If the image is smaller, an exception
 *   will be thrown.
 *
 * @param {number} [options.minHeight=DEFAULT_CANVAS_MIN_HEIGHT]
 *   Minumum source image height. If the image is smaller, an exception
 *   will be thrown.
 *
 * @param {number} [options.maxWidth=DEFAULT_CANVAS_MAX_WIDTH]
 *   Maximum source image width. If the image is larger, it will be scaled
 *   to the maximum size.
 *
 * @param {number} [options.maxHeight=DEFAULT_CANVAS_MAX_HEIGHT]
 *   Maximum source image height. If the image is larger, it will be scaled
 *   to the maximum size
 *
 * --
 *
 * @throws {Error} Image too small
 *
 * --
 *
 * @returns {Canvas} canvas object
 */
export function createCanvasImage( img, options={} )
{
  if( !(img instanceof Image) &&
      !(img instanceof HTMLCanvasElement) )
  {
    throw new Error("Invalid parameter [img] (expected Image)");
  }

  const {
    orientation = 1,
    backgroundColor = DEFAULT_CANVAS_BACKGROUND_COLOR,
    minWidth = DEFAULT_CANVAS_MIN_WIDTH,
    minHeight = DEFAULT_CANVAS_MIN_HEIGHT,
    maxWidth = DEFAULT_CANVAS_MAX_WIDTH,
    maxHeight = DEFAULT_CANVAS_MAX_HEIGHT } = options;

  // -- Check canvas or create canvas element

  let canvas = options.canvas;

  if( canvas )
  {
    if( !(canvas instanceof HTMLCanvasElement) )
    {
      throw new Error(
        "Invalid parameter [options.canvas] (expected HTMLCanvasElement)");
    }
  }
  else {
    canvas = document.createElement("canvas");
  }

  const ctx = canvas.getContext("2d");

  const imgWidth = img.width;
  const imgHeight = img.height;

  // -- Check for image too small

  let err;

  if( imgWidth < minWidth )
  {
    err = new Error(
      "Invalid parameter [img] (img.width < options.minWidth)");

    err.imageTooSmall = 1;
  }

  if( imgHeight < minHeight )
  {
    err = new Error(
      "Invalid parameter [img] (img.height < options.minHeight)");

    err.imageTooSmall = 1;
  }

  if( err )
  {
    throw err;
  }

  // -- Determine scaling

  let scale = 1;

  let wScale = 1;
  let hScale = 1;

  if( imgWidth > maxWidth )
  {
    wScale = maxWidth / imgWidth;
  }

  if( imgHeight > maxHeight )
  {
    hScale = maxHeight / imgHeight;
  }

  scale = Math.min( wScale, hScale );

  const scaledWidth = Math.floor( scale * imgWidth );
  const scaledHeight = Math.floor( scale * imgHeight );

  let outputWidth;
  let outputHeight;

  //
  // Set canvas dimensions before transform & export
  //
  // @note canvas.width and canvas.height are the virtual number of pixels in
  //       the canvas. These numbers do not have to correspond with the display
  //       size of the canvas set by the style
  //
  if( 4 < orientation && orientation < 9 )
  {
    outputWidth = canvas.width = scaledHeight;
    outputHeight = canvas.height = scaledWidth;
  }
  else {
    outputWidth = canvas.width = scaledWidth;
    outputHeight = canvas.height = scaledHeight;
  }

  // -- Determine orientation

  //
  // @see
  //   https://www.daveperrett.com/articles/2012/07/28/
  //     exif-orientation-handling-is-a-ghetto/
  //
  // https://gist.github.com/nezed/d536ccdace84c6f2ef13da47a8fd6bdb
  //
  // const ORIENT_TRANSFORMS = {
  //     1: '',
  //     2: 'rotateY(180deg)',
  //     3: 'rotate(180deg)',
  //     4: 'rotate(180deg) rotateY(180deg)',
  //     5: 'rotate(270deg) rotateY(180deg)',
  //     6: 'rotate(90deg)',
  //     7: 'rotate(90deg) rotateY(180deg)',
  //     8: 'rotate(270deg)'
  // }

  //
  // transform context before drawing image
  //
  switch( orientation )
  {
    case 2:
      ctx.transform(-1, 0, 0, 1, scaledWidth, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, scaledWidth, scaledHeight );
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, scaledHeight );
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, scaledHeight, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, scaledHeight, scaledWidth);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, scaledWidth);
        break;
    default:
      break;
  }

  ctx.fillStyle = backgroundColor;

  if( 4 < orientation && orientation < 9 )
  {
    ctx.fillRect( 0, 0, outputHeight, outputWidth );
    ctx.drawImage( img, 0, 0, outputHeight, outputWidth );
  }
  else {
    ctx.fillRect( 0, 0, outputWidth, outputHeight );
    ctx.drawImage( img, 0, 0, outputWidth, outputHeight );
  }

  // -- Store original image properties in WeakMap

  canvasImageInfo.set( canvas,
    {
      canvasImageScale: scale,
      originalFileName: img.fileName,
      originalFileSize: img.fileSize,
      originalFileType: img.fileType,
    } );

  // -- Return canvas

  return canvas;
}

// -----------------------------------------------------------------------------

/**
 * Export canvas data as WebP File
 * - Uses internally stored information about the original file like
 *   - file type
 *   - file name
 *
 * @param {string} [baseFileName]
 *   The file name will be lower cased, non-alpha characters will be replaced,
 *   and a `.webp` extension will be added.
 *
 * @param {number} [quality]
 *   - Sane values are in the range [0.75 ... 0.95]
 *   - Intenally information is kept about the image File that was drawn on the
 *   canvas. If the image was JPG, the default quality is `DEFAULT_QUALITY_JPG`,
 *   otherwise the quality is `DEFAULT_QUALITY_PNG`.
 *
 * @param {number} [lastModified=Date.now()]
 *
 * @returns {ArrayBuffer} WebP image data
 */
export /* async */ function canvasToWebP( canvas, options={} )
{
  let {
    quality,
    baseFileName,
    lastModified=Date.now() } = options;

  if( undefined !== quality )
  {
    expectNumber( quality,
      "Missing or invalid parameter [quality]" );

    if( quality < 0 || quality > 1 )
    {
      throw new Error("Invalid value for parameter [quality]");
    }
  }

  // -- Get canvas scale and original File info
  //    (set if the canvas was created using `createCanvasImage()`)

  const info = canvasImageInfo.get( canvas );

  if( !quality && info )
  {
    switch( info.originalFileType )
    {
      case "image/jpeg":
        quality = DEFAULT_QUALITY_JPG;
        break;

      // case "image/png":
      // case "image/webp":
      default:
        quality = DEFAULT_QUALITY_PNG;
        break;
    }
  }

  // console.log( { info } );

  if( !baseFileName )
  {
    if( info && info.originalFileName )
    {
      baseFileName = info.originalFileName;
    }
    else {
      baseFileName = "untitled";
    }
  }
  else {
    baseFileName =
      baseFileName
        .toLowerCase()
        .replace(/[^0-9a-zA-z_-]+/g, '_');
  }

  expectNotEmptyString( baseFileName,
    "Missing or invalid parameter [baseFileName]" );

  expectNumber( lastModified,
    "Missing or invalid parameter [lastModified]" );

  // const promise = new HkPromise();

  const type = "image/webp";

  let dataUrl;

  if( undefined === quality )
  {
    dataUrl = canvas.toDataURL( type );
  }
  else {
    dataUrl = canvas.toDataURL( type, quality );
  }

  if( "data:," === dataUrl )
  {
    throw new Error("Canvas size 0 or exceeds maximum canvas size");
  }

  const from = dataUrl.indexOf(",");

  if( -1 === from )
  {
    throw new Error("Invalid output from [canvas.toDataURL()]");
  }

  const binaryString = atob( dataUrl.slice( from + 1 ) );


  const n = binaryString.length;
  const arr = new Uint8Array( n );

  // @note const arr = Uint8Array.from(...) does not work -> use for loop

  for( let j = 0; j < n; j = j + 1 )
  {
    arr[ j ] = binaryString.charCodeAt( j );
  }

  const fileName = `${baseFileName}.webp`;

  //
  // @note the first argument of `new File( ... )` is a file parts array,
  //       so wrap the ArrayBuffer data in an array first
  //
  const file =
    new File( [arr], fileName, { type: "image/webp", lastModified } );

  // console.log(
  //   {
  //     ofgFileSize: info?.originalFileSize || '?',
  //     newFileSize: file.size
  //   } );

  return file;
}
