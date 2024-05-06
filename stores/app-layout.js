
/* ------------------------------------------------------------------ Imports */

import { defer }
  from '@hkd-base/helpers/process.js';

import DedupValueStore
  from '@hkd-base/classes/DedupValueStore.js';

import DerivedStore
  from '@hkd-base/classes/DerivedStore.js';

// import Scrollbar from "../scrollbar/Scrollbar.svelte";

/* ---------------------------------------------------------------- Internals */

const backgroundPanelReady = new DedupValueStore( false );
const topPanelReady = new DedupValueStore( false );
const subTopPanelReady = new DedupValueStore( false );
const contentPanelReady = new DedupValueStore( false );
const superBottomPanelReady = new DedupValueStore( false );
const bottomPanelReady = new DedupValueStore( false );

const PRIORITY_HIGH = 100;
const PRIORITY_LOW = 20;

const priority =
  new DerivedStore( [ contentPanelReady ],
    (( storesMap ) =>
    {
      const value = storesMap.getValueFromStore( 0 );

      if( value )
      {
        return PRIORITY_LOW;
      }
      else {
        return PRIORITY_HIGH;
      }
    }) );

/* ------------------------------------------------------------------ Exports */

//
// `ready` stores can be used to mark panels as `ready to show to the user`
//

export { backgroundPanelReady,
         topPanelReady,
         subTopPanelReady,
         contentPanelReady,
         superBottomPanelReady,
         bottomPanelReady };

// -----------------------------------------------------------------------------

export { PRIORITY_HIGH,
         PRIORITY_LOW };

export { priority };

// -----------------------------------------------------------------------------

/**
 * Mark background panel as ready for showing to the user
 */
export function markBackgroundPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { backgroundPanelReady.set( true ); } );
}

/**
 * Mark top panel as ready for showing to the user
 */
export function markTopPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { topPanelReady.set( true ); } );
}

/**
 * Mark sub top panel as ready for showing to the user
 */
export function markSubTopPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { subTopPanelReady.set( true ); } );
}

/**
 * Mark content panel as ready for showing to the user
 */
export function markContentPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { contentPanelReady.set( true ); } );
}

/**
 * Mark super bottom panel as ready for showing to the user
 */
export function markSuperBottomPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { superBottomPanelReady.set( true ); } );
}

/**
 * Mark bottom panel as ready for showing to the user
 */
export function markBottomPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { bottomPanelReady.set( true ); } );
}
