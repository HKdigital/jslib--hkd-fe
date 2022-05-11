
/* ------------------------------------------------------------------ Exports */

export const SURFACE_COLOR_NONE = "none";
export const SURFACE_COLOR_DEFAULT = "surface-default";

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

  if( colorName && colorName.startsWith("surface") )
  {
    return;
  }

  if( allowNone && "none" === colorName )
  {
    return;
  }

  throw new Error(`Color [${colorName}] is not a valid surface color`);
}