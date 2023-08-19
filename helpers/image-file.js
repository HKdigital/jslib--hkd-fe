
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectNumber,
  expectObject,
  expectArrayBuffer } from "@hkd-base/helpers/expect.js";

import { HkPromise } from "@hkd-base/helpers/promises.js";

import { noop }
  from "@hkd-base/helpers/function.js";

import { tiffTagsByCode,
         gpsTagsByCode } from "@hkd-fe/constants/exif.js";

/* ------------------------------------------------------------------ Exports */

/**
 * Create an Image object from an image File object
 * - Converts image File objects to a base64 encoded data url
 *
 * @param {(string|File)} urlOrImageFile
 *   URL of the image or Image file to load
 *
 * @returns {Promise<Image>} Image object
 */
export /*async*/ function loadImage( urlOrImageFile )
{
  let url;
  // let tryRevokeObjectUrlFn;

  const img = new Image();

  const promise = new HkPromise();

  if( urlOrImageFile instanceof File )
  {
    // Create object URL
    // url = URL.createObjectURL( urlOrImageFile );

    // -- Store information about the file as properties of the image object

    let fileName = urlOrImageFile.name || null;

    img.fileName = urlOrImageFile.name;

    if( urlOrImageFile.size )
    {
      img.fileSize = urlOrImageFile.size;
    }

    if( urlOrImageFile.type )
    {
      img.fileType = urlOrImageFile.type;
    }

    const reader = new FileReader();

    // console.log(`Load image from file [${fileName}]`);

    reader.addEventListener( "load", ( e ) =>
      {
        img.src = e.target.result;

        // console.log( `Loaded image from file [${fileName}]`);

        promise.resolve( img );
      } );

    reader.addEventListener( "error", promise.reject.bind( promise ) );

    reader.readAsDataURL( urlOrImageFile );

  }
  else if( typeof urlOrImageFile === "string" )
  {
    url = urlOrImageFile;
    // tryRevokeObjectUrlFn = noop;

    img.crossOrigin = "Anonymous";

    img.addEventListener( "load",
      () => {
        const imgWidth = img.width;
        const imgHeight = img.height;

        if( 0 === imgWidth || 0 === imgHeight )
        {
          promise.reject( new Error("Image width or height is 0") );
          return;
        }

        promise.resolve( img );

        // tryRevokeObjectUrlFn();
      } );

    img.addEventListener( "error", promise.reject.bind( promise ) );

    // console.log("Load", url);

    img.src = url;
  }
  else {
    throw new Error(
      "Invalid parameter [urlOrImageFile] (expected url or image File)");
  }

  return promise;
}

// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

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

/* ---------------------------------------------------------------- Internals */

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

// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

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
