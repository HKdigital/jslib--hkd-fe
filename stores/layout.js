/* ------------------------------------------------------------------ Imports */

import { DedupValueStore } from "@hkd-base/stores.js";

import { defer } from '@hkd-base/process.js';

/* ------------------------------------------------------------------ Exports */

export const backgroundPanelReady = new DedupValueStore( false );
export const topPanelReady = new DedupValueStore( false );
export const subTopPanelReady = new DedupValueStore( false );
export const contentPanelReady = new DedupValueStore( false );
export const bottomPanelReady = new DedupValueStore( false );

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
 * Mark bottom panel as ready for showing to the user
 */
export function markBottomPanelReady()
{
  // @note using defer, otherwise fade in effect does not trigger
  defer( () => { bottomPanelReady.set( true ); } );
}