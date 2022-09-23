
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

export const tiffTagsByCode =
    {
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

export const gpsTagsByCode =
    {
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