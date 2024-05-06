
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectObject } from '@hkd-base/helpers/expect.js';

import MediaQuery from '@hkd-fe/classes/MediaQuery.js';

/* ---------------------------------------------------------------- Internals */

/**
 * @typedef Rule
 *
 * @propery {string} query
 *   Media query e.g. `(min-width: 40rem)`
 *
 * @propery {string} className
 *   CSS classname that should be set if the media query matches
 *
 * @propery {object} [target=document.documentElement]
 */

/* ------------------------------------------------------------------ Exports */

/**
 * Enable a media query that sets a breakpoint for a column grid
 * - Sets a className `js-allow-X-columns` if the window width is greater than
 *   the  specified width
 *
 * @param  {string} breakPointWidth
 *   Minimum inner window width required to enable the CSS class
 *   `js-allow-X-columns`.
 *   e.g. breakPointWidth="40rem"
 *
 * @param  {number} numberOfColumns
 *   The number of columns the breakpoint width corresponds to.
 *   e.g. numberOfColums=2
 *
 * @returns {function} unsubscribe function
 */
export function enableColumnBreakpoint(
  breakPointWidth, numberOfColumns )
{
  expectNotEmptyString( breakPointWidth,
    'Missing or invalid parameter [breakPointWidth]');

  if( typeof numberOfColumns !== 'number' || numberOfColumns < 2 )
  {
    throw new Error(
      'Invalid value for parameter [numberOfColumns]. ' +
      'Expected number greater than 1');
  }

  return enableMediaQueryRule(
    {
      query: `(min-width: ${breakPointWidth})`,
      className: `js-allow-${numberOfColumns}-columns`
    } );
}

// -----------------------------------------------------------------------------

/**
 * Enable a single multiple media query rule
 * - The media query rule sets or unsets CSS classname on the target DOM node
 * - The default target DOM node is `document.documentELement`
 *
 * @param {Rule[]} rules
 *
 * @returns {function} unsubscribe function
 */
export function enableMediaQueryRule( rule )
{
  expectObject( rule, 'Invalid parameter [rule]' );

  const { query, className } = rule;

  expectNotEmptyString( query,
    'Missing or invalid parameter [query]');

  expectNotEmptyString( className,
    'Missing or invalid parameter [className]');

  const mq = new MediaQuery( query );

  return mq.listen( ( MediaQueryListEvent ) =>
    {
      if( MediaQueryListEvent.matches )
      {
        document.documentElement.classList.add( className );
      }
      else {
        document.documentElement.classList.remove( className );
      }
    } );
}
