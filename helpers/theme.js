
// import { expectString } from "@hkd-base/helpers/expect.js";

// import { surfaceColors,
//          colors } from "$theme/all-constants.js";

/* ------------------------------------------------------------------ Exports */

export { SURFACE_NONE }
  from '@hkd-fe/constants/surfaces.js';

// ---------------------------------------------------------------------- Method

/**
 * Throws an exception if the specified color name has not been defined
 * in the `colors` object of the theme
 *
 * @param  {string} colorName
 */
export function expectValidColor( /*colorName*/ )
{
  // FIXME

  // if( typeof colors[ colorName ] !== "string" )
  // {
  //   throw new Error(
  //     `Color [${colorName}] is not a valid theme color`);
  // }
}

// ---------------------------------------------------------------------- Method

/**
 * Throws an exception if the specified color name has not been defined
 * in the `surfaceColors` object of the theme
 *
 * @param {string} colorName
 * @param {boolean} [allowNone=false]
 *
 * @throws Invalid surface color
 */
export function expectValidSurfaceColor( colorName, allowNone=false )
{
  // FIXME

  // if( typeof surfaceColors[ colorName ] !== "string" && colorName !== "none" )
  // {
  //   throw new Error(
  //     `Color [${colorName}] is not a valid theme surface color`);
  // }

  if( colorName && colorName.startsWith('surface') )
  {
    return;
  }

  if( allowNone && 'none' === colorName )
  {
    return;
  }

  throw new Error(`Color [${colorName}] is not a valid surface color`);
}

// ---------------------------------------------------------------------- Method

/**
 * Get the name of the default color of e.g. text that is placed on the
 * specified background
 *
 * @param  {string} onBackgroundColor - Color of the background
 * @param  {string} purpose - Purpose of the contrast color
 *
 * @returns {string} component background color
 */
// export function defaultOnColorName( onBackgroundColor )
// {
//   expectString( onBackgroundColor,
//     "Missing or invalid parameter [onBackgroundColor]" );

//   // console.log("colors", colors, onBackgroundColor );

//   let result = defaultOnColorNames[ onBackgroundColor ];

//   if( !result )
//   {
//     let tmp = camelToDash( onBackgroundColor )
//     result = defaultOnColorNames[ tmp ];
//   }

//   if( !result )
//   {
//     throw new Error(
//       `No default-on-color found for [onBackgroundColor=${onBackgroundColor}]`);
//   }

//   return result;
// }

// ---------------------------------------------------------------------- Method

/**
 * Get the name of the surface color of a component that is placed on the
 * specified surface color
 *
 * @param  {string} onColor
 *   Color of the surface where the surface is placed on
 *
 * @param  {string} purpose - Purpose of the contrast color
 *
 * @returns {string} component background color
 */
// export function surfaceOnSurfaceColorName( onColor, purpose )
// {
//   expectString( onColor,
//     "Missing or invalid parameter [onColor]" );

//   expectString( purpose,
//     "Missing or invalid parameter [purpose]" );

//   let result = objectGet( surfaceOnSurfaceColorNames, [ onColor, purpose ] );

//   if( !result )
//   {
//     let tmp = camelToDash( onColor )
//     result = objectGet( surfaceOnSurfaceColorNames, [ tmp, purpose ] );
//   }

//   if( !result )
//   {
//     throw new Error(
//       `No surface-on-surface color found for ` +
//       `[onColor=${onColor}] and [purpose=${purpose}]`);
//   }

//   return result;
// }

// ---------------------------------------------------------------------- Method

/**
 * Get the name of the contrast color of a component that is placed on the
 * specified background
 *
 * @param  {string} onBackgroundColor - Color of the background
 * @param  {string} purpose - Purpose of the contrast color
 *
 * @returns {string} component background color
 */
// export function contrastColorName( onBackgroundColor, purpose )
// {
//   expectString( onBackgroundColor,
//     "Missing or invalid parameter [onBackgroundColor]" );

//   expectString( purpose,
//     "Missing or invalid parameter [purpose]" );

//   // console.log("contrastColorNames", contrastColorNames, onBackgroundColor, purpose );

//   let result = objectGet( contrastColorNames, [ onBackgroundColor, purpose ] );

//   if( !result )
//   {
//     let tmp = camelToDash( onBackgroundColor )
//     result = objectGet( contrastColorNames, [ tmp, purpose ] );
//   }

//   if( !result )
//   {
//     throw new Error(
//       `No contrast color found for ` +
//       `[onBackgroundColor=${onBackgroundColor}] and [purpose=${purpose}]`);
//   }

//   return result;
// }

// ---------------------------------------------------------------------- Method

/**
 * Get the name of the variant color
 *
 * @param  {string} color
 *
 * @returns {string} variant color
 */
// export function variantColorName( color )
// {
//   expectString( color,
//     "Missing or invalid parameter [color]" );

//   let variantColor = variantColorNames[ color ];

//   if( !variantColor )
//   {
//     color = camelToDash( color )
//     variantColor = variantColorNames[ color ];
//   }

//   if( !variantColor )
//   {
//     throw new Error(
//       `No variant color found for [onBackgroundColor=${color}]`);
//   }

//   // console.log("variantColorName", { color, variantColor } );

//   return variantColor;
// }

// ---------------------------------------------------------------------- Method

/**
 * Get the name of the line color
 *
 * @param  {string} onBackgroundColor - Color of the background
 *
 * @returns {string} line color
 */
// export function lineColorName( onBackgroundColor )
// {
//   expectString( onBackgroundColor,
//     "Missing or invalid parameter [onBackgroundColor]" );

//   let lineColor = lineColorNames[ onBackgroundColor ];

//   if( !lineColor )
//   {
//     lineColor = lineColorNames[ camelToDash( onBackgroundColor ) ];
//   }

//   if( !lineColor )
//   {
//     throw new Error(
//       `No line color found for [onBackgroundColor=${onBackgroundColor}]`);
//   }

//   console.log("lineColorName", { onBackgroundColor, lineColor } );

//   return lineColor;
// }


