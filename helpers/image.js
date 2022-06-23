
// -----------------------------------------------------------------------------
// Imports

  import {
    expectString,
    expectNotEmptyString,
    expectNumber,
    expectObject,
    expectArrayBuffer } from "@hkd-base/helpers/expect.js";

  import { HkPromise, doNothing } from "@hkd-base/helpers/promises.js";

// -----------------------------------------------------------------------------
// Constants

// The Exif tag structure is borrowed from TIFF files.
// When Exif is employed for JPEG files, the Exif data are stored in one
// of JPEG's defined utility Application Segments, the APP1 (segment
// marker 0xFFE1), which in effect holds an entire TIFF file within.
//
// The TIFF Private Tag 0x8769 defines a sub-Image File Directory (IFD)
// that holds the Exif specified TIFF Tags
//
// Exif also defines a Global Positioning System sub-IFD using the TIFF
// Private Tag 0x8825, holding location information
//
// @see https://en.wikipedia.org/wiki/Exif

// const exifTagsByCode =
//   HkMediaHelper.exifTagsByCode = {
//
//     // version tags
//     0x9000 : "ExifVersion",             // EXIF version
//     0xA000 : "FlashpixVersion",         // Flashpix format version
//
//     // colorspace tags
//     0xA001 : "ColorSpace",              // Color space information tag
//
//     // image configuration
//     0xA002 : "PixelXDimension",         // Valid width of meaningful image
//     0xA003 : "PixelYDimension",         // Valid height of meaningful image
//     0x9101 : "ComponentsConfiguration", // Information about channels
//     0x9102 : "CompressedBitsPerPixel",  // Compressed bits per pixel
//
//     // user information
//     0x927C : "MakerNote",               // Any desired information written by the manufacturer
//     0x9286 : "UserComment",             // Comments by user
//
//     // related file
//     0xA004 : "RelatedSoundFile",        // Name of related sound file
//
//     // date and time
//     0x9003 : "DateTimeOriginal",        // Date and time when the original image was generated
//     0x9004 : "DateTimeDigitized",       // Date and time when the image was stored digitally
//     0x9290 : "SubsecTime",              // Fractions of seconds for DateTime
//     0x9291 : "SubsecTimeOriginal",      // Fractions of seconds for DateTimeOriginal
//     0x9292 : "SubsecTimeDigitized",     // Fractions of seconds for DateTimeDigitized
//
//     // picture-taking conditions
//     0x829A : "ExposureTime",            // Exposure time (in seconds)
//     0x829D : "FNumber",                 // F number
//     0x8822 : "ExposureProgram",         // Exposure program
//     0x8824 : "SpectralSensitivity",     // Spectral sensitivity
//     0x8827 : "ISOSpeedRatings",         // ISO speed rating
//     0x8828 : "OECF",                    // Optoelectric conversion factor
//     0x9201 : "ShutterSpeedValue",       // Shutter speed
//     0x9202 : "ApertureValue",           // Lens aperture
//     0x9203 : "BrightnessValue",         // Value of brightness
//     0x9204 : "ExposureBias",            // Exposure bias
//     0x9205 : "MaxApertureValue",        // Smallest F number of lens
//     0x9206 : "SubjectDistance",         // Distance to subject in meters
//     0x9207 : "MeteringMode",            // Metering mode
//     0x9208 : "LightSource",             // Kind of light source
//     0x9209 : "Flash",                   // Flash status
//     0x9214 : "SubjectArea",             // Location and area of main subject
//     0x920A : "FocalLength",             // Focal length of the lens in mm
//     0xA20B : "FlashEnergy",             // Strobe energy in BCPS
//     0xA20C : "SpatialFrequencyResponse",    //
//     0xA20E : "FocalPlaneXResolution",   // Number of pixels in width direction per FocalPlaneResolutionUnit
//     0xA20F : "FocalPlaneYResolution",   // Number of pixels in height direction per FocalPlaneResolutionUnit
//     0xA210 : "FocalPlaneResolutionUnit",    // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
//     0xA214 : "SubjectLocation",         // Location of subject in image
//     0xA215 : "ExposureIndex",           // Exposure index selected on camera
//     0xA217 : "SensingMethod",           // Image sensor type
//     0xA300 : "FileSource",              // Image source (3 == DSC)
//     0xA301 : "SceneType",               // Scene type (1 == directly photographed)
//     0xA302 : "CFAPattern",              // Color filter array geometric pattern
//     0xA401 : "CustomRendered",          // Special processing
//     0xA402 : "ExposureMode",            // Exposure mode
//     0xA403 : "WhiteBalance",            // 1 = auto white balance, 2 = manual
//     0xA404 : "DigitalZoomRation",       // Digital zoom ratio
//     0xA405 : "FocalLengthIn35mmFilm",   // Equivalent foacl length assuming 35mm film camera (in mm)
//     0xA406 : "SceneCaptureType",        // Type of scene
//     0xA407 : "GainControl",             // Degree of overall image gain adjustment
//     0xA408 : "Contrast",                // Direction of contrast processing applied by camera
//     0xA409 : "Saturation",              // Direction of saturation processing applied by camera
//     0xA40A : "Sharpness",               // Direction of sharpness processing applied by camera
//     0xA40B : "DeviceSettingDescription",    //
//     0xA40C : "SubjectDistanceRange",    // Distance to subject
//
//     // other tags
//     0xA005 : "InteroperabilityIFDPointer",
//     0xA420 : "ImageUniqueID"            // Identifier assigned uniquely to each image
// };

// @note not very interesting properties commented on purpose
// @see awaresystems.be/imaging/tiff/tifftags/search.html
// @see http://www.opanda.com/en/pe/help/gps.html

const tiffTagsByCode = {
    0x0100 : "ImageWidth",
    0x0101 : "ImageHeight",
    0x8769 : "ExifIFDPointer",
    0x8825 : "GPSInfoIFDPointer",
    // 0xA005 : "InteroperabilityIFDPointer",
    // 0x0102 : "BitsPerSample",
    0x0103 : "Compression",
    // 0x0106 : "PhotometricInterpretation",
    0x0112 : "Orientation",
    // 0x0115 : "SamplesPerPixel",
    // 0x011C : "PlanarConfiguration",
    // 0x0212 : "YCbCrSubSampling",
    // 0x0213 : "YCbCrPositioning",
    // 0x011A : "XResolution",
    // 0x011B : "YResolution",
    // 0x0128 : "ResolutionUnit",
    // 0x0111 : "StripOffsets",
    // 0x0116 : "RowsPerStrip",
    // 0x0117 : "StripByteCounts",
    // 0x0201 : "JPEGInterchangeFormat",
    // 0x0202 : "JPEGInterchangeFormatLength",
    // 0x012D : "TransferFunction",
    // 0x013E : "WhitePoint",
    // 0x013F : "PrimaryChromaticities",
    // 0x0211 : "YCbCrCoefficients",
    // 0x0214 : "ReferenceBlackWhite",
    0x0132 : "DateTime",
    0x010E : "ImageDescription",
    0x010F : "Make",
    0x0110 : "Model",
    0x0131 : "Software",
    0x013B : "Artist",
    0x8298 : "Copyright"
};

// @note date and time already taken from TIFF data

const gpsTagsByCode = {
    0x0000 : "GPSVersionID",
    0x0001 : "GPSLatitudeRef",
    0x0002 : "GPSLatitude",
    0x0003 : "GPSLongitudeRef",
    0x0004 : "GPSLongitude",
    0x0005 : "GPSAltitudeRef",
    0x0006 : "GPSAltitude",
    // 0x0007 : "GPSTimeStamp",
    0x0008 : "GPSSatellites",
    0x0009 : "GPSStatus",
    0x000A : "GPSMeasureMode",
    0x000B : "GPSDOP",
    0x000C : "GPSSpeedRef",
    0x000D : "GPSSpeed",
    0x000E : "GPSTrackRef",
    0x000F : "GPSTrack",
    0x0010 : "GPSImgDirectionRef",
    0x0011 : "GPSImgDirection",
    0x0012 : "GPSMapDatum",
    0x0013 : "GPSDestLatitudeRef",
    0x0014 : "GPSDestLatitude",
    0x0015 : "GPSDestLongitudeRef",
    0x0016 : "GPSDestLongitude",
    0x0017 : "GPSDestBearingRef",
    0x0018 : "GPSDestBearing",
    0x0019 : "GPSDestDistanceRef",
    0x001A : "GPSDestDistance",
    0x001B : "GPSProcessingMethod",
    0x001C : "GPSAreaInformation",
    // 0x001D : "GPSDateStamp",
    0x001E : "GPSDifferential"
};

const DEFAULT_CANVAS_BACKGROUND_COLOR = '#FFF';
const DEFAULT_CANVAS_MIN_WIDTH = 700;
const DEFAULT_CANVAS_MIN_HEIGHT = 250;
const DEFAULT_CANVAS_MAX_WIDTH = 4096;
const DEFAULT_CANVAS_MAX_HEIGHT = 4096;

// -----------------------------------------------------------------------------
// Info about the original image that was drawn on the canvas

const canvasImageInfo = new WeakMap();

// -----------------------------------------------------------------------------
// Exports

export const DEFAULT_QUALITY_JPG = 0.85;
export const DEFAULT_QUALITY_PNG = 0.92;

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

/**
 * Create an Image object from an image File object
 *
 * @note No EXIF orientation is taken into account (in case of JPG)
 *
 * @param {string|File} urlOrImageFile
 *   Url of the image or Image file to load
 *
 * @returns {Image} Image object
 */
export /*async*/ function loadImage( urlOrImageFile )
{
  let url;
  let tryRevokeObjectUrlFn;

  const img = new Image();

  if( urlOrImageFile instanceof File )
  {
    url = URL.createObjectURL( urlOrImageFile );

    // Store information about the file as properties of the image object

    if( urlOrImageFile.name )
    {
      img.fileName = urlOrImageFile.name;
    }

    if( urlOrImageFile.size )
    {
      img.fileSize = urlOrImageFile.size;
    }

    if( urlOrImageFile.type )
    {
      img.fileType = urlOrImageFile.type;
    }

    // urlOrImageFile

    tryRevokeObjectUrlFn = () => { URL.revokeObjectURL( url ); };
  }
  else if( typeof urlOrImageFile === "string" )
  {
    url = urlOrImageFile;
    tryRevokeObjectUrlFn = doNothing;
  }
  else {
    throw new Error(
      "Invalid parameter [urlOrImageFile] (expected url or image File)");
  }

  const promise = new HkPromise();

  img.crossOrigin = "Anonymous";

  img.addEventListener( "load",
    () => {
      tryRevokeObjectUrlFn();

      const imgWidth = img.width;
      const imgHeight = img.height;

      if( 0 === imgWidth || 0 === imgHeight )
      {
        promise.reject( new Error("Image width or height is 0") );
        return;
      }

      promise.resolve( img );
    } );

  img.addEventListener( "error",
    ( e ) => {
      tryRevokeObjectUrlFn();

      promise.reject( e );
    } );

  img.src = url;

  return promise;
}

/**
 * Get meta data tags from the jpgFile object
 * - Uses EXIF data embedded in the image
 *
 * @param {file} jpgFile
 *
 * @returns {object} meta data tags
 */
export /* async */ function getMetaDataFromJpgFile( jpgFile )
{
  if( !(jpgFile instanceof File) )
  {
    throw new Error("Invalid parameter [jpgFile] (expected File object)");
  }

  const promise = new HkPromise();

  const reader = new FileReader();

  reader.addEventListener( "error", promise.reject );

  reader.addEventListener( "load",
    () => {
      const exifTags = readExifTags( reader.result );

      if( exifTags )
      {
        const metaTags = convertExifToMetaTags( exifTags );

        promise.resolve( metaTags );
      }
      else {
        promise.resolve( {} );
      }
    } );

    // Limit reading data to 64k, EXIF header should be there
    reader.readAsArrayBuffer( jpgFile.slice( 0, 64 * 1024 ) );

    return promise;
}

/**
 * Read EXIF tags from image data
 *
 * @note use getMetaDataFromJpgFile( jpgFile ) to process a File object
 *
 * @param {ArrayBuffer} buffer
 *
 * @returns {object|null} EXIF data or null if not found
 */
export function readExifTags( buffer )
{
  expectArrayBuffer( buffer, "Missing or invalid parameter [buffer]" );

  const offset = _findExifDataOffset( buffer );

  if( offset < 0 )
  {
    return null;
  }

  // First four bytes should be (ASCII) "Exif"

  if( "Exif" !== _readAsciiStringFromBuffer( buffer, offset, 4 ) )
  {
    // Invalid EXIF data
    return null;
  }

  const dataView = new DataView( buffer );

  // -- Define tiff data offset

  let tiffOffset = offset + 6;

  // --- Detect first IDF offset

  let useBigEndianness = false; // little endianness (e.g. intel)

  // Test for TIFF validity detect endianness
  if( 0x4949 === dataView.getUint16( tiffOffset ) )
  {
      useBigEndianness = false;
  }
  else if( 0x4D4D === dataView.getUint16( tiffOffset ) )
  {
      useBigEndianness = true;
  }
  else {
    // Invalid TIFF data (EXIF is based on TIFF)
    return null;
  }

  if( 0x002A !== dataView.getUint16( tiffOffset + 2, !useBigEndianness ) )
  {
    // Invalid TIFF data (EXIF is based on TIFF)
    return null;
  }

  const firstIFDOffset =
    dataView.getUint32( tiffOffset + 4, !useBigEndianness );

  if( firstIFDOffset < 8 )
  {
    // Invalid TIFF data (EXIF is based on TIFF)
    return null;
  }

  // hk.debug(
  //   {
  //     tiffOffset,
  //     firstIFDOffset
  //   } );

  const tags =
    _readTags(
      {
        buffer,
        tiffOffset,
        dirOffset: tiffOffset + firstIFDOffset,
        tagsByCode: tiffTagsByCode,
        useBigEndianness
      } );


  // -- Get EXIF information

  //
  // TODO? (no use cases yet)
  //
  // if (tags.ExifIFDPointer) {
  //     exifData = readTags(file, tiffOffset, tiffOffset + tags.ExifIFDPointer, ExifTags, bigEnd);
  //     for (tag in exifData) {
  //         switch (tag) {
  //             case "LightSource" :
  //             case "Flash" :
  //             case "MeteringMode" :
  //             case "ExposureProgram" :
  //             case "SensingMethod" :
  //             case "SceneCaptureType" :
  //             case "SceneType" :
  //             case "CustomRendered" :
  //             case "WhiteBalance" :
  //             case "GainControl" :
  //             case "Contrast" :
  //             case "Saturation" :
  //             case "Sharpness" :
  //             case "SubjectDistanceRange" :
  //             case "FileSource" :
  //                 exifData[tag] = StringValues[tag][exifData[tag]];
  //                 break;
  //
  //             case "ExifVersion" :
  //             case "FlashpixVersion" :
  //                 exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[tag][3]);
  //                 break;
  //
  //             case "ComponentsConfiguration" :
  //                 exifData[tag] =
  //                     StringValues.Components[exifData[tag][0]] +
  //                     StringValues.Components[exifData[tag][1]] +
  //                     StringValues.Components[exifData[tag][2]] +
  //                     StringValues.Components[exifData[tag][3]];
  //                 break;
  //         }
  //         tags[tag] = exifData[tag];
  //     }
  // }

  // -- Get GPS information

  if( tags.GPSInfoIFDPointer )
  {
    const gpsData =
      _readTags( {
          buffer,
          tiffOffset,
          dirOffset: tiffOffset + tags.GPSInfoIFDPointer,
          tagsByCode: gpsTagsByCode,
          useBigEndianness
        } );

    for( const tag in gpsData )
    {
      const value = gpsData[ tag ];

      if( "GPSVersionID" === tag )
      {
        tags[ tag ] =
          value[0] +
          "." + value[1] +
          "." + value[2] +
          "." + value[3];
      }
      else {
        tags[ tag ] = gpsData[ tag ];
      }
    }
  }

  // TODO: thumbnail?
  // tags['thumbnail'] = readThumbnailImage(file, tiffOffset, firstIFDOffset, bigEnd);

  // hk.debug( "tags", tags );

  return tags;
}

/**
 * Convert EXIT tags to `meta` tags
 * - Meta tags are a normalized representation of EXIF tags
 * - Unhandy data like speed in Miles or the date time format in EXIF date
 *   are normalized
 * - Drops "uninteresting" or "unknown" data
 *
 * @see GPS tag info:
 *   https://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/GPS.html
 *
 * @param {object} exifTags
 *
 * @returns {object} an object that contains `meta tags`
 */
export function convertExifToMetaTags( exifTags )
{
  expectObject( exifTags, "Missing or invalid parameter [exifTags]" );

  // -- Create empty normalizedTags

  const normalizedTags = {};

  // -- Delete uninteresting properties

  // -- Normalized known tags

  {
    const key = "Orientation";
    const value = exifTags[ key ];

    if( value !== undefined )
    {
      delete normalizedTags[ key ];
      normalizedTags.orientation = 0 + value;
    }
  }

  {
    const key = "DateTime";
    const value = exifTags[ key ];

    if( value !== undefined )
    {
      delete normalizedTags[ key ];
      normalizedTags.dateTime = _parseExifDateTime( value );
    }
  }

  {
    const key = "Make";
    const value = exifTags[ key ];

    if( value !== undefined )
    {
      delete normalizedTags[ key ];
      normalizedTags.manufacturer = "" + value;
    }
  }

  {
    const key = "Model";
    const value = exifTags[ key ];

    if( value !== undefined )
    {
      delete normalizedTags[ key ];
      normalizedTags.model = "" + value;
    }
  }

  {
    const key = "Software";
    const value = exifTags[ key ];

    if( value !== undefined )
    {
      delete normalizedTags[ key ];
      normalizedTags.softwareVersion = "" + value;
    }
  }
  {
    // @note speed will be stored in KM/H

    const key = "GPSSpeed";
    const value = exifTags[ key ];

    if( value !== undefined )
    {
      switch( exifTags["GPSSpeedRef"] || "K" )
      {
        case "K": // Kilometers per hour
          normalizedTags.speed = 0 + value;
          break;

        case "M": // Miles per hour
          normalizedTags.speed = 0 + value * 1.609344;
          break;

        case "N": // Knots
          normalizedTags.speed = 0 + value * 1.852001;
          break;
      }

      delete normalizedTags["GPSSpeed"];
      delete normalizedTags["GPSSpeedRef"];
    }
  }

  {
    const key = "GPSImgDirection";
    const value = exifTags[ key ];

    if( value !== undefined )
    {
      const ref = exifTags["GPSImgDirectionRef"] || "T";
      normalizedTags.direction = value.toFixed(4) + ref;

      delete normalizedTags["GPSImgDirection"];
      delete normalizedTags["GPSImgDirectionRef"];
    }
  }

  {
    const key = "GPSDestBearing";
    const value = exifTags[ key ];

    if( value !== undefined )
    {
      const ref = exifTags["GPSDestBearingRef"] || "T";
      normalizedTags.bearing = value.toFixed(4) + ref;

      delete normalizedTags["GPSDestBearing"];
      delete normalizedTags["GPSDestBearingRef"];
    }
  }

  {
    const key = "GPSAltitude";
    const value = exifTags[ key ];

    if( value !== undefined )
    {
      delete normalizedTags[ key ];

      const denominator = value.denominator;

      let altitude = 0;

      if( denominator )
      {
        altitude = value.numerator / denominator;
      }

      const sign = exifTags["GPSAltitudeRef"] || 0;

      if( 0 !== altitude &&
         (1 === sign || "-" === "sign") )
      {
        // 1 or "-" means Below Sea Level -> negate value
        altitude = -altitude;
      }
      normalizedTags.altitude = altitude.toFixed(8);

      delete normalizedTags["GPSAltitude"];
      delete normalizedTags["GPSAltitudeRef"];
    }
  }

  // hk.debug( "ExifTagKeys",  Object.keys( exifTags ) );

  if( exifTags["GPSLatitude"] &&
      exifTags["GPSLatitudeRef"] &&
      exifTags["GPSLongitude"] &&
      exifTags["GPSLongitudeRef"] )
  {
    delete normalizedTags["GPSLatitude"];
    delete normalizedTags["GPSLatitudeRef"];
    delete normalizedTags["GPSLongitude"];
    delete normalizedTags["GPSLongitudeRef"];

    {
      const [ latDegree, latMinute, latSeconds ] = exifTags["GPSLatitude"];

      // Convert to decimal degree
      let latitude = latDegree + latMinute / 60 + latSeconds / 3600;

      if( "S" === exifTags["GPSLatitudeRef"] )
      {
        latitude = -latitude;
      }

      normalizedTags.latitude = latitude.toFixed(8);
    }

    {
      const [ longDegree, longMinute, longSeconds ] = exifTags["GPSLongitude"];

      // Convert to decimal degree
      let longitude = longDegree + longMinute / 60 + longSeconds / 3600;

      if( "W" === exifTags["GPSLongitudeRef"] )
      {
        longitude = -longitude;
      }

      normalizedTags.longitude = longitude.toFixed(8);
    }
  }

  // hk.debug( { normalizedTags } );

  return normalizedTags;
}

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

  console.log( { info } );

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
  const file = new File( [arr], fileName, { type: "image/webp", lastModified } );

  console.log(
    {
      ofgFileSize: info.originalFileSize,
      newFileSize: file.size
    } );

  return file;
}

// -----------------------------------------------------------------------------
// Internals

/**
 * Find EXIF data offset
 *
 * @param {ArrayBuffer} buffer - Image data
 *
 * @returns {number}
 *   EXIF data offset or -1 if no EXIF data marker was found
 */
function _findExifDataOffset( buffer )
{
  expectArrayBuffer( buffer, "Missing or invalid parameter [buffer]" );

  const dataView = new DataView( buffer );

  const length = buffer.byteLength;

  let offset = 2;

  if( dataView.getUint16(0, false) != 0xFFD8 )
  {
    // Not a JPG file -> return "not found"
    return -1;
  }

  while( offset < length )
  {
    if( dataView.getUint8(offset) !== 0xFF )
    {
      // Not a valid marker, something is wrong -> return "not found"
      return -1;
    }

    const marker = dataView.getUint8(offset + 1);

    // We could implement handling for other markers here,
    // but we're only looking for 0xFFE1 for EXIF data

    if( 0xE1 === marker )
    {
      // Found EXIF data marker
      return offset + 4;
    }

    offset = offset + 2 + dataView.getUint16( offset + 2 );
  }

  return -1;
}

// -------------------------------------------------------------------- Method

/**
 * Read tags
 * - Read tags from e.g. TIFF data block
 *
 * @param {ArrayBuffer} buffer
 * @param {number} tiffOffset
 * @param {number} dirOffset
 * @param {object} tagsByCode
 * @param {boolean} [useBigEndianness=true]
 *
 * @returns {object} tags
 */
function _readTags(
  {
    buffer,
    tiffOffset,
    dirOffset,
    tagsByCode,
    useBigEndianness=true
  }={}  )
{
  expectArrayBuffer( buffer,
    "Missing or invalid parameter [buffer]" );

  expectNumber( tiffOffset,
    "Missing or invalid parameter [tiffOffset]" );

  expectNumber( dirOffset,
    "Missing or invalid parameter [dirOffset]" );

  expectObject( tagsByCode,
    "Missing or invalid parameter [tagsByCode]" );

  const dataView = new DataView( buffer );

  const numberOfEntries =
    dataView.getUint16( dirOffset, !useBigEndianness );

  // hk.debug( { numberOfEntries } );

  const tags = {};

  for( let j = 0; j < numberOfEntries; j = j + 1 )
  {
    const entryOffset = dirOffset + j * 12 + 2;
    const tagCode = dataView.getUint16(entryOffset, !useBigEndianness);

    const tag = tagsByCode[ tagCode ];

    if( !tag )
    {
      // Unknown tag
      continue;
    }

    tags[ tag ] =
      _readTagValue(
        {
          buffer,
          entryOffset,
          tiffOffset,
          dirOffset,
          tagsByCode,
          useBigEndianness
        } );
  }

  return tags;
}

// -------------------------------------------------------------------- Method

/**
 * Read a tag value
 *
 * @param {ArrayBuffer} buffer
 * @param {number} entryOffset
 * @param {number} tiffOffset
 * @param {number} dirOffset
 * @param {object} tagsByCode
 * @param {boolean} [useBigEndianness=true]
 *
 * @returns {mixed} tag value
 */
function _readTagValue(
  {
    buffer,
    entryOffset,
    tiffOffset,
    dirOffset,
    tagsByCode,
    useBigEndianness=true
  }={} )
{
  expectArrayBuffer( buffer,
    "Missing or invalid parameter [buffer]" );

  expectNumber( entryOffset,
    "Missing or invalid parameter [entryOffset]" );

  expectNumber( tiffOffset,
    "Missing or invalid parameter [tiffOffset]" );

  expectNumber( dirOffset,
    "Missing or invalid parameter [dirOffset]" );

  expectObject( tagsByCode,
    "Missing or invalid parameter [tagsByCode]" );

  const dataView = new DataView( buffer );

  const dataType = dataView.getUint16( entryOffset + 2, !useBigEndianness );

  // Note: if numberOfValues greater than 1 -> return array

  const numberOfValues =
    dataView.getUint32( entryOffset + 4, !useBigEndianness );

  const valueOffset =
    dataView.getUint32(entryOffset+8, !useBigEndianness) + tiffOffset;

  // offset,
  // vals, val, n,
  // numerator, denominator;

  switch( dataType )
  {
    case 1:
      // byte, 8-bit unsigned int
      // fall through

    case 7:
      // undefined, 8-bit byte, value depending on field

      if( 1 === numberOfValues )
      {
        return dataView.getUint8( entryOffset + 8, !useBigEndianness );
      }
      else {
        const offset = numberOfValues > 4 ? valueOffset : (entryOffset + 8);

        const vals = [];

        for( let j = 0; j < numberOfValues; j = j + 1 )
        {
          vals[j] = dataView.getUint8( offset + j );
        }

        return vals;
      }

    case 2:
      // ascii, 8-bit byte
      {
        const offset =
          numberOfValues > 4 ? valueOffset : (entryOffset + 8);

        return _readAsciiStringFromBuffer( buffer, offset, numberOfValues - 1);
      }

    case 3:
      // short, 16 bit int

      if( 1 === numberOfValues )
      {
        return dataView.getUint16( entryOffset + 8, !useBigEndianness );
      }
      else {
        const offset =
          numberOfValues > 2 ? valueOffset : (entryOffset + 8);

        const vals = [];

        for( let j = 0; j < numberOfValues; j = j + 1)
        {
          vals[j] =
            dataView.getUint16( offset + 2 * j, !useBigEndianness );
        }

        return vals;
      }

    case 4:
      // long, 32 bit int

      if( 1 === numberOfValues)
      {
        return dataView.getUint32( entryOffset + 8, !useBigEndianness );
      }
      else {
          const vals = [];

          for( let j = 0; j < numberOfValues; j++ )
          {
            vals[j] =
              dataView.getUint32( valueOffset + 4 * j, !useBigEndianness);
          }
          return vals;
      }

    case 5:
      // rational = two long values, first is numerator, second is denominator

      if( 1 === numberOfValues )
      {
        const numerator =
          dataView.getUint32(valueOffset, !useBigEndianness);
        const denominator =
          dataView.getUint32(valueOffset+4, !useBigEndianness);

        const val = new Number(numerator / denominator);

        val.numerator = numerator;
        val.denominator = denominator;

        return val;
      }
      else {
        const vals = [];

        for( let j = 0; j < numberOfValues; j = j + 1 )
        {
          const numerator =
            dataView.getUint32(valueOffset + 8 * j, !useBigEndianness);

          const denominator =
            dataView.getUint32( valueOffset + 4 + 8 * j, !useBigEndianness);

          vals[j] = new Number(numerator / denominator);
          vals[j].numerator = numerator;
          vals[j].denominator = denominator;
        }

        return vals;
      }

    case 9:
      // slong, 32 bit signed int

      if( 1 === numberOfValues )
      {
        return dataView.getInt32( entryOffset + 8, !useBigEndianness );
      }
      else {
        const vals = [];

        for( let j = 0; j < numberOfValues; j = j + 1 )
        {
          vals[j] =
            dataView.getInt32( valueOffset + 4 * j, !useBigEndianness );
        }

        return vals;
      }

    case 10:
      // signed rational, two slongs, first is numerator, second is denominator

      if( 1 === numberOfValues )
      {
        return dataView.getInt32( valueOffset, !useBigEndianness ) /
                  dataView.getInt32( valueOffset + 4, !useBigEndianness );
      }
      else {
          const vals = [];

          for( let j = 0; j < numberOfValues; j = j + 1 )
          {
            vals[j] =
              dataView.getInt32( valueOffset + 8 * j, !useBigEndianness) /
                dataView.getInt32( valueOffset+4 + 8 * j, !useBigEndianness);
          }

          return vals;
      }
  } // end switch

  return null;
}

// -------------------------------------------------------------------- Method

/**
 * Convert an Exif DateTime value to a unix epoch timestamp
 *
 * @param {string} value - Exif date-time value
 *   (e.g. 2018:06:04 15:42:09 [yyyy:MM:dd HH:mm:ss])
 *
 * @returns {number} unix epoch timestamp
 */
function _parseExifDateTime( value )
{
  expectString( value, "Missing or invald parameter [value]");

  if( 19 !== value.length )
  {
    throw new Error("Invalid parameter [value] (expected length [19])");
  }

  const year = value.slice( 0, 4 );
  const month = value.slice( 5, 7 );
  const day = value.slice( 8, 10 );
  const hours = value.slice( 11, 13 );
  const minutes = value.slice( 14, 16 );
  const seconds = value.slice( 17, 19 );

  const date =
    new Date( year, month - 1, day, hours, minutes, seconds );

  // hk.debug( value, { year, month, day, hours, minutes, seconds } );

  return date.getTime();
}

// -------------------------------------------------------------------- Method

/**
 * Read a string from a buffer
 * - The encoding of the string in the buffer is ASCII
 *
 * @param {ArrayBuffer} buffer
 * @param {number} [offset=0]
 * @param {number} [numberOfbytes]
 *
 * @returns {string} string
 */
function _readAsciiStringFromBuffer( buffer, offset=0, numberOfbytes )
{
  expectArrayBuffer( buffer, "Missing or invalid parameter [buffer]" );

  expectNumber( offset,
    "Missing or invalid parameter [offset]" );

  if( !numberOfbytes )
  {
    numberOfbytes = buffer.byteLength - offset;
  }
  else {
    expectNumber( offset, "Invalid parameter [offset]" );
  }

  const dataView = new DataView( buffer );

  let str = "";

  for( let j = offset, n = offset + numberOfbytes; j < n; j = j + 1 )
  {
     str += String.fromCharCode( dataView.getUint8( j ) );
  }

  return str;
}
