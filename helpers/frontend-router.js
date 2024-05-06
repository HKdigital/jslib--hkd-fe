
/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectObject } from '@hkd-base/helpers/expect.js';


import { BACKGROUND_PANEL,
         TOP_PANEL,
         SUB_TOP_PANEL,
         CONTENT_PANEL,
         BOTTOM_PANEL } from '@hkd-fe/types/panel-types.js';

/* ---------------------------------------------------------------- Internals */

const PANEL_NAMES =
  new Set(
    [
      BACKGROUND_PANEL,
      TOP_PANEL,
      SUB_TOP_PANEL,
      CONTENT_PANEL,
      BOTTOM_PANEL
    ] );

/* ------------------------------------------------------------------ Exports */

/**
 * Throws an error if the route is not valid
 *
 * @param {object} route
 * @param {object} route.layout
 * @param {object} route.panels
 */
export function expectValidRoute( route )
{
  expectObject( route, 'Invalid route' );

  const routeLabel = route.label;

  expectString( routeLabel,
    'Invalid route, missing or invalid property [label]' );

  // == Check layout

  const layout = route.layout;

  expectObject( layout,
    `Invalid route [${routeLabel}]. Missing or invalid property [layout]` );

  // TODO

  // expectValidLayout( ... );

  // == Check panels

  const panels = route.panels;

  expectObject( panels,
    `Invalid route [${routeLabel}]. Missing or invalid property [panels]` );

  for( const panelName in panels )
  {
    if( !PANEL_NAMES.has( panelName ) )
    {
      const allowedPanelNames =
        Array.from( PANEL_NAMES.values() ).join(', ');

      throw new Error(
        `Invalid route [${routeLabel}]. Invalid panel name [${panelName}], ` +
        `expected [${allowedPanelNames}]`);
    }

    expectValidPanel( { routeLabel, panelName, panel: panels[panelName] } );

  } // end for

}

// -----------------------------------------------------------------------------

/**
 * Throws an error if the panel object is not valid
 *
 * @param  {string} _.routeLabel
 *   Label of the route the panel belongs to
 *
 * @param  {string} _.panelName
 *   Name of the panel that is being checked
 *
 * @param  {object} _.panel
 *   Panel parameters to check
 */
function expectValidPanel( { routeLabel, panelName, panel } )
{
  expectString( routeLabel,
    'Missing or invalid parameter [routeLabel].' );

  expectString( panelName,
    'Missing or invalid parameter [panelName].' );

  expectObject( panel,
    `Invalid panel [${panelName}] in route [${routeLabel}].` );

  // TODO

  expectObject( panel.component,
    `Missing prpoerty panel [${panelName}] in route [${routeLabel}].` );


}
