
/* ------------------------------------------------------------------ Imports */

import { expectPositiveNumber,
         expectArray } from '@hkd-base/helpers/expect.js';

/* ---------------------------------------------------------------- Internals */

//
// referenceFullWidth:
// 1600 microsoft
// 1140 bootstrap 4
// 1366 popular display size
//
const BREAK_POINTS =
  {
    2: [ 0.5 ],
    3: [ 0.3, 0.6 ],
    4: [ 0.25, 0.5, 0.75, 0.9 ],
    // 5, 6 ?
  };

/* ------------------------------------------------------------------ Exports */

export const REFERENCE_FULL_WIDTH = 1366;
export const REFERENCE_MAX_COLUMNS = 4;

export const MEDIUM_COLUMN_WIDTH = Math.floor(REFERENCE_FULL_WIDTH / 2);

export const SMALL_COLUMN_WIDTH = Math.floor(MEDIUM_COLUMN_WIDTH / 1.5);
export const LARGE_COLUMN_WIDTH = Math.floor(MEDIUM_COLUMN_WIDTH * 1.5);
export const XL_COLUMN_WIDTH = Math.floor(MEDIUM_COLUMN_WIDTH * 2);

// -----------------------------------------------------------------------------

/**
 * Throws an expeption if the specified breakproints are not valid
 * - Breakpoint values should be smaller than 1
 * - Breakpoint values should be increasing
 *
 * @param {number[]} breakPoints
 */
export function expectValidBreakPoints( breakPoints )
{
  expectArray( breakPoints,
    'Missing or invalid parameter [breakPoints]' );

  const maxColumns = breakPoints.length;

  const lastValue = 0;

  for( let j = 0; j < maxColumns; j = j + 1 )
  {
    const value = breakPoints[ j ];

    if( typeof value !== 'number'  || value < lastValue || value >= 1 )
    {
      throw new Error(`Invalid value [${value}] for breakpoint [${j}]`);
    }
  } // end for
}

// -----------------------------------------------------------------------------

/**
 * Determines the optimal number of columns for the given available width
 * - Uses breakpoints to determine the number of columns that best fit
 *   with the available width
 *
 * @param {number} _.availableWidth
 *   The width of the element where the columns should be placed in
 *
 * @param {number} [_.maxColumns]
 *   The maximum value for numberOfColumns that the function should return
 *
 * @param {number} [_.referenceFullWidth=REFERENCE_FULL_WIDTH]
 *   The reference / maximal width, used to convert the available width to a
 *   relative value
 *
 * @param {number} [_.referenceMaxColumns=REFERENCE_MAX_COLUMNS]
 *  The reference / maximum number of columns when the `availableWidth` equals
 *  the `referenceFullWidth`
 *
 * --
 *
 * @returns {number} numberOfColumns
 */
export function calculateNumberOfColumns(
  {
    availableWidth,
    maxColumns,
    referenceMaxColumns=REFERENCE_MAX_COLUMNS,
    referenceFullWidth=REFERENCE_FULL_WIDTH
  }={} )
{
  expectPositiveNumber( availableWidth,
    'Missing or invalid parameter [availableWidth]' );

  expectPositiveNumber( maxColumns,
    'Missing or invalid parameter [maxColumns]' );

  expectPositiveNumber( referenceFullWidth,
    'Missing or invalid parameter [referenceFullWidth]' );

  expectPositiveNumber( referenceMaxColumns,
    'Missing or invalid parameter [referenceMaxColumns]' );

  if( 1 === referenceMaxColumns )
  {
    // -> numberOfColumns is always 1
    return 1;
  }

  const breakPoints = BREAK_POINTS[ referenceMaxColumns ];

  if( !breakPoints )
  {
    throw new Error(
      `Invalid value for [referenceMaxColumns=${referenceMaxColumns}]`);
  }

  if( 1 === maxColumns )
  {
    return 1;
  }

  const x = availableWidth / referenceFullWidth;

  let numberOfColumns = 1;

  const n = Math.min( maxColumns - 1, breakPoints.length - 1 );

  for( let j = n; j >= 0; j = j - 1 )
  {
    if( x > breakPoints[ j ] )
    {
      numberOfColumns = j + 1;
      break;
    }
  }

  if( numberOfColumns > maxColumns )
  {
    numberOfColumns = maxColumns;
  }

  return numberOfColumns;
}
